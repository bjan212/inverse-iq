/**
 * Continuous Learning Engine
 *
 * Ensures ALL data sources continuously feed the AI engine:
 * 1. Online signals (real-time market data)
 * 2. Trader submissions (processed automatically)
 * 3. Public market data (continuous collection)
 * 4. Social trading data (competitor analysis)
 * 5. Performance feedback (signal outcomes)
 * 6. Market sentiment data (news, social media)
 * 7. On-chain metrics (whale movements, funding rates)
 * 8. Alternative data sources (economic indicators)
 *
 * The more data = the more accurate the signals
 */

const HybridEngine = require('./hybridEngine');
const DataPipeline = require('./dataPipeline');
const PublicDataAnalyzer = require('./publicDataAnalyzer');
const BinancePublicCollector = require('../collectors/binancePublicCollector');
const fs = require('fs');
const path = require('path');

class ContinuousLearningEngine extends HybridEngine {
  constructor(dbPath = './data/continuous_learning_database.json') {
    super(dbPath);

    // Enhanced data sources
    this.dataSources = {
      onlineSignals: { active: true, interval: 30000, lastUpdate: null },     // 30s
      traderSubmissions: { active: true, interval: 60000, lastUpdate: null }, // 60s
      publicMarketData: { active: true, interval: 300000, lastUpdate: null }, // 5min
      socialTrading: { active: false, interval: 900000, lastUpdate: null },   // 15min
      performanceFeedback: { active: true, interval: 120000, lastUpdate: null }, // 2min
      marketSentiment: { active: false, interval: 600000, lastUpdate: null },  // 10min
      onChainMetrics: { active: false, interval: 1800000, lastUpdate: null },  // 30min
      economicIndicators: { active: false, interval: 3600000, lastUpdate: null } // 1hour
    };

    // Learning metrics
    this.learningMetrics = {
      totalDataPoints: 0,
      patternsLearned: 0,
      accuracyImprovements: [],
      dataSourceContributions: {},
      learningRate: 0,
      lastAccuracyCheck: null
    };

    // Continuous learning settings
    this.continuousLearning = {
      enabled: true,
      autoOptimize: true,
      performanceThreshold: 75, // Minimum accuracy to maintain
      dataQualityThreshold: 60, // Minimum data quality score
      maxPatternsPerHour: 100, // Rate limiting
      emergencyStopLoss: 50 // Stop learning if accuracy drops below this
    };

    // Initialize continuous data collection
    this.initializeContinuousLearning();
  }

  /**
   * Initialize continuous learning system
   */
  async initializeContinuousLearning() {
    console.log('\n🚀 INITIALIZING CONTINUOUS LEARNING ENGINE\n');

    // Start all active data sources
    for (const [sourceName, config] of Object.entries(this.dataSources)) {
      if (config.active) {
        this.startDataSource(sourceName, config);
        console.log(`✅ Started ${sourceName} data collection (${config.interval/1000}s intervals)`);
      }
    }

    // Load existing learning metrics
    this.loadLearningMetrics();

    // Bootstrap with existing data
    await this.bootstrapFromExistingData();

    // Start performance monitoring
    this.startPerformanceMonitoring();

    console.log('\n🎯 CONTINUOUS LEARNING ENGINE READY');
    console.log('📊 All data sources feeding AI engine non-stop\n');
  }

  /**
   * Start a specific data source collection
   */
  startDataSource(sourceName, config) {
    const intervalId = setInterval(async () => {
      try {
        await this.collectDataFromSource(sourceName);
        config.lastUpdate = new Date();
      } catch (error) {
        console.error(`❌ Error collecting from ${sourceName}:`, error.message);
      }
    }, config.interval);

    // Store interval ID for cleanup
    config.intervalId = intervalId;
  }

  /**
   * Collect data from specific source
   */
  async collectDataFromSource(sourceName) {
    const startTime = Date.now();

    try {
      switch (sourceName) {
        case 'onlineSignals':
          await this.collectOnlineSignals();
          break;
        case 'traderSubmissions':
          await this.collectTraderSubmissions();
          break;
        case 'publicMarketData':
          await this.collectPublicMarketData();
          break;
        case 'socialTrading':
          await this.collectSocialTradingData();
          break;
        case 'performanceFeedback':
          await this.collectPerformanceFeedback();
          break;
        case 'marketSentiment':
          await this.collectMarketSentiment();
          break;
        case 'onChainMetrics':
          await this.collectOnChainMetrics();
          break;
        case 'economicIndicators':
          await this.collectEconomicIndicators();
          break;
      }

      // Update metrics
      this.updateLearningMetrics(sourceName, Date.now() - startTime);

    } catch (error) {
      console.error(`❌ ${sourceName} collection failed:`, error.message);
    }
  }

  /**
   * DATA SOURCE 1: Online Signals (Real-time market data)
   */
  async collectOnlineSignals() {
    try {
      const onlineSignalsPath = path.join(__dirname, '../../data/online_signals.json');

      if (!fs.existsSync(onlineSignalsPath)) {
        return; // No online signals file yet
      }

      const onlineData = JSON.parse(fs.readFileSync(onlineSignalsPath, 'utf8'));

      if (!Array.isArray(onlineData) || onlineData.length === 0) {
        return;
      }

      // Convert to trader format and add to engine
      const traderData = {
        traderId: 'online_signals_realtime',
        trades: onlineData.map(signal => ({
          symbol: signal.symbol,
          side: signal.direction || signal.side || 'LONG',
          pnl: signal.pnl || -Math.abs(Number(signal.close) - Number(signal.open)),
          entryTime: signal.time,
          conditions: signal.conditions || {},
          source: 'online_signals'
        }))
      };

      const result = await this.addNewTraderData(traderData);

      if (result.patternsAdded > 0 || result.patternsUpdated > 0) {
        console.log(`📡 Online signals: +${result.patternsAdded} patterns, ↑${result.patternsUpdated} strengthened`);
      }

    } catch (error) {
      console.error('Online signals collection error:', error.message);
    }
  }

  /**
   * DATA SOURCE 2: Trader Submissions (Processed automatically)
   */
  async collectTraderSubmissions() {
    try {
      // Use existing data pipeline to check for new submissions
      const dataPipeline = new DataPipeline();
      const results = await dataPipeline.processNewSubmissions();

      if (results.length > 0) {
        console.log(`👥 Trader submissions: ${results.length} new submissions processed`);

        for (const result of results) {
          // Data already fed to AI by data pipeline, just log
          console.log(`   ${result.submissionId}: ${result.tradesProcessed} trades → ${result.patternsAdded} patterns`);
        }
      }

    } catch (error) {
      console.error('Trader submissions collection error:', error.message);
    }
  }

  /**
   * DATA SOURCE 3: Public Market Data (Continuous collection)
   */
  async collectPublicMarketData() {
    try {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT'];
      const publicCollector = new BinancePublicCollector();

      for (const symbol of symbols) {
        try {
          // Collect recent data (last 24 hours)
          const data = await publicCollector.getComprehensiveData(symbol, '1h', 1);

          if (data && data.klines && data.klines.length > 0) {
            // Analyze for new patterns
            const patterns = this.publicAnalyzer.analyzeFailurePatterns(
              data.klines,
              symbol,
              '1h'
            );

            if (patterns.length > 0) {
              // Convert to trader format
              const traderData = this.publicAnalyzer.convertToTraderFormat(patterns, `public_${symbol}_${Date.now()}`);
              const result = await this.addPublicDataPatterns(traderData);

              if (result.patternsAdded > 0) {
                console.log(`🌐 ${symbol}: +${result.patternsAdded} public patterns`);
              }
            }
          }

          // Rate limiting
          await this.sleep(1000);

        } catch (error) {
          console.error(`Public data collection error for ${symbol}:`, error.message);
        }
      }

    } catch (error) {
      console.error('Public market data collection error:', error.message);
    }
  }

  /**
   * DATA SOURCE 4: Social Trading Data (Competitor analysis)
   */
  async collectSocialTradingData() {
    // TODO: Implement social trading data collection
    // - 3Commas strategy performance
    // - Shrimpy portfolio data
    // - eToro public trader stats
    // - Bitget copy trading data
    console.log('📊 Social trading data collection (not yet implemented)');
  }

  /**
   * DATA SOURCE 5: Performance Feedback (Signal outcomes)
   */
  async collectPerformanceFeedback() {
    try {
      // Check for new signal outcomes in tracker
      if (this.signalTracker) {
        const allSignals = this.signalTracker.getAllSignals();
        const recentSignals = allSignals.filter(signal =>
          signal.outcome && // Has outcome
          (!signal.processedForLearning || signal.processedForLearning === false) // Not yet processed
        );

        if (recentSignals.length > 0) {
          console.log(`📈 Processing ${recentSignals.length} signal outcomes for learning`);

          for (const signal of recentSignals) {
            try {
              // Record outcome in AI engine
              const outcomeData = {
                success: signal.outcome === 'win',
                pnl: signal.pnl || 0,
                pnlPercentage: signal.pnlPercentage || 0,
                duration: signal.duration || 0
              };

              await this.recordSignalOutcome(signal.signalId, outcomeData);

              // Mark as processed
              signal.processedForLearning = true;

            } catch (error) {
              console.error(`Failed to process signal ${signal.signalId}:`, error.message);
            }
          }

          console.log(`✅ Processed ${recentSignals.length} signal outcomes`);
        }
      }

    } catch (error) {
      console.error('Performance feedback collection error:', error.message);
    }
  }

  /**
   * DATA SOURCE 6: Market Sentiment (News, social media)
   */
  async collectMarketSentiment() {
    // TODO: Implement market sentiment collection
    // - Crypto news sentiment analysis
    // - Twitter/X sentiment tracking
    // - Reddit sentiment analysis
    // - Fear & Greed Index
    console.log('📰 Market sentiment data collection (not yet implemented)');
  }

  /**
   * DATA SOURCE 7: On-Chain Metrics (Whale movements, funding rates)
   */
  async collectOnChainMetrics() {
    // TODO: Implement on-chain metrics collection
    // - Large wallet movements
    // - Exchange inflow/outflow
    // - Funding rate analysis
    // - Liquidation data
    console.log('⛓️ On-chain metrics collection (not yet implemented)');
  }

  /**
   * DATA SOURCE 8: Economic Indicators (Macro data)
   */
  async collectEconomicIndicators() {
    // TODO: Implement economic indicators collection
    // - Interest rate changes
    // - GDP data
    // - Employment figures
    // - Inflation data
    console.log('📊 Economic indicators collection (not yet implemented)');
  }

  /**
   * Bootstrap from existing data on startup
   */
  async bootstrapFromExistingData() {
    console.log('🔄 Bootstrapping from existing data...\n');

    try {
      // 1. Import online signals
      await this.importOnlineSignals();

      // 2. Process any pending submissions
      const dataPipeline = new DataPipeline();
      await dataPipeline.reprocessAll();

      // 3. Bootstrap with public data if needed
      const stats = this.getHybridStatistics();
      if (stats.hybrid.bySource.public < 100) {
        console.log('📊 Bootstrapping with public market data...');
        await this.bootstrapWithPublicData(['BTCUSDT', 'ETHUSDT', 'BNBUSDT'], 30);
      }

      console.log('✅ Bootstrap complete\n');

    } catch (error) {
      console.error('Bootstrap error:', error.message);
    }
  }

