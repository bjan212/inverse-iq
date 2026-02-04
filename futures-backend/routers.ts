import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import { futuresRouter } from "./futuresRouter";
import { binanceRouter } from "./binanceRouter";
import { generateBestTradeSignal } from "./tradingSignals";
import { generateWithEnsemble } from "./aiEnsemble";
import { getDb } from "./db";
import { apiKeys, trades } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { EdgeXClient, signalToEdgeXOrder } from "./edgexApi";
import type { EdgeXOrder } from "./edgexApi";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  futures: futuresRouter,
  binance: binanceRouter,

  prompt: router({
    generateFromDescription: publicProcedure
      .input(
        z.object({
          description: z.string(),
          provider: z.enum(["built-in", "openai", "anthropic"]).optional(),
          useStoredKey: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { description } = input;

        // Gather available API keys
        const availableKeys: { openai?: string; anthropic?: string } = {};

        if (ctx.user) {
          const db = await getDb();
          if (db) {
            const results = await db.select().from(apiKeys).where(eq(apiKeys.userId, ctx.user.id)).limit(1);
            const storedKey = results[0];

            if (storedKey && storedKey.isActive) {
              if (storedKey.provider === "openai") {
                availableKeys.openai = storedKey.apiKey;
              } else if (storedKey.provider === "anthropic") {
                availableKeys.anthropic = storedKey.apiKey;
              }
            }
          }
        }

        // Use ensemble system to query all available models and synthesize
        const result = await generateWithEnsemble(description, availableKeys);

        console.log(`[Quick Start] Generated using: ${result.modelsUsed.join(", ")}`);

        return result.fields;
      }),

    saveApiKey: publicProcedure
      .input(
        z.object({
          provider: z.enum(["openai", "anthropic"]),
          apiKey: z.string(),
          model: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Must be logged in to save API keys");
        }

        const { provider, apiKey: key, model } = input;

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Check if user already has a key for this provider
        const results = await db.select().from(apiKeys).where(eq(apiKeys.userId, ctx.user.id)).limit(1);
        const existing = results[0];

        if (existing) {
          // Update existing key
          await db.update(apiKeys)
            .set({
              provider,
              apiKey: key,
              model: model || null,
              isActive: 1,
              updatedAt: new Date(),
            })
            .where(eq(apiKeys.userId, ctx.user.id));
        } else {
          // Insert new key
          await db.insert(apiKeys).values({
            userId: ctx.user.id,
            provider,
            apiKey: key,
            model: model || null,
            isActive: 1,
          });
        }

        return { success: true };
      }),

    getApiKeyStatus: publicProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user) {
          return { hasKey: false };
        }

        const db = await getDb();
        if (!db) {
          return { hasKey: false };
        }

        const results = await db.select().from(apiKeys).where(eq(apiKeys.userId, ctx.user.id)).limit(1);
        const key = results[0];

        if (!key || !key.isActive) {
          return { hasKey: false };
        }

        return {
          hasKey: true,
          provider: key.provider,
          model: key.model,
        };
      }),
  }),

  trading: router({
    generateSignal: publicProcedure
      .input(
        z.object({
          exchange: z.string(),
          riskProfile: z.string(),
          specificCrypto: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { exchange, riskProfile, specificCrypto } = input;
        const userId = ctx.user?.id;
        const signal = await generateBestTradeSignal(exchange, riskProfile, specificCrypto, userId);
        return signal;
      }),
  }),

  ai: router({
    suggest: publicProcedure
      .input(
        z.object({
          framework: z.enum(["aim", "map", "ocean", "crypto", "spot", "boardroom"]),
          currentField: z.string(),
          currentValue: z.string(),
          targetField: z.string(),
          allFields: z.record(z.string(), z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { framework, currentField, currentValue, targetField, allFields } = input;

        const fieldsContext = allFields
          ? `Other fields they've filled:\n${Object.entries(allFields)
              .map(([k, v]) => `- ${k}: ${v}`)
              .join("\n")}`
          : "";

        const contextPrompt = `You are an AI prompt engineering assistant. The user is building a prompt using the "${framework}" framework.

They have filled in the "${currentField}" field with:
"${currentValue}"

${fieldsContext}

Now, suggest a concise, relevant value for the "${targetField}" field that complements what they've already written. Keep it brief (1-3 sentences max).`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a helpful AI prompt engineering assistant." },
            { role: "user", content: contextPrompt },
          ],
        });

        const content = response.choices[0]?.message?.content;
        const suggestion = typeof content === "string" ? content.trim() : "";

        return { suggestion };
      }),
  }),

  edgex: router({
    // Execute trade on EdgeX L2 DEX
    executeTrade: publicProcedure
      .input(
        z.object({
          signal: z.object({
            pair: z.string(),
            direction: z.enum(["LONG", "SHORT"]),
            entry: z.number(),
            stopLoss: z.number(),
            takeProfit: z.number(),
            leverage: z.string(),
          }),
          walletAddress: z.string(),
          quantity: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        // TODO: Get EdgeX API credentials from user settings
        // For now, using placeholder
        const client = new EdgeXClient('placeholder_key', 'placeholder_secret');

        const leverage = parseInt(input.signal.leverage.replace('x', ''));
        const order: EdgeXOrder = {
          ...signalToEdgeXOrder(input.signal, leverage),
          quantity: input.quantity,
        };

        try {
          // Set leverage first
          await client.setLeverage(
            order.symbol,
            leverage,
            input.walletAddress
          );

          // Place main entry order
          const mainOrder = await client.placeOrder(order, input.walletAddress);

          // Place stop-loss order
          const stopLossOrder: EdgeXOrder = {
            symbol: order.symbol,
            side: order.side === 'BUY' ? 'SELL' : 'BUY',
            type: 'STOP_MARKET',
            quantity: input.quantity,
            stopPrice: input.signal.stopLoss.toString(),
            reduceOnly: true,
          };
          await client.placeOrder(stopLossOrder, input.walletAddress);

          // Place take-profit order
          const takeProfitOrder: EdgeXOrder = {
            symbol: order.symbol,
            side: order.side === 'BUY' ? 'SELL' : 'BUY',
            type: 'TAKE_PROFIT_MARKET',
            quantity: input.quantity,
            stopPrice: input.signal.takeProfit.toString(),
            reduceOnly: true,
          };
          await client.placeOrder(takeProfitOrder, input.walletAddress);

          return {
            success: true,
            orderId: mainOrder.orderId,
            message: 'Trade executed successfully with stop-loss and take-profit orders',
          };
        } catch (error: any) {
          throw new Error(`Failed to execute trade: ${error.message}`);
        }
      }),

    // Get active positions
    getPositions: publicProcedure
      .input(
        z.object({
          walletAddress: z.string(),
        })
      )
      .query(async ({ input }) => {
        const client = new EdgeXClient('placeholder_key', 'placeholder_secret');
        return await client.getPositions(input.walletAddress);
      }),

    // Close position
    closePosition: publicProcedure
      .input(
        z.object({
          symbol: z.string(),
          walletAddress: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const client = new EdgeXClient('placeholder_key', 'placeholder_secret');
        return await client.closePosition(input.symbol, input.walletAddress);
      }),

    // Get account balance
    getBalance: publicProcedure
      .input(
        z.object({
          walletAddress: z.string(),
        })
      )
      .query(async ({ input }) => {
        const client = new EdgeXClient('placeholder_key', 'placeholder_secret');
        return await client.getBalance(input.walletAddress);
      }),
  }),

  tradeHistory: router({
    // Get user's trade history with filters
    getHistory: protectedProcedure
      .input(
        z.object({
          startDate: z.string().optional(),
          endDate: z.string().optional(),
          symbol: z.string().optional(),
          direction: z.enum(["LONG", "SHORT"]).optional(),
          result: z.enum(["win", "loss", "breakeven", "open"]).optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const conditions = [eq(trades.userId, ctx.user.id)];
        if (input.symbol) conditions.push(eq(trades.symbol, input.symbol));
        if (input.direction) conditions.push(eq(trades.direction, input.direction));
        if (input.result) conditions.push(eq(trades.result, input.result));

        const results = await db
          .select()
          .from(trades)
          .where(and(...conditions))
          .limit(input.limit)
          .offset(input.offset);
        
        return results;
      }),

    // Get trading statistics
    getStatistics: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const userTrades = await db.select().from(trades).where(eq(trades.userId, ctx.user.id));

      const totalTrades = userTrades.length;
      const winningTrades = userTrades.filter((t: any) => t.result === 'win').length;
      const losingTrades = userTrades.filter((t: any) => t.result === 'loss').length;
      const openTrades = userTrades.filter((t: any) => t.result === 'open').length;

      const winRate = totalTrades > 0 ? (winningTrades / (winningTrades + losingTrades)) * 100 : 0;

      const totalPnL = userTrades
        .filter((t: any) => t.profitLoss)
        .reduce((sum: number, t: any) => sum + parseFloat(t.profitLoss || '0'), 0);

      const avgProfit = winningTrades > 0
        ? userTrades
            .filter((t: any) => t.result === 'win' && t.profitLoss)
            .reduce((sum: number, t: any) => sum + parseFloat(t.profitLoss || '0'), 0) / winningTrades
        : 0;

      const avgLoss = losingTrades > 0
        ? userTrades
            .filter((t: any) => t.result === 'loss' && t.profitLoss)
            .reduce((sum: number, t: any) => sum + parseFloat(t.profitLoss || '0'), 0) / losingTrades
        : 0;

      const bestTrade = userTrades
        .filter((t: any) => t.profitLoss)
        .sort((a: any, b: any) => parseFloat(b.profitLoss!) - parseFloat(a.profitLoss!))[0];

      const worstTrade = userTrades
        .filter((t: any) => t.profitLoss)
        .sort((a: any, b: any) => parseFloat(a.profitLoss!) - parseFloat(b.profitLoss!))[0];

      return {
        totalTrades,
        winningTrades,
        losingTrades,
        openTrades,
        winRate: winRate.toFixed(2),
        totalPnL: totalPnL.toFixed(2),
        avgProfit: avgProfit.toFixed(2),
        avgLoss: avgLoss.toFixed(2),
        bestTrade: bestTrade ? {
          symbol: bestTrade.symbol,
          pnl: bestTrade.profitLoss,
          date: bestTrade.closedAt,
        } : null,
        worstTrade: worstTrade ? {
          symbol: worstTrade.symbol,
          pnl: worstTrade.profitLoss,
          date: worstTrade.closedAt,
        } : null,
      };
    }),

    // Record a new trade
    recordTrade: protectedProcedure
      .input(
        z.object({
          symbol: z.string(),
          direction: z.enum(["LONG", "SHORT"]),
          entryPrice: z.string(),
          stopLoss: z.string(),
          takeProfit: z.string(),
          leverage: z.number(),
          positionSize: z.string(),
          riskLevel: z.enum(["very_high", "high", "medium", "low"]),
          aiConfidence: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        await db.insert(trades).values({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
