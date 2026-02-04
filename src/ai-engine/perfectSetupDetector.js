/**
 * Perfect Setup Detector
 * 
 * Identifies "perfect" trading setups based on multiple criteria:
 * - High confidence (90%+)
 * - Excellent risk/reward ratio (3:1+)
 * - Strong pattern history
 * - Favorable market conditions
 * - Multi-timeframe alignment
 * 
 * @module perfectSetupDetector
 */

const axios = require('axios');

class PerfectSetupDetector {
  constructor(options = {}) {
    // Perfect setup criteria
    this.criteria = {
      minConfidence: options.minConfidence || 90,
      minRiskReward: options.minRiskReward || 3.0,
      maxRiskLevel: options.maxRiskLevel || 'MEDIUM',
      minPatternOccurrences: options.minPatternOccurrences || 10,
      minPatternWinRate: options.minPatternWinRate || 75,
      
      // Market condition requirements
      requiredConditions: {
        volumeSpike: options.volumeSpike !== false,
        trendAlignment: options.trendAlignment !== false,
        supportResistance: options.supportResistance !== false,
        multiTimeframeConfirm: options.multiTimeframeConfirm !== false
      },
      
      // Advanced filters
      excludeHighVolatility: options.excludeHighVolatility !== false,
      requireLowSpread: options.requireLowSpread !== false,
      checkNewsEvents: options.checkNewsEvents || false
    };
    
    // Statistics
    this.stats = {
      totalAnalyzed: 0,
      perfectSetupsFound: 0,
      lastPerfectSetup: null,
      averagePerfectionScore: 0
    };
    
    // Storage for perfect setups
    this.perfectSetups = [];
    this.maxStoredSetups = options.maxStoredSetups || 100;
  }

  /**
   * Analyze if a signal qualifies as a "perfect setup"
   * @param {Object} signal - The signal to analyze
   * @param {Object} marketData - Current market data
   * @returns {Promise<Object>} Analysis result
   */
  async isPerfectSetup(signal, marketData = {}) {
    this.stats.totalAnalyzed++;
    
    console.log(`\n🔍 Analyzing signal ${signal.signalId} for perfect setup...`);
    
    // Run all checks
    const checks = {
      confidence: this.checkConfidence(signal),
      riskReward: this.checkRiskReward(signal),
      riskLevel: this.checkRiskLevel(signal),
      patternQuality: this.checkPatternQuality(signal.pattern),
      marketConditions: await this.checkMarketConditions(signal.symbol, marketData),
      timing: await this.checkTiming(signal)
    };
    
    // Calculate perfection score (0-100)
    const score = this.calculatePerfectionScore(checks);
    
    // All checks must pass for perfect setup
    const isPerfect = Object.values(checks).every(check => check.passed === true);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(checks, score);
    
    const result = {
      isPerfect,
      score,
      checks,
      reasoning,
      signal: {
        signalId: signal.signalId,
        symbol: signal.symbol,
        direction: signal.direction,
        confidence: signal.confidence
      },
      analyzedAt: new Date()
    };
    
    // Store if perfect
    if (isPerfect) {
      this.stats.perfectSetupsFound++;
      this.stats.lastPerfectSetup = new Date();
      this.storePerfectSetup(signal, result);
      
      console.log(`✨ PERFECT SETUP DETECTED! Score: ${score}/100`);
    } else {
      console.log(`❌ Not a perfect setup. Score: ${score}/100`);
    }
    
    // Update average score
    this.stats.averagePerfectionScore = 
      ((this.stats.averagePerfectionScore * (this.stats.totalAnalyzed - 1)) + score) / 
      this.stats.totalAnalyzed;
    
    return result;
  }

  /**
   * Check confidence level
   */
  checkConfidence(signal) {
    const passed = signal.confidence >= this.criteria.minConfidence;
    
    return {
      passed,
      actual: signal.confidence,
      required: this.criteria.minConfidence,
      score: passed ? 100 : (signal.confidence / this.criteria.minConfidence) * 100,
      message: passed 
        ? `Confidence ${signal.confidence}% meets minimum ${this.criteria.minConfidence}%`
        : `Confidence ${signal.confidence}% below minimum ${this.criteria.minConfidence}%`
    };
  }

  /**
   * Check risk/reward ratio
   */
  checkRiskReward(signal) {
    const riskReward = this.calculateRiskReward(signal);
    const passed = riskReward >= this.criteria.minRiskReward;
    
    return {
      passed,
      actual: riskReward,
      required: this.criteria.minRiskReward,
      score: passed ? 100 : (riskReward / this.criteria.minRiskReward) * 100,
      message: passed
        ? `Risk/Reward ${riskReward.toFixed(2)}:1 meets minimum ${this.criteria.minRiskReward}:1`
        : `Risk/Reward ${riskReward.toFixed(2)}:1 below minimum ${this.criteria.minRiskReward}:1`
    };
  }

