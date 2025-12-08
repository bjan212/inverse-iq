/**
 * Inverse Signal AI Engine
 * 
 * Core concept: When multiple traders lost money in similar market conditions,
 * those conditions become STRONG INVERSE SIGNALS.
 * 
 * The more traders who lost → The stronger the inverse signal
 * The bigger the losses → The more confident we are
 * 
 * This engine:
 * 1. Processes collected trading data from multiple traders
 * 2. Identifies common loss patterns across all traders
 * 3. Monitors live market conditions in real-time
 * 4. Generates inverse entry signals when conditions match
 * 5. Weights signals by number of traders + total losses
 */

const axios = require('axios');

class InverseSignalEngine {
  constructor() {
    this.lossPatterns = [];
    this.traderData = [];
    this.liveConditions = {};
    this.activeSignals = [];
  }

  /**
   * STEP 1: Process collected trading data
   * Convert raw trades into AI-ready loss patterns
   */
  async processCollectedData(collectedTrades) {
    console.log('\n🧠 AI ENGINE: Processing collected trading data...\n');
    
    // Group by trader
    const traderGroups = this.groupByTrader(collectedTrades);
    
    console.log(`📊 Processing data from ${traderGroups.length} traders...`);
    
    let totalLosses = 0;
    let totalLossAmount = 0;
    
    // Process each trader's data
    for (const trader of traderGroups) {
      console.log(`\n  Trader ${trader.id}:`);
      console.log(`    Total trades: ${trader.trades.length}`);
      
      // Separate wins and losses
      const losses = trader.trades.filter(t => t.pnl < 0);
      const wins = trader.trades.filter(t => t.pnl > 0);
      
      console.log(`    Losses: ${losses.length}`);
      console.log(`    Wins: ${wins.length}`);
      
      // Focus on LOSSES (this is key!)
      if (losses.length > 0) {
        const lossAmount = losses.reduce((sum, t) => sum + Math.abs(t.pnl), 0);
        console.log(`    Total loss amount: $${lossAmount.toFixed(2)}`);
        
        totalLosses += losses.length;
        totalLossAmount += lossAmount;
        
        // Extract loss patterns from this trader
        const patterns = await this.extractLossPatterns(trader.id, losses);
        console.log(`    Extracted ${patterns.length} loss patterns`);
        
        this.lossPatterns.push(...patterns);
      }
      
      this.traderData.push({
        traderId: trader.id,
        totalTrades: trader.trades.length,
        losses: losses.length,
        wins: wins.length,
        totalLossAmount: losses.reduce((sum, t) => sum + Math.abs(t.pnl), 0),
        lossPatterns: losses.length
      });
    }
    
    console.log(`\n✅ Data processing complete:`);
    console.log(`   Total traders: ${traderGroups.length}`);
    console.log(`   Total losses: ${totalLosses}`);
    console.log(`   Total loss amount: $${totalLossAmount.toFixed(2)}`);
    console.log(`   Loss patterns extracted: ${this.lossPatterns.length}`);
    
    return {
      traders: traderGroups.length,
      totalLosses,
      totalLossAmount,
      patterns: this.lossPatterns.length
    };
  }

  /**
   * STEP 2: Extract loss patterns from trades
   * Identify what conditions led to losses
   */
  async extractLossPatterns(traderId, losses) {
    const patterns = [];
    
    for (const loss of losses) {
      // Get market conditions at time of loss
      const conditions = await this.getMarketConditionsAtTime(
        loss.symbol,
        loss.entryTime || loss.time
      );
      
      patterns.push({
        traderId,
        symbol: loss.symbol,
        direction: loss.side, // The direction they took (and lost)
        inverseDirection: loss.side === 'LONG' ? 'SHORT' : 'LONG', // OPPOSITE!
        lossAmount: Math.abs(loss.pnl),
        entryTime: loss.entryTime || loss.time,
        conditions: {
          // Price action
          priceLevel: conditions.price,
          priceChange24h: conditions.priceChange24h,
          
          // Volume
          volume24h: conditions.volume24h,
          volumeRatio: conditions.volumeRatio,
          
          // Technical indicators (estimated from price data)
          rsi: conditions.rsi,
          macd: conditions.macd,
          
          // Market context
          marketSentiment: conditions.marketSentiment,
          fearGreedIndex: conditions.fearGreedIndex,
          
          // Futures-specific
          fundingRate: conditions.fundingRate,
          openInterest: conditions.openInterest,
          longShortRatio: conditions.longShortRatio
        }
      });
    }
    
    return patterns;
  }

