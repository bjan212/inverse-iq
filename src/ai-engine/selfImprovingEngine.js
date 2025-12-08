/**
 * Self-Improving AI Engine
 * 
 * This engine LEARNS and IMPROVES over time as you feed it more trader data.
 * 
 * Key Features:
 * 1. Incremental Learning - Add new traders without reprocessing everything
 * 2. Pattern Strengthening - Patterns get stronger as more traders confirm them
 * 3. Confidence Evolution - Automatically adjusts confidence as data grows
 * 4. Performance Tracking - Learns from signal outcomes (wins/losses)
 * 5. Auto-Retraining - Improves predictions based on real results
 * 6. Pattern Database - Persistent storage that grows over time
 * 
 * The more accounts you feed it → The smarter it gets!
 */

const fs = require('fs');
const path = require('path');
const InverseSignalEngine = require('./inverseSignalEngine');

class SelfImprovingEngine extends InverseSignalEngine {
  constructor(dbPath = './data/pattern_database.json') {
    super();
    
    this.dbPath = dbPath;
    this.patternDatabase = {
      version: 1,
      created: new Date(),
      lastUpdated: new Date(),
      totalTraders: 0,
      totalTrades: 0,
      totalPatterns: 0,
      patterns: {},
      performance: {
        totalSignals: 0,
        successfulSignals: 0,
        failedSignals: 0,
        accuracy: 0
      },
      traderHistory: []
    };
    
    // Load existing database
    this.loadDatabase();
  }

  /**
   * CORE FEATURE 1: Incremental Learning
   * Add new trader data without reprocessing everything
   */
  async addNewTraderData(traderData) {
    console.log('\n🔄 INCREMENTAL LEARNING: Adding new trader data...\n');
    
    const traderId = traderData.traderId || `trader_${Date.now()}`;
    
    // Check if trader already exists
    const existingTrader = this.patternDatabase.traderHistory.find(t => t.id === traderId);
    if (existingTrader) {
      console.log(`⚠️  Trader ${traderId} already exists. Updating...`);
    } else {
      console.log(`✅ New trader: ${traderId}`);
    }
    
    // Process this trader's data
    const trades = traderData.trades || [];
    console.log(`   Processing ${trades.length} trades...`);
    
    // Extract loss patterns from this trader
    const losses = trades.filter(t => t.pnl < 0);
    console.log(`   Found ${losses.length} losses`);
    
    const newPatterns = await this.extractLossPatterns(traderId, losses);
    console.log(`   Extracted ${newPatterns.length} loss patterns`);
    
    // INCREMENTAL UPDATE: Add patterns to database
    let patternsAdded = 0;
    let patternsUpdated = 0;
    
    for (const pattern of newPatterns) {
      const patternKey = this.getPatternKey(pattern);
      
      if (!this.patternDatabase.patterns[patternKey]) {
        // New pattern - add it
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
          confidence: 50, // Start with base confidence
          created: new Date(),
          lastSeen: new Date(),
          version: 1
        };
        patternsAdded++;
      } else {
        // Existing pattern - STRENGTHEN it!
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
        
        // Update conditions (weighted average)
        this.updateConditions(existing.conditions, pattern.conditions, existing.occurrences);
        
        // RECALCULATE CONFIDENCE (gets stronger with more traders!)
        existing.confidence = this.calculatePatternConfidence(existing);
        
        patternsUpdated++;
      }
    }
    
    // Update trader history
    if (!existingTrader) {
      this.patternDatabase.traderHistory.push({
        id: traderId,
        addedAt: new Date(),
        totalTrades: trades.length,
        totalLosses: losses.length,
        patternsContributed: newPatterns.length
      });
      this.patternDatabase.totalTraders++;
    }
    
    // Update totals
    this.patternDatabase.totalTrades += trades.length;
    this.patternDatabase.totalPatterns = Object.keys(this.patternDatabase.patterns).length;
    this.patternDatabase.lastUpdated = new Date();
    
