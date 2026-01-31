/**
 * Test Signal Integration
 * 
 * This script tests the integration between the Signal Accountability System
 * and the existing signal generation system. It verifies that signals generated
 * by the AI engine are properly tracked and monitored by the accountability system.
 */

const SignalTracker = require('../src/tracking/signalTracker');
const SignalPerformanceTracker = require('../src/tracking/signalPerformanceTracker');
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
  // Test parameters
  testSymbols: ['BTCUSDT', 'ETHUSDT'],
  testDuration: 10000, // 10 seconds
  checkInterval: 1000, // 1 second
};

// Ensure test directory exists
if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

// Initialize components
const signalTracker = new SignalTracker(path.join(CONFIG.dataDir, CONFIG.signalsFile));
const performanceTracker = new SignalPerformanceTracker(path.join(CONFIG.dataDir, CONFIG.performanceFile));
const hybridEngine = new HybridEngine(path.join(CONFIG.dataDir, CONFIG.hybridDbFile));

// Connect components
hybridEngine.setSignalTracker(signalTracker);

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Generate signals using the hybrid engine
async function generateSignals() {
  log('Generating signals using the hybrid engine');
  
  for (const symbol of CONFIG.testSymbols) {
    try {
      // Generate a signal for the symbol
      const result = await hybridEngine.generateSignal(symbol);
      
      if (result && result.signalId) {
        log(`✅ Generated signal: ${result.signalId} (${result.symbol} ${result.direction})`);
      } else {
        log(`❌ Failed to generate signal for ${symbol}`);
      }
    } catch (error) {
      log(`❌ Error generating signal for ${symbol}: ${error.message}`);
    }
  }
  
  // Get all signals
  const signals = signalTracker.getAllSignals();
  log(`Total signals generated: ${signals.length}`);
  
  return signals;
}

// Track signals using the performance tracker
async function trackSignals(signals) {
  log('Tracking signals using the performance tracker');
  
  for (const signal of signals) {
    try {
      // Start tracking the signal
      const result = await performanceTracker.startTracking(signal, signalTracker);
      
      if (result) {
        log(`✅ Started tracking: ${signal.signalId} (${signal.symbol} ${signal.direction})`);
      } else {
        log(`❌ Failed to start tracking: ${signal.signalId}`);
      }
    } catch (error) {
      log(`❌ Error tracking signal ${signal.signalId}: ${error.message}`);
    }
  }
  
  // Get all tracked signals
  const trackedSignals = Object.keys(performanceTracker.performance.signals || {});
  log(`Total signals tracked: ${trackedSignals.length}`);
  
  return trackedSignals;
}

// Simulate price updates
async function simulatePriceUpdates(trackedSignals) {
  log('Simulating price updates');
  
  // Update prices for each signal
  for (const signalId of trackedSignals) {
    try {
      await performanceTracker.updateSignalPerformance(signalId, signalTracker);
      log(`✅ Updated price for: ${signalId}`);
    } catch (error) {
      log(`❌ Error updating price for ${signalId}: ${error.message}`);
    }
  }
}

// Simulate signal outcomes
async function simulateOutcomes(trackedSignals) {
  log('Simulating signal outcomes');
  
  for (const signalId of trackedSignals) {
    try {
      const signal = performanceTracker.performance.signals[signalId];
      
      // Skip already closed signals
      if (signal.status === 'closed') {
        continue;
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
      await performanceTracker.closeSignal(signalId, outcome, exitPrice, signalTracker);
      
      log(`✅ Recorded ${outcome.toUpperCase()} for: ${signalId}`);
    } catch (error) {
      log(`❌ Error recording outcome for ${signalId}: ${error.message}`);
    }
  }
}

// Get and log statistics
function getStatistics() {
  const stats = performanceTracker.getStatistics();
  
  log('\n--- Performance Statistics ---');
  log(`Total Signals: ${stats.totalSignals}`);
  log(`Win Rate: ${stats.winRate.toFixed(2)}%`);
  log(`Average PnL: $${stats.avgPnl.toFixed(2)}`);
  
  return stats;
}

// Test verification system
function testVerification() {
  log('\nTesting verification system');
  
  // Get verification IDs
  const verificationIds = Object.values(performanceTracker.performance.signals || {})
    .map(signal => signal.publicVerificationId)
    .filter(Boolean);
  
  if (verificationIds.length === 0) {
    log('❌ No verification IDs found');
    return false;
  }
  
  // Test verification with the first ID
  const verificationId = verificationIds[0];
  log(`Testing verification with ID: ${verificationId}`);
  
  const verificationData = performanceTracker.getVerificationData(verificationId);
  
  if (!verificationData) {
    log('❌ Verification failed');
    return false;
  }
  
  log('✅ Verification successful');
  log(`Verified signal: ${verificationData.symbol} ${verificationData.direction}`);
  
  return true;
}

// Main test function
async function runIntegrationTest() {
  log('Starting Signal Integration Test');
  
  try {
    // Step 1: Generate signals
    const signals = await generateSignals();
    
    if (signals.length === 0) {
      throw new Error('No signals were generated');
    }
    
    // Step 2: Track signals
    const trackedSignals = await trackSignals(signals);
    
    if (trackedSignals.length === 0) {
      throw new Error('No signals were tracked');
    }
    
    // Step 3: Simulate price updates
    await simulatePriceUpdates(trackedSignals);
    
    // Step 4: Simulate outcomes
    await simulateOutcomes(trackedSignals);
    
    // Step 5: Get statistics
    const stats = getStatistics();
    
    // Step 6: Test verification
    const verificationSuccess = testVerification();
    
    log('\n--- Integration Test Results ---');
    log(`Signals Generated: ${signals.length}`);
    log(`Signals Tracked: ${trackedSignals.length}`);
    log(`Win Rate: ${stats.winRate.toFixed(2)}%`);
    log(`Verification System: ${verificationSuccess ? 'Working' : 'Failed'}`);
    
    const success = signals.length > 0 && 
                   trackedSignals.length > 0 && 
                   verificationSuccess;
    
    log(`\nIntegration Test: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    
    return {
      success,
      signalsGenerated: signals.length,
      signalsTracked: trackedSignals.length,
      stats,
      verificationSuccess
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
runIntegrationTest().then(result => {
  log(`Test ${result.success ? 'passed' : 'failed'}`);
  
  if (!result.success) {
    process.exit(1);
  }
});