  /**
   * STEP 3: Aggregate patterns across all traders
   * Find common loss conditions that multiple traders experienced
   */
  aggregateLossPatterns() {
    console.log('\n🔍 Aggregating loss patterns across all traders...\n');
    
    // Group patterns by symbol and similar conditions
    const grouped = {};
    
    for (const pattern of this.lossPatterns) {
      const key = this.getPatternKey(pattern);
      
      if (!grouped[key]) {
        grouped[key] = {
          symbol: pattern.symbol,
          originalDirection: pattern.direction,
          inverseDirection: pattern.inverseDirection,
          traders: new Set(),
          occurrences: 0,
          totalLoss: 0,
          avgConditions: this.initializeConditions(),
          patterns: []
        };
      }
      
      grouped[key].traders.add(pattern.traderId);
      grouped[key].occurrences++;
      grouped[key].totalLoss += pattern.lossAmount;
      grouped[key].patterns.push(pattern);
      
      // Accumulate conditions for averaging
      this.accumulateConditions(grouped[key].avgConditions, pattern.conditions);
    }
    
    // Calculate averages and create aggregated patterns
    const aggregated = [];
    
    for (const [key, group] of Object.entries(grouped)) {
      // Only keep patterns that multiple traders experienced
      if (group.traders.size >= 2) { // At least 2 traders lost in similar conditions
        
        // Average the conditions
        this.finalizeConditions(group.avgConditions, group.occurrences);
        
        // Calculate confidence score
        const confidence = this.calculateConfidence(group);
        
        aggregated.push({
          patternId: key,
          symbol: group.symbol,
          originalDirection: group.originalDirection,
          inverseDirection: group.inverseDirection,
          
          // Strength indicators
          traderCount: group.traders.size,
          occurrences: group.occurrences,
          totalLoss: group.totalLoss,
          avgLoss: group.totalLoss / group.occurrences,
          confidence,
          
          // Market conditions that led to losses
          conditions: group.avgConditions,
          
          // Signal generation
          signalType: 'INVERSE_LOSS_PATTERN',
          reason: `${group.traders.size} traders lost ${group.occurrences} times going ${group.originalDirection} in these conditions. Total losses: $${group.totalLoss.toFixed(2)}. INVERSE signal: ${group.inverseDirection}`
        });
      }
    }
    
    // Sort by confidence (strongest signals first)
    aggregated.sort((a, b) => b.confidence - a.confidence);
    
    console.log(`✅ Aggregation complete:`);
    console.log(`   Unique patterns: ${Object.keys(grouped).length}`);
    console.log(`   Multi-trader patterns: ${aggregated.length}`);
    console.log(`   Strongest pattern: ${aggregated[0]?.traderCount || 0} traders, confidence ${aggregated[0]?.confidence || 0}%`);
    
    return aggregated;
  }

  /**
   * STEP 4: Monitor live market conditions
   * Check current market against known loss patterns
   */
  async monitorLiveMarket(symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']) {
    console.log('\n📡 Monitoring live market conditions...\n');
    
    const signals = [];
    
    for (const symbol of symbols) {
      // Get current market conditions
      const current = await this.getCurrentMarketConditions(symbol);
      
      // Store for reference
      this.liveConditions[symbol] = current;
      
      // Compare against all loss patterns
      const matches = this.findMatchingPatterns(symbol, current);
      
      if (matches.length > 0) {
        console.log(`\n🎯 ${symbol}: Found ${matches.length} matching loss patterns!`);
        
        // Generate signals from matches
        for (const match of matches) {
          const signal = this.generateSignal(symbol, current, match);
          signals.push(signal);
          
          console.log(`   Signal: ${signal.direction} (Confidence: ${signal.confidence}%)`);
          console.log(`   Reason: ${signal.reason.substring(0, 100)}...`);
        }
      }
    }
    
    this.activeSignals = signals;
    
    return signals;
  }

