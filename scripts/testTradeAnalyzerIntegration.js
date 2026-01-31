/**
 * Test Trade Analyzer Integration with Signal Accountability System
 * 
 * This script tests the integration between the Trade Analyzer and
 * the Signal Accountability System, ensuring that performance data
 * from the Signal Performance Tracker is correctly used in trade analysis.
 */

const SignalTracker = require('../src/tracking/signalTracker');
const SignalPerformanceTracker = require('../src/tracking/signalPerformanceTracker');
const TradeAnalyzer = require('../src/analytics/tradeAnalyzer');
const HybridEngine = require('../src/ai-engine/hybridEngine');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Test data file paths
  dataDir: path.join(__dirname, '../data/test_integration'),
  signalsFile: 'integration_signals.json',
  performanceFile: 'integration_performance.json',
  hybridDbFile: 'integration_hybrid_db.json',
  apiKeysFile: 'integration_api_keys.json',
  // Test parameters
  testUserId: 'test_user_' + Date.now(),
  testSymbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'],
  testExchange: 'binance',
  testApiKey: 'test_api_key_' + Date.now(),
  testApiSecret: 'test_api_secret_' + Date.now()
};

// Ensure test directory exists
if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

// Initialize components
const signalTracker = new SignalTracker(path.join(CONFIG.dataDir, CONFIG.signalsFile));
const performanceTracker = new SignalPerformanceTracker(path.join(CONFIG.dataDir, CONFIG.performanceFile));
const hybridEngine = new HybridEngine(path.join(CONFIG.dataDir, CONFIG.hybridDbFile));
const tradeAnalyzer = new TradeAnalyzer({
  dataDir: CONFIG.dataDir,
  apiKeysFile: CONFIG.apiKeysFile
});

// Connect components
hybridEngine.setSignalTracker(signalTracker);

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Generate mock signals
async function generateMockSignals() {
  log('Generating mock signals');
  
  const mockPatterns = [
    { key: 'FALSE_BREAKOUT', source: 'public' },
    { key: 'LIQUIDITY_GRAB', source: 'trader' },
    { key: 'WYCKOFF_SPRING', source: 'combined' }
  ];
  
  const mockDirections = ['LONG', 'SHORT'];
  
  // Clear existing signals
  signalTracker.clearAllSignals();
  
  // Generate signals for each symbol
  for (const symbol of CONFIG.testSymbols) {
    // Generate 2 signals per symbol
    for (let i = 0; i < 2; i++) {
      const direction = mockDirections[Math.floor(Math.random() * mockDirections.length)];
      const pattern = mockPatterns[Math.floor(Math.random() * mockPatterns.length)];
      const confidence = Math.floor(Math.random() * 30) + 70; // 70-99
      
      const signal = {
        signalId: `TEST_${symbol}_${Date.now()}_${i}`,
        symbol,
        direction,
        confidence,
        pattern,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        reason: `Test signal for ${symbol} going ${direction} with ${confidence}% confidence`
      };
      
      // Add trading levels
      const currentPrice = symbol === 'BTCUSDT' ? 50000 : 
                           symbol === 'ETHUSDT' ? 3000 : 
                           symbol === 'BNBUSDT' ? 500 : 100;
      
      signal.averageEntryPrice = currentPrice;
      signal.stopLoss = direction === 'LONG' ? currentPrice * 0.95 : currentPrice * 1.05;
      signal.takeProfit1 = direction === 'LONG' ? currentPrice * 1.05 : currentPrice * 0.95;
      signal.takeProfit2 = direction === 'LONG' ? currentPrice * 1.10 : currentPrice * 0.90;
      signal.riskRewardRatio1 = 1.0;
      signal.riskRewardRatio2 = 2.0;
      signal.stopLossPercent = 5.0;
      signal.takeProfit1Percent = 5.0;
      signal.takeProfit2Percent = 10.0;
      
      // Register signal
      await signalTracker.registerSignal(signal);
      
      log(`Generated signal: ${signal.signalId} (${signal.symbol} ${signal.direction})`);
    }
  }
  
  return signalTracker.getAllSignals();
}

// Track signals and record outcomes
async function trackSignalsAndRecordOutcomes(signals) {
  log('Tracking signals and recording outcomes');
  
  // Start tracking each signal
  for (const signal of signals) {
    const result = await performanceTracker.startTracking(signal, signalTracker);
    
    if (result) {
      log(`Started tracking: ${signal.signalId} (${signal.symbol} ${signal.direction})`);
    } else {
      log(`Failed to start tracking: ${signal.signalId}`);
    }
    
    // Randomly decide outcome (win/loss)
    const outcome = Math.random() > 0.5 ? 'win' : 'loss';
    
    // Calculate exit price based on outcome
    let exitPrice;
    if (outcome === 'win') {
      exitPrice = signal.takeProfit1;
    } else {
      exitPrice = signal.stopLoss;
    }
    
    // Close signal
    await performanceTracker.closeSignal(signal.signalId, outcome, exitPrice, signalTracker);
    
    log(`Recorded ${outcome.toUpperCase()} for: ${signal.signalId}`);
  }
  
  return performanceTracker.getStatistics();
}

// Set up mock exchange API keys
function setupMockExchangeAPI() {
  log('Setting up mock exchange API');
  
  tradeAnalyzer.setApiKeys(CONFIG.testUserId, CONFIG.testExchange, CONFIG.testApiKey, CONFIG.testApiSecret);
  
  log(`Set up API keys for user ${CONFIG.testUserId} and exchange ${CONFIG.testExchange}`);
}

