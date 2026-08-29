"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { createCompatibilityServer } = require("./server");

async function withServer(run) {
  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), "inverseiq-learning-test-"));
  const server = createCompatibilityServer({
    storagePath: path.join(temporaryDir, "outcomes.json"),
    apiKey: "test-feedback-key",
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temporaryDir, { recursive: true, force: true });
  }
}

const feedback = {
  signalId: 42,
  symbol: "BTCUSDT",
  direction: "LONG",
  entry: 100000,
  exit: 102000,
  outcome: "win",
  confidence: 91.5,
  strategy: "bestCoin",
};

test("health and statistics endpoint match the Xrypt contract", async () => {
  await withServer(async (baseUrl) => {
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, "healthy");

    const stats = await fetch(`${baseUrl}/api/ai/stats`);
    assert.equal(stats.status, 200);
    assert.deepEqual(await stats.json(), {
      success: true,
      totalPatterns: 0,
      totalTraders: 0,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      observedWinRate: null,
      avgConfidence: 0,
      lastUpdated: null,
      publicOnlyPatterns: 0,
      traderOnlyPatterns: 0,
      combinedPatterns: 0,
      publicPatternsConfidence: 0,
      traderPatternsConfidence: 0,
      combinedPatternsConfidence: 0,
      highConfidenceCount: 0,
      mediumConfidenceCount: 0,
      lowConfidenceCount: 0,
      insights: ["No verified outcomes have been received yet."],
    });
  });
});

test("feedback requires authentication and preserves one outcome per signal", async () => {
  await withServer(async (baseUrl) => {
    const rejected = await fetch(`${baseUrl}/api/feedback/signal-outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedback),
    });
    assert.equal(rejected.status, 401);

    const accepted = await fetch(`${baseUrl}/api/feedback/signal-outcome`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-feedback-key",
      },
      body: JSON.stringify(feedback),
    });
    assert.equal(accepted.status, 201);
    assert.equal((await accepted.json()).duplicate, false);

    const duplicate = await fetch(`${baseUrl}/api/feedback/signal-outcome`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-feedback-key",
      },
      body: JSON.stringify(feedback),
    });
    assert.equal(duplicate.status, 200);
    assert.equal((await duplicate.json()).duplicate, true);

    const stats = await fetch(`${baseUrl}/api/ai/stats`);
    const data = await stats.json();
    assert.equal(data.totalTrades, 1);
    assert.equal(data.wins, 1);
    assert.equal(data.observedWinRate, 100);
    assert.equal(data.totalPatterns, 1);
  });
});

test("conflicting outcomes for an existing signal are rejected without overwriting the record", async () => {
  await withServer(async (baseUrl) => {
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer test-feedback-key",
    };
    await fetch(`${baseUrl}/api/feedback/signal-outcome`, {
      method: "POST",
      headers,
      body: JSON.stringify(feedback),
    });

    const conflict = await fetch(`${baseUrl}/api/feedback/signal-outcome`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...feedback, outcome: "loss", exit: 98000 }),
    });
    assert.equal(conflict.status, 409);

    const stats = await fetch(`${baseUrl}/api/ai/stats`);
    const data = await stats.json();
    assert.equal(data.totalTrades, 1);
    assert.equal(data.wins, 1);
  });
});
