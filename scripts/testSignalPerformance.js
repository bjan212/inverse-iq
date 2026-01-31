/**
 * Test Signal Performance Tracking System
 * 
 * This script tests the signal performance tracking system by:
 * 1. Creating mock signals
 * 2. Tracking their performance
 * 3. Simulating price movements
 * 4. Recording outcomes
 * 5. Verifying statistics
 */

const SignalTracker = require('../src/tracking/signalTracker');
const SignalPerformanceTracker = require('../src/tracking/signalPerformanceTracker');
const HybridEngine = require('../src/ai-engine/hybridEngine');

// Create test instances with unique file names to avoid accumulation from previous runs
const testTimestamp = Date.now();
const signalTracker = new SignalTracker(`./data/test_signals_${testTimestamp}.json`);
const performanceTracker = new SignalPerformanceTracker(`./data/test_performance_${testTimestamp}.json`);
const hybridEngine = new HybridEngine(`./data/test_hybrid_db_${testTimestamp}.json`);

// Connect components
hybridEngine.setSignalTracker(signalTracker);

// Mock data
const mockSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
const mockDirections = ['LONG', 'SHORT'];
const mockPatterns = [
  { key: 'FALSE_BREAKOUT', source: 'public' },
  { key: 'LIQUIDITY_GRAB', source: 'trader' },
  { key: 'WYCKOFF_SPRING', source: 'combined' },
  { key: 'ORDERBLOCK_RETEST', source: 'trader' },
  { key: 'SUPPLY_DEMAND_ZONE', source: 'public' }
];