  /**
   * STEP 5: Generate inverse entry signal
   * When current conditions match loss patterns → INVERSE SIGNAL!
   */
  generateSignal(symbol, currentConditions, matchedPattern) {
    // Calculate how well current conditions match the loss pattern
    const similarity = this.calculateSimilarity(currentConditions, matchedPattern.conditions);
    
    // Adjust confidence based on similarity
    const adjustedConfidence = Math.min(
      matchedPattern.confidence * similarity,
      100
    );
    
    return {
      signalId: `${symbol}_${Date.now()}`,
      symbol,
      direction: matchedPattern.inverseDirection, // OPPOSITE of what traders lost on!
      confidence: Math.round(adjustedConfidence),
      
      // Why this signal is generated
      reason: `INVERSE SIGNAL: ${matchedPattern.traderCount} traders lost $${matchedPattern.totalLoss.toFixed(2)} going ${matchedPattern.originalDirection} in similar conditions. Current market matches ${(similarity * 100).toFixed(0)}% of those conditions. Suggested: ${matchedPattern.inverseDirection}`,
      
      // Pattern details
      pattern: {
        tradersAffected: matchedPattern.traderCount,
        totalOccurrences: matchedPattern.occurrences,
        totalLosses: matchedPattern.totalLoss,
        avgLoss: matchedPattern.avgLoss,
        originalDirection: matchedPattern.originalDirection
      },
      
      // Current market conditions
      currentConditions: {
        price: currentConditions.price,
        priceChange24h: currentConditions.priceChange24h,
        volume24h: currentConditions.volume24h,
        rsi: currentConditions.rsi,
        macd: currentConditions.macd,
        marketSentiment: currentConditions.marketSentiment,
        fearGreedIndex: currentConditions.fearGreedIndex,
        fundingRate: currentConditions.fundingRate
      },
      
      // Risk assessment
      riskLevel: this.assessRisk(adjustedConfidence, matchedPattern),
      
      // Timestamp
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
    };
  }

  /**
   * Calculate confidence score based on pattern strength
   */
  calculateConfidence(pattern) {
    let confidence = 50; // Base confidence
    
    // More traders = higher confidence
    confidence += Math.min(pattern.traders.size * 5, 20);
    
    // More occurrences = higher confidence
    confidence += Math.min(pattern.occurrences * 2, 15);
    
    // Larger losses = higher confidence (expensive lessons!)
    if (pattern.totalLoss > 10000) confidence += 15;
    else if (pattern.totalLoss > 5000) confidence += 10;
    else if (pattern.totalLoss > 1000) confidence += 5;
    
    return Math.min(confidence, 100);
  }

  /**
   * Calculate similarity between current conditions and pattern conditions
   */
  calculateSimilarity(current, pattern) {
    let matches = 0;
    let total = 0;
    
    // Compare each condition
    const comparisons = [
      { key: 'priceChange24h', tolerance: 0.1 }, // ±10%
      { key: 'volumeRatio', tolerance: 0.2 }, // ±20%
      { key: 'rsi', tolerance: 10 }, // ±10 points
      { key: 'fearGreedIndex', tolerance: 15 }, // ±15 points
      { key: 'fundingRate', tolerance: 0.005 } // ±0.5%
    ];
    
    for (const comp of comparisons) {
      if (current[comp.key] !== undefined && pattern[comp.key] !== undefined) {
        total++;
        
        const diff = Math.abs(current[comp.key] - pattern[comp.key]);
        if (diff <= comp.tolerance) {
          matches++;
        } else if (diff <= comp.tolerance * 2) {
          matches += 0.5; // Partial match
        }
      }
    }
    
    return total > 0 ? matches / total : 0;
  }

