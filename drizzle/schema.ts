import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Futures Trading Tables

/**
 * Stores user's futures trades for learning and analysis
 */
export const trades = mysqlTable("trades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(), // e.g., "BTC/USDT"
  direction: mysqlEnum("direction", ["LONG", "SHORT"]).notNull(),
  entryPrice: varchar("entryPrice", { length: 20 }).notNull(),
  exitPrice: varchar("exitPrice", { length: 20 }),
  stopLoss: varchar("stopLoss", { length: 20 }).notNull(),
  takeProfit: varchar("takeProfit", { length: 20 }).notNull(),
  leverage: int("leverage").notNull(),
  positionSize: varchar("positionSize", { length: 20 }).notNull(),
  result: mysqlEnum("result", ["win", "loss", "breakeven", "open"]).default("open").notNull(),
  profitLoss: varchar("profitLoss", { length: 20 }),
  riskLevel: mysqlEnum("riskLevel", ["very_high", "high", "medium", "low"]).notNull(),
  entryConditions: text("entryConditions"), // JSON string of indicators at entry
  aiConfidence: int("aiConfidence"), // 1-10 score
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
});

/**
 * Stores inverse learning patterns from losing trades
 */
export const inversePatterns = mysqlTable("inversePatterns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  originalTradeId: int("originalTradeId").notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  originalDirection: mysqlEnum("originalDirection", ["LONG", "SHORT"]).notNull(),
  invertedDirection: mysqlEnum("invertedDirection", ["LONG", "SHORT"]).notNull(),
  conditions: text("conditions").notNull(), // JSON string of conditions to match
  confidenceBoost: int("confidenceBoost").default(2).notNull(), // Added to signal confidence
  timesTriggered: int("timesTriggered").default(0).notNull(),
  successRate: int("successRate").default(0).notNull(), // 0-100
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Tracks user progress and difficulty level
 */
export const userProgress = mysqlTable("userProgress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currentLevel: mysqlEnum("currentLevel", ["beginner", "intermediate", "advanced", "expert"]).default("beginner").notNull(),
  totalTrades: int("totalTrades").default(0).notNull(),
  winningTrades: int("winningTrades").default(0).notNull(),
  losingTrades: int("losingTrades").default(0).notNull(),
  averageRR: varchar("averageRR", { length: 10 }).default("0").notNull(), // Average risk-reward ratio
  maxDrawdown: varchar("maxDrawdown", { length: 10 }).default("0").notNull(), // Percentage
  quizScore: int("quizScore").default(0).notNull(), // Total correct answers
  quizAttempts: int("quizAttempts").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;
export type InversePattern = typeof inversePatterns.$inferSelect;
export type InsertInversePattern = typeof inversePatterns.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = typeof userProgress.$inferInsert;

/**
 * Stores user's external API keys for premium AI services
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["openai", "anthropic", "binance"]).notNull(),
  apiKey: text("apiKey").notNull(), // Encrypted in production
  apiSecret: text("apiSecret"), // For Binance HMAC-SHA256 authentication
  model: varchar("model", { length: 50 }), // e.g., "gpt-4", "claude-3-5-sonnet-20241022"
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;