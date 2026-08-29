"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const MAX_BODY_BYTES = 16 * 1024;

function parsePort(value, fallback = 3001) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 && parsed < 65536
    ? parsed
    : fallback;
}

function sendJson(response, statusCode, data) {
  const body = JSON.stringify(data);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(body);
}

function toFiniteNumber(value) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeString(value, maximumLength) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || normalized.length > maximumLength) return null;
  return normalized;
}

function normalizeFeedback(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "JSON object payload is required" };
  }

  const signalIdRaw = payload.signalId;
  const signalId =
    typeof signalIdRaw === "string" || typeof signalIdRaw === "number"
      ? String(signalIdRaw).trim()
      : "";
  const symbol = normalizeString(payload.symbol, 32)?.toUpperCase();
  const direction = normalizeString(payload.direction, 8)?.toUpperCase();
  const outcome = normalizeString(payload.outcome, 8)?.toLowerCase();
  const strategy = normalizeString(payload.strategy, 120) || "unknown";
  const entry = toFiniteNumber(payload.entry ?? payload.entryPrice);
  const exit = toFiniteNumber(payload.exit ?? payload.exitPrice);
  const confidence = toFiniteNumber(payload.confidence);

  if (!signalId || signalId.length > 128) {
    return { error: "signalId must be a non-empty string or number up to 128 characters" };
  }
  if (!symbol) return { error: "symbol is required" };
  if (direction !== "LONG" && direction !== "SHORT") {
    return { error: "direction must be LONG or SHORT" };
  }
  if (outcome !== "win" && outcome !== "loss") {
    return { error: "outcome must be win or loss" };
  }
  if (entry === null || entry <= 0 || exit === null || exit <= 0) {
    return { error: "entry and exit must be positive finite numbers" };
  }
  if (confidence === null || confidence < 0 || confidence > 100) {
    return { error: "confidence must be a number from 0 to 100" };
  }

  return {
    value: {
      signalId,
      symbol,
      direction,
      outcome,
      strategy,
      entry,
      exit,
      confidence,
      recordedAt: new Date().toISOString(),
    },
  };
}

