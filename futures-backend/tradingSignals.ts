import { invokeLLM } from "./_core/llm";

/**
 * Trading Signal Types
 */
export interface TradingSignal {
  pair: string;
  direction: "LONG" | "SHORT";
  entry: number;
  stopLoss: number;
  takeProfit: number;
  leverage: string;
  confidence: number;
  timeframe: string;
  validityMinutes: number;
  riskReward: string;
  indicators: {
    rsi: number;
    macd: string;
    volume: string;
    sentiment: string;
  };
  reasoning: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  volume24h: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
}

/**
 * Fetch market data from Binance API (free, no API key required)
 */
export async function fetchMarketData(symbols?: string[]): Promise<MarketData[]> {
  try {
    const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
    const data = await response.json();
    
    // Filter for USDT pairs and convert to our format
    const marketData: MarketData[] = data
      .filter((ticker: any) => {
        if (symbols && symbols.length > 0) {
          return symbols.some(s => ticker.symbol === s.replace("/", ""));
        }
        return ticker.symbol.endsWith("USDT");
      })
      .map((ticker: any) => ({
        symbol: ticker.symbol.replace("USDT", "/USDT"),
        price: parseFloat(ticker.lastPrice),
        volume24h: parseFloat(ticker.volume),
        priceChange24h: parseFloat(ticker.priceChangePercent),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
      }))
      .slice(0, 50); // Limit to top 50 by volume

    return marketData;
  } catch (error) {
    console.error("Error fetching market data:", error);
    return [];
  }
}

/**
 * Calculate technical indicators for a given symbol
 */
