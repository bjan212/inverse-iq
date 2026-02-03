import { getDb } from "./db";
import { trades, inversePatterns, type Trade, type InsertInversePattern } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Entry conditions extracted from a trade
 */
export interface EntryConditions {
  rsi?: number;
  macd?: { value: number; signal: number; histogram: number };
  volume?: number;
  volatility?: number;
  sentiment?: "bullish" | "bearish" | "neutral";
  priceLevel?: "support" | "resistance" | "neutral";
  timeframe?: string;
}

/**
 * Analyze a losing trade and extract entry conditions
 */
export async function analyzeLosingTrade(tradeId: number): Promise<EntryConditions | null> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const trade = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
  
  if (!trade.length || trade[0].result !== "loss") {
    return null;
  }

  // Parse entry conditions from JSON string
  const conditions = trade[0].entryConditions 
    ? JSON.parse(trade[0].entryConditions) 
    : {};

  return conditions as EntryConditions;
}

/**
 * Create an inverse pattern from a losing trade
 */
export async function createInversePattern(
  userId: number,
  tradeId: number
): Promise<InsertInversePattern | null> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const trade = await db.select().from(trades).where(eq(trades.id, tradeId)).limit(1);
  
  if (!trade.length || trade[0].result !== "loss") {
    return null;
  }

  const conditions = await analyzeLosingTrade(tradeId);
  if (!conditions) {
    return null;
  }

  // Invert the direction
  const invertedDirection = trade[0].direction === "LONG" ? "SHORT" : "LONG";

  const pattern: InsertInversePattern = {
    userId,
    originalTradeId: tradeId,
    symbol: trade[0].symbol,
    originalDirection: trade[0].direction,
    invertedDirection,
    conditions: JSON.stringify(conditions),
    confidenceBoost: 2, // Initial boost
    timesTriggered: 0,
    successRate: 0,
  };

  return pattern;
}

/**
 * Store inverse pattern in database
 */
export async function storeInversePattern(pattern: InsertInversePattern): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.insert(inversePatterns).values(pattern);
}

/**
 * Process all losing trades for a user and create inverse patterns
 */
export async function processLosingTrades(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  // Get all losing trades that don't have inverse patterns yet
  const losingTrades = await db
    .select()
    .from(trades)
    .where(and(eq(trades.userId, userId), eq(trades.result, "loss")))
    .orderBy(desc(trades.createdAt));

  // Get existing patterns to avoid duplicates
  const existingPatterns = await db
    .select()
    .from(inversePatterns)
    .where(eq(inversePatterns.userId, userId));

  const existingTradeIds = new Set(existingPatterns.map(p => p.originalTradeId));

  let created = 0;
  for (const trade of losingTrades) {
    if (existingTradeIds.has(trade.id)) {
      continue; // Skip if pattern already exists
    }

    const pattern = await createInversePattern(userId, trade.id);
    if (pattern) {
      await storeInversePattern(pattern);
      created++;
    }
  }

  return created;
}

/**
 * Get all inverse patterns for a user
 */
export async function getUserInversePatterns(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return db
    .select()
    .from(inversePatterns)
    .where(eq(inversePatterns.userId, userId))
    .orderBy(desc(inversePatterns.successRate), desc(inversePatterns.confidenceBoost));
}

/**
 * Check if current market conditions match any inverse patterns
 */
export function matchInversePattern(
  currentConditions: EntryConditions,
  patterns: typeof inversePatterns.$inferSelect[]
): typeof inversePatterns.$inferSelect | null {
  for (const pattern of patterns) {
    const patternConditions: EntryConditions = JSON.parse(pattern.conditions);
    
    // Simple matching logic - can be enhanced with fuzzy matching
    const rsiMatch = !patternConditions.rsi || 
      (currentConditions.rsi && Math.abs(currentConditions.rsi - patternConditions.rsi) < 10);
    
    const sentimentMatch = !patternConditions.sentiment || 
      currentConditions.sentiment === patternConditions.sentiment;
    
    if (rsiMatch && sentimentMatch) {
      return pattern;
    }
  }
  
  return null;
}

/**
 * Update pattern statistics after a trade
 */
export async function updatePatternStats(
  patternId: number,
  wasSuccessful: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const pattern = await db
    .select()
    .from(inversePatterns)
    .where(eq(inversePatterns.id, patternId))
    .limit(1);

  if (!pattern.length) return;

  const current = pattern[0];
  const newTimesTriggered = current.timesTriggered + 1;
  const successCount = wasSuccessful 
    ? Math.floor((current.successRate * current.timesTriggered) / 100) + 1
    : Math.floor((current.successRate * current.timesTriggered) / 100);
  
  const newSuccessRate = Math.floor((successCount / newTimesTriggered) * 100);

  await db
    .update(inversePatterns)
    .set({
      timesTriggered: newTimesTriggered,
      successRate: newSuccessRate,
      confidenceBoost: newSuccessRate > 70 ? 3 : newSuccessRate > 50 ? 2 : 1,
    })
    .where(eq(inversePatterns.id, patternId));
}