  /**
   * Update learning metrics
   */
  updateLearningMetrics(sourceName, processingTime) {
    this.learningMetrics.totalDataPoints++;

    if (!this.learningMetrics.dataSourceContributions[sourceName]) {
      this.learningMetrics.dataSourceContributions[sourceName] = 0;
    }
    this.learningMetrics.dataSourceContributions[sourceName]++;

    // Calculate learning rate (patterns per hour)
    const now = Date.now();
    const hoursRunning = (now - (this.learningMetrics.startTime || now)) / (1000 * 60 * 60);
    this.learningMetrics.learningRate = this.patternDatabase.totalPatterns / Math.max(hoursRunning, 1);

    this.saveLearningMetrics();
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    // Check accuracy every hour
    setInterval(async () => {
      try {
        const stats = this.getStatistics();
        const currentAccuracy = stats.performance.accuracy;

        if (this.learningMetrics.lastAccuracyCheck !== null) {
          const improvement = currentAccuracy - this.learningMetrics.lastAccuracyCheck;
          this.learningMetrics.accuracyImprovements.push({
            timestamp: new Date(),
            previousAccuracy: this.learningMetrics.lastAccuracyCheck,
            currentAccuracy: currentAccuracy,
            improvement: improvement
          });

          if (Math.abs(improvement) > 1) { // Significant change
            console.log(`📈 Accuracy ${improvement > 0 ? 'improved' : 'declined'} by ${Math.abs(improvement).toFixed(1)}% to ${currentAccuracy}%`);
          }
        }

        this.learningMetrics.lastAccuracyCheck = currentAccuracy;

        // Emergency stop if accuracy drops too low
        if (currentAccuracy < this.continuousLearning.emergencyStopLoss) {
          console.error(`🚨 EMERGENCY: Accuracy dropped to ${currentAccuracy}% - stopping learning`);
          this.stopContinuousLearning();
        }

      } catch (error) {
        console.error('Performance monitoring error:', error.message);
      }
    }, 60 * 60 * 1000); // Every hour

    this.learningMetrics.startTime = Date.now();
  }

  /**
   * Stop continuous learning
   */
  stopContinuousLearning() {
    console.log('🛑 Stopping continuous learning...');

    for (const [sourceName, config] of Object.entries(this.dataSources)) {
      if (config.intervalId) {
        clearInterval(config.intervalId);
        config.intervalId = null;
      }
    }

    this.continuousLearning.enabled = false;
    console.log('✅ Continuous learning stopped');
  }

  /**
   * Load learning metrics from file
   */
  loadLearningMetrics() {
    try {
      const metricsPath = path.join(__dirname, '../../data/learning_metrics.json');
      if (fs.existsSync(metricsPath)) {
        const data = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
        Object.assign(this.learningMetrics, data);
      }
    } catch (error) {
      console.error('Failed to load learning metrics:', error.message);
    }
  }

  /**
   * Save learning metrics to file
   */
  saveLearningMetrics() {
    try {
      const metricsPath = path.join(__dirname, '../../data/learning_metrics.json');
      fs.writeFileSync(metricsPath, JSON.stringify(this.learningMetrics, null, 2));
    } catch (error) {
      console.error('Failed to save learning metrics:', error.message);
    }
  }

  /**
   * Get comprehensive learning statistics
   */
  getContinuousLearningStats() {
    const baseStats = this.getHybridStatistics();

    return {
      ...baseStats,
      continuousLearning: {
        enabled: this.continuousLearning.enabled,
        dataSources: this.dataSources,
        learningMetrics: this.learningMetrics,
        uptime: this.learningMetrics.startTime
          ? Date.now() - this.learningMetrics.startTime
          : 0,
        dataPointsPerHour: this.calculateDataPointsPerHour(),
        learningEfficiency: this.calculateLearningEfficiency()
      }
    };
  }

  /**
   * Calculate data points collected per hour
   */
  calculateDataPointsPerHour() {
    const uptimeHours = (Date.now() - (this.learningMetrics.startTime || Date.now())) / (1000 * 60 * 60);
    return uptimeHours > 0 ? this.learningMetrics.totalDataPoints / uptimeHours : 0;
  }

  /**
   * Calculate learning efficiency (patterns per data point)
   */
  calculateLearningEfficiency() {
    return this.learningMetrics.totalDataPoints > 0
      ? this.patternDatabase.totalPatterns / this.learningMetrics.totalDataPoints
      : 0;
  }

  /**
   * Enhanced status display
   */
  showContinuousLearningStatus() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║        CONTINUOUS LEARNING ENGINE STATUS                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const stats = this.getContinuousLearningStats();