export async function calculateIndicators(symbol: string): Promise<{
  rsi: number;
  macd: string;
  volume: string;
  sentiment: string;
}> {
  try {
    // Fetch kline data from Binance (candlestick data)
    const binanceSymbol = symbol.replace("/", "");
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=5m&limit=100`
    );
    const klines = await response.json();

    // Calculate RSI (simplified)
    const closes = klines.map((k: any) => parseFloat(k[4]));
    const rsi = calculateRSI(closes, 14);

    // Calculate MACD signal (simplified)
    const macd = calculateMACD(closes);

    // Volume analysis
    const volumes = klines.map((k: any) => parseFloat(k[5]));
    const avgVolume = volumes.slice(0, 20).reduce((a: number, b: number) => a + b, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];
    const volumeChange = ((currentVolume - avgVolume) / avgVolume) * 100;
    const volume = volumeChange > 0 ? `+${volumeChange.toFixed(0)}%` : `${volumeChange.toFixed(0)}%`;

    // Sentiment (based on price action and volume)
    const priceChange = ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100;
    let sentiment = "Neutral";
    if (priceChange > 5 && volumeChange > 50) sentiment = "Extremely Bullish";
    else if (priceChange > 2 && volumeChange > 20) sentiment = "Bullish";
    else if (priceChange < -5 && volumeChange > 50) sentiment = "Extremely Bearish";
    else if (priceChange < -2 && volumeChange > 20) sentiment = "Bearish";

    return { rsi, macd, volume, sentiment };
  } catch (error) {
    console.error("Error calculating indicators:", error);
    return {
      rsi: 50,
      macd: "Neutral",
      volume: "0%",
      sentiment: "Neutral",
    };
  }
}

/**
 * Simplified RSI calculation
 */
function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return Math.round(rsi);
}

/**
 * Simplified MACD calculation
 */
function calculateMACD(closes: number[]): string {
  if (closes.length < 26) return "Neutral";

  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12 - ema26;

  // Simple signal: if MACD is positive and increasing, bullish
  if (macdLine > 0) return "Bullish Crossover";
  else if (macdLine < 0) return "Bearish Crossover";
  return "Neutral";
}

/**
 * Calculate Exponential Moving Average
 */
function calculateEMA(closes: number[], period: number): number {
  const multiplier = 2 / (period + 1);
  let ema = closes[closes.length - period];

  for (let i = closes.length - period + 1; i < closes.length; i++) {
    ema = (closes[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate signal validity based on volatility and timeframe
 */
function calculateValidityMinutes(
  volatility: number,
  volume: string,
  timeframe: string,
  rsi: number
): number {
  let baseMinutes = 30; // Default for 5m timeframe

  // Adjust based on volatility
  if (volatility > 5) baseMinutes = 15; // High volatility = shorter validity
  else if (volatility < 2) baseMinutes = 45; // Low volatility = longer validity

  // Adjust based on RSI extremes
  if (rsi < 30 || rsi > 70) baseMinutes -= 5; // Extreme RSI = shorter validity

  // Adjust based on volume
  const volumeNum = parseInt(volume.replace("%", "").replace("+", ""));
  if (volumeNum > 100) baseMinutes -= 5; // High volume = shorter validity

  return Math.max(10, Math.min(60, baseMinutes)); // Clamp between 10-60 minutes
}

/**
 * Generate AI-powered trading signal for best opportunity
 */
export async function generateBestTradeSignal(
  exchange: string,
  riskProfile: string,
  specificCrypto?: string,
  userId?: number
): Promise<TradingSignal & { learnedFromHistory?: boolean; patternId?: number }> {
  try {
    // Check for inverse patterns first if userId provided
    let inversePattern: any = null;
    if (userId) {
      const { getUserInversePatterns, matchInversePattern } = await import("./inverseLearning");
      const patterns = await getUserInversePatterns(userId);
      
      // Try to match current market conditions with learned patterns
      if (patterns.length > 0) {
        // Get current market data for pattern matching
        const currentMarket = specificCrypto
          ? await fetchMarketData([specificCrypto])
          : await fetchMarketData();
        
        if (currentMarket.length > 0) {
          const indicators = await calculateIndicators(currentMarket[0].symbol);
          const currentConditions = {
            rsi: indicators.rsi,
            volume: parseFloat(indicators.volume.replace("%", "")),
            sentiment: indicators.sentiment.includes("Bullish") ? "bullish" as const : 
                      indicators.sentiment.includes("Bearish") ? "bearish" as const : "neutral" as const,
          };
          
          inversePattern = matchInversePattern(currentConditions, patterns);
        }
      }
    }
    
    // If we have a high-confidence inverse pattern, prioritize it
    if (inversePattern && inversePattern.successRate > 60) {
      const marketData = await fetchMarketData([inversePattern.symbol]);
      if (marketData.length > 0) {
        const indicators = await calculateIndicators(marketData[0].symbol);
        const data = marketData[0];
        
        // Build signal from inverse pattern
        const direction = inversePattern.invertedDirection;
        const entry = data.price;
        const stopLoss = direction === "LONG" 
          ? entry * 0.97 // 3% stop loss for LONG
          : entry * 1.03; // 3% stop loss for SHORT
        const takeProfit = direction === "LONG"
          ? entry * 1.06 // 6% take profit for LONG (2:1 RR)
          : entry * 0.94; // 6% take profit for SHORT (2:1 RR)
        
        return {
          pair: data.symbol,
          direction,
          entry,
          stopLoss,
          takeProfit,
          leverage: "10x",
          confidence: Math.min(99, 85 + inversePattern.confidenceBoost * 5),
          timeframe: "5m",
          validityMinutes: 30,
          riskReward: "1:2",
          indicators: {
            rsi: indicators.rsi,
            macd: indicators.macd,
            volume: indicators.volume,
            sentiment: indicators.sentiment,
          },
          reasoning: `🎓 **Learned from Trading History**\n\nThis signal is based on inverse learning from past trades. Pattern has ${inversePattern.successRate}% success rate over ${inversePattern.timesTriggered} uses.`,
          learnedFromHistory: true,
          patternId: inversePattern.id,
        };
      }
    }
    
    // Otherwise, proceed with normal signal generation
    const marketData = specificCrypto
      ? await fetchMarketData([specificCrypto])
      : await fetchMarketData();

    if (marketData.length === 0) {
      throw new Error("No market data available");
    }

    // Sort by volume and price change to find best opportunities
    const sortedData = marketData.sort((a: MarketData, b: MarketData) => {
      // Prioritize high volume + significant price movement
      const scoreA = Math.abs((a as MarketData).priceChange24h) * ((a as MarketData).volume24h / 1000000);
      const scoreB = Math.abs((b as MarketData).priceChange24h) * ((b as MarketData).volume24h / 1000000);
      return scoreB - scoreA;
    });

    // Get top 5 candidates
    const candidates = sortedData.slice(0, 5);

    // Calculate indicators for each candidate
    const candidatesWithIndicators = await Promise.all(
      candidates.map(async (c) => ({
        ...c,
        indicators: await calculateIndicators(c.symbol),
      }))
    );

    // Use AI to analyze and select the best trade
    const aiAnalysis = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert cryptocurrency futures trading analyst specializing in high-probability trade signals. Your goal is to identify the single best trading opportunity with 99% confidence targeting.

Risk Profile: ${riskProfile}
Exchange: ${exchange}

Analyze the following market data and technical indicators to select THE BEST trade opportunity. Consider:
1. Technical indicators (RSI, MACD, Volume)
2. Price action and momentum
3. Risk/reward ratio
4. Market sentiment
5. Volatility for optimal entry timing

For Very High Risk profile: Focus on high volatility, extreme indicators, and potential for 2x returns in 24 hours.
For other profiles: Balance risk with probability of success.`,
        },
        {
          role: "user",
          content: `Market Data:\n${JSON.stringify(candidatesWithIndicators, null, 2)}\n\nSelect the BEST trading opportunity and provide a complete trading signal.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "trading_signal",
          strict: true,
          schema: {
            type: "object",
            properties: {
              pair: { type: "string", description: "Trading pair (e.g., BTC/USDT)" },
              direction: {
                type: "string",
                enum: ["LONG", "SHORT"],
                description: "Trade direction",
              },
              entry: { type: "number", description: "Entry price" },
              stopLoss: { type: "number", description: "Stop loss price" },
              takeProfit: { type: "number", description: "Take profit price" },
              confidence: {
                type: "number",
                description: "Confidence score (0-100), target 99",
              },
              reasoning: {
                type: "string",
                description: "Brief explanation of why this is the best trade",
              },
            },
            required: [
              "pair",
              "direction",
              "entry",
              "stopLoss",
              "takeProfit",
              "confidence",
              "reasoning",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = aiAnalysis.choices[0].message.content;
    const aiResponse = JSON.parse(typeof content === 'string' ? content : "{}");

    // Find the selected pair's data
    const selectedPair = candidatesWithIndicators.find(
      (c) => c.symbol === aiResponse.pair
    );

    if (!selectedPair) {
      throw new Error("AI selected invalid pair");
    }

    // Calculate additional metrics
    const riskAmount = Math.abs(aiResponse.entry - aiResponse.stopLoss);
    const rewardAmount = Math.abs(aiResponse.takeProfit - aiResponse.entry);
    const riskReward = `1:${(rewardAmount / riskAmount).toFixed(1)}`;

    // Determine leverage based on risk profile
    let leverage = "10x";
    if (riskProfile === "very-high") leverage = "50x";
    else if (riskProfile === "high") leverage = "20x";
    else if (riskProfile === "medium") leverage = "10x";
    else if (riskProfile === "low") leverage = "5x";

    // Calculate validity
    const volatility = Math.abs(selectedPair.priceChange24h);
    const validityMinutes = calculateValidityMinutes(
      volatility,
      selectedPair.indicators.volume,
      "5m",
      selectedPair.indicators.rsi
    );

    const signal: TradingSignal = {
      pair: aiResponse.pair,
      direction: aiResponse.direction,
      entry: aiResponse.entry,
      stopLoss: aiResponse.stopLoss,
      takeProfit: aiResponse.takeProfit,
      leverage,
      confidence: aiResponse.confidence,
      timeframe: "5m",
      validityMinutes,
      riskReward,
      indicators: selectedPair.indicators,
      reasoning: aiResponse.reasoning,
    };

    return signal;
  } catch (error) {
    console.error("Error generating trade signal:", error);
    throw error;
  }
}

/**
 * Analyze user trade history for inverse learning
 * (Placeholder - will be implemented when trade history tracking is added)
 */
export async function analyzeTradeHistory(userId: string): Promise<{
  winRate: number;
  avgReturn: number;
  inversePatterns: string[];
}> {
  // TODO: Implement inverse learning system
  // 1. Fetch user's trade history from database
  // 2. Identify losing trades and their entry conditions
  // 3. Invert signals for those conditions
  // 4. Store as high-confidence patterns
  return {
    winRate: 0,
    avgReturn: 0,
    inversePatterns: [],
  };
}
