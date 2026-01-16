/**
 * Hybrid AI Engine
 * 
 * Combines PUBLIC market data with PRIVATE trader data for maximum accuracy.
 * 
 * Strategy:
 * 1. Bootstrap with public data patterns (false breakouts, exhaustion, etc.)
 * 2. Enhance with real trader loss patterns
 * 3. Weight patterns based on source quality
 * 4. Generate high-confidence signals from combined intelligence
 * 
 * Pattern Weighting:
 * - Public data patterns: 60-70% confidence (good baseline)
 * - Single trader patterns: 70-80% confidence (real behavior)
 * - Multi-trader patterns: 85-95% confidence (strongest signals)
 * - Combined patterns: 90-100% confidence (public + private confirmation)
 */

const SelfImprovingEngine = require('./selfImprovingEngine');
const PublicDataAnalyzer = require('./publicDataAnalyzer');
const BinancePublicCollector = require('../collectors/binancePublicCollector');

class HybridEngine extends SelfImprovingEngine {
  constructor(dbPath = './data/hybrid_pattern_database.json') {
    super(dbPath);
    
    this.publicAnalyzer = new PublicDataAnalyzer();
    this.publicCollector = new BinancePublicCollector();
    
    // Track data sources
    this.dataSources = {
      publicPatterns: 0,
      traderPatterns: 0,
      combinedPatterns: 0
    };
    
    // Signal caching to prevent spam
    this.signalCache = new Map();
    this.cacheTTL = Number(process.env.SIGNAL_CACHE_TTL || 3600000); // 1 hour default
    this.similarityThreshold = Number(process.env.SIGNAL_SIMILARITY_THRESHOLD || 0.95); // 95% similar
  }

  /**
   * Import online_signals.json as trader data (auto-load on startup)
   */
  async importOnlineSignals() {
    const fs = require('fs');
    try {
      const onlineData = JSON.parse(fs.readFileSync('data/online_signals.json', 'utf8'));
      if (!Array.isArray(onlineData) || onlineData.length === 0) {
        console.log('No online signals to import.');
        return;
      }
      // Format as traderData for addNewTraderData
      const traderData = {
        traderId: 'online_data',
        trades: onlineData.map(d => ({
          symbol: d.symbol,
          side: d.direction || d.side || 'LONG',
          pnl: d.pnl || -Math.abs(Number(d.close) - Number(d.open)),
          entryTime: d.time,
          conditions: d.conditions || {}
        }))
      };
      await this.addNewTraderData(traderData);
      console.log('✅ Imported online signals into AI engine.');
    } catch (e) {
      console.error('Failed to import online signals:', e.message);
    }
  }

  /**
   * Override to track generated signals
   */
  async generateSmartSignals(symbols = ['BTCUSDT', 'ETHUSDT']) {
    const signals = await super.generateSmartSignals(symbols);
    
    // Track signals if tracker is available
    if (this.signalTracker) {
      for (const signal of signals) {
        try {
          this.signalTracker.registerSignal(signal);
        } catch (error) {
          console.error(`Failed to track signal ${signal.signalId}:`, error.message);
        }
      }
    }
    
    return signals;
  }

  /**
   * HYBRID FEATURE 1: Bootstrap with Public Data
   * Initialize AI with public market patterns before collecting trader data
   */
  async bootstrapWithPublicData(symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'], days = 90) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         BOOTSTRAPPING AI WITH PUBLIC DATA                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log(`📊 Collecting ${days} days of data for ${symbols.length} symbols...`);
    
    const allPatterns = [];
    
    for (const symbol of symbols) {
      try {
        console.log(`\n🔍 Processing ${symbol}...`);
        
        // Collect comprehensive public data
        const data = await this.publicCollector.getComprehensiveData(symbol, '1h', days);
        
        // Analyze for failure patterns
        const patterns = this.publicAnalyzer.analyzeFailurePatterns(
          data.klines,
          symbol,
          '1h'
        );
        
        allPatterns.push(...patterns);
        
        // Rate limiting
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`❌ Failed to process ${symbol}:`, error.message);
      }
    }
    
    console.log(`\n✅ Public data collection complete: ${allPatterns.length} patterns found`);
    
    // Convert patterns to trader format and add to database
    console.log('\n📥 Adding public patterns to AI database...');
    