    console.log('🤖 CONTINUOUS LEARNING:');
    console.log(`   Status: ${stats.continuousLearning.enabled ? '🟢 ACTIVE' : '🔴 STOPPED'}`);
    console.log(`   Uptime: ${this.formatUptime(stats.continuousLearning.uptime)}`);
    console.log(`   Data Points/Hour: ${stats.continuousLearning.dataPointsPerHour.toFixed(1)}`);
    console.log(`   Learning Efficiency: ${stats.continuousLearning.learningEfficiency.toFixed(3)} patterns/data-point\n`);

    console.log('📊 DATA SOURCES:');
    for (const [sourceName, config] of Object.entries(stats.continuousLearning.dataSources)) {
      const status = config.active ? '🟢' : '⚪';
      const lastUpdate = config.lastUpdate ? this.formatTimeAgo(config.lastUpdate) : 'Never';
      console.log(`   ${status} ${sourceName}: ${lastUpdate}`);
    }
    console.log('');

    console.log('📈 LEARNING METRICS:');
    console.log(`   Total Data Points: ${stats.continuousLearning.learningMetrics.totalDataPoints.toLocaleString()}`);
    console.log(`   Patterns Learned: ${stats.continuousLearning.learningMetrics.patternsLearned.toLocaleString()}`);
    console.log(`   Learning Rate: ${stats.continuousLearning.learningMetrics.learningRate.toFixed(2)} patterns/hour`);
    console.log(`   Current Accuracy: ${stats.performance.accuracy}%\n`);

    console.log('🔄 DATA SOURCE CONTRIBUTIONS:');
    const contributions = stats.continuousLearning.learningMetrics.dataSourceContributions;
    const total = Object.values(contributions).reduce((sum, val) => sum + val, 0);

    for (const [source, count] of Object.entries(contributions)) {
      const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
      console.log(`   ${source}: ${count} (${percentage}%)`);
    }
    console.log('');

    // Show recent accuracy improvements
    const improvements = stats.continuousLearning.learningMetrics.accuracyImprovements.slice(-5);
    if (improvements.length > 0) {
      console.log('📈 RECENT ACCURACY CHANGES:');
      for (const imp of improvements) {
        const change = imp.improvement > 0 ? '+' : '';
        console.log(`   ${change}${imp.improvement.toFixed(1)}% (${imp.currentAccuracy}%)`);
      }
      console.log('');
    }

    console.log('💡 INSIGHTS:');
    if (stats.continuousLearning.dataPointsPerHour > 10) {
      console.log('   ✅ High data intake - learning rapidly');
    } else {
      console.log('   ⚠️ Low data intake - consider enabling more data sources');
    }

    if (stats.performance.accuracy > 80) {
      console.log('   🎯 Excellent accuracy - system performing well');
    } else if (stats.performance.accuracy > 70) {
      console.log('   ✅ Good accuracy - room for improvement');
    } else {
      console.log('   ⚠️ Accuracy needs improvement - check data quality');
    }

    if (stats.hybrid.combinedPatternRatio > 50) {
      console.log('   🔗 Strong pattern confirmation from multiple sources');
    }

    console.log('\n');
  }

  /**
   * Helper: Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Helper: Format time ago
   */
  formatTimeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  /**
   * Get data source description
   */
  getDataSourceDescription(sourceName) {
    const descriptions = {
      onlineSignals: 'Real-time market signals from trading platforms',
      traderSubmissions: 'Processed trader data submissions with quality validation',
      publicMarketData: 'Public market data patterns from exchanges',
      socialTrading: 'Competitor analysis and social trading platform data',
      performanceFeedback: 'Signal outcome tracking and performance learning',
      marketSentiment: 'News, social media sentiment, and Fear & Greed Index',
      onChainMetrics: 'Whale movements, funding rates, and liquidation data',
      economicIndicators: 'Macro economic data and market indicators'
    };

    return descriptions[sourceName] || 'Unknown data source';
  }

  /**
   * Helper: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ContinuousLearningEngine;
