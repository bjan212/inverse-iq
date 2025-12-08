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
    let confidence = 50; // Base confidence
    
    // Source-based confidence
    if (pattern.source === 'combined') {
      // BEST: Both public and trader data confirm this pattern
      confidence += 30;
    } else if (pattern.source === 'trader') {
      // GOOD: Real trader data
      confidence += 20;
    } else if (pattern.source === 'public') {
      // OK: Public market data
      confidence += 10;
    }
    
    // Trader count bonus (more traders = higher confidence)
    const traderBonus = Math.min(pattern.traders.length * 8, 25);
    confidence += traderBonus;
    
    // Occurrence bonus
    const occurrenceBonus = Math.min(pattern.occurrences * 1.5, 15);
    confidence += occurrenceBonus;
    
    // Loss amount bonus (expensive lessons!)
    if (pattern.totalLoss > 20000) confidence += 15;
    else if (pattern.totalLoss > 10000) confidence += 12;
    else if (pattern.totalLoss > 5000) confidence += 8;
    else if (pattern.totalLoss > 1000) confidence += 5;
    
    // Pattern type bonus (some patterns are more reliable)
    if (pattern.patternType === 'FALSE_BREAKOUT') confidence += 5;
    if (pattern.patternType === 'LIQUIDATION_WICK') confidence += 5;
    
    // Recent activity bonus
    const daysSinceLastSeen = (Date.now() - new Date(pattern.lastSeen)) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSeen < 7) confidence += 5;
    else if (daysSinceLastSeen < 30) confidence += 3;
    
    // Performance-based adjustment
    if (pattern.performance) {
      const successRate = pattern.performance.wins / (pattern.performance.wins + pattern.performance.losses);
      if (successRate > 0.8) confidence += 10;
      else if (successRate > 0.7) confidence += 5;
      else if (successRate < 0.5) confidence -= 10;
    }
    
    return Math.min(Math.max(confidence, 0), 100);
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
   * Helper: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = HybridEngine;
