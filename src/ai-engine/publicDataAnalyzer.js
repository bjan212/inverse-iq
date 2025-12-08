/**
 * Public Data Analyzer
 * 
 * Analyzes public market data to identify common failure patterns
 * WITHOUT needing individual trader data.
 * 
 * This module:
 * 1. Analyzes price action patterns that typically lead to losses
 * 2. Identifies false breakouts, exhaustion moves, and traps
 * 3. Detects high-risk market conditions
 * 4. Creates synthetic "loss patterns" from market behavior
 * 
 * These patterns can bootstrap your AI before collecting real trader data.
 */

class PublicDataAnalyzer {
  constructor() {
    this.patterns = [];
    this.statistics = {
      totalCandles: 0,
      patternsFound: 0,
      falseBreakouts: 0,
      exhaustionTops: 0,
      exhaustionBottoms: 0,
      liquidationWicks: 0,
      volumeSpikes: 0
    };
  }

  /**
   * Analyze klines data for failure patterns
   * @param {Array} klines - Array of OHLCV candles
   * @param {string} symbol - Trading pair
   * @param {string} interval - Timeframe
   */
  analyzeFailurePatterns(klines, symbol, interval) {
    console.log(`\n🔍 Analyzing ${klines.length} candles for failure patterns...`);
    
    this.statistics.totalCandles = klines.length;
    const patterns = [];
    
    // Need at least 50 candles for pattern detection
    if (klines.length < 50) {
      console.log('⚠️  Not enough data for pattern analysis');
      return patterns;
    }
    
    for (let i = 50; i < klines.length; i++) {
      const current = klines[i];
      const previous = klines.slice(i - 50, i);
      
      // Pattern 1: False Breakout (LONG trap)
      const falseBreakoutLong = this.detectFalseBreakout(current, previous, 'LONG');
      if (falseBreakoutLong) {
        patterns.push({
          type: 'FALSE_BREAKOUT',
          symbol,
          interval,
          timestamp: current.openTime,
          direction: 'LONG', // Direction that would lose
          inverseDirection: 'SHORT', // Profitable direction
          confidence: falseBreakoutLong.confidence,
          conditions: falseBreakoutLong.conditions,
          estimatedLoss: this.estimateLoss(current, falseBreakoutLong),
          reason: 'Price broke above resistance but immediately rejected - classic bull trap'
        });
        this.statistics.falseBreakouts++;
      }
      
      // Pattern 2: False Breakdown (SHORT trap)
      const falseBreakoutShort = this.detectFalseBreakout(current, previous, 'SHORT');
      if (falseBreakoutShort) {
        patterns.push({
          type: 'FALSE_BREAKDOWN',
          symbol,
          interval,
          timestamp: current.openTime,
          direction: 'SHORT',
          inverseDirection: 'LONG',
          confidence: falseBreakoutShort.confidence,
          conditions: falseBreakoutShort.conditions,
          estimatedLoss: this.estimateLoss(current, falseBreakoutShort),
          reason: 'Price broke below support but immediately recovered - classic bear trap'
        });
        this.statistics.falseBreakouts++;
      }
      
      // Pattern 3: Exhaustion Top (LONG trap)
      const exhaustionTop = this.detectExhaustionTop(current, previous);
      if (exhaustionTop) {
        patterns.push({
          type: 'EXHAUSTION_TOP',
          symbol,
          interval,
          timestamp: current.openTime,
          direction: 'LONG',
          inverseDirection: 'SHORT',
          confidence: exhaustionTop.confidence,
          conditions: exhaustionTop.conditions,
          estimatedLoss: this.estimateLoss(current, exhaustionTop),
          reason: 'Parabolic move with extreme volume - buyers exhausted, reversal likely'
        });
        this.statistics.exhaustionTops++;
      }
      
      // Pattern 4: Exhaustion Bottom (SHORT trap)
      const exhaustionBottom = this.detectExhaustionBottom(current, previous);
      if (exhaustionBottom) {
        patterns.push({
          type: 'EXHAUSTION_BOTTOM',
          symbol,
          interval,
          timestamp: current.openTime,
          direction: 'SHORT',
          inverseDirection: 'LONG',
          confidence: exhaustionBottom.confidence,
          conditions: exhaustionBottom.conditions,
          estimatedLoss: this.estimateLoss(current, exhaustionBottom),
          reason: 'Capitulation selling with extreme volume - sellers exhausted, bounce likely'
        });
        this.statistics.exhaustionBottoms++;
      }
      
      // Pattern 5: Liquidation Wick (both directions)
      const liquidationWick = this.detectLiquidationWick(current, previous);
      if (liquidationWick) {
        patterns.push({
          type: 'LIQUIDATION_WICK',
          symbol,
          interval,
          timestamp: current.openTime,
          direction: liquidationWick.direction,
          inverseDirection: liquidationWick.inverseDirection,
          confidence: liquidationWick.confidence,
          conditions: liquidationWick.conditions,
          estimatedLoss: this.estimateLoss(current, liquidationWick),
          reason: 'Long wick indicates mass liquidations - strong reversal signal'
        });
        this.statistics.liquidationWicks++;
      }
      
      // Pattern 6: Volume Spike Reversal
      const volumeSpike = this.detectVolumeSpike(current, previous);
      if (volumeSpike) {
        patterns.push({
          type: 'VOLUME_SPIKE_REVERSAL',
          symbol,
          interval,
          timestamp: current.openTime,
          direction: volumeSpike.direction,
          inverseDirection: volumeSpike.inverseDirection,
          confidence: volumeSpike.confidence,
          conditions: volumeSpike.conditions,
          estimatedLoss: this.estimateLoss(current, volumeSpike),
          reason: 'Extreme volume spike often marks trend exhaustion'
        });
        this.statistics.volumeSpikes++;
      }
    }
    
    this.statistics.patternsFound = patterns.length;
    this.patterns.push(...patterns);
    
    console.log(`✅ Found ${patterns.length} failure patterns:`);
    console.log(`   False Breakouts: ${this.statistics.falseBreakouts}`);
    console.log(`   Exhaustion Tops: ${this.statistics.exhaustionTops}`);
    console.log(`   Exhaustion Bottoms: ${this.statistics.exhaustionBottoms}`);
    console.log(`   Liquidation Wicks: ${this.statistics.liquidationWicks}`);
    console.log(`   Volume Spikes: ${this.statistics.volumeSpikes}`);
    
    return patterns;
  }

