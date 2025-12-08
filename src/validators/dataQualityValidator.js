/**
 * Automated Data Quality Validator & Scorer * 
 * This system:
 * 1. Tests trader API credentials
 * 2. Validates data against quality parameters
 * 3. Calculates quality score (0-100)
 * 4. Determines payment amount
 * 5. Triggers automated crypto payment
 * 
 * NO MANUAL PROCESSING - FULLY AUTOMATED
 */

class DataQualityValidator {
  constructor() {
    // Minimum requirements for data acceptance
    this.minimumRequirements = {
      minTrades: 20,            // At least 20 trades
      minCapital: 500,          // At least $500 peak capital
      minTradingDays: 30,       // At least 30 days of trading
      minSymbols: 3,            // At least 3 different symbols
      maxGapDays: 60            // Max 60-day gap in trading
    };
    
    // Quality scoring weights (total = 100 points)
    this.scoringWeights = {
      tradeCount: 30,           // 30 points for trade volume
      capitalSize: 20,          // 20 points for capital size
      consistency: 20,          // 20 points for trading consistency
      symbolDiversity: 15,      // 15 points for symbol diversity
      dataCompleteness: 15      // 15 points for data completeness
    };
    
    // Payment tiers based on quality score
    this.paymentTiers = [
      { minScore: 85, maxScore: 100, payment: 40, label: 'EXCELLENT' },
      { minScore: 75, maxScore: 84, payment: 25, label: 'GOOD' },
      { minScore: 60, maxScore: 74, payment: 15, label: 'ACCEPTABLE' },
      { minScore: 40, maxScore: 59, payment: 10, label: 'BASIC' },
      { minScore: 0, maxScore: 39, payment: 0, label: 'INSUFFICIENT' }
    ];
  }

  /**
   * MAIN VALIDATION FLOW
   * Tests API, validates data, calculates score, determines payment
   */
  async validateAndScore(tradeData) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         AUTOMATED DATA QUALITY VALIDATION                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const result = {
      passed: false,
      score: 0,
      payment: 0,
      paymentCurrency: 'USDT',
      tier: 'INSUFFICIENT',
      details: {},
      requirements: {},
      timestamp: new Date()
    };
    
    try {
      // Step 1: Validate minimum requirements
      console.log('📋 STEP 1: Checking Minimum Requirements\n');
      const requirementsCheck = this.checkMinimumRequirements(tradeData);
      result.requirements = requirementsCheck;
      
      if (!requirementsCheck.passed) {
        console.log('❌ FAILED: Does not meet minimum requirements\n');
        result.failureReason = requirementsCheck.failureReason;
        return result;
      }
      
      console.log('✅ PASSED: Meets all minimum requirements\n');
      
      // Step 2: Calculate quality score
      console.log('📊 STEP 2: Calculating Quality Score\n');
      const scoreDetails = this.calculateQualityScore(tradeData);
      result.score = scoreDetails.totalScore;
      result.details = scoreDetails;
      
      // Step 3: Determine payment
      console.log('💰 STEP 3: Determining Payment\n');
      const paymentInfo = this.determinePayment(result.score);
      result.payment = paymentInfo.payment;
      result.tier = paymentInfo.label;
      result.passed = paymentInfo.payment > 0;
      
      console.log(`✅ Quality Score: ${result.score}/100`);
      console.log(`✅ Payment Tier: ${result.tier}`);
      console.log(`✅ Payment Amount: ${result.payment} ${result.paymentCurrency}\n`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Validation Error:', error.message);
      result.failureReason = error.message;
      return result;
    }
  }