  /**
   * Calculate risk/reward ratio
   */
  calculateRiskReward(signal) {
    if (!signal.averageEntryPrice || !signal.stopLoss || !signal.takeProfit1) {
      return 0;
    }
    
    const risk = Math.abs(signal.averageEntryPrice - signal.stopLoss);
    const reward = Math.abs(signal.takeProfit1 - signal.averageEntryPrice);
    
    return risk > 0 ? reward / risk : 0;
  }

  /**
   * Check risk level
   */
  checkRiskLevel(signal) {
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'EXTREME'];
    const maxIndex = riskLevels.indexOf(this.criteria.maxRiskLevel);
    const actualIndex = riskLevels.indexOf(signal.riskLevel);
    
    const passed = actualIndex <= maxIndex;
    
    return {
      passed,
      actual: signal.riskLevel,
      required: this.criteria.maxRiskLevel,
      score: passed ? 100 : Math.max(0, 100 - ((actualIndex - maxIndex) * 33)),
      message: passed
        ? `Risk level ${signal.riskLevel} is acceptable (max: ${this.criteria.maxRiskLevel})`
        : `Risk level ${signal.riskLevel} exceeds maximum ${this.criteria.maxRiskLevel}`
    };
  }

  /**
   * Check pattern quality
   */
  checkPatternQuality(pattern) {
    if (!pattern) {
      return {
        passed: false,
        score: 0,
        message: 'No pattern data available'
      };
    }
    
    const occurrences = pattern.totalOccurrences || 0;
    const winRate = pattern.winRate || 0;
    
    const occurrencesPassed = occurrences >= this.criteria.minPatternOccurrences;
    const winRatePassed = winRate >= this.criteria.minPatternWinRate;
    const passed = occurrencesPassed && winRatePassed;
    
    const occurrencesScore = Math.min(100, (occurrences / this.criteria.minPatternOccurrences) * 100);
    const winRateScore = Math.min(100, (winRate / this.criteria.minPatternWinRate) * 100);
    const score = (occurrencesScore + winRateScore) / 2;
    
    return {
      passed,
      actual: { occurrences, winRate },
      required: {
        occurrences: this.criteria.minPatternOccurrences,
        winRate: this.criteria.minPatternWinRate
      },
      score,
      message: passed
        ? `Pattern quality excellent: ${occurrences} occurrences, ${winRate}% win rate`
        : `Pattern quality insufficient: ${occurrences} occurrences (need ${this.criteria.minPatternOccurrences}), ${winRate}% win rate (need ${this.criteria.minPatternWinRate}%)`
    };
  }

  /**
   * Check market conditions
   */
  async checkMarketConditions(symbol, marketData) {
    const conditions = {
      volumeSpike: false,
      trendAlignment: false,
      supportResistance: false,
      volatility: 'normal',
      spread: 'normal'
    };
    
    try {
      // Check volume spike
      if (marketData.volume && marketData.avgVolume) {
        conditions.volumeSpike = marketData.volume > marketData.avgVolume * 1.5;
      } else {
        conditions.volumeSpike = true; // Assume OK if no data
      }
      
      // Check trend alignment
      if (marketData.trend) {
        conditions.trendAlignment = marketData.trend !== 'sideways';
      } else {
        conditions.trendAlignment = true; // Assume OK if no data
      }
      
      // Check support/resistance
      if (marketData.nearKeyLevel !== undefined) {
        conditions.supportResistance = marketData.nearKeyLevel;
      } else {
        conditions.supportResistance = true; // Assume OK if no data
      }
      
      // Check volatility
      if (marketData.volatility) {
        conditions.volatility = marketData.volatility;
      }
      
      // Check spread
      if (marketData.spread) {
        conditions.spread = marketData.spread < 0.1 ? 'tight' : 'normal';
      }
      
    } catch (error) {
      console.error('Error checking market conditions:', error.message);
    }
    
    // Evaluate conditions
    const volumeOk = !this.criteria.requiredConditions.volumeSpike || conditions.volumeSpike;
    const trendOk = !this.criteria.requiredConditions.trendAlignment || conditions.trendAlignment;
    const srOk = !this.criteria.requiredConditions.supportResistance || conditions.supportResistance;
    const volatilityOk = !this.criteria.excludeHighVolatility || conditions.volatility !== 'extreme';
    const spreadOk = !this.criteria.requireLowSpread || conditions.spread === 'tight';
    
    const passed = volumeOk && trendOk && srOk && volatilityOk && spreadOk;
    
    const passedCount = [volumeOk, trendOk, srOk, volatilityOk, spreadOk].filter(Boolean).length;
    const score = (passedCount / 5) * 100;
    
    return {
      passed,
      actual: conditions,
      score,
      message: passed
        ? 'All market conditions favorable'
        : `Market conditions not optimal: ${5 - passedCount} checks failed`
    };
  }

  /**
   * Check timing
   */
  async checkTiming(signal) {
    const now = new Date();
    const hour = now.getUTCHours();
    
    // Avoid major news times (example: avoid 12:30-14:30 UTC for US news)
    const isNewsTime = this.criteria.checkNewsEvents && 
                       (hour >= 12 && hour <= 14);
    
    // Prefer high liquidity hours (8:00-16:00 UTC)
    const isHighLiquidity = hour >= 8 && hour <= 16;
    
    const passed = !isNewsTime && isHighLiquidity;
    const score = passed ? 100 : (isHighLiquidity ? 70 : 40);
    
    return {
      passed,
      actual: { hour, isNewsTime, isHighLiquidity },
      score,
      message: passed
        ? 'Timing is optimal'
        : isNewsTime 
          ? 'Avoiding news event time'
          : 'Outside high liquidity hours'
    };
  }

  /**
   * Calculate overall perfection score
   */
  calculatePerfectionScore(checks) {
    const weights = {
      confidence: 0.25,
      riskReward: 0.25,
      riskLevel: 0.15,
      patternQuality: 0.20,
      marketConditions: 0.10,
      timing: 0.05
    };
    
    let totalScore = 0;
    
    for (const [key, weight] of Object.entries(weights)) {
      if (checks[key] && checks[key].score !== undefined) {
        totalScore += checks[key].score * weight;
      }
    }
    
    return Math.round(totalScore);
  }

  /**
   * Generate reasoning for the analysis
   */
  generateReasoning(checks, score) {
    const reasons = [];
    
    // Add positive reasons
    for (const [key, check] of Object.entries(checks)) {
      if (check.passed) {
        reasons.push(`✅ ${check.message}`);
      }
    }
    
    // Add negative reasons
    for (const [key, check] of Object.entries(checks)) {
      if (!check.passed) {
        reasons.push(`❌ ${check.message}`);
      }
    }
    
    // Overall assessment
    let assessment;
    if (score >= 95) {
      assessment = 'EXCEPTIONAL - This is a near-perfect setup with all criteria met';
    } else if (score >= 90) {
      assessment = 'EXCELLENT - Strong setup meeting all major criteria';
    } else if (score >= 80) {
      assessment = 'GOOD - Solid setup with minor weaknesses';
    } else if (score >= 70) {
      assessment = 'FAIR - Acceptable setup but with notable concerns';
    } else {
      assessment = 'POOR - Multiple criteria not met, high risk';
    }
    
    return {
      assessment,
      score,
      details: reasons
    };
  }

  /**
   * Store a perfect setup
   */
  storePerfectSetup(signal, analysis) {
    const perfectSetup = {
      ...signal,
      analysis,
      detectedAt: new Date(),
      perfectionScore: analysis.score
    };
    
    this.perfectSetups.unshift(perfectSetup);
    
    // Limit storage
    if (this.perfectSetups.length > this.maxStoredSetups) {
      this.perfectSetups = this.perfectSetups.slice(0, this.maxStoredSetups);
    }
    
    console.log(`💾 Stored perfect setup. Total: ${this.perfectSetups.length}`);
  }

  /**
   * Get recent perfect setups
   */
  getRecentPerfectSetups(options = {}) {
    const { timeframe = '24h', limit = 50 } = options;
    
    // Parse timeframe
    const hours = this.parseTimeframe(timeframe);
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Filter by timeframe
    let setups = this.perfectSetups.filter(setup => 
      new Date(setup.detectedAt) >= cutoff
    );
    
    // Limit results
    if (limit) {
      setups = setups.slice(0, limit);
    }
    
    return setups;
  }

  /**
   * Parse timeframe string to hours
   */
  parseTimeframe(timeframe) {
    const match = timeframe.match(/^(\d+)([hdwm])$/);
    if (!match) return 24; // Default 24 hours
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'h': return value;
      case 'd': return value * 24;
      case 'w': return value * 24 * 7;
      case 'm': return value * 24 * 30;
      default: return 24;
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      perfectSetupRate: this.stats.totalAnalyzed > 0
        ? ((this.stats.perfectSetupsFound / this.stats.totalAnalyzed) * 100).toFixed(2) + '%'
        : '0%',
      storedSetups: this.perfectSetups.length,
      criteria: this.criteria
    };
  }

  /**
   * Update criteria
   */
  updateCriteria(newCriteria) {
    this.criteria = {
      ...this.criteria,
      ...newCriteria
    };
    
    console.log('✅ Perfect setup criteria updated');
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.stats = {
      totalAnalyzed: 0,
      perfectSetupsFound: 0,
      lastPerfectSetup: null,
      averagePerfectionScore: 0
    };
    
    console.log('✅ Statistics reset');
  }

  /**
   * Clear stored setups
   */
  clearStoredSetups() {
    this.perfectSetups = [];
    console.log('✅ Stored setups cleared');
  }
}

module.exports = PerfectSetupDetector;