  /**
   * Detect false breakout pattern
   */
  detectFalseBreakout(current, previous, direction) {
    if (direction === 'LONG') {
      // Calculate resistance from previous candles
      const resistance = Math.max(...previous.slice(-20).map(k => k.high));
      const avgHigh = previous.slice(-20).reduce((sum, k) => sum + k.high, 0) / 20;
      
      // Check if current candle broke above resistance
      const breakout = current.high > resistance;
      
      // Check if it closed below resistance (rejection)
      const rejection = current.close < resistance;
      
      // Check for long upper wick (sign of rejection)
      const wickSize = current.high - Math.max(current.open, current.close);
      const bodySize = Math.abs(current.close - current.open);
      const longWick = wickSize > bodySize * 1.5;
      
      if (breakout && rejection && longWick) {
        const confidence = this.calculateConfidence({
          wickRatio: wickSize / bodySize,
          rejectionStrength: (resistance - current.close) / resistance,
          volumeConfirmation: current.volume > this.avgVolume(previous)
        });
        
        return {
          confidence,
          conditions: {
            resistance,
            breakoutHigh: current.high,
            closePrice: current.close,
            wickSize,
            bodySize,
            volume: current.volume,
            priceChange: ((current.close - current.open) / current.open) * 100
          }
        };
      }
    } else {
      // SHORT - False breakdown
      const support = Math.min(...previous.slice(-20).map(k => k.low));
      const breakdown = current.low < support;
      const recovery = current.close > support;
      
      const wickSize = Math.min(current.open, current.close) - current.low;
      const bodySize = Math.abs(current.close - current.open);
      const longWick = wickSize > bodySize * 1.5;
      
      if (breakdown && recovery && longWick) {
        const confidence = this.calculateConfidence({
          wickRatio: wickSize / bodySize,
          recoveryStrength: (current.close - support) / support,
          volumeConfirmation: current.volume > this.avgVolume(previous)
        });
        
        return {
          confidence,
          conditions: {
            support,
            breakdownLow: current.low,
            closePrice: current.close,
            wickSize,
            bodySize,
            volume: current.volume,
            priceChange: ((current.close - current.open) / current.open) * 100
          }
        };
      }
    }
    
    return null;
  }