// Test functions
async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         SIGNAL PERFORMANCE TRACKING SYSTEM TEST           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  try {
    await testSignalGeneration();
    await testPerformanceTracking();
    await testPriceMovements();
    await testOutcomeRecording();
    await testStatisticsGeneration();
    await testVerification();
    
    console.log('\n✅ All tests completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Test 1: Signal Generation
async function testSignalGeneration() {
  console.log('📊 TEST 1: Signal Generation\n');
  
  // Generate 10 mock signals
  for (let i = 0; i < 10; i++) {
    const symbol = mockSymbols[Math.floor(Math.random() * mockSymbols.length)];
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
    
    const levels = hybridEngine.calculateTradingLevels(
      signal,
      currentPrice,
      { atr: currentPrice * 0.02 } // 2% ATR
    );
    
    // Add levels to signal
    signal.averageEntryPrice = levels.averageEntryPrice;
    signal.stopLoss = levels.stopLoss;
    signal.takeProfit1 = levels.takeProfit1;
    signal.takeProfit2 = levels.takeProfit2;
    signal.riskRewardRatio1 = levels.riskRewardRatio1;
    signal.riskRewardRatio2 = levels.riskRewardRatio2;
    signal.stopLossPercent = levels.stopLossPercent;
    signal.takeProfit1Percent = levels.takeProfit1Percent;
    signal.takeProfit2Percent = levels.takeProfit2Percent;
    
    // Register signal
    await signalTracker.registerSignal(signal);
    
    console.log(`   ✅ Generated signal: ${signal.signalId} (${signal.symbol} ${signal.direction})`);
  }
  
  // Verify signals were created
  const signals = signalTracker.getAllSignals();
  console.log(`\n   Total signals created: ${signals.length}`);
  
  if (signals.length !== 10) {
    throw new Error('Expected 10 signals, but got ' + signals.length);
  }
  
  console.log('   ✅ Signal generation test passed\n');
}

// Test 2: Performance Tracking
async function testPerformanceTracking() {
  console.log('📊 TEST 2: Performance Tracking\n');
  
  // Get all signals
  const signals = signalTracker.getAllSignals();
  
  // Start tracking each signal
  for (const signal of signals) {
    const result = await performanceTracker.startTracking(signal, signalTracker);
    
    if (result) {
      console.log(`   ✅ Started tracking: ${signal.signalId}`);
    } else {
      throw new Error(`Failed to start tracking signal: ${signal.signalId}`);
    }
  }
  
  // Verify signals are being tracked
  const trackedSignals = Object.keys(performanceTracker.performance.signals);
  console.log(`\n   Total signals tracked: ${trackedSignals.length}`);
  
  if (trackedSignals.length !== 10) {
    throw new Error(`Expected 10 tracked signals, but got ${trackedSignals.length}`);
  }
  
  console.log('   ✅ Performance tracking test passed\n');
}

// Test 3: Price Movements
async function testPriceMovements() {
  console.log('📊 TEST 3: Price Movements\n');
  
  // Get all tracked signals
  const trackedSignals = Object.keys(performanceTracker.performance.signals);
  
  // Update each signal with price movements
  for (const signalId of trackedSignals) {
    // Simulate price movement
    await performanceTracker.updateSignalPerformance(signalId, signalTracker);
    
    console.log(`   ✅ Updated price for: ${signalId}`);
  }
  
  // Verify price history is being recorded
  const firstSignalId = trackedSignals[0];
  const priceHistory = performanceTracker.performance.signals[firstSignalId].priceHistory;
  
  console.log(`\n   Price history points for first signal: ${priceHistory.length}`);
  
  if (priceHistory.length < 1) {
    throw new Error('Expected at least 1 price history point, but got ' + priceHistory.length);
  }
  
  console.log('   ✅ Price movement test passed\n');
}

// Test 4: Outcome Recording
async function testOutcomeRecording() {
  console.log('📊 TEST 4: Outcome Recording\n');
  
  // Get all tracked signals
  const trackedSignals = Object.keys(performanceTracker.performance.signals);
  
  // Close half as wins, half as losses
  const halfIndex = Math.floor(trackedSignals.length / 2);
  
  for (let i = 0; i < trackedSignals.length; i++) {
    const signalId = trackedSignals[i];
    const signal = performanceTracker.performance.signals[signalId];
    
    // Determine outcome (first half win, second half loss)
    const outcome = i < halfIndex ? 'win' : 'loss';
    
    // Calculate exit price based on outcome
    let exitPrice;
    if (outcome === 'win') {
      // Win - exit at take profit 1
      exitPrice = signal.takeProfit1;
    } else {
      // Loss - exit at stop loss
      exitPrice = signal.stopLoss;
    }
    
    // Close signal
    await performanceTracker.closeSignal(signalId, outcome, exitPrice, signalTracker);
    
    console.log(`   ✅ Recorded ${outcome.toUpperCase()} for: ${signalId}`);
  }
  
  // Verify outcomes were recorded
  const closedSignals = Object.values(performanceTracker.performance.signals).filter(s => s.status === 'closed');
  
  console.log(`\n   Total closed signals: ${closedSignals.length}`);
  console.log(`   Wins: ${closedSignals.filter(s => s.outcome === 'win').length}`);
  console.log(`   Losses: ${closedSignals.filter(s => s.outcome === 'loss').length}`);
  
  if (closedSignals.length !== trackedSignals.length) {
    throw new Error(`Expected ${trackedSignals.length} closed signals, but got ${closedSignals.length}`);
  }
  
  console.log('   ✅ Outcome recording test passed\n');
}

// Test 5: Statistics Generation
async function testStatisticsGeneration() {
  console.log('📊 TEST 5: Statistics Generation\n');
  
  // Get statistics
  const stats = performanceTracker.getStatistics();
  
  console.log('   Overall Statistics:');
  console.log(`   - Total Signals: ${stats.totalSignals}`);
  console.log(`   - Win Rate: ${stats.winRate}%`);
  console.log(`   - Avg PnL: $${stats.avgPnl}`);
  
  // Verify statistics
  if (stats.totalSignals !== 10) {
    throw new Error(`Expected 10 total signals in stats, but got ${stats.totalSignals}`);
  }
  
  if (stats.winCount !== 5) {
    throw new Error(`Expected 5 wins in stats, but got ${stats.winCount}`);
  }
  
  if (stats.lossCount !== 5) {
    throw new Error(`Expected 5 losses in stats, but got ${stats.lossCount}`);
  }
  
  // Get pattern statistics
  const patternStats = Object.values(performanceTracker.performance.patterns);
  
  console.log('\n   Pattern Statistics:');
  for (const pattern of patternStats) {
    console.log(`   - ${pattern.key}: ${pattern.winRate}% win rate (${pattern.totalSignals} signals)`);
  }
  
  // Get symbol statistics
  const symbolStats = Object.values(performanceTracker.performance.symbols);
  
  console.log('\n   Symbol Statistics:');
  for (const symbol of symbolStats) {
    console.log(`   - ${symbol.symbol}: ${symbol.winRate}% win rate (${symbol.totalSignals} signals)`);
  }
  
  console.log('   ✅ Statistics generation test passed\n');
}

// Test 6: Verification
async function testVerification() {
  console.log('📊 TEST 6: Verification\n');
  
  // Get a verification ID from a signal
  const signals = Object.values(performanceTracker.performance.signals);
  const verificationId = signals[0].publicVerificationId;
  
  console.log(`   Testing verification ID: ${verificationId}`);
  
  // Get verification data
  const verificationData = performanceTracker.getVerificationData(verificationId);
  
  if (!verificationData) {
    throw new Error(`Verification data not found for ID: ${verificationId}`);
  }
  
  console.log('   Verification data:');
  console.log(`   - Symbol: ${verificationData.symbol}`);
  console.log(`   - Direction: ${verificationData.direction}`);
  console.log(`   - Outcome: ${verificationData.outcome}`);
  console.log(`   - PnL: $${verificationData.finalPnl}`);
  
  console.log('   ✅ Verification test passed\n');
}

// Run all tests
runTests();
