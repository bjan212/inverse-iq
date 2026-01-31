/**
 * Test Auto Track Random Pairs
 * 
 * This script tests the auto-tracking functionality for randomly selected pairs.
 * It simulates the behavior of the autoTrackRandomPairs.js script but in a controlled
 * test environment with mock signals.
 */

const SignalTracker = require('../src/tracking/signalTracker');
const SignalPerformanceTracker = require('../src/tracking/signalPerformanceTracker');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // List of available trading pairs
  availablePairs: [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'
  ],
  // Number of pairs to track
  pairsToTrack: 2,
  // Number of mock signals to generate per pair
  signalsPerPair: 3,
  // Test data file paths
  dataDir: path.join(__dirname, '../data/test'),
  signalsFile: 'test_signals.json',
  performanceFile: 'test_performance.json'
};

// Ensure test directory exists
if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

// Initialize trackers with test files
const signalTracker = new SignalTracker(path.join(CONFIG.dataDir, CONFIG.signalsFile));
const performanceTracker = new SignalPerformanceTracker(path.join(CONFIG.dataDir, CONFIG.performanceFile));

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Select random pairs
function selectRandomPairs() {
  const shuffled = [...CONFIG.availablePairs].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, CONFIG.pairsToTrack);
}

// Generate mock signals for testing
async function generateMockSignals(pairs) {
  log(`Generating mock signals for pairs: ${pairs.join(', ')}`);
  
  const mockPatterns = [
    { key: 'FALSE_BREAKOUT', source: 'public' },
    { key: 'LIQUIDITY_GRAB', source: 'trader' },
    { key: 'WYCKOFF_SPRING', source: 'combined' }
  ];
  
  const mockDirections = ['LONG', 'SHORT'];
  
  // Clear existing signals
  signalTracker.clearAllSignals();
  
  // Generate signals for each pair
  for (const pair of pairs) {
    for (let i = 0; i < CONFIG.signalsPerPair; i++) {
      const direction = mockDirections[Math.floor(Math.random() * mockDirections.length)];
      const pattern = mockPatterns[Math.floor(Math.random() * mockPatterns.length)];
      const confidence = Math.floor(Math.random() * 30) + 70; // 70-99
      
      const signal = {
        signalId: `TEST_${pair}_${Date.now()}_${i}`,
        symbol: pair,
        direction,
        confidence,
        pattern,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
        reason: `Test signal for ${pair} going ${direction} with ${confidence}% confidence`
      };
      
      // Add trading levels
      const currentPrice = pair === 'BTCUSDT' ? 50000 : 
                           pair === 'ETHUSDT' ? 3000 : 
                           pair === 'BNBUSDT' ? 500 : 100;
      
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

// Track signals for the selected pairs
async function trackSignals(pairs) {
  log(`Tracking signals for pairs: ${pairs.join(', ')}`);
  
  // Get all signals
  const allSignals = signalTracker.getAllSignals();
  
  // Filter signals for the selected pairs
  const pairSignals = allSignals.filter(signal => pairs.includes(signal.symbol));
  
  log(`Found ${pairSignals.length} signals for selected pairs`);
  
  // Start tracking each signal
  for (const signal of pairSignals) {
    const result = await performanceTracker.startTracking(signal, signalTracker);
    
    if (result) {
      log(`Started tracking: ${signal.signalId} (${signal.symbol} ${signal.direction})`);
    } else {
      log(`Failed to start tracking: ${signal.signalId}`);
    }
  }
  
  return pairSignals;
}

// Simulate price movements and outcomes
async function simulateOutcomes() {
  log('Simulating price movements and outcomes');
  
  // Get all tracked signals
  const trackedSignals = Object.keys(performanceTracker.performance.signals || {});
  
  log(`Simulating outcomes for ${trackedSignals.length} signals`);
  
  // Update each signal with a random outcome
  for (const signalId of trackedSignals) {
    const signal = performanceTracker.performance.signals[signalId];
    
    // Skip already closed signals
    if (signal.status === 'closed') {
      continue;
    }
    
    // Update price
    await performanceTracker.updateSignalPerformance(signalId, signalTracker);
    
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
    await performanceTracker.closeSignal(signalId, outcome, exitPrice, signalTracker);
    
    log(`Recorded ${outcome.toUpperCase()} for: ${signalId}`);
  }
}

// Get and log statistics
function getStatistics() {
  const stats = performanceTracker.getStatistics();
  
  log('\n--- Performance Statistics ---');
  log(`Total Signals: ${stats.totalSignals}`);
  log(`Win Rate: ${stats.winRate.toFixed(2)}%`);
  log(`Average PnL: $${stats.avgPnl.toFixed(2)}`);
  
  // Symbol statistics
  log('\nSymbol Statistics:');
  for (const symbol of CONFIG.availablePairs) {
    const symbolStats = performanceTracker.getStatistics({ symbol });
    
    if (symbolStats.totalSignals > 0) {
      log(`- ${symbol}: ${symbolStats.winRate.toFixed(2)}% win rate (${symbolStats.totalSignals} signals)`);
    }
  }
  
  return stats;
}

// Main test function
async function runTest() {
  log('Starting Auto Track Random Pairs Test');
  
  try {
    // Step 1: Select random pairs
    const selectedPairs = selectRandomPairs();
    log(`Selected pairs: ${selectedPairs.join(', ')}`);
    
    // Step 2: Generate mock signals
    const signals = await generateMockSignals(selectedPairs);
    log(`Generated ${signals.length} mock signals`);
    
    // Step 3: Track signals for selected pairs
    const trackedSignals = await trackSignals(selectedPairs);
    log(`Tracked ${trackedSignals.length} signals`);
    
    // Step 4: Simulate price movements and outcomes
    await simulateOutcomes();
    
    // Step 5: Get statistics
    const stats = getStatistics();
    
    // Step 6: Verify verification system
    const verificationIds = Object.values(performanceTracker.performance.signals || {})
      .map(signal => signal.publicVerificationId)
      .filter(Boolean);
    
    if (verificationIds.length > 0) {
      const verificationId = verificationIds[0];
      log(`\nTesting verification with ID: ${verificationId}`);
      
      const verificationData = performanceTracker.getVerificationData(verificationId);
      
      if (verificationData) {
        log('✅ Verification system working correctly');
        log(`Verified signal: ${verificationData.symbol} ${verificationData.direction}`);
      } else {
        log('❌ Verification system failed');
      }
    }
    
    log('\n✅ Auto Track Random Pairs Test completed successfully');
    
    return {
      success: true,
      selectedPairs,
      signalCount: signals.length,
      trackedCount: trackedSignals.length,
      stats
    };
  } catch (error) {
    log(`❌ Test failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
runTest().then(result => {
  log(`Test ${result.success ? 'passed' : 'failed'}`);
  
  if (!result.success) {
    process.exit(1);
  }
});
