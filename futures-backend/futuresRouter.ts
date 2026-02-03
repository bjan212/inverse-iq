import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import { getDb } from "./db";
import axios from "axios";
import { trades, inversePatterns, userProgress } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Futures Trading Router
 * Handles multi-agent signal generation, trade tracking, and inverse learning
 */
export const futuresRouter = router({
  /**
   * Generate a trading signal using multi-agent AI analysis
   */
  generateSignal: protectedProcedure
    .input(
      z.object({
        symbol: z.string(), // e.g., "BTC/USDT"
        riskLevel: z.enum(["very_high", "high", "medium", "low"]),
        capital: z.number(),
        leverage: z.number().min(1).max(50),
        exchange: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { symbol, riskLevel, capital, leverage } = input;
      const userId = ctx.user.id;

      // Fetch user's inverse patterns for this symbol
      const db = await getDb();
      let inversePatternsList: any[] = [];
      if (db) {
        inversePatternsList = await db
          .select()
          .from(inversePatterns)
          .where(and(eq(inversePatterns.userId, userId), eq(inversePatterns.symbol, symbol)))
          .orderBy(desc(inversePatterns.confidenceBoost))
          .limit(5);
      }

      const inverseContext =
        inversePatternsList.length > 0
          ? `\n\nIMPORTANT - Inverse Learning Patterns (from user's past losing trades):\n${inversePatternsList
              .map(
                (p) =>
                  `- Original ${p.originalDirection} failed under these conditions: ${p.conditions}. Consider ${p.invertedDirection} instead. Confidence boost: +${p.confidenceBoost}`
              )
              .join("\n")}`
          : "";

      // Agent 1: Quantitative Analyst
      const quantPrompt = `You are a Quantitative Analyst expert in crypto futures trading.

Analyze ${symbol} for a ${riskLevel.toUpperCase()} risk ${leverage}x leverage trade.

Provide:
1. Technical analysis (support/resistance, momentum indicators)
2. Entry zone recommendation
3. Confidence score (1-10)

Use chain-of-thought reasoning. Show your step-by-step logic.${inverseContext}

Keep response concise (max 200 words).`;

      const quantResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are a quantitative analyst specializing in crypto futures." },
          { role: "user", content: quantPrompt },
        ],
      });

      const quantAnalysis = typeof quantResponse.choices[0]?.message?.content === "string"
        ? quantResponse.choices[0].message.content
        : "Analysis unavailable";

      // Agent 2: Risk Specialist
      const riskPrompt = `You are a Risk Management Specialist.

Given:
- User capital: $${capital}
- Leverage: ${leverage}x
- Risk level: ${riskLevel.toUpperCase()}
- Symbol: ${symbol}

Calculate:
1. Maximum account risk (2-5% based on risk level)
2. Optimal position size
3. Stop-loss placement strategy
4. Take-profit levels (minimum 1:3 R:R for high risk, 1:2 for medium, 1:1.5 for low)

Use chain-of-thought reasoning. Show calculations step-by-step.

Keep response concise (max 200 words).`;

      const riskResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are a risk management specialist for futures trading." },
          { role: "user", content: riskPrompt },
        ],
      });

      const riskAnalysis = typeof riskResponse.choices[0]?.message?.content === "string"
        ? riskResponse.choices[0].message.content
        : "Analysis unavailable";

      // Agent 3: Market Psychology
      const psychologyPrompt = `You are a Market Psychology Analyst.

Analyze ${symbol} for:
1. Current market sentiment (fear/greed)
2. Potential news catalysts or narrative drivers
3. Social media trends (bullish/bearish bias)
4. Whale behavior implications

Use chain-of-thought reasoning.

Keep response concise (max 200 words).`;

      const psychologyResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are a market psychology and sentiment analyst." },
          { role: "user", content: psychologyPrompt },
        ],
      });

      const psychologyAnalysis = typeof psychologyResponse.choices[0]?.message?.content === "string"
        ? psychologyResponse.choices[0].message.content
        : "Analysis unavailable";

      // Agent 4: Contrarian (InverseIQ)
      const contrarianPrompt = `You are a Contrarian Analyst (InverseIQ specialist).

Analyze ${symbol} for:
1. Is the consensus trade too crowded?
2. Funding rate extremes (if applicable)
3. Liquidation cluster risks
4. Counter-trend opportunities${inverseContext}

Use chain-of-thought reasoning. Challenge the obvious.

Keep response concise (max 200 words).`;

      const contrarianResponse = await invokeLLM({
        messages: [
          { role: "system", content: "You are a contrarian analyst who challenges consensus trades." },
          { role: "user", content: contrarianPrompt },
        ],
      });

      const contrarianAnalysis = typeof contrarianResponse.choices[0]?.message?.content === "string"
        ? contrarianResponse.choices[0].message.content
        : "Analysis unavailable";

      // Unified Recommendation
      const unifiedPrompt = `You are the Chief Trading Officer synthesizing analysis from 4 expert agents.

Agent Reports:
1. Quant Analyst: ${quantAnalysis}
2. Risk Specialist: ${riskAnalysis}
3. Market Psychology: ${psychologyAnalysis}
4. Contrarian: ${contrarianAnalysis}

Provide a UNIFIED RECOMMENDATION:
- Direction: LONG or SHORT
- Entry Zone: $X - $Y
- Stop-Loss: $Z
- Take-Profit: $W
- Position Size: $P
- Confidence Score: X/10
- Validity: X minutes/hours
- Key Risk: One sentence

Format as JSON:
{
  "direction": "LONG" or "SHORT",
  "entryZone": "$X - $Y",
  "stopLoss": "$Z",
  "takeProfit": "$W",
  "positionSize": "$P",
  "confidence": X,
  "validityMinutes": X,
  "keyRisk": "..."
}`;

      const unifiedResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a chief trading officer synthesizing multi-agent analysis into actionable trades.",
          },
          { role: "user", content: unifiedPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "trade_recommendation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                direction: { type: "string", enum: ["LONG", "SHORT"] },
                entryZone: { type: "string" },
                stopLoss: { type: "string" },
                takeProfit: { type: "string" },
                positionSize: { type: "string" },
                confidence: { type: "integer", minimum: 1, maximum: 10 },
                validityMinutes: { type: "integer" },
                keyRisk: { type: "string" },
              },
              required: [
                "direction",
                "entryZone",
                "stopLoss",
                "takeProfit",
                "positionSize",
                "confidence",
                "validityMinutes",
                "keyRisk",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const unifiedContent = typeof unifiedResponse.choices[0]?.message?.content === "string" 
        ? unifiedResponse.choices[0].message.content 
        : "{}";
      const recommendation = JSON.parse(unifiedContent);

      return {
        agents: {
          quant: quantAnalysis,
          risk: riskAnalysis,
          psychology: psychologyAnalysis,
          contrarian: contrarianAnalysis,
        },
        recommendation,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Record a trade result (win/loss) for learning
   */
  recordTradeResult: protectedProcedure
    .input(
      z.object({
        tradeId: z.number(),
        result: z.enum(["win", "loss", "breakeven"]),
        exitPrice: z.string(),
        profitLoss: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { tradeId, result, exitPrice, profitLoss } = input;
      const userId = ctx.user.id;

      // Update trade
      await db
        .update(trades)
        .set({
          result,
          exitPrice,
          profitLoss,
          closedAt: new Date(),
        })
        .where(and(eq(trades.id, tradeId), eq(trades.userId, userId)));

      // If loss, create inverse pattern
      if (result === "loss") {
        const trade = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
        if (trade.length > 0) {
          const t = trade[0];
          await db.insert(inversePatterns).values({
            userId,
            originalTradeId: tradeId,
            symbol: t.symbol,
            originalDirection: t.direction,
            invertedDirection: t.direction === "LONG" ? "SHORT" : "LONG",
            conditions: t.entryConditions || "{}",
            confidenceBoost: 2,
          });
        }
      }

      // Update user progress
      const progress = await db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1);
      if (progress.length === 0) {
        await db.insert(userProgress).values({
          userId,
          totalTrades: 1,
          winningTrades: result === "win" ? 1 : 0,
          losingTrades: result === "loss" ? 1 : 0,
        });
      } else {
        const p = progress[0];
        await db
          .update(userProgress)
          .set({
            totalTrades: p.totalTrades + 1,
            winningTrades: result === "win" ? p.winningTrades + 1 : p.winningTrades,
            losingTrades: result === "loss" ? p.losingTrades + 1 : p.losingTrades,
          })
          .where(eq(userProgress.userId, userId));
      }

      return { success: true };
    }),

  /**
   * Get user's trade history
   */
  getTradeHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const userTrades = await db
      .select()
      .from(trades)
      .where(eq(trades.userId, ctx.user.id))
      .orderBy(desc(trades.createdAt))
      .limit(50);

    return userTrades;
  }),

  /**
   * Fetch real-time market data from Binance
   */
  getMarketData: protectedProcedure
    .input(
      z.object({
        symbol: z.string(), // e.g., "BTCUSDT"
      })
    )
    .query(async ({ input }) => {
      const { symbol } = input;
      const binanceSymbol = symbol.replace("/", ""); // "BTC/USDT" -> "BTCUSDT"

      try {
        // Fetch ticker data from Binance
        const tickerResponse = await axios.get(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
          { timeout: 5000 }
        );

        const ticker = tickerResponse.data;

        // Fetch funding rate (for futures)
        let fundingRate = null;
        try {
          const fundingResponse = await axios.get(
            `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${binanceSymbol}`,
            { timeout: 5000 }
          );
          fundingRate = fundingResponse.data.lastFundingRate;
        } catch (e) {
          // Funding rate not available for spot pairs
        }

        return {
          symbol: input.symbol,
          price: parseFloat(ticker.lastPrice),
          change24h: parseFloat(ticker.priceChangePercent),
          high24h: parseFloat(ticker.highPrice),
          low24h: parseFloat(ticker.lowPrice),
          volume24h: parseFloat(ticker.volume),
          fundingRate: fundingRate ? parseFloat(fundingRate) : null,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("Failed to fetch market data:", error);
        throw new Error("Failed to fetch market data from Binance");
      }
    }),

  /**
   * Get user progress and level
   */
  getUserProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const progress = await db.select().from(userProgress).where(eq(userProgress.userId, ctx.user.id)).limit(1);

    if (progress.length === 0) {
      // Initialize progress
      await db.insert(userProgress).values({ userId: ctx.user.id });
      return {
        currentLevel: "beginner",
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
      };
    }

    const p = progress[0];
    const winRate = p.totalTrades > 0 ? Math.round((p.winningTrades / p.totalTrades) * 100) : 0;

    return {
      ...p,
      winRate,
    };
  }),
});