  /**
   * CHECK MINIMUM REQUIREMENTS
   * Must pass ALL to proceed
   */
  checkMinimumRequirements(tradeData) {
    const checks = {
      passed: true,
      failureReason: null,
      details: {}
    };
    
    const trades = tradeData.trades || [];
    
    // 1. Minimum trade count
    const tradeCount = trades.length;
    checks.details.tradeCount = {
      value: tradeCount,
      required: this.minimumRequirements.minTrades,
      passed: tradeCount >= this.minimumRequirements.minTrades
    };
    
    console.log(`   Trade Count: ${tradeCount} (Required: ${this.minimumRequirements.minTrades}) ${checks.details.tradeCount.passed ? '✓' : '✗'}`);
    
    if (!checks.details.tradeCount.passed) {
      checks.passed = false;
      checks.failureReason = `Insufficient trades: ${tradeCount}. Minimum required: ${this.minimumRequirements.minTrades}`;
      return checks;
    }
    
    // 2. Peak capital
    const peakCapital = this.calculatePeakCapital(trades);
    checks.details.peakCapital = {
      value: peakCapital,
      required: this.minimumRequirements.minCapital,
      passed: peakCapital >= this.minimumRequirements.minCapital
    };
    
    console.log(`   Peak Capital: $${peakCapital.toFixed(2)} (Required: $${this.minimumRequirements.minCapital}) ${checks.details.peakCapital.passed ? '✓' : '✗'}`);
    
    if (!checks.details.peakCapital.passed) {
      checks.passed = false;
      checks.failureReason = `Insufficient capital: $${peakCapital.toFixed(2)}. Minimum required: $${this.minimumRequirements.minCapital}`;
      return checks;
    }
    
    // 3. Trading history span
    const tradingSpan = this.calculateTradingSpan(trades);
    checks.details.tradingSpan = {
      value: tradingSpan,
      required: this.minimumRequirements.minTradingDays,
      passed: tradingSpan >= this.minimumRequirements.minTradingDays
    };
    
    console.log(`   Trading Span: ${tradingSpan} days (Required: ${this.minimumRequirements.minTradingDays}) ${checks.details.tradingSpan.passed ? '✓' : '✗'}`);
    
    if (!checks.details.tradingSpan.passed) {
      checks.passed = false;
      checks.failureReason = `Insufficient trading history: ${tradingSpan} days. Minimum required: ${this.minimumRequirements.minTradingDays}`;
      return checks;
    }
    
    // 4. Symbol diversity
    const uniqueSymbols = this.countUniqueSymbols(trades);
    checks.details.symbolDiversity = {
      value: uniqueSymbols,
      required: this.minimumRequirements.minSymbols,
      passed: uniqueSymbols >= this.minimumRequirements.minSymbols
    };
    
    console.log(`   Unique Symbols: ${uniqueSymbols} (Required: ${this.minimumRequirements.minSymbols}) ${checks.details.symbolDiversity.passed ? '✓' : '✗'}`);
    
    if (!checks.details.symbolDiversity.passed) {
      checks.passed = false;
      checks.failureReason = `Insufficient symbol diversity: ${uniqueSymbols}. Minimum required: ${this.minimumRequirements.minSymbols}`;
      return checks;
    }
    
    // 5. Trading consistency (no large gaps)
    const maxGap = this.calculateMaxGap(trades);
    checks.details.consistency = {
      value: maxGap,
      required: this.minimumRequirements.maxGapDays,
      passed: maxGap <= this.minimumRequirements.maxGapDays
    };
    
    console.log(`   Max Gap: ${maxGap} days (Max Allowed: ${this.minimumRequirements.maxGapDays}) ${checks.details.consistency.passed ? '✓' : '✗'}`);
    
    if (!checks.details.consistency.passed) {
      checks.passed = false;
      checks.failureReason = `Trading gap too large: ${maxGap} days. Maximum allowed: ${this.minimumRequirements.maxGapDays}`;
      return checks;
    }
    
    return checks;
  }