// Mock exchange positions
function mockExchangePositions() {
  log('Mocking exchange positions');
  
  // Override the getOpenPositions method to return mock data
  tradeAnalyzer.getExchangeConnector = (userId, exchange) => {
    return {
      getOpenPositions: async () => {
        // Return mock positions for the test symbols
        return CONFIG.testSymbols.map(symbol => ({
          symbol,
          entryPrice: symbol === 'BTCUSDT' ? 50000 : 
                      symbol === 'ETHUSDT' ? 3000 : 
                      symbol === 'BNBUSDT' ? 500 : 100,
          size: 1,
          direction: Math.random() > 0.5 ? 'long' : 'short',
          leverage: Math.floor(Math.random() * 10) + 1,
          liquidationPrice: 0,
          unrealizedPnl: Math.random() > 0.5 ? 100 : -100,
          marginBalance: 1000
        }));
      },
      
      getAccountInfo: async () => {
        // Return mock account info
        return {
          balance: 10000,
          equity: 10000,
          availableBalance: 9000,
          positions: CONFIG.testSymbols.length
        };
      }
    };
  };
  
  log('Mocked exchange connector');
}

// Test trade analysis with performance data
async function testTradeAnalysis() {
  log('Testing trade analysis with performance data');
  
  // Analyze open trades
  const analysis = await tradeAnalyzer.analyzeOpenTrades(CONFIG.testUserId, {
    performanceTracker
  });
  
  log('Trade analysis completed');
  
  // Verify analysis
  if (!analysis) {
    throw new Error('Analysis is null or undefined');
  }
  
  if (analysis.userId !== CONFIG.testUserId) {
    throw new Error(`Expected user ID ${CONFIG.testUserId}, got ${analysis.userId}`);
  }
  
  if (!analysis.riskAssessment) {
    throw new Error('Risk assessment is missing');
  }
  
  if (!analysis.overallRecommendation) {
    throw new Error('Overall recommendation is missing');
  }
  
  if (!analysis.exchanges || !analysis.exchanges[CONFIG.testExchange]) {
    throw new Error(`Exchange ${CONFIG.testExchange} is missing from analysis`);
  }
  
  log('Analysis verification passed');
  
  // Check if performance data was used
  const performanceStats = performanceTracker.getStatistics();
  
  // Log performance stats and analysis for comparison
  log('\nPerformance Statistics:');
  log(`Total Signals: ${performanceStats.totalSignals}`);
  log(`Win Rate: ${performanceStats.winRate.toFixed(2)}%`);
  
  log('\nAnalysis Results:');
  log(`Risk Score: ${analysis.riskAssessment.riskScore.toFixed(2)}`);
  log(`Recommendation: ${analysis.overallRecommendation}`);
  
  // Check if any symbol-specific recommendations were made
  let symbolRecommendationsFound = false;
  
  for (const exchange in analysis.exchanges) {
    const exchangeData = analysis.exchanges[exchange];
    
    if (exchangeData.positions) {
      for (const position of exchangeData.positions) {
        if (position.recommendation && position.recommendation.includes('win rate')) {
          symbolRecommendationsFound = true;
          log(`Symbol-specific recommendation found: ${position.symbol} - ${position.recommendation}`);
        }
      }
    }
  }
  
  if (!symbolRecommendationsFound) {
    log('Warning: No symbol-specific recommendations based on performance data were found');
  }
  
  return {
    analysis,
    performanceStats,
    symbolRecommendationsFound
  };
}

// Main test function
async function runIntegrationTest() {
  log('Starting Trade Analyzer Integration Test');
  
  try {
    // Step 1: Generate mock signals
    const signals = await generateMockSignals();
    
    if (signals.length === 0) {
      throw new Error('No signals were generated');
    }
    
    log(`Generated ${signals.length} signals`);
    
    // Step 2: Track signals and record outcomes
    const stats = await trackSignalsAndRecordOutcomes(signals);
    
    log(`Tracked ${stats.totalSignals} signals with ${stats.winRate.toFixed(2)}% win rate`);
    
    // Step 3: Set up mock exchange API
    setupMockExchangeAPI();
    
    // Step 4: Mock exchange positions
    mockExchangePositions();
    
    // Step 5: Test trade analysis with performance data
    const result = await testTradeAnalysis();
    
    log('\n--- Integration Test Results ---');
    log(`Signals Generated: ${signals.length}`);
    log(`Performance Stats: ${stats.totalSignals} signals, ${stats.winRate.toFixed(2)}% win rate`);
    log(`Analysis Risk Score: ${result.analysis.riskAssessment.riskScore.toFixed(2)}`);
    log(`Symbol-Specific Recommendations: ${result.symbolRecommendationsFound ? 'Found' : 'Not Found'}`);
    
    const success = signals.length > 0 && 
                   stats.totalSignals > 0 && 
                   result.analysis.riskAssessment.riskScore >= 0;
    
    log(`\nIntegration Test: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      success,
      signalsGenerated: signals.length,
      performanceStats: stats,
      analysis: result.analysis,
      symbolRecommendationsFound: result.symbolRecommendationsFound
    };
  } catch (error) {
    log(`❌ Integration test failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the integration test
runIntegrationTest().catch(error => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});