function createStore(storagePath) {
  const emptyState = () => ({ version: 1, outcomes: [] });

  function load() {
    try {
      const parsed = JSON.parse(fs.readFileSync(storagePath, "utf8"));
      if (!parsed || !Array.isArray(parsed.outcomes)) return emptyState();
      return { version: 1, outcomes: parsed.outcomes };
    } catch (error) {
      if (error && error.code === "ENOENT") return emptyState();
      throw new Error(`Unable to read learning state: ${error.message}`);
    }
  }

  let state = load();

  function persist() {
    fs.mkdirSync(path.dirname(storagePath), { recursive: true, mode: 0o750 });
    const temporaryPath = `${storagePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    fs.renameSync(temporaryPath, storagePath);
  }

  function getBySignalId(signalId) {
    return state.outcomes.find((item) => item.signalId === signalId) || null;
  }

  function append(outcome) {
    state.outcomes.push(outcome);
    persist();
  }

  return { append, getBySignalId, getOutcomes: () => state.outcomes.slice() };
}

function calculateStats(outcomes) {
  const strategies = new Map();
  let wins = 0;
  let confidenceTotal = 0;

  for (const item of outcomes) {
    const strategy = strategies.get(item.strategy) || { wins: 0, losses: 0 };
    if (item.outcome === "win") {
      wins += 1;
      strategy.wins += 1;
    } else {
      strategy.losses += 1;
    }
    confidenceTotal += item.confidence;
    strategies.set(item.strategy, strategy);
  }

  const totalTrades = outcomes.length;
  const averageConfidence = totalTrades === 0 ? 0 : confidenceTotal / totalTrades;
  const winRate = totalTrades === 0 ? null : (wins / totalTrades) * 100;
  const lastUpdated = outcomes.at(-1)?.recordedAt || null;
  const totalPatterns = strategies.size;
  const insights =
    totalTrades === 0
      ? ["No verified outcomes have been received yet."]
      : [
          `${totalTrades} verified outcome${totalTrades === 1 ? "" : "s"} recorded.`,
          `Observed win rate: ${winRate.toFixed(1)}% across recorded outcomes.`,
          `${totalPatterns} strategy label${totalPatterns === 1 ? "" : "s"} represented in the learning data.`,
        ];

  return {
    totalPatterns,
    totalTraders: 0,
    totalTrades,
    wins,
    losses: totalTrades - wins,
    observedWinRate: winRate,
    avgConfidence: Number(averageConfidence.toFixed(2)),
    lastUpdated,
    publicOnlyPatterns: 0,
    traderOnlyPatterns: 0,
    combinedPatterns: totalPatterns,
    publicPatternsConfidence: 0,
    traderPatternsConfidence: 0,
    combinedPatternsConfidence: Number(averageConfidence.toFixed(2)),
    highConfidenceCount: outcomes.filter((item) => item.confidence >= 85).length,
    mediumConfidenceCount: outcomes.filter(
      (item) => item.confidence >= 70 && item.confidence < 85
    ).length,
    lowConfidenceCount: outcomes.filter((item) => item.confidence < 70).length,
    insights,
  };
}

function parseBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;

    request.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        reject(new Error("Request body exceeds 16 KB"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("Request body must be valid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function hasValidApiKey(request, expectedApiKey) {
  if (!expectedApiKey) return false;
  const header = request.headers.authorization || request.headers["x-api-key"];
  const supplied = header?.startsWith("Bearer ") ? header.slice(7) : header;
  if (typeof supplied !== "string") return false;
  const expected = Buffer.from(expectedApiKey);
  const received = Buffer.from(supplied);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function createCompatibilityServer({ storagePath, apiKey, now = () => new Date() }) {
  const store = createStore(storagePath);
  const startedAt = now();

  return http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://localhost");

    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, 200, {
        status: "healthy",
        service: "inverseiq-continuous-learning",
        timestamp: now().toISOString(),
      });
    }

    if (request.method === "GET" && url.pathname === "/api/ai/stats") {
      return sendJson(response, 200, { success: true, ...calculateStats(store.getOutcomes()) });
    }

    if (request.method === "GET" && url.pathname === "/api/ai/continuous-learning") {
      const stats = calculateStats(store.getOutcomes());
      return sendJson(response, 200, {
        success: true,
        continuousLearning: {
          enabled: true,
          uptimeSeconds: Math.floor((now().getTime() - startedAt.getTime()) / 1000),
          totalVerifiedOutcomes: stats.totalTrades,
          lastUpdated: stats.lastUpdated,
        },
        hybridStats: {
          totalPatterns: stats.totalPatterns,
          totalTraders: stats.totalTraders,
          combinedPatterns: stats.combinedPatterns,
          observedWinRate: stats.observedWinRate,
        },
      });
    }

    if (request.method === "POST" && url.pathname === "/api/feedback/signal-outcome") {
      if (!apiKey) {
        return sendJson(response, 503, {
          success: false,
          error: "Feedback authentication is not configured",
        });
      }
      if (!hasValidApiKey(request, apiKey)) {
        return sendJson(response, 401, { success: false, error: "Unauthorized" });
      }

      try {
        const normalized = normalizeFeedback(await parseBody(request));
        if (normalized.error) {
          return sendJson(response, 400, { success: false, error: normalized.error });
        }

        const existing = store.getBySignalId(normalized.value.signalId);
        if (existing) {
          const sameOutcome =
            existing.outcome === normalized.value.outcome &&
            existing.entry === normalized.value.entry &&
            existing.exit === normalized.value.exit;
          if (!sameOutcome) {
            return sendJson(response, 409, {
              success: false,
              error: "Conflicting outcome already recorded for signalId",
            });
          }
          return sendJson(response, 200, {
            success: true,
            duplicate: true,
            message: "Verified signal outcome was already recorded",
            patternsUpdated: 0,
          });
        }

        store.append(normalized.value);
        return sendJson(response, 201, {
          success: true,
          duplicate: false,
          message: "Verified signal outcome recorded",
          patternsUpdated: 1,
        });
      } catch (error) {
        return sendJson(response, 400, { success: false, error: error.message });
      }
    }

    return sendJson(response, 404, { success: false, error: "Not found" });
  });
}

if (require.main === module) {
  const port = parsePort(process.env.PORT, 3001);
  const host = process.env.BIND_HOST || "127.0.0.1";
  const storagePath = process.env.LEARNING_DATA_PATH || path.join(__dirname, "data", "outcomes.json");
  const server = createCompatibilityServer({
    storagePath,
    apiKey: process.env.CONTINUOUS_LEARNING_API_KEY || "",
  });

  server.listen(port, host, () => {
    console.log(`Continuous-learning compatibility backend listening on ${host}:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`Received ${signal}; closing compatibility backend.`);
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

module.exports = { calculateStats, createCompatibilityServer, normalizeFeedback, parsePort };