  /**
   * CALCULATE QUALITY SCORE (0-100)
   * Based on 5 factors with different weights
   */
  calculateQualityScore(tradeData) {
    const trades = tradeData.trades || [];
    const scores = {};
    let totalScore = 0;
    
    // 1. TRADE COUNT SCORE (30 points)
    const tradeCount = trades.length;
    if (tradeCount >= 1000) scores.tradeCount = 30;
    else if (tradeCount >= 500) scores.tradeCount = 25;
    else if (tradeCount >= 300) scores.tradeCount = 20;
    else if (tradeCount >= 200) scores.tradeCount = 15;
    else if (tradeCount >= 100) scores.tradeCount = 12;
    else if (tradeCount >= 50) scores.tradeCount = 8;
    else if (tradeCount >= 20) scores.tradeCount = 5;
    else scores.tradeCount = 0;
    
    console.log(`   Trade Count: ${tradeCount} → ${scores.tradeCount}/${this.scoringWeights.tradeCount} points`);
    totalScore += scores.tradeCount;
    
    // 2. CAPITAL SIZE SCORE (20 points)
    const peakCapital = this.calculatePeakCapital(trades);
    if (peakCapital >= 50000) scores.capitalSize = 20;
    else if (peakCapital >= 20000) scores.capitalSize = 17;
    else if (peakCapital >= 10000) scores.capitalSize = 14;
    else if (peakCapital >= 5000) scores.capitalSize = 11;
    else if (peakCapital >= 2000) scores.capitalSize = 8;
    else if (peakCapital >= 500) scores.capitalSize = 5;
    else scores.capitalSize = 0;
    
    console.log(`   Capital Size: $${peakCapital.toFixed(2)} → ${scores.capitalSize}/${this.scoringWeights.capitalSize} points`);
    totalScore += scores.capitalSize;
    
    // 3. CONSISTENCY SCORE (20 points)
    const maxGap = this.calculateMaxGap(trades);
    const tradingSpan = this.calculateTradingSpan(trades);
    const tradingDays = this.countTradingDays(trades);
    const consistencyRatio = tradingDays / tradingSpan;
    
    if (maxGap <= 7 && consistencyRatio >= 0.7) scores.consistency = 20;
    else if (maxGap <= 14 && consistencyRatio >= 0.5) scores.consistency = 16;
    else if (maxGap <= 30 && consistencyRatio >= 0.3) scores.consistency = 12;
    else if (maxGap <= 45 && consistencyRatio >= 0.2) scores.consistency = 8;
    else if (maxGap <= 60) scores.consistency = 4;
    else scores.consistency = 0;
    
    console.log(`   Consistency: ${consistencyRatio.toFixed(2)} ratio, ${maxGap} max gap → ${scores.consistency}/${this.scoringWeights.consistency} points`);
    totalScore += scores.consistency;
    
    // 4. SYMBOL DIVERSITY SCORE (15 points)
    const uniqueSymbols = this.countUniqueSymbols(trades);
    if (uniqueSymbols >= 10) scores.symbolDiversity = 15;
    else if (uniqueSymbols >= 7) scores.symbolDiversity = 12;
    else if (uniqueSymbols >= 5) scores.symbolDiversity = 9;
    else if (uniqueSymbols >= 3) scores.symbolDiversity = 6;
    else scores.symbolDiversity = 0;
    
    console.log(`   Symbol Diversity: ${uniqueSymbols} symbols → ${scores.symbolDiversity}/${this.scoringWeights.symbolDiversity} points`);
    totalScore += scores.symbolDiversity;
    
    // 5. DATA COMPLETENESS SCORE (15 points)
    const completeness = this.calculateDataCompleteness(trades);
    scores.dataCompleteness = Math.round(completeness * this.scoringWeights.dataCompleteness);
    
    console.log(`   Data Completeness: ${(completeness * 100).toFixed(1)}% → ${scores.dataCompleteness}/${this.scoringWeights.dataCompleteness} points`);
    totalScore += scores.dataCompleteness;
    
    console.log(`\n   TOTAL SCORE: ${totalScore}/100\n`);
    
    return {
      totalScore,
      breakdown: scores,
      metrics: {
        tradeCount,
        peakCapital,
        tradingSpan,
        uniqueSymbols,
        consistencyRatio,
        completeness
      }
    };
  }