    // Save to disk
    this.saveDatabase();
    
    console.log(`\n✅ Incremental learning complete:`);
    console.log(`   Patterns added: ${patternsAdded}`);
    console.log(`   Patterns strengthened: ${patternsUpdated}`);
    console.log(`   Total patterns in database: ${this.patternDatabase.totalPatterns}`);
    console.log(`   Total traders: ${this.patternDatabase.totalTraders}`);
    
    return {
      patternsAdded,
      patternsUpdated,
      totalPatterns: this.patternDatabase.totalPatterns,
      totalTraders: this.patternDatabase.totalTraders
    };
  }

  /**
   * CORE FEATURE 2: Pattern Strengthening
   * Patterns get stronger as more traders confirm them
   */
  calculatePatternConfidence(pattern) {
    let confidence = 50; // Base confidence
    
    // More traders = MUCH higher confidence
    const traderBonus = Math.min(pattern.traders.length * 8, 25);
    confidence += traderBonus;
    
    // More occurrences = higher confidence
    const occurrenceBonus = Math.min(pattern.occurrences * 1.5, 15);
    confidence += occurrenceBonus;
    
    // Larger losses = higher confidence (expensive lessons!)
    if (pattern.totalLoss > 20000) confidence += 15;
    else if (pattern.totalLoss > 10000) confidence += 12;
    else if (pattern.totalLoss > 5000) confidence += 8;
    else if (pattern.totalLoss > 1000) confidence += 5;
    
    // Recent activity bonus
    const daysSinceLastSeen = (Date.now() - new Date(pattern.lastSeen)) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSeen < 7) confidence += 5;
    else if (daysSinceLastSeen < 30) confidence += 3;
    
    // Performance-based adjustment (if we have historical data)
    if (pattern.performance) {
      const successRate = pattern.performance.wins / (pattern.performance.wins + pattern.performance.losses);
      if (successRate > 0.8) confidence += 10;
      else if (successRate > 0.7) confidence += 5;
      else if (successRate < 0.5) confidence -= 10;
    }
    
    return Math.min(Math.max(confidence, 0), 100);
  }

  /**
   * CORE FEATURE 3: Performance Tracking
   * Track signal outcomes and learn from them
   */
  async recordSignalOutcome(signalId, outcome) {
    console.log(`\n📊 Recording signal outcome: ${signalId} → ${outcome}\n`);
    
    // Find the pattern that generated this signal
    const signal = this.findSignalById(signalId);
    if (!signal) {
      console.log('⚠️  Signal not found');
      return;
    }
    
    const patternKey = this.getPatternKeyFromSignal(signal);
    const pattern = this.patternDatabase.patterns[patternKey];
    
    if (!pattern) {
      console.log('⚠️  Pattern not found');
      return;
    }
    
    // Initialize performance tracking if not exists
    if (!pattern.performance) {
      pattern.performance = {
        wins: 0,
        losses: 0,
        totalPnl: 0,
        avgPnl: 0,
        lastOutcome: null,
        lastOutcomeAt: null
      };
    }
    
    // Update performance
    if (outcome.success) {
      pattern.performance.wins++;
      this.patternDatabase.performance.successfulSignals++;
    } else {
      pattern.performance.losses++;
      this.patternDatabase.performance.failedSignals++;
    }
    
    pattern.performance.totalPnl += outcome.pnl || 0;
    pattern.performance.avgPnl = pattern.performance.totalPnl / 
                                  (pattern.performance.wins + pattern.performance.losses);
    pattern.performance.lastOutcome = outcome.success ? 'WIN' : 'LOSS';
    pattern.performance.lastOutcomeAt = new Date();
    
    // RECALCULATE CONFIDENCE based on performance
    pattern.confidence = this.calculatePatternConfidence(pattern);
    
    // Update global performance
    this.patternDatabase.performance.totalSignals++;
    this.patternDatabase.performance.accuracy = 
      (this.patternDatabase.performance.successfulSignals / 
       this.patternDatabase.performance.totalSignals * 100).toFixed(2);
    
    this.patternDatabase.lastUpdated = new Date();
    this.saveDatabase();
    
    console.log(`✅ Pattern performance updated:`);
    console.log(`   Wins: ${pattern.performance.wins}`);
    console.log(`   Losses: ${pattern.performance.losses}`);
    console.log(`   Win Rate: ${(pattern.performance.wins / (pattern.performance.wins + pattern.performance.losses) * 100).toFixed(2)}%`);
    console.log(`   Avg PnL: $${pattern.performance.avgPnl.toFixed(2)}`);
    console.log(`   New Confidence: ${pattern.confidence}%`);
    
    return pattern.performance;
  }

  /**
   * CORE FEATURE 4: Smart Signal Generation
   * Use database patterns with confidence scores
   */
  async generateSmartSignals(symbols = ['BTCUSDT', 'ETHUSDT']) {
    console.log('\n🎯 Generating smart signals from pattern database...\n');
    
    const signals = [];
    
    for (const symbol of symbols) {
      // Get current market conditions
      const current = await this.getCurrentMarketConditions(symbol);
      
      // Find matching patterns from database
      const matches = this.findMatchingPatternsFromDB(symbol, current);
      
      if (matches.length > 0) {
        console.log(`\n📍 ${symbol}: Found ${matches.length} matching patterns!`);
        
        for (const match of matches) {
          const signal = this.generateSignalFromPattern(symbol, current, match);
          signals.push(signal);
          
          console.log(`   Signal: ${signal.direction} (Confidence: ${signal.confidence}%)`);
          console.log(`   Pattern: ${match.traders.length} traders, ${match.occurrences} occurrences`);
          
          if (match.performance) {
            const winRate = (match.performance.wins / (match.performance.wins + match.performance.losses) * 100).toFixed(0);
            console.log(`   Historical Win Rate: ${winRate}%`);
          }
        }
      }
    }
    
    console.log(`\n✅ Generated ${signals.length} smart signals`);
    
    return signals;
  }

  /**
   * Find matching patterns from database
   */
  findMatchingPatternsFromDB(symbol, currentConditions) {
    const matches = [];
    
    for (const [key, pattern] of Object.entries(this.patternDatabase.patterns)) {
      if (pattern.symbol !== symbol) continue;
      
      // Calculate similarity
      const similarity = this.calculateSimilarity(currentConditions, pattern.conditions);
      
      // Match threshold: 70% similarity
      if (similarity >= 0.7) {
        matches.push({
          ...pattern,
          similarity
        });
      }
    }
    
    // Sort by confidence * similarity
    matches.sort((a, b) => (b.confidence * b.similarity) - (a.confidence * a.similarity));
    
    return matches;
  }

  /**
   * Generate signal from database pattern
   */
  generateSignalFromPattern(symbol, currentConditions, pattern) {
    // Adjust confidence based on similarity and performance
    let adjustedConfidence = pattern.confidence * pattern.similarity;
    
    // Boost confidence if pattern has good historical performance
    if (pattern.performance) {
      const winRate = pattern.performance.wins / (pattern.performance.wins + pattern.performance.losses);
      if (winRate > 0.75) adjustedConfidence *= 1.1;
      else if (winRate < 0.5) adjustedConfidence *= 0.8;
    }
    
    adjustedConfidence = Math.min(Math.round(adjustedConfidence), 100);
    
    return {
      signalId: `${symbol}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      direction: pattern.inverseDirection,
      confidence: adjustedConfidence,
      
      reason: `INVERSE SIGNAL: ${pattern.traders.length} traders lost $${pattern.totalLoss.toFixed(2)} going ${pattern.originalDirection} in similar conditions (${(pattern.similarity * 100).toFixed(0)}% match). Pattern seen ${pattern.occurrences} times. Suggested: ${pattern.inverseDirection}`,
      
      pattern: {
        key: pattern.key,
        tradersAffected: pattern.traders.length,
        totalOccurrences: pattern.occurrences,
        totalLosses: pattern.totalLoss,
        avgLoss: pattern.avgLoss,
        originalDirection: pattern.originalDirection,
        confidence: pattern.confidence,
        version: pattern.version,
        performance: pattern.performance || null
      },
      
      currentConditions,
      
      riskLevel: this.assessRiskLevel(adjustedConfidence, pattern),
      
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
    };
  }

  /**
   * Get database statistics
   */
  getStatistics() {
    const patterns = Object.values(this.patternDatabase.patterns);
    
    // Calculate average confidence
    const avgConfidence = patterns.length > 0
      ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
      : 0;
    
    // Get top patterns
    const topPatterns = patterns
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
    
    // Calculate performance by trader count
    const byTraderCount = {};
    for (const pattern of patterns) {
      const count = pattern.traders.length;
      if (!byTraderCount[count]) {
        byTraderCount[count] = { count: 0, avgConfidence: 0 };
      }
      byTraderCount[count].count++;
      byTraderCount[count].avgConfidence += pattern.confidence;
    }
    
    for (const key in byTraderCount) {
      byTraderCount[key].avgConfidence /= byTraderCount[key].count;
    }
    
    return {
      database: {
        version: this.patternDatabase.version,
        created: this.patternDatabase.created,
        lastUpdated: this.patternDatabase.lastUpdated,
        totalTraders: this.patternDatabase.totalTraders,
        totalTrades: this.patternDatabase.totalTrades,
        totalPatterns: this.patternDatabase.totalPatterns
      },
      patterns: {
        total: patterns.length,
        avgConfidence: avgConfidence.toFixed(2),
        highConfidence: patterns.filter(p => p.confidence >= 85).length,
        mediumConfidence: patterns.filter(p => p.confidence >= 70 && p.confidence < 85).length,
        lowConfidence: patterns.filter(p => p.confidence < 70).length
      },
      performance: this.patternDatabase.performance,
      byTraderCount,
      topPatterns: topPatterns.map(p => ({
        symbol: p.symbol,
        direction: `${p.originalDirection} → ${p.inverseDirection}`,
        traders: p.traders.length,
        confidence: p.confidence,
        occurrences: p.occurrences,
        totalLoss: p.totalLoss
      }))
    };
  }

  /**
   * Show learning progress
   */
  showLearningProgress() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              LEARNING PROGRESS REPORT                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const stats = this.getStatistics();
    
    console.log('📊 DATABASE STATUS:\n');
    console.log(`   Version: ${stats.database.version}`);
    console.log(`   Created: ${new Date(stats.database.created).toLocaleDateString()}`);
    console.log(`   Last Updated: ${new Date(stats.database.lastUpdated).toLocaleString()}`);
    console.log(`   Total Traders: ${stats.database.totalTraders}`);
    console.log(`   Total Trades: ${stats.database.totalTrades}`);
    console.log(`   Total Patterns: ${stats.database.totalPatterns}`);
    
    console.log('\n📈 PATTERN QUALITY:\n');
    console.log(`   Average Confidence: ${stats.patterns.avgConfidence}%`);
    console.log(`   High Confidence (85%+): ${stats.patterns.highConfidence}`);
    console.log(`   Medium Confidence (70-84%): ${stats.patterns.mediumConfidence}`);
    console.log(`   Low Confidence (<70%): ${stats.patterns.lowConfidence}`);
    
    console.log('\n🎯 PERFORMANCE:\n');
    console.log(`   Total Signals Generated: ${stats.performance.totalSignals}`);
    console.log(`   Successful Signals: ${stats.performance.successfulSignals}`);
    console.log(`   Failed Signals: ${stats.performance.failedSignals}`);
    console.log(`   Overall Accuracy: ${stats.performance.accuracy}%`);
    
    console.log('\n🔥 TOP PATTERNS:\n');
    for (let i = 0; i < Math.min(5, stats.topPatterns.length); i++) {
      const p = stats.topPatterns[i];
      console.log(`   ${i + 1}. ${p.symbol} ${p.direction}`);
      console.log(`      Traders: ${p.traders} | Confidence: ${p.confidence}% | Loss: $${p.totalLoss.toFixed(2)}`);
    }
    
    console.log('\n💡 LEARNING INSIGHTS:\n');
    
    if (stats.database.totalTraders < 10) {
      console.log('   ⚠️  Need more traders! Current: ' + stats.database.totalTraders + ', Target: 10+');
      console.log('   → Add more traders to improve pattern confidence');
    } else if (stats.database.totalTraders < 30) {
      console.log('   ✅ Good progress! ' + stats.database.totalTraders + ' traders contributing');
      console.log('   → Target 30+ traders for 75%+ accuracy');
    } else {
      console.log('   🚀 Excellent! ' + stats.database.totalTraders + ' traders in database');
      console.log('   → System is learning effectively');
    }
    
    if (stats.patterns.highConfidence > 0) {
      console.log(`   ✅ ${stats.patterns.highConfidence} high-confidence patterns ready to use`);
    }
    
    if (stats.performance.totalSignals > 0) {
      if (parseFloat(stats.performance.accuracy) >= 75) {
        console.log(`   🎯 Excellent accuracy: ${stats.performance.accuracy}%`);
      } else if (parseFloat(stats.performance.accuracy) >= 65) {
        console.log(`   ✅ Good accuracy: ${stats.performance.accuracy}%`);
      } else {
        console.log(`   ⚠️  Accuracy needs improvement: ${stats.performance.accuracy}%`);
        console.log('   → Add more trader data to strengthen patterns');
      }
    }
    
    console.log('\n');
  }

  /**
   * Database persistence
   */
  loadDatabase() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        this.patternDatabase = JSON.parse(data);
        console.log(`✅ Loaded pattern database: ${this.patternDatabase.totalPatterns} patterns from ${this.patternDatabase.totalTraders} traders`);
      } else {
        console.log('📝 Creating new pattern database');
      }
    } catch (error) {
      console.error('Failed to load database:', error.message);
    }
  }

  saveDatabase() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.dbPath, JSON.stringify(this.patternDatabase, null, 2));
      console.log(`💾 Database saved: ${this.patternDatabase.totalPatterns} patterns`);
    } catch (error) {
      console.error('Failed to save database:', error.message);
    }
  }

  /**
   * Helper methods
   */
  
  updateConditions(existing, newConditions, occurrences) {
    // Weighted average update
    const weight = 1 / occurrences;
    
    for (const key in newConditions) {
      if (typeof newConditions[key] === 'number') {
        existing[key] = existing[key] * (1 - weight) + newConditions[key] * weight;
      }
    }
  }

  assessRiskLevel(confidence, pattern) {
    const traderCount = pattern.traders.length;
    
    if (confidence >= 85 && traderCount >= 5) return 'VERY_LOW';
    if (confidence >= 75 && traderCount >= 3) return 'LOW';
    if (confidence >= 65 && traderCount >= 2) return 'MEDIUM';
    return 'HIGH';
  }

  findSignalById(signalId) {
    // Use signal tracker if available
    if (this.signalTracker) {
      return this.signalTracker.getSignal(signalId);
    }
    return null;
  }

  getPatternKeyFromSignal(signal) {
    // Extract pattern key from signal
    if (signal.patternKey) {
      return signal.patternKey;
    }
    return signal.pattern?.key || signal.fullSignal?.pattern?.key || '';
  }

  /**
   * Set signal tracker for feedback loop
   */
  setSignalTracker(tracker) {
    this.signalTracker = tracker;
    console.log('✅ Signal tracker connected to AI engine');
  }
}

module.exports = SelfImprovingEngine;

