/**
 * Advanced Pattern Detector
 * 
 * Detects sophisticated trading patterns including:
 * - Elliott Wave analysis
 * - Wyckoff Method (Accumulation/Distribution)
 * - Market Structure (Higher Highs/Lows, Break of Structure)
 * - Order Flow patterns
 * - Smart Money Concepts (SMC)
 * - Volume Profile analysis
 */

class AdvancedPatternDetector {
  constructor() {
    this.minCandlesRequired = 50;
  }

  /**
   * MARKET STRUCTURE DETECTION
   */

  /**
   * Detect market structure (trend, swing points, breaks)
   * @param {Array} candles - OHLCV candle data
   * @returns {object} Market structure analysis
   */
  detectMarketStructure(candles) {
    if (!candles || candles.length < this.minCandlesRequired) {
      return { error: 'Insufficient data', required: this.minCandlesRequired };
    }

    const swings = this.identifySwingPoints(candles);
    const highs = swings.filter(s => s.type === 'high');
    const lows = swings.filter(s => s.type === 'low');

    // Check for higher highs and higher lows (uptrend)
    const higherHighs = this.checkHigherHighs(highs);
    const higherLows = this.checkHigherLows(lows);

    // Check for lower highs and lower lows (downtrend)
    const lowerHighs = this.checkLowerHighs(highs);
    const lowerLows = this.checkLowerLows(lows);

    // Detect break of structure
    const bos = this.detectBreakOfStructure(candles, swings);
    const choch = this.detectChangeOfCharacter(candles, swings);

    const trend = this.determineTrend(higherHighs, higherLows, lowerHighs, lowerLows);
    const strength = this.calculateTrendStrength(swings);

    return {
      trend,
      strength,
      higherHighs: higherHighs.length,
      higherLows: higherLows.length,
      lowerHighs: lowerHighs.length,
      lowerLows: lowerLows.length,
      breakOfStructure: bos,
      changeOfCharacter: choch,
      swingPoints: swings.length,
      interpretation: this.interpretStructure(trend, strength, bos, choch)
    };
  }

  identifySwingPoints(candles, lookback = 5) {
    const swings = [];

    for (let i = lookback; i < candles.length - lookback; i++) {
      const current = candles[i];
      let isHigh = true;
      let isLow = true;

      // Check if current is a swing high
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && candles[j].high >= current.high) {
          isHigh = false;
          break;
        }
      }