  /**
   * Detect exhaustion top pattern
   */
  detectExhaustionTop(current, previous) {
    // Calculate average volume
    const avgVolume = this.avgVolume(previous);
    
    // Check for volume spike (2x+ average)
    const volumeSpike = current.volume > avgVolume * 2;
    
    // Check for parabolic move (strong uptrend)
    const recentGains = previous.slice(-10).filter(k => k.close > k.open).length;
    const parabolic = recentGains >= 7; // 7 out of 10 green candles
    
    // Check for long upper wick (rejection at top)
    const wickSize = current.high - Math.max(current.open, current.close);
    const bodySize = Math.abs(current.close - current.open);
    const longWick = wickSize > bodySize * 1.5;
    
    // Check if current candle is bearish or doji
    const bearishOrDoji = current.close <= current.open;
    
    if (volumeSpike && parabolic && longWick && bearishOrDoji) {
      const confidence = this.calculateConfidence({
        volumeRatio: current.volume / avgVolume,
        wickRatio: wickSize / bodySize,
        trendStrength: recentGains / 10,
        rejection: bearishOrDoji ? 1 : 0.5
      });
      
      return {
        confidence,
        conditions: {
          volume: current.volume,
          avgVolume,
          volumeRatio: current.volume / avgVolume,
          wickSize,
          bodySize,
          recentGains,
          high: current.high,
          close: current.close,
          priceChange: ((current.close - current.open) / current.open) * 100
        }
      };
    }
    
    return null;
  }

  /**
   * Detect exhaustion bottom pattern
   */
  detectExhaustionBottom(current, previous) {
    const avgVolume = this.avgVolume(previous);
    const volumeSpike = current.volume > avgVolume * 2;
    
    // Check for strong downtrend
    const recentLosses = previous.slice(-10).filter(k => k.close < k.open).length;
    const downtrend = recentLosses >= 7;
    
    // Check for long lower wick (buying pressure)
    const wickSize = Math.min(current.open, current.close) - current.low;
    const bodySize = Math.abs(current.close - current.open);
    const longWick = wickSize > bodySize * 1.5;
    
    // Check if current candle is bullish or doji
    const bullishOrDoji = current.close >= current.open;
    
    if (volumeSpike && downtrend && longWick && bullishOrDoji) {
      const confidence = this.calculateConfidence({
        volumeRatio: current.volume / avgVolume,
        wickRatio: wickSize / bodySize,
        trendStrength: recentLosses / 10,
        recovery: bullishOrDoji ? 1 : 0.5
      });
      
      return {
        confidence,
        conditions: {
          volume: current.volume,
          avgVolume,
          volumeRatio: current.volume / avgVolume,
          wickSize,
          bodySize,
          recentLosses,
          low: current.low,
          close: current.close,
          priceChange: ((current.close - current.open) / current.open) * 100
        }
      };
    }
    
    return null;
  }

  /**
   * Detect liquidation wick pattern
   */
  detectLiquidationWick(current, previous) {
    const bodySize = Math.abs(current.close - current.open);
    const upperWick = current.high - Math.max(current.open, current.close);
    const lowerWick = Math.min(current.open, current.close) - current.low;
    
    // Long upper wick = long liquidations
    if (upperWick > bodySize * 3) {
      const avgVolume = this.avgVolume(previous);
      const volumeConfirmation = current.volume > avgVolume * 1.5;
      
      if (volumeConfirmation) {
        return {
          direction: 'LONG',
          inverseDirection: 'SHORT',
          confidence: this.calculateConfidence({
            wickRatio: upperWick / bodySize,
            volumeRatio: current.volume / avgVolume
          }),
          conditions: {
            upperWick,
            bodySize,
            wickRatio: upperWick / bodySize,
            volume: current.volume,
            high: current.high,
            close: current.close
          }
        };
      }
    }
    
    // Long lower wick = short liquidations
    if (lowerWick > bodySize * 3) {
      const avgVolume = this.avgVolume(previous);
      const volumeConfirmation = current.volume > avgVolume * 1.5;
      
      if (volumeConfirmation) {
        return {
          direction: 'SHORT',
          inverseDirection: 'LONG',
          confidence: this.calculateConfidence({
            wickRatio: lowerWick / bodySize,
            volumeRatio: current.volume / avgVolume
          }),
          conditions: {
            lowerWick,
            bodySize,
            wickRatio: lowerWick / bodySize,
            volume: current.volume,
            low: current.low,
            close: current.close
          }
        };
      }
    }
    
    return null;
  }

