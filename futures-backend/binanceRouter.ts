import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { apiKeys } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { BinanceFuturesClient } from "./binanceFuturesApi";

export const binanceRouter = router({
  // Save Binance API keys
  saveApiKeys: protectedProcedure
    .input(
      z.object({
        apiKey: z.string(),
        apiSecret: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Check if user already has Binance keys
      const existing = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, 'binance')))
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(apiKeys)
          .set({
            apiKey: input.apiKey,
            apiSecret: input.apiSecret,
            updatedAt: new Date(),
          })
          .where(eq(apiKeys.id, existing[0].id));
      } else {
        // Insert new
        await db.insert(apiKeys).values({
          userId: ctx.user.id,
          provider: 'binance',
          apiKey: input.apiKey,
          apiSecret: input.apiSecret,
          isActive: 1,
        });
      }

      return { success: true };
    }),

  // Get Binance API keys status
  getApiKeysStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { hasKeys: false };

    const result = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, 'binance')))
      .limit(1);

    return {
      hasKeys: result.length > 0,
      isActive: result.length > 0 ? result[0].isActive === 1 : false,
    };
  }),

  // Test Binance API connection
  testConnection: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const result = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, 'binance')))
      .limit(1);

    if (result.length === 0) {
      throw new Error('No Binance API keys found');
    }

    const client = new BinanceFuturesClient(result[0].apiKey, result[0].apiSecret!);
    const isValid = await client.testConnection();

    if (!isValid) {
      throw new Error('Invalid API keys or connection failed');
    }

    return { success: true, message: 'Connection successful' };
  }),

  // Execute trade on Binance Futures
  executeTrade: protectedProcedure
    .input(
      z.object({
        signal: z.object({
          pair: z.string(),
          direction: z.enum(['LONG', 'SHORT']),
          entry: z.number(),
          stopLoss: z.number(),
          takeProfit: z.number(),
          leverage: z.number(),
        }),
        quantity: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get user's Binance API keys
      const result = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, 'binance')))
        .limit(1);

      if (result.length === 0) {
        throw new Error('Please setup your Binance API keys first');
      }

      const { signalToBinanceOrder } = await import('./binanceFuturesApi');
      const client = new BinanceFuturesClient(result[0].apiKey, result[0].apiSecret!);

      try {
        // Set leverage
        const symbol = input.signal.pair.replace('/', '') + 'USDT';
        await client.setLeverage(symbol, input.signal.leverage);

        // Convert signal to Binance orders
        const orders = signalToBinanceOrder(input.signal, input.quantity);

        // Place main order
        const mainOrder = await client.placeOrder(orders.main);

        // Place stop-loss order
        await client.placeOrder(orders.stopLoss);

        // Place take-profit order
        await client.placeOrder(orders.takeProfit);

        return {
          success: true,
          message: `${input.signal.direction} position opened successfully!`,
          orderId: mainOrder.orderId,
        };
      } catch (error: any) {
        throw new Error(`Trade execution failed: ${error.message}`);
      }
    }),

  // Get active positions
  getPositions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, 'binance')))
      .limit(1);

    if (result.length === 0) {
      return [];
    }

    const client = new BinanceFuturesClient(result[0].apiKey, result[0].apiSecret!);
    return await client.getPositions();
  }),

  // Close position
  closePosition: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        positionAmt: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const result = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.userId, ctx.user.id), eq(apiKeys.provider, 'binance')))
        .limit(1);

      if (result.length === 0) {
        throw new Error('No Binance API keys found');
      }

      const client = new BinanceFuturesClient(result[0].apiKey, result[0].apiSecret!);
      await client.closePosition(input.symbol, input.positionAmt);

      return { success: true, message: 'Position closed successfully' };
    }),

  // Record trade close for auto-learning
  recordTradeClose: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        direction: z.enum(['LONG', 'SHORT']),
        entryPrice: z.number(),
        exitPrice: z.number(),
        pnl: z.number(),
        leverage: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const { trades } = await import('../drizzle/schema');
      const { processLosingTrades } = await import('./inverseLearning');

      // Save trade to database
      await db.insert(trades).values({
        userId: ctx.user.id,
        symbol: input.symbol,
        direction: input.direction,
        entryPrice: input.entryPrice.toString(),
        exitPrice: input.exitPrice.toString(),
        stopLoss: '0', // Not available at close
        takeProfit: '0', // Not available at close
        leverage: input.leverage,
        positionSize: '0', // Not available at close
        profitLoss: input.pnl.toString(),
        riskLevel: 'high', // Default
        result: input.pnl < 0 ? 'loss' : 'win',
        closedAt: new Date(),
      });

      // Auto-learn from this trade
      if (input.pnl < 0) {
        await processLosingTrades(ctx.user.id);
        return {
          success: true,
          message: 'Trade recorded and inverse pattern created',
          learnedFromTrade: true,
        };
      }

      return {
        success: true,
        message: 'Trade recorded successfully',
        learnedFromTrade: false,
      };
    }),
});
