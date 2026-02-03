import { describe, it, expect } from "vitest";
import { fetchMarketData, calculateIndicators, generateBestTradeSignal } from "./tradingSignals";

describe("Trading Signals API", () => {
  it("should fetch market data from Binance", async () => {
    const data = await fetchMarketData();
    
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    // Check first item structure
    const first = data[0];
    expect(first).toHaveProperty("symbol");
    expect(first).toHaveProperty("price");
    expect(first).toHaveProperty("volume24h");
    expect(first).toHaveProperty("priceChange24h");
    expect(first.symbol).toContain("/USDT");
  }, 10000);

  it("should calculate technical indicators for BTC/USDT", async () => {
    const indicators = await calculateIndicators("BTC/USDT");
    
    expect(indicators).toBeDefined();
    expect(indicators).toHaveProperty("rsi");
    expect(indicators).toHaveProperty("macd");
    expect(indicators).toHaveProperty("volume");
    expect(indicators).toHaveProperty("sentiment");
    
    // RSI should be between 0 and 100
    expect(indicators.rsi).toBeGreaterThanOrEqual(0);
    expect(indicators.rsi).toBeLessThanOrEqual(100);
    
    // MACD should be a string
    expect(typeof indicators.macd).toBe("string");
    
    // Volume should include %
    expect(indicators.volume).toContain("%");
    
    // Sentiment should be one of the expected values
    const validSentiments = ["Extremely Bullish", "Bullish", "Neutral", "Bearish", "Extremely Bearish"];
    expect(validSentiments).toContain(indicators.sentiment);
  }, 15000);

  it("should generate a complete trading signal", async () => {
    const signal = await generateBestTradeSignal("binance", "very-high");
    
    expect(signal).toBeDefined();
    expect(signal).toHaveProperty("pair");
    expect(signal).toHaveProperty("direction");
    expect(signal).toHaveProperty("entry");
    expect(signal).toHaveProperty("stopLoss");
    expect(signal).toHaveProperty("takeProfit");
    expect(signal).toHaveProperty("leverage");
    expect(signal).toHaveProperty("confidence");
    expect(signal).toHaveProperty("timeframe");
    expect(signal).toHaveProperty("validityMinutes");
    expect(signal).toHaveProperty("riskReward");
    expect(signal).toHaveProperty("indicators");
    expect(signal).toHaveProperty("reasoning");
    
    // Direction should be LONG or SHORT
    expect(["LONG", "SHORT"]).toContain(signal.direction);
    
    // Confidence should be between 0 and 100
    expect(signal.confidence).toBeGreaterThanOrEqual(0);
    expect(signal.confidence).toBeLessThanOrEqual(100);
    
    // Validity should be between 10 and 60 minutes
    expect(signal.validityMinutes).toBeGreaterThanOrEqual(10);
    expect(signal.validityMinutes).toBeLessThanOrEqual(60);
    
    // Entry, stop-loss, and take-profit should be valid numbers
    expect(signal.entry).toBeGreaterThan(0);
    expect(signal.stopLoss).toBeGreaterThan(0);
    expect(signal.takeProfit).toBeGreaterThan(0);
    
    // For LONG: stop-loss < entry < take-profit
    // For SHORT: take-profit < entry < stop-loss
    if (signal.direction === "LONG") {
      expect(signal.stopLoss).toBeLessThan(signal.entry);
      expect(signal.entry).toBeLessThan(signal.takeProfit);
    } else {
      expect(signal.takeProfit).toBeLessThan(signal.entry);
      expect(signal.entry).toBeLessThan(signal.stopLoss);
    }
    
    // Leverage should match risk profile
    expect(signal.leverage).toBe("50x"); // Very high risk = 50x
    
    console.log("Generated signal:", JSON.stringify(signal, null, 2));
  }, 30000);

  it("should generate signal for specific crypto", async () => {
    const signal = await generateBestTradeSignal("binance", "high", "ETH/USDT");
    
    expect(signal).toBeDefined();
    expect(signal.pair).toBe("ETH/USDT");
    expect(signal.leverage).toBe("20x"); // High risk = 20x
  }, 30000);
});