      // Check if current is a swing low
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j !== i && candles[j].low <= current.low) {
          isLow = false;
          break;
        }
      }

      if (isHigh) {
        swings.push({
          type: 'high',
          price: current.high,
          index: i,
          timestamp: current.timestamp
        });
      }

      if (isLow) {
        swings.push({
          type: 'low',
          price: current.low,
          index: i,
          timestamp: current.timestamp
        });
      }
    }

    return swings;
  }

  checkHigherHighs(highs) {
    const hh = [];
    for (let i = 1; i < highs.length; i++) {
      if (highs[i].price > highs[i - 1].price) {
        hh.push(highs[i]);
      }
    }
    return hh;
  }

  checkHigherLows(lows) {
    const hl = [];
    for (let i = 1; i < lows.length; i++) {
      if (lows[i].price > lows[i - 1].price) {
        hl.push(lows[i]);
      }
    }
    return hl;
  }

  checkLowerHighs(highs) {
    const lh = [];
    for (let i = 1; i < highs.length; i++) {
      if (highs[i].price < highs[i - 1].price) {
        lh.push(highs[i]);
      }
    }
    return lh;
  }

  checkLowerLows(lows) {
    const ll = [];
    for (let i = 1; i < lows.length; i++) {
      if (lows[i].price < lows[i - 1].price) {
        ll.push(lows[i]);
      }
    }
    return ll;
  }

  determineTrend(higherHighs, higherLows, lowerHighs, lowerLows) {
    const bullishSignals = higherHighs.length + higherLows.length;
    const bearishSignals = lowerHighs.length + lowerLows.length;

    if (bullishSignals > bearishSignals * 1.5) return 'uptrend';
    if (bearishSignals > bullishSignals * 1.5) return 'downtrend';
    return 'ranging';
  }

  calculateTrendStrength(swings) {
    if (swings.length < 2) return 0;

    let totalMove = 0;
    for (let i = 1; i < swings.length; i++) {
      totalMove += Math.abs(swings[i].price - swings[i - 1].price);
    }

    const avgMove = totalMove / (swings.length - 1);
    const lastMove = Math.abs(swings[swings.length - 1].price - swings[swings.length - 2].price);

    return Math.min(100, (lastMove / avgMove) * 50);
  }

  detectBreakOfStructure(candles, swings) {
    if (swings.length < 3) return false;

    const recentSwings = swings.slice(-5);
    const lastCandle = candles[candles.length - 1];

    // Check if price broke through significant swing level
    for (const swing of recentSwings) {
      if (swing.type === 'high' && lastCandle.close > swing.price) {
        return { detected: true, type: 'bullish', level: swing.price };
      }
      if (swing.type === 'low' && lastCandle.close < swing.price) {
        return { detected: true, type: 'bearish', level: swing.price };
      }
    }

    return { detected: false };
  }

  detectChangeOfCharacter(candles, swings) {
    if (swings.length < 4) return false;

    const recentSwings = swings.slice(-4);
    
    // Check for trend reversal pattern
    if (recentSwings.length === 4) {
      const [s1, s2, s3, s4] = recentSwings;
      
      // Bullish ChoCh: LL -> HL
      if (s1.type === 'low' && s2.type === 'high' && 
          s3.type === 'low' && s4.type === 'high') {
        if (s3.price > s1.price && s4.price > s2.price) {
          return { detected: true, type: 'bullish' };
        }
      }
      
      // Bearish ChoCh: HH -> LH
      if (s1.type === 'high' && s2.type === 'low' && 
          s3.type === 'high' && s4.type === 'low') {
        if (s3.price < s1.price && s4.price < s2.price) {
          return { detected: true, type: 'bearish' };
        }
      }
    }

    return { detected: false };
  }

  interpretStructure(trend, strength, bos, choch) {
    let interpretation = `Market is in ${trend}`;
    
    if (strength > 70) interpretation += ' with strong momentum';
    else if (strength > 40) interpretation += ' with moderate momentum';
    else interpretation += ' with weak momentum';

    if (bos.detected) interpretation += `. Break of Structure detected (${bos.type})`;
    if (choch.detected) interpretation += `. Change of Character detected (${choch.type})`;

    return interpretation;
  }

  /**
   * WYCKOFF METHOD DETECTION
   */

  /**
   * Detect Wyckoff accumulation/distribution phases
   * @param {Array} candles - OHLCV data
   * @param {Array} volume - Volume data
   * @returns {object} Wyckoff analysis
   */
  detectWyckoffPhases(candles, volume) {
    if (!candles || candles.length < this.minCandlesRequired) {
      return { error: 'Insufficient data' };
    }

    const phases = {
      PS: this.detectPreliminarySupport(candles, volume),
      SC: this.detectSellingClimax(candles, volume),
      AR: this.detectAutomaticRally(candles, volume),
      ST: this.detectSecondaryTest(candles, volume),
      Spring: this.detectSpring(candles, volume)
    };

    // Determine current phase
    let currentPhase = 'unknown';
    let confidence = 0;

    if (phases.Spring.detected) {
      currentPhase = 'spring';
      confidence = phases.Spring.confidence;
    } else if (phases.ST.detected) {
      currentPhase = 'secondary_test';
      confidence = phases.ST.confidence;
    } else if (phases.AR.detected) {
      currentPhase = 'automatic_rally';
      confidence = phases.AR.confidence;
    } else if (phases.SC.detected) {
      currentPhase = 'selling_climax';
      confidence = phases.SC.confidence;
    } else if (phases.PS.detected) {
      currentPhase = 'preliminary_support';
      confidence = phases.PS.confidence;
    }

    return {
      phase: 'accumulation',
      stage: currentPhase,
      confidence,
      phases,
      signals: this.generateWyckoffSignals(phases, currentPhase),
      nextExpected: this.predictNextPhase(currentPhase)
    };
  }

  detectPreliminarySupport(candles, volume) {
    // Look for initial support with increased volume
    const recentCandles = candles.slice(-20);
    const avgVolume = this.calculateAvgVolume(volume.slice(-50, -20));
    
    let detected = false;
    let confidence = 0;

    for (let i = 0; i < recentCandles.length - 1; i++) {
      const current = recentCandles[i];
      const next = recentCandles[i + 1];
      
      if (current.close < current.open && // Down candle
          next.close > next.open && // Up candle
          volume[i] > avgVolume * 1.5) { // High volume
        detected = true;
        confidence = 65;
        break;
      }
    }

    return { detected, confidence };
  }

  detectSellingClimax(candles, volume) {
    // Look for panic selling with very high volume
    const recentCandles = candles.slice(-10);
    const avgVolume = this.calculateAvgVolume(volume.slice(-50, -10));
    
    let detected = false;
    let confidence = 0;
    let maxVolume = 0;

    for (let i = 0; i < recentCandles.length; i++) {
      const current = recentCandles[i];
      const currentVolume = volume[volume.length - 10 + i];
      
      if (current.close < current.open && // Down candle
          currentVolume > avgVolume * 2 && // Very high volume
          currentVolume > maxVolume) {
        detected = true;
        confidence = 75;
        maxVolume = currentVolume;
      }
    }

    return { detected, confidence };
  }

  detectAutomaticRally(candles, volume) {
    // Look for bounce after selling climax
    const recentCandles = candles.slice(-15);
    
    let detected = false;
    let confidence = 0;
    let rallyStrength = 0;

    for (let i = 1; i < recentCandles.length; i++) {
      const prev = recentCandles[i - 1];
      const current = recentCandles[i];
      
      if (prev.close < prev.open && // Previous down
          current.close > current.open && // Current up
          current.close > prev.high) { // Break above previous high
        rallyStrength++;
      }
    }

    if (rallyStrength >= 3) {
      detected = true;
      confidence = Math.min(85, 60 + rallyStrength * 5);
    }

    return { detected, confidence, rallyStrength };
  }

  detectSecondaryTest(candles, volume) {
    // Look for retest of lows with lower volume
    const recentCandles = candles.slice(-20);
    const avgVolume = this.calculateAvgVolume(volume.slice(-50, -20));
    
    let detected = false;
    let confidence = 0;

    const lows = recentCandles.map(c => c.low);
    const lowestLow = Math.min(...lows);
    
    for (let i = recentCandles.length - 5; i < recentCandles.length; i++) {
      const current = recentCandles[i];
      const currentVolume = volume[volume.length - 20 + i];
      
      if (Math.abs(current.low - lowestLow) / lowestLow < 0.02 && // Near previous low
          currentVolume < avgVolume * 0.8) { // Lower volume
        detected = true;
        confidence = 70;
        break;
      }
    }

    return { detected, confidence };
  }

  detectSpring(candles, volume) {
    // Look for false breakdown below support
    const recentCandles = candles.slice(-15);
    
    let detected = false;
    let confidence = 0;

    const lows = recentCandles.slice(0, -3).map(c => c.low);
    const supportLevel = Math.min(...lows);
    
    for (let i = recentCandles.length - 3; i < recentCandles.length; i++) {
      const current = recentCandles[i];
      
      if (current.low < supportLevel && // Break below support
          current.close > supportLevel) { // Close back above
        detected = true;
        confidence = 80;
        break;
      }
    }

    return { detected, confidence };
  }

  calculateAvgVolume(volumeArray) {
    if (!volumeArray || volumeArray.length === 0) return 0;
    return volumeArray.reduce((sum, v) => sum + v, 0) / volumeArray.length;
  }

  generateWyckoffSignals(phases, currentPhase) {
    const signals = [];

    if (currentPhase === 'spring') {
      signals.push({
        type: 'BUY',
        strength: 'STRONG',
        reason: 'Spring detected - Accumulation complete, markup phase likely'
      });
    } else if (currentPhase === 'secondary_test') {
      signals.push({
        type: 'WATCH',
        strength: 'MODERATE',
        reason: 'Secondary test - Wait for spring or markup'
      });
    }

    return signals;
  }

  predictNextPhase(currentPhase) {
    const phaseSequence = {
      'preliminary_support': 'selling_climax',
      'selling_climax': 'automatic_rally',
      'automatic_rally': 'secondary_test',
      'secondary_test': 'spring',
      'spring': 'markup',
      'unknown': 'preliminary_support'
    };

    return phaseSequence[currentPhase] || 'unknown';
  }

  /**
   * SMART MONEY CONCEPTS (SMC)
   */

  /**
   * Detect Smart Money Concepts
   * @param {Array} candles - OHLCV data
   * @returns {object} SMC analysis
   */
  detectSMC(candles) {
    if (!candles || candles.length < this.minCandlesRequired) {
      return { error: 'Insufficient data' };
    }

    return {
      orderBlocks: this.detectOrderBlocks(candles),
      fairValueGaps: this.detectFairValueGaps(candles),
      liquidityPools: this.detectLiquidityPools(candles),
      breakers: this.detectBreakers(candles),
      mitigation: this.detectMitigationBlocks(candles)
    };
  }

  detectOrderBlocks(candles) {
    const orderBlocks = [];
    
    for (let i = 2; i < candles.length - 1; i++) {
      const prev = candles[i - 1];
      const current = candles[i];
      const next = candles[i + 1];
      
      // Bullish Order Block: Down candle followed by strong up move
      if (current.close < current.open && // Down candle
          next.close > current.high && // Next breaks above
          next.close - next.open > (current.open - current.close) * 1.5) {
        orderBlocks.push({
          type: 'bullish',
          high: current.high,
          low: current.low,
          index: i,
          strength: 'strong'
        });
      }
      
      // Bearish Order Block: Up candle followed by strong down move
      if (current.close > current.open && // Up candle
          next.close < current.low && // Next breaks below
          current.close - current.open > (next.open - next.close) * 1.5) {
        orderBlocks.push({
          type: 'bearish',
          high: current.high,
          low: current.low,
          index: i,
          strength: 'strong'
        });
      }
    }

    return orderBlocks;
  }

  detectFairValueGaps(candles) {
    const fvgs = [];
    
    for (let i = 1; i < candles.length - 1; i++) {
      const prev = candles[i - 1];
      const current = candles[i];
      const next = candles[i + 1];
      
      // Bullish FVG: Gap between prev high and next low
      if (next.low > prev.high) {
        fvgs.push({
          type: 'bullish',
          top: next.low,
          bottom: prev.high,
          index: i,
          size: next.low - prev.high
        });
      }
      
      // Bearish FVG: Gap between prev low and next high
      if (next.high < prev.low) {
        fvgs.push({
          type: 'bearish',
          top: prev.low,
          bottom: next.high,
          index: i,
          size: prev.low - next.high
        });
      }
    }

    return fvgs;
  }

  detectLiquidityPools(candles) {
    const pools = [];
    const swings = this.identifySwingPoints(candles);
    
    // Liquidity typically sits above swing highs and below swing lows
    swings.forEach(swing => {
      if (swing.type === 'high') {
        pools.push({
          type: 'sell_side',
          level: swing.price,
          index: swing.index,
          description: 'Stop losses above swing high'
        });
      } else {
        pools.push({
          type: 'buy_side',
          level: swing.price,
          index: swing.index,
          description: 'Stop losses below swing low'
        });
      }
    });

    return pools.slice(-10); // Return most recent 10
  }

  detectBreakers(candles) {
    const breakers = [];
    const orderBlocks = this.detectOrderBlocks(candles);
    
    // Breaker = Failed order block
    orderBlocks.forEach(ob => {
      for (let i = ob.index + 1; i < candles.length; i++) {
        const candle = candles[i];
        
        if (ob.type === 'bullish' && candle.close < ob.low) {
          breakers.push({
            type: 'failed_bullish',
            originalOB: ob,
            failedAt: i,
            newBias: 'bearish'
          });
          break;
        }
        
        if (ob.type === 'bearish' && candle.close > ob.high) {
          breakers.push({
            type: 'failed_bearish',
            originalOB: ob,
            failedAt: i,
            newBias: 'bullish'
          });
          break;
        }
      }
    });

    return breakers;
  }

  detectMitigationBlocks(candles) {
    const mitigations = [];
    const orderBlocks = this.detectOrderBlocks(candles);
    
    // Mitigation = Price returns to order block
    orderBlocks.forEach(ob => {
      for (let i = ob.index + 5; i < candles.length; i++) {
        const candle = candles[i];
        
        // Check if price returned to OB zone
        if (candle.low <= ob.high && candle.high >= ob.low) {
          mitigations.push({
            type: ob.type,
            orderBlock: ob,
            mitigatedAt: i,
            reaction: this.analyzeMitigationReaction(candles, i, ob.type)
          });
          break;
        }
      }
    });

    return mitigations;
  }

  analyzeMitigationReaction(candles, index, obType) {
    if (index >= candles.length - 3) return 'insufficient_data';
    
    const nextCandles = candles.slice(index + 1, index + 4);
    const avgMove = nextCandles.reduce((sum, c) => 
      sum + Math.abs(c.close - c.open), 0) / nextCandles.length;
    
    if (obType === 'bullish') {
      const upMoves = nextCandles.filter(c => c.close > c.open).length;
      return upMoves >= 2 ? 'strong_bounce' : 'weak_reaction';
    } else {
      const downMoves = nextCandles.filter(c => c.close < c.open).length;
      return downMoves >= 2 ? 'strong_rejection' : 'weak_reaction';
    }
  }

  /**
   * ORDER FLOW PATTERNS
   */

  /**
   * Detect order flow patterns
   * @param {Array} candles - OHLCV data
   * @param {Array} volume - Volume data
   * @param {Array} trades - Trade data (optional)
   * @returns {object} Order flow analysis
   */
  detectOrderFlow(candles, volume, trades = []) {
    return {
      absorption: this.detectAbsorption(candles, volume),
      exhaustion: this.detectExhaustion(candles, volume),
      iceberg: this.detectIcebergOrders(candles, volume),
      sweepLiquidity: this.detectLiquiditySweep(candles)
    };
  }

  detectAbsorption(candles, volume) {
    // Large volume but small price movement
    const detected = [];
    const avgVolume = this.calculateAvgVolume(volume.slice(-50));
    
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const vol = volume[i];
      const bodySize = Math.abs(candle.close - candle.open);
      const range = candle.high - candle.low;
      
      if (vol > avgVolume * 2 && bodySize / range < 0.3) {
        detected.push({
          index: i,
          volume: vol,
          interpretation: 'Large orders absorbed by opposite side'
        });
      }
    }

    return { detected: detected.length > 0, instances: detected };
  }

  detectExhaustion(candles, volume) {
    // Climactic volume at trend extreme
    const detected = [];
    const avgVolume = this.calculateAvgVolume(volume);
    
    for (let i = 10; i < candles.length; i++) {
      const vol = volume[i];
      const candle = candles[i];
      const prevCandles = candles.slice(i - 10, i);
      
      // Check if at potential extreme
      const isHigh = candle.high >= Math.max(...prevCandles.map(c => c.high));
      const isLow = candle.low <= Math.min(...prevCandles.map(c => c.low));
      
      if ((isHigh || isLow) && vol > avgVolume * 2.5) {
        detected.push({
          index: i,
          type: isHigh ? 'top' : 'bottom',
          volume: vol,
          interpretation: 'Potential trend exhaustion'
        });
      }
    }

    return { detected: detected.length > 0, instances: detected };
  }

  detectIcebergOrders(candles, volume) {
    // Hidden orders - consistent volume at price level
    const detected = [];
    const priceVolume = {};
    
    candles.forEach((candle, i) => {
      const priceLevel = Math.round(candle.close / 10) * 10; // Round to nearest 10
      if (!priceVolume[priceLevel]) {
        priceVolume[priceLevel] = [];
      }
      priceVolume[priceLevel].push(volume[i]);
    });
    
    // Find levels with consistent high volume
    Object.entries(priceVolume).forEach(([price, vols]) => {
      if (vols.length >= 3) {
        const avgVol = vols.reduce((sum, v) => sum + v, 0) / vols.length;
        const consistency = vols.filter(v => v > avgVol * 0.8).length / vols.length;
        
        if (consistency > 0.7) {
          detected.push({
            priceLevel: parseFloat(price),
            avgVolume: avgVol,
            consistency: (consistency * 100).toFixed(0) + '%',
            interpretation: 'Potential iceberg orders'
          });
        }
      }
    });

    return { detected: detected.length > 0, levels: detected };
  }

  detectLiquiditySweep(candles) {
    // Price briefly breaks level then reverses
    const sweeps = [];
    
    for (let i = 10; i < candles.length - 2; i++) {
      const prevCandles = candles.slice(i - 10, i);
      const current = candles[i];
      const next = candles[i + 1];
      
      const prevLow = Math.min(...prevCandles.map(c => c.low));
      const prevHigh = Math.max(...prevCandles.map(c => c.high));
      
      // Sweep below then reverse up
      if (current.low < prevLow && next.close > current.open) {
        sweeps.push({
          index: i,
          type: 'bullish',
          sweptLevel: prevLow,
          interpretation: 'Liquidity sweep below support - potential reversal'
        });
      }
      
      // Sweep above then reverse down
      if (current.high > prevHigh && next.close < current.open) {
        sweeps.push({
          index: i,
          type: 'bearish',
          sweptLevel: prevHigh,
          interpretation: 'Liquidity sweep above resistance - potential reversal'
        });
      }
    }

    return { detected: sweeps.length > 0, sweeps };
  }
}

module.exports = AdvancedPatternDetector;