    const traderData = this.publicAnalyzer.convertToTraderFormat(allPatterns, 'public_market_data');
    const result = await this.addPublicDataPatterns(traderData);
    
    this.dataSources.publicPatterns = result.patternsAdded;
    
    console.log('\n✅ Bootstrap complete!');
    this.showDatabaseStatus();
    
    return result;
  }

  /**
   * HYBRID FEATURE 2: Add Public Data Patterns
   * Special handling for public data patterns with appropriate weighting
   */
  async addPublicDataPatterns(publicData) {
    console.log('\n🔄 Adding public data patterns to database...\n');
    
    const trades = publicData.trades || [];
    console.log(`   Processing ${trades.length} public patterns...`);
    
    // Extract patterns
    const patterns = trades.map(t => ({
      traderId: publicData.traderId,
      symbol: t.symbol,
      direction: t.side,
      inverseDirection: t.side === 'LONG' ? 'SHORT' : 'LONG',
      lossAmount: Math.abs(t.pnl),
      entryTime: t.entryTime,
      conditions: t.conditions,
      source: 'public',
      patternType: t.pattern,
      baseConfidence: t.confidence
    }));
    
    let patternsAdded = 0;
    let patternsUpdated = 0;
    
    for (const pattern of patterns) {
      const patternKey = this.getPatternKey(pattern);
      
      if (!this.patternDatabase.patterns[patternKey]) {
        // New pattern from public data
        this.patternDatabase.patterns[patternKey] = {
          key: patternKey,
          symbol: pattern.symbol,
          originalDirection: pattern.direction,
          inverseDirection: pattern.inverseDirection,
          traders: [pattern.traderId],
          occurrences: 1,
          totalLoss: pattern.lossAmount,
          avgLoss: pattern.lossAmount,
          conditions: pattern.conditions,
          confidence: pattern.baseConfidence, // Use pattern's confidence
          source: 'public',
          patternType: pattern.patternType,
          created: new Date(),
          lastSeen: new Date(),
          version: 1
        };
        patternsAdded++;
      } else {
        // Pattern already exists - update it
        const existing = this.patternDatabase.patterns[patternKey];
        
        existing.occurrences++;
        existing.totalLoss += pattern.lossAmount;
        existing.avgLoss = existing.totalLoss / existing.occurrences;
        existing.lastSeen = new Date();
        existing.version++;
        
        // If this is first public data for a trader pattern, mark as combined
        if (existing.source === 'trader' && pattern.source === 'public') {
          existing.source = 'combined';
          this.dataSources.combinedPatterns++;
        }
        
        // Recalculate confidence
        existing.confidence = this.calculateHybridConfidence(existing);
        
        patternsUpdated++;
      }
    }
    
    // Update database metadata
    if (!this.patternDatabase.traderHistory.find(t => t.id === publicData.traderId)) {
      this.patternDatabase.traderHistory.push({
        id: publicData.traderId,
        addedAt: new Date(),
        totalTrades: trades.length,
        totalLosses: trades.length,
        patternsContributed: patterns.length,
        source: 'public'
      });
      this.patternDatabase.totalTraders++;
    }
    
    this.patternDatabase.totalTrades += trades.length;
    this.patternDatabase.totalPatterns = Object.keys(this.patternDatabase.patterns).length;
    this.patternDatabase.lastUpdated = new Date();
    
    this.saveDatabase();
    
    console.log(`✅ Public data integration complete:`);
    console.log(`   Patterns added: ${patternsAdded}`);
    console.log(`   Patterns updated: ${patternsUpdated}`);
    console.log(`   Total patterns: ${this.patternDatabase.totalPatterns}`);
    
    return {
      patternsAdded,
      patternsUpdated,
      totalPatterns: this.patternDatabase.totalPatterns
    };
  }

  /**
   * HYBRID FEATURE 3: Enhanced Confidence Calculation
   * Weights patterns based on data source and confirmation
   */
  calculateHybridConfidence(pattern) {
    const now = Date.now();
    const daysSinceLastSeen = (now - new Date(pattern.lastSeen)) / (1000 * 60 * 60 * 24);

    const sourceBase = {
      combined: 28,
      trader: 20,
      public: 12
    }[pattern.source] || 10;

    // Sample strength with diminishing returns
    const traderFactor = Math.min(pattern.traders.length * 7, 28);
    const occurrenceFactor = Math.min(Math.log(1 + pattern.occurrences) * 6, 18);

    // Laplace-smoothed performance (prevents divide-by-zero and overfitting)
    let performanceBonus = 0;
    if (pattern.performance) {
      const wins = pattern.performance.wins || 0;
      const losses = pattern.performance.losses || 0;
      const smoothed = (wins + 1) / (wins + losses + 2);
      performanceBonus = Math.max(-12, Math.min(18, (smoothed - 0.5) * 60));
    }

    // Recency decay to avoid stale patterns dominating
    const recencyPenalty = Math.min(12, Math.max(0, (daysSinceLastSeen / 30) * 4));

    // Loss magnitude influences conviction but capped
    let lossBonus = 0;
    if (pattern.totalLoss > 20000) lossBonus = 12;
    else if (pattern.totalLoss > 10000) lossBonus = 9;
    else if (pattern.totalLoss > 5000) lossBonus = 6;
    else if (pattern.totalLoss > 1000) lossBonus = 3;

    // Specific pattern types that historically travel well
    const patternTypeBonus = ['FALSE_BREAKOUT', 'LIQUIDATION_WICK'].includes(pattern.patternType) ? 4 : 0;

    const raw = 40 + sourceBase + traderFactor + occurrenceFactor + performanceBonus + lossBonus + patternTypeBonus - recencyPenalty;
    return Math.min(Math.max(Math.round(raw), 0), 100);
  }

  /**
   * HYBRID FEATURE 4: Add Real Trader Data
   * Override parent method to mark source as 'trader'
   */
  async addNewTraderData(traderData) {
    console.log('\n🔄 ADDING REAL TRADER DATA (High Value!)...\n');
    
    const traderId = traderData.traderId || `trader_${Date.now()}`;
    const trades = traderData.trades || [];
    
    console.log(`   Trader: ${traderId}`);
    console.log(`   Processing ${trades.length} trades...`);
    
    // Extract loss patterns
    const losses = trades.filter(t => t.pnl < 0);
    console.log(`   Found ${losses.length} losses`);
    
    const newPatterns = await this.extractLossPatterns(traderId, losses);
    console.log(`   Extracted ${newPatterns.length} loss patterns`);
    
    let patternsAdded = 0;
    let patternsUpdated = 0;
    let patternsUpgraded = 0; // Public → Combined
    
    for (const pattern of newPatterns) {
      const patternKey = this.getPatternKey(pattern);
      
      if (!this.patternDatabase.patterns[patternKey]) {
        // New pattern from trader
        this.patternDatabase.patterns[patternKey] = {
          key: patternKey,
          symbol: pattern.symbol,
          originalDirection: pattern.direction,
          inverseDirection: pattern.inverseDirection,
          traders: [traderId],
          occurrences: 1,
          totalLoss: pattern.lossAmount,
          avgLoss: pattern.lossAmount,
          conditions: pattern.conditions,
          confidence: 70, // Higher base for trader data
          source: 'trader',
          created: new Date(),
          lastSeen: new Date(),
          version: 1
        };
        patternsAdded++;
      } else {
        const existing = this.patternDatabase.patterns[patternKey];
        
        // Add trader if not already in list
        if (!existing.traders.includes(traderId)) {
          existing.traders.push(traderId);
        }
        
        existing.occurrences++;
        existing.totalLoss += pattern.lossAmount;
        existing.avgLoss = existing.totalLoss / existing.occurrences;
        existing.lastSeen = new Date();
        existing.version++;
        
        // UPGRADE: Public pattern confirmed by real trader!
        if (existing.source === 'public') {
          existing.source = 'combined';
          patternsUpgraded++;
          this.dataSources.combinedPatterns++;
          console.log(`   🎯 Pattern upgraded to COMBINED: ${patternKey}`);
        }
        
        // Update conditions
        this.updateConditions(existing.conditions, pattern.conditions, existing.occurrences);
        
        // Recalculate confidence
        existing.confidence = this.calculateHybridConfidence(existing);
        
        patternsUpdated++;
      }
    }
    
    // Update trader history
    if (!this.patternDatabase.traderHistory.find(t => t.id === traderId)) {
      this.patternDatabase.traderHistory.push({
        id: traderId,
        addedAt: new Date(),
        totalTrades: trades.length,
        totalLosses: losses.length,
        patternsContributed: newPatterns.length,
        source: 'trader'
      });
      this.patternDatabase.totalTraders++;
    }
    
    this.patternDatabase.totalTrades += trades.length;
    this.patternDatabase.totalPatterns = Object.keys(this.patternDatabase.patterns).length;
    this.patternDatabase.lastUpdated = new Date();
    
    this.dataSources.traderPatterns += patternsAdded;
    
    this.saveDatabase();
    
    console.log(`\n✅ Trader data integration complete:`);
    console.log(`   Patterns added: ${patternsAdded}`);
    console.log(`   Patterns updated: ${patternsUpdated}`);
    console.log(`   Patterns upgraded to COMBINED: ${patternsUpgraded} 🎯`);
    console.log(`   Total patterns: ${this.patternDatabase.totalPatterns}`);
    
    return {
      patternsAdded,
      patternsUpdated,
      patternsUpgraded,
      totalPatterns: this.patternDatabase.totalPatterns
    };
  }

  /**
   * HYBRID FEATURE 5: Enhanced Statistics
   */
  getHybridStatistics() {
    const baseStats = this.getStatistics();
    
    // Count patterns by source
    const patterns = Object.values(this.patternDatabase.patterns);
    const bySource = {
      public: patterns.filter(p => p.source === 'public').length,
      trader: patterns.filter(p => p.source === 'trader').length,
      combined: patterns.filter(p => p.source === 'combined').length
    };
    
    // Calculate average confidence by source
    const avgConfidenceBySource = {
      public: this.avgConfidence(patterns.filter(p => p.source === 'public')),
      trader: this.avgConfidence(patterns.filter(p => p.source === 'trader')),
      combined: this.avgConfidence(patterns.filter(p => p.source === 'combined'))
    };
    
    return {
      ...baseStats,
      hybrid: {
        bySource,
        avgConfidenceBySource,
        dataSources: this.dataSources,
        combinedPatternRatio: (bySource.combined / patterns.length * 100).toFixed(2) + '%'
      }
    };
  }

  /**
   * Show enhanced database status
   */
  showDatabaseStatus() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           HYBRID AI DATABASE STATUS                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const stats = this.getHybridStatistics();
    
    console.log('📊 DATABASE OVERVIEW:\n');
    console.log(`   Total Patterns: ${stats.database.totalPatterns}`);
    console.log(`   Total Traders: ${stats.database.totalTraders}`);
    console.log(`   Total Trades: ${stats.database.totalTrades}`);
    console.log(`   Last Updated: ${new Date(stats.database.lastUpdated).toLocaleString()}`);
    
    console.log('\n🔀 PATTERN SOURCES:\n');
    console.log(`   Public Data Only: ${stats.hybrid.bySource.public} (${(stats.hybrid.bySource.public / stats.database.totalPatterns * 100).toFixed(1)}%)`);
    console.log(`   Trader Data Only: ${stats.hybrid.bySource.trader} (${(stats.hybrid.bySource.trader / stats.database.totalPatterns * 100).toFixed(1)}%)`);
    console.log(`   Combined (Public + Trader): ${stats.hybrid.bySource.combined} (${stats.hybrid.combinedPatternRatio}) 🎯`);
    
    console.log('\n📈 CONFIDENCE BY SOURCE:\n');
    console.log(`   Public Patterns: ${stats.hybrid.avgConfidenceBySource.public}% avg`);
    console.log(`   Trader Patterns: ${stats.hybrid.avgConfidenceBySource.trader}% avg`);
    console.log(`   Combined Patterns: ${stats.hybrid.avgConfidenceBySource.combined}% avg 🎯`);
    
    console.log('\n🎯 QUALITY DISTRIBUTION:\n');
    console.log(`   High Confidence (85%+): ${stats.patterns.highConfidence}`);
    console.log(`   Medium Confidence (70-84%): ${stats.patterns.mediumConfidence}`);
    console.log(`   Low Confidence (<70%): ${stats.patterns.lowConfidence}`);
    
    if (stats.performance.totalSignals > 0) {
      console.log('\n📊 PERFORMANCE:\n');
      console.log(`   Total Signals: ${stats.performance.totalSignals}`);
      console.log(`   Successful: ${stats.performance.successfulSignals}`);
      console.log(`   Failed: ${stats.performance.failedSignals}`);
      console.log(`   Accuracy: ${stats.performance.accuracy}%`);
    }
    
    console.log('\n💡 INSIGHTS:\n');
    
    if (stats.hybrid.bySource.combined > 0) {
      console.log(`   ✅ ${stats.hybrid.bySource.combined} patterns confirmed by BOTH public and trader data!`);
      console.log(`   → These are your STRONGEST signals`);
    }
    
    if (stats.hybrid.bySource.public > stats.hybrid.bySource.trader) {
      console.log(`   📊 More public patterns than trader patterns`);
      console.log(`   → Add more trader data to improve accuracy`);
    } else {
      console.log(`   ✅ Good balance of public and trader data`);
    }
    
    if (parseFloat(stats.hybrid.avgConfidenceBySource.combined) > 85) {
      console.log(`   🚀 Combined patterns have ${stats.hybrid.avgConfidenceBySource.combined}% confidence!`);
      console.log(`   → System is highly reliable`);
    }
    
    console.log('\n');
  }

  /**
   * Helper: Calculate average confidence
   */
  avgConfidence(patterns) {
    if (patterns.length === 0) return 0;
    const sum = patterns.reduce((acc, p) => acc + p.confidence, 0);
    return (sum / patterns.length).toFixed(2);
  }

  /**
   * TRADING LEVELS CALCULATION
   * Calculate entry, stop loss, and take profit levels based on:
   * - Risk level
   * - Confidence score
   * - Market volatility
   * - Historical pattern performance
   */
  calculateTradingLevels(signal, currentPrice, marketData = {}) {
    const direction = signal.direction;
    const confidence = signal.confidence;
    const riskLevel = signal.riskLevel;
    
    // Get ATR (Average True Range) for volatility-based calculations
    const atr = marketData.atr || (currentPrice * 0.02); // Default 2% if no ATR
    
    // Calculate stop loss distance based on risk level
    const stopLossMultiplier = this.getStopLossMultiplier(riskLevel, confidence);
    const stopLossDistance = atr * stopLossMultiplier;
    
    // Calculate take profit distances based on confidence and risk/reward
    const tp1Multiplier = this.getTakeProfitMultiplier(confidence, 1); // Conservative
    const tp2Multiplier = this.getTakeProfitMultiplier(confidence, 2); // Aggressive
    
    const tp1Distance = atr * tp1Multiplier;
    const tp2Distance = atr * tp2Multiplier;
    
    // Calculate actual levels based on direction
    let levels;
    if (direction === 'LONG') {
      levels = {
        averageEntryPrice: currentPrice,
        stopLoss: currentPrice - stopLossDistance,
        takeProfit1: currentPrice + tp1Distance,
        takeProfit2: currentPrice + tp2Distance
      };
    } else { // SHORT
      levels = {
        averageEntryPrice: currentPrice,
        stopLoss: currentPrice + stopLossDistance,
        takeProfit1: currentPrice - tp1Distance,
        takeProfit2: currentPrice - tp2Distance
      };
    }
    
    // Calculate risk/reward ratios
    const riskAmount = Math.abs(levels.averageEntryPrice - levels.stopLoss);
    const reward1 = Math.abs(levels.takeProfit1 - levels.averageEntryPrice);
    const reward2 = Math.abs(levels.takeProfit2 - levels.averageEntryPrice);
    
    levels.riskRewardRatio1 = (reward1 / riskAmount).toFixed(2);
    levels.riskRewardRatio2 = (reward2 / riskAmount).toFixed(2);
    
    // Add percentage distances for display
    levels.stopLossPercent = ((Math.abs(levels.stopLoss - levels.averageEntryPrice) / levels.averageEntryPrice) * 100).toFixed(2);
    levels.takeProfit1Percent = ((Math.abs(levels.takeProfit1 - levels.averageEntryPrice) / levels.averageEntryPrice) * 100).toFixed(2);
    levels.takeProfit2Percent = ((Math.abs(levels.takeProfit2 - levels.averageEntryPrice) / levels.averageEntryPrice) * 100).toFixed(2);
    
    return levels;
  }

  /**
   * Get stop loss multiplier based on risk level and confidence
   */
  getStopLossMultiplier(riskLevel, confidence) {
    // Base multipliers by risk level
    const baseMultipliers = {
      'VERY_LOW': 1.5,  // Tighter stop for very low risk
      'LOW': 2.0,       // Standard stop
      'MEDIUM': 2.5,    // Wider stop for medium risk
      'HIGH': 3.0       // Widest stop for high risk
    };
    
    let multiplier = baseMultipliers[riskLevel] || 2.0;
    
    // Adjust based on confidence
    // Higher confidence = can use tighter stops
    if (confidence >= 90) {
      multiplier *= 0.85;
    } else if (confidence >= 80) {
      multiplier *= 0.9;
    } else if (confidence >= 70) {
      multiplier *= 0.95;
    } else if (confidence < 60) {
      multiplier *= 1.1; // Lower confidence = wider stops
    }
    
    return multiplier;
  }

  /**
   * Get take profit multiplier based on confidence and target level
   */
  getTakeProfitMultiplier(confidence, targetLevel) {
    // Base multipliers for TP1 (conservative) and TP2 (aggressive)
    const baseMultipliers = {
      1: 2.5,  // TP1: 2.5x ATR (conservative)
      2: 4.5   // TP2: 4.5x ATR (aggressive)
    };
    
    let multiplier = baseMultipliers[targetLevel] || 2.5;
    
    // Adjust based on confidence
    // Higher confidence = can target larger profits
    if (confidence >= 90) {
      multiplier *= 1.3;
    } else if (confidence >= 85) {
      multiplier *= 1.2;
    } else if (confidence >= 80) {
      multiplier *= 1.15;
    } else if (confidence >= 75) {
      multiplier *= 1.1;
    } else if (confidence < 65) {
      multiplier *= 0.9; // Lower confidence = more conservative targets
    }
    
    return multiplier;
  }

  /**
   * Generate cache key for a symbol
   */
  getCacheKey(symbol) {
    return `signal_${symbol}`;
  }

  /**
   * Check if cached signal is still valid
   */
  isCacheValid(cachedSignal) {
    if (!cachedSignal) return false;
    
    const now = Date.now();
    const cacheAge = now - cachedSignal.cachedAt;
    
    return cacheAge < this.cacheTTL;
  }

  /**
   * Calculate market condition similarity (0-1)
   */
  calculateSimilarity(current, cached) {
    if (!cached || !current) return 0;
    
    // Compare key market conditions
    const priceDiff = Math.abs(current.price - cached.price) / cached.price;
    const rsiDiff = Math.abs(current.rsi - cached.rsi) / 100;
    const volumeDiff = Math.abs(current.volume24h - cached.volume24h) / cached.volume24h;
    
    // Weight the differences
    const similarity = 1 - (
      (priceDiff * 0.4) +  // Price is most important
      (rsiDiff * 0.3) +     // RSI is important
      (volumeDiff * 0.3)    // Volume is important
    );
    
    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * Get cached signal if valid and similar
   */
  getCachedSignal(symbol, currentConditions) {
    const cacheKey = this.getCacheKey(symbol);
    const cached = this.signalCache.get(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    // Check if cache is still valid (time-based)
    if (!this.isCacheValid(cached)) {
      console.log(`   ⏰ Cache expired for ${symbol}`);
      this.signalCache.delete(cacheKey);
      return null;
    }
    
    // Check if market conditions are similar
    const similarity = this.calculateSimilarity(currentConditions, cached.conditions);
    
    if (similarity >= this.similarityThreshold) {
      console.log(`   ♻️  Using cached signal for ${symbol} (${(similarity * 100).toFixed(1)}% similar)`);
      return cached.signal;
    } else {
      console.log(`   🔄 Market changed for ${symbol} (${(similarity * 100).toFixed(1)}% similar, threshold ${(this.similarityThreshold * 100).toFixed(0)}%)`);
      return null;
    }
  }

  /**
   * Cache a signal
   */
  cacheSignal(symbol, signal, conditions) {
    const cacheKey = this.getCacheKey(symbol);
    
    this.signalCache.set(cacheKey, {
      signal: signal,
      conditions: conditions,
      cachedAt: Date.now()
    });
    
    console.log(`   💾 Cached signal for ${symbol} (TTL: ${this.cacheTTL / 1000 / 60} minutes)`);
  }

  /**
   * Clear cache for a symbol
   */
  clearCache(symbol = null) {
    if (symbol) {
      const cacheKey = this.getCacheKey(symbol);
      this.signalCache.delete(cacheKey);
      console.log(`🗑️  Cleared cache for ${symbol}`);
    } else {
      this.signalCache.clear();
      console.log('🗑️  Cleared all signal cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = {
      cachedSignals: this.signalCache.size,
      cacheTTL: this.cacheTTL,
      similarityThreshold: this.similarityThreshold,
      signals: []
    };
    
    for (const [key, cached] of this.signalCache.entries()) {
      const age = Date.now() - cached.cachedAt;
      const remaining = this.cacheTTL - age;
      
      stats.signals.push({
        symbol: cached.signal.symbol,
        signalId: cached.signal.signalId,
        cachedAt: new Date(cached.cachedAt),
        expiresIn: Math.max(0, Math.floor(remaining / 1000 / 60)) + ' minutes',
        valid: this.isCacheValid(cached)
      });
    }
    
    return stats;
  }

  /**
   * Override generateSmartSignals to include caching and trading levels
   */
  async generateSmartSignals(symbols = ['BTCUSDT', 'ETHUSDT']) {
    console.log('\n🎯 Generating smart signals with caching and trading levels...\n');
    
    const signals = [];
    
    for (const symbol of symbols) {
      try {
        // Get current market conditions
        const current = await this.getCurrentMarketConditions(symbol);
        
        // Check cache first
        const cachedSignal = this.getCachedSignal(symbol, current);
        
        if (cachedSignal) {
          // Use cached signal
          signals.push(cachedSignal);
          console.log(`   ✅ Reusing cached signal for ${symbol}`);
          continue;
        }
        
        // No valid cache, generate new signal
        console.log(`   🆕 Generating new signal for ${symbol}`);
        
        // Find matching patterns from database
        const matches = this.findMatchingPatternsFromDB(symbol, current);
        
        if (matches.length > 0) {
          console.log(`\n📍 ${symbol}: Found ${matches.length} matching patterns!`);
          
          for (const match of matches) {
            const signal = this.generateSignalFromPattern(symbol, current, match);
            
            // Calculate trading levels
            const tradingLevels = this.calculateTradingLevels(
              signal,
              current.price,
              { atr: current.atr }
            );
            
            // Add trading levels to signal
            signal.averageEntryPrice = tradingLevels.averageEntryPrice;
            signal.stopLoss = tradingLevels.stopLoss;
            signal.takeProfit1 = tradingLevels.takeProfit1;
            signal.takeProfit2 = tradingLevels.takeProfit2;
            signal.riskRewardRatio1 = tradingLevels.riskRewardRatio1;
            signal.riskRewardRatio2 = tradingLevels.riskRewardRatio2;
            signal.stopLossPercent = tradingLevels.stopLossPercent;
            signal.takeProfit1Percent = tradingLevels.takeProfit1Percent;
            signal.takeProfit2Percent = tradingLevels.takeProfit2Percent;
            
            // Cache the signal
            this.cacheSignal(symbol, signal, current);
            
            signals.push(signal);
            
            console.log(`   Signal: ${signal.direction} (Confidence: ${signal.confidence}%)`);
            console.log(`   Entry: $${signal.averageEntryPrice.toFixed(2)}`);
            console.log(`   Stop Loss: $${signal.stopLoss.toFixed(2)} (-${signal.stopLossPercent}%)`);
            console.log(`   TP1: $${signal.takeProfit1.toFixed(2)} (+${signal.takeProfit1Percent}%) [R:R ${signal.riskRewardRatio1}]`);
            console.log(`   TP2: $${signal.takeProfit2.toFixed(2)} (+${signal.takeProfit2Percent}%) [R:R ${signal.riskRewardRatio2}]`);
            console.log(`   Pattern: ${match.traders.length} traders, ${match.occurrences} occurrences`);
            
            if (match.performance) {
              const winRate = (match.performance.wins / (match.performance.wins + match.performance.losses) * 100).toFixed(0);
              console.log(`   Historical Win Rate: ${winRate}%`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error generating signals for ${symbol}:`, error.message);
      }
    }
    
    console.log(`\n✅ Generated ${signals.length} smart signals (${this.signalCache.size} cached)`);
    
    // Track signals if tracker is available
    if (this.signalTracker) {
      for (const signal of signals) {
        try {
          this.signalTracker.registerSignal(signal);
        } catch (error) {
          console.error(`Failed to track signal ${signal.signalId}:`, error.message);
        }
      }
    }
    
    return signals;
  }

  /**
   * Helper: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = HybridEngine;