  /**
   * Find patterns that match current market conditions
   */
  findMatchingPatterns(symbol, currentConditions) {
    const matches = [];
    
    // Get aggregated patterns for this symbol
    const aggregated = this.aggregateLossPatterns();
    const symbolPatterns = aggregated.filter(p => p.symbol === symbol);
    
    for (const pattern of symbolPatterns) {
      const similarity = this.calculateSimilarity(currentConditions, pattern.conditions);
      
      // Match threshold: 70% similarity
      if (similarity >= 0.7) {
        matches.push({
          ...pattern,
          similarity
        });
      }
    }
    
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Get current market conditions for a symbol
   */
  async getCurrentMarketConditions(symbol) {
    try {
      // Get price data from Binance
      const ticker = await axios.get(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`);
      const price = parseFloat(ticker.data.lastPrice);
      const priceChange24h = parseFloat(ticker.data.priceChangePercent);
      const volume24h = parseFloat(ticker.data.volume);
      
      // Get funding rate
      const funding = await axios.get(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=1`);
      const fundingRate = parseFloat(funding.data[0].fundingRate);
      
      // Get Fear & Greed Index
      const fgi = await axios.get('https://api.alternative.me/fng/');
      const fearGreedIndex = parseInt(fgi.data.data[0].value);
      
      // Estimate RSI (simplified - would use proper calculation in production)
      const rsi = this.estimateRSI(priceChange24h);
      
      // Estimate MACD signal
      const macd = priceChange24h > 0 ? 'BULLISH' : 'BEARISH';
      
      // Volume ratio (simplified)
      const volumeRatio = 1.0; // Would compare to average volume
      
      return {
        price,
        priceChange24h,
        volume24h,
        volumeRatio,
        rsi,
        macd,
        marketSentiment: this.getSentiment(fearGreedIndex),
        fearGreedIndex,
        fundingRate,
        openInterest: 0, // Would fetch from API
        longShortRatio: 0 // Would fetch from API
      };
    } catch (error) {
      console.error(`Failed to get market conditions for ${symbol}:`, error.message);
      return this.getDefaultConditions();
    }
  }

  /**
   * Get market conditions at a specific time (historical)
   */
  async getMarketConditionsAtTime(symbol, timestamp) {
    // In production, would fetch historical data
    // For now, return estimated conditions
    return this.getDefaultConditions();
  }

  /**
   * Helper functions
   */
  
  groupByTrader(trades) {
    const groups = {};
    
    for (const trade of trades) {
      const traderId = trade.submission_id || trade.traderId || 'unknown';
      
      if (!groups[traderId]) {
        groups[traderId] = {
          id: traderId,
          trades: []
        };
      }
      
      groups[traderId].trades.push(trade);
    }
    
    return Object.values(groups);
  }

  getPatternKey(pattern) {
    // Create key based on symbol and general conditions
    const rsiRange = Math.floor(pattern.conditions.rsi / 20) * 20; // 0-20, 20-40, etc.
    const sentimentKey = pattern.conditions.marketSentiment;
    
    return `${pattern.symbol}_${pattern.direction}_RSI${rsiRange}_${sentimentKey}`;
  }

  initializeConditions() {
    return {
      priceChange24h: 0,
      volume24h: 0,
      volumeRatio: 0,
      rsi: 0,
      fearGreedIndex: 0,
      fundingRate: 0,
      count: 0
    };
  }

  accumulateConditions(avg, conditions) {
    avg.priceChange24h += conditions.priceChange24h || 0;
    avg.volume24h += conditions.volume24h || 0;
    avg.volumeRatio += conditions.volumeRatio || 0;
    avg.rsi += conditions.rsi || 0;
    avg.fearGreedIndex += conditions.fearGreedIndex || 0;
    avg.fundingRate += conditions.fundingRate || 0;
    avg.count++;
  }

  finalizeConditions(avg, count) {
    avg.priceChange24h /= count;
    avg.volume24h /= count;
    avg.volumeRatio /= count;
    avg.rsi /= count;
    avg.fearGreedIndex /= count;
    avg.fundingRate /= count;
  }

  estimateRSI(priceChange) {
    // Simplified RSI estimation
    if (priceChange > 5) return 70;
    if (priceChange > 2) return 60;
    if (priceChange > 0) return 55;
    if (priceChange > -2) return 45;
    if (priceChange > -5) return 40;
    return 30;
  }

  getSentiment(fearGreedIndex) {
    if (fearGreedIndex < 25) return 'EXTREME_FEAR';
    if (fearGreedIndex < 45) return 'FEAR';
    if (fearGreedIndex < 55) return 'NEUTRAL';
    if (fearGreedIndex < 75) return 'GREED';
    return 'EXTREME_GREED';
  }

  getDefaultConditions() {
    return {
      price: 0,
      priceChange24h: 0,
      volume24h: 0,
      volumeRatio: 1.0,
      rsi: 50,
      macd: 'NEUTRAL',
      marketSentiment: 'NEUTRAL',
      fearGreedIndex: 50,
      fundingRate: 0,
      openInterest: 0,
      longShortRatio: 1.0
    };
  }

  assessRisk(confidence, pattern) {
    if (confidence >= 85 && pattern.traderCount >= 5) return 'VERY_LOW';
    if (confidence >= 75 && pattern.traderCount >= 3) return 'LOW';
    if (confidence >= 65) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Get active signals
   */
  getActiveSignals() {
    // Filter out expired signals
    const now = Date.now();
    this.activeSignals = this.activeSignals.filter(s => s.expiresAt > now);
    
    return this.activeSignals;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalTraders: this.traderData.length,
      totalLossPatterns: this.lossPatterns.length,
      activeSignals: this.activeSignals.length,
      traders: this.traderData
    };
  }
}

module.exports = InverseSignalEngine;