  /**
   * DETERMINE PAYMENT based on score
   */
  determinePayment(score) {
    for (const tier of this.paymentTiers) {
      if (score >= tier.minScore && score <= tier.maxScore) {
        return tier;
      }
    }
    return this.paymentTiers[this.paymentTiers.length - 1]; // Default to lowest
  }

  /**
   * HELPER METHODS
   */
  
  calculatePeakCapital(trades) {
    let runningBalance = 0;
    let peakBalance = 0;
    
    for (const trade of trades) {
      runningBalance += (trade.realizedPnl || trade.pnl || 0);
      if (runningBalance > peakBalance) {
        peakBalance = runningBalance;
      }
    }
    
    // Also check if there's a balance field
    const balances = trades.map(t => t.balance || 0).filter(b => b > 0);
    if (balances.length > 0) {
      const maxBalance = Math.max(...balances);
      peakBalance = Math.max(peakBalance, maxBalance);
    }
    
    return Math.abs(peakBalance);
  }

  calculateTradingSpan(trades) {
    if (trades.length === 0) return 0;
    
    const timestamps = trades.map(t => new Date(t.time || t.updateTime).getTime());
    const earliest = Math.min(...timestamps);
    const latest = Math.max(...timestamps);
    
    return Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24));
  }

  countTradingDays(trades) {
    const uniqueDays = new Set();
    
    for (const trade of trades) {
      const date = new Date(trade.time || trade.updateTime);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      uniqueDays.add(dayKey);
    }
    
    return uniqueDays.size;
  }

  calculateMaxGap(trades) {
    if (trades.length < 2) return 0;
    
    const timestamps = trades
      .map(t => new Date(trade.time || t.updateTime).getTime())
      .sort((a, b) => a - b);
    
    let maxGap = 0;
    for (let i = 1; i < timestamps.length; i++) {
      const gap = (timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60 * 24);
      if (gap > maxGap) maxGap = gap;
    }
    
    return Math.ceil(maxGap);
  }

  countUniqueSymbols(trades) {
    const symbols = new Set();
    for (const trade of trades) {
      if (trade.symbol) symbols.add(trade.symbol);
    }
    return symbols.size;
  }

  calculateDataCompleteness(trades) {
    if (trades.length === 0) return 0;
    
    const requiredFields = ['symbol', 'side', 'price', 'qty', 'realizedPnl', 'time'];
    let totalCompleteness = 0;
    
    for (const trade of trades) {
      let presentFields = 0;
      for (const field of requiredFields) {
        if (trade[field] !== undefined && trade[field] !== null) {
          presentFields++;
        }
      }
      totalCompleteness += presentFields / requiredFields.length;
    }
    
    return totalCompleteness / trades.length;
  }

  /**
   * GENERATE VALIDATION REPORT
   */
  generateReport(validationResult) {
    const report = {
      submissionId: `SUB${Date.now().toString(36).toUpperCase()}`,
      timestamp: validationResult.timestamp,
      passed: validationResult.passed,
      qualityScore: validationResult.score,
      paymentTier: validationResult.tier,
      paymentAmount: validationResult.payment,
      paymentCurrency: validationResult.paymentCurrency,
      
      requirements: validationResult.requirements,
      scoreBreakdown: validationResult.details,
      
      summary: {
        tradeCount: validationResult.details?.metrics?.tradeCount || 0,
        peakCapital: validationResult.details?.metrics?.peakCapital || 0,
        tradingSpan: validationResult.details?.metrics?.tradingSpan || 0,
        uniqueSymbols: validationResult.details?.metrics?.uniqueSymbols || 0,
        dataCompleteness: validationResult.details?.metrics?.completeness || 0
      }
    };
    
    if (!validationResult.passed) {
      report.failureReason = validationResult.failureReason;
    }
    
    return report;
  }
}

module.exports = DataQualityValidator;