  /**
   * Detect volume spike reversal
   */
  detectVolumeSpike(current, previous) {
    const avgVolume = this.avgVolume(previous);
    const volumeSpike = current.volume > avgVolume * 3; // 3x average
    
    if (!volumeSpike) return null;
    
    // Determine trend direction
    const recentCandles = previous.slice(-5);
    const bullish = recentCandles.filter(k => k.close > k.open).length >= 4;
    const bearish = recentCandles.filter(k => k.close < k.open).length >= 4;
    
    // Volume spike in uptrend = potential top
    if (bullish && current.close < current.open) {
      return {
        direction: 'LONG',
        inverseDirection: 'SHORT',
        confidence: this.calculateConfidence({
          volumeRatio: current.volume / avgVolume,
          reversal: 1
        }),
        conditions: {
          volume: current.volume,
          avgVolume,
          volumeRatio: current.volume / avgVolume,
          priceChange: ((current.close - current.open) / current.open) * 100
        }
      };
    }
    
    // Volume spike in downtrend = potential bottom
    if (bearish && current.close > current.open) {
      return {
        direction: 'SHORT',
        inverseDirection: 'LONG',
        confidence: this.calculateConfidence({
          volumeRatio: current.volume / avgVolume,
          reversal: 1
        }),
        conditions: {
          volume: current.volume,
          avgVolume,
          volumeRatio: current.volume / avgVolume,
          priceChange: ((current.close - current.open) / current.open) * 100
        }
      };
    }
    
    return null;
  }

  /**
   * Calculate pattern confidence score
   */
  calculateConfidence(factors) {
    let confidence = 50; // Base confidence
    
    // Wick ratio factor
    if (factors.wickRatio) {
      confidence += Math.min(factors.wickRatio * 5, 20);
    }
    
    // Volume factor
    if (factors.volumeRatio) {
      confidence += Math.min(factors.volumeRatio * 5, 15);
    }
    
    // Trend strength factor
    if (factors.trendStrength) {
      confidence += factors.trendStrength * 10;
    }
    
    // Rejection/Recovery factor
    if (factors.rejection || factors.recovery) {
      confidence += 10;
    }
    
    // Reversal confirmation
    if (factors.reversal) {
      confidence += 10;
    }
    
    return Math.min(Math.round(confidence), 95); // Max 95% for public data
  }

  /**
   * Estimate potential loss from pattern
   */
  estimateLoss(current, pattern) {
    // Estimate based on wick size or price movement
    const priceRange = current.high - current.low;
    const estimatedLoss = priceRange * 0.5; // Assume 50% of range as loss
    
    // Convert to percentage
    const lossPercent = (estimatedLoss / current.close) * 100;
    
    // Estimate dollar amount (assuming $1000 position)
    const estimatedDollarLoss = 1000 * (lossPercent / 100);
    
    return {
      priceRange,
      estimatedLoss,
      lossPercent: lossPercent.toFixed(2),
      estimatedDollarLoss: estimatedDollarLoss.toFixed(2)
    };
  }

  /**
   * Calculate average volume
   */
  avgVolume(candles) {
    if (candles.length === 0) return 0;
    return candles.reduce((sum, k) => sum + k.volume, 0) / candles.length;
  }

  /**
   * Get all detected patterns
   */
  getPatterns() {
    return this.patterns;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return this.statistics;
  }

  /**
   * Convert patterns to trader-like format for AI engine
   */
  convertToTraderFormat(patterns, traderId = 'public_data') {
    return {
      traderId,
      source: 'public_market_data',
      trades: patterns.map((p, index) => ({
        id: `${traderId}_${index}`,
        symbol: p.symbol,
        side: p.direction,
        entryTime: p.timestamp,
        pnl: -parseFloat(p.estimatedLoss.estimatedDollarLoss), // Negative = loss
        conditions: p.conditions,
        pattern: p.type,
        confidence: p.confidence
      }))
    };
  }

  /**
   * Reset analyzer
   */
  reset() {
    this.patterns = [];
    this.statistics = {
      totalCandles: 0,
      patternsFound: 0,
      falseBreakouts: 0,
      exhaustionTops: 0,
      exhaustionBottoms: 0,
      liquidationWicks: 0,
      volumeSpikes: 0
    };
  }
}

module.exports = PublicDataAnalyzer;
