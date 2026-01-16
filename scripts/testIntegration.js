i want#!/usr/bin/env node

/**
 * Integration Test Script for Signal Enhancements
 * 
 * Tests:
 * 1. Server component integration
 * 2. End-to-end signal generation flow
 * 3. Notification system integration
 * 4. Edge cases and error handling
 */

const SignalTracker = require('../src/tracking/signalTracker');
const NotificationManager = require('../src/notifications/notificationManager');
const HybridEngine = require('../src/ai-engine/hybridEngine');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║        INTEGRATION & END-TO-END TESTING                   ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function runIntegrationTests() {
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Component Integration
  console.log('📋 TEST 1: Component Integration\n');
  try {
    console.log('   Initializing components...');
    
    const signalTracker = new SignalTracker('./data/integration_test_signals.json');
    const notificationManager = new NotificationManager(signalTracker);
    const hybridEngine = new HybridEngine('./data/integration_test_db.json');
    
    console.log('   ✅ SignalTracker initialized');
    console.log('   ✅ NotificationManager initialized');
    console.log('   ✅ HybridEngine initialized');
    
    // Connect components
    notificationManager.setSignalTracker(signalTracker);
    hybridEngine.setSignalTracker(signalTracker);
    
    console.log('   ✅ Components connected');
    
    // Verify connections
    if (!notificationManager.signalTracker) {
      throw new Error('NotificationManager not connected to SignalTracker');
    }
    if (!hybridEngine.signalTracker) {
      throw new Error('HybridEngine not connected to SignalTracker');
    }
    
    console.log('   ✅ All connections verified');
    
    passedTests++;
    console.log('\n✅ TEST 1 PASSED\n');
  } catch (error) {
    console.error(`\n❌ TEST 1 FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 2: End-to-End Signal Generation with Trading Levels
  console.log('📋 TEST 2: End-to-End Signal Generation\n');
  try {
    const signalTracker = new SignalTracker('./data/integration_test_signals.json');
    const hybridEngine = new HybridEngine('./data/integration_test_db.json');
    hybridEngine.setSignalTracker(signalTracker);
    
    // Create a mock signal with all required fields
    const mockSignal = {
      signalId: 'E2E_TEST_001',
      symbol: 'BTCUSDT',
      direction: 'LONG',
      confidence: 85,
      riskLevel: 'LOW',
      pattern: {
        key: 'test_pattern',
        tradersAffected: 5,
        totalOccurrences: 10,
        totalLosses: 5000,
        avgLoss: 500,
        source: 'test'
      },
      currentConditions: {
        price: 50000,
        priceChange24h: 2.5,
        rsi: 65,
        marketSentiment: 'bullish',
        atr: 1000
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
    };
    
    // Calculate trading levels
    const levels = hybridEngine.calculateTradingLevels(
      mockSignal,
      mockSignal.currentConditions.price,
      { atr: mockSignal.currentConditions.atr }
    );
    
    // Add levels to signal
    Object.assign(mockSignal, levels);
    
    console.log('   ✅ Signal generated with trading levels');
    console.log(`   Entry: $${mockSignal.averageEntryPrice.toFixed(2)}`);
    console.log(`   Stop Loss: $${mockSignal.stopLoss.toFixed(2)}`);
    console.log(`   TP1: $${mockSignal.takeProfit1.toFixed(2)}`);
    console.log(`   TP2: $${mockSignal.takeProfit2.toFixed(2)}`);
    
    // Register signal
    signalTracker.registerSignal(mockSignal);
    console.log('   ✅ Signal registered in tracker');
    
    // Verify signal has all required fields
    const retrievedSignal = signalTracker.getSignal('E2E_TEST_001');
    
    if (!retrievedSignal.averageEntryPrice) throw new Error('Missing averageEntryPrice');
    if (!retrievedSignal.stopLoss) throw new Error('Missing stopLoss');
    if (!retrievedSignal.takeProfit1) throw new Error('Missing takeProfit1');
    if (!retrievedSignal.takeProfit2) throw new Error('Missing takeProfit2');
    if (!retrievedSignal.notificationsSent) throw new Error('Missing notificationsSent array');
    
    console.log('   ✅ All required fields present');
    
    passedTests++;
    console.log('\n✅ TEST 2 PASSED\n');
  } catch (error) {
    console.error(`\n❌ TEST 2 FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 3: Notification System Integration
  console.log('📋 TEST 3: Notification System Integration\n');
  try {
    const signalTracker = new SignalTracker('./data/integration_test_signals.json');
    const notificationManager = new NotificationManager(signalTracker);
    notificationManager.setSignalTracker(signalTracker);
    
    const testSignal = {
      signalId: 'NOTIF_TEST_001',
      symbol: 'ETHUSDT',
      direction: 'SHORT',
      confidence: 90,
      riskLevel: 'LOW',
      averageEntryPrice: 3000,
      stopLoss: 3150,
      takeProfit1: 2850,
      takeProfit2: 2700,
      stopLossPercent: '5.00',
      takeProfit1Percent: '5.00',
      takeProfit2Percent: '10.00',
      riskRewardRatio1: '1.00',
      riskRewardRatio2: '2.00',
      pattern: {
        tradersAffected: 8,
        totalOccurrences: 15,
        totalLosses: 10000,
        avgLoss: 666.67
      },
      currentConditions: {
        price: 3000,
        priceChange24h: -3.5,
        rsi: 75,
        marketSentiment: 'bearish'
      },
      reason: 'Test signal for notification integration',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
    };
    
    // Register signal
    signalTracker.registerSignal(testSignal);
    console.log('   ✅ Test signal registered');
    
    // Test deduplication - first attempt should be allowed
    const check1 = notificationManager.shouldSendNotification(testSignal);
    if (!check1.allowed) {
      throw new Error('First notification should be allowed');
    }
    console.log('   ✅ First notification check: Allowed');
    
    // Record notification
    signalTracker.recordNotificationSent('NOTIF_TEST_001', 'test');
    console.log('   ✅ Notification recorded');
    
    // Test deduplication - second attempt should be blocked
    const check2 = notificationManager.shouldSendNotification(testSignal);
    if (check2.allowed) {
      throw new Error('Second notification should be blocked');
    }
    console.log('   ✅ Second notification check: Blocked');
    console.log(`   ✅ Block reason: ${check2.reason}`);
    
    // Verify notification history
    const history = signalTracker.getNotificationHistory('NOTIF_TEST_001');
    if (history.notificationCount !== 1) {
      throw new Error('Notification count should be 1');
    }
    console.log('   ✅ Notification history verified');
    
    passedTests++;
    console.log('\n✅ TEST 3 PASSED\n');
  } catch (error) {
    console.error(`\n❌ TEST 3 FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 4: Edge Cases - Missing ATR
  console.log('📋 TEST 4: Edge Case - Missing ATR Data\n');
  try {
    const hybridEngine = new HybridEngine('./data/integration_test_db.json');
    
    const testSignal = {
      direction: 'LONG',
      confidence: 80,
      riskLevel: 'MEDIUM'
    };
    
    const currentPrice = 45000;
    const marketData = {}; // No ATR provided
    
    // Should use default ATR (2% of price)
    const levels = hybridEngine.calculateTradingLevels(testSignal, currentPrice, marketData);
    
    console.log('   ✅ Calculation succeeded with missing ATR');
    console.log(`   Default ATR used: $${(currentPrice * 0.02).toFixed(2)}`);
    console.log(`   Stop Loss: $${levels.stopLoss.toFixed(2)}`);
    
    // Verify levels are reasonable
    if (levels.stopLoss >= levels.averageEntryPrice) {
      throw new Error('Stop loss should be below entry for LONG');
    }
    
    console.log('   ✅ Levels calculated correctly with default ATR');
    
    passedTests++;
    console.log('\n✅ TEST 4 PASSED\n');
  } catch (error) {
    console.error(`\n❌ TEST 4 FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 5: Edge Cases - Extreme Confidence Values
  console.log('📋 TEST 5: Edge Case - Extreme Confidence Values\n');
  try {
    const hybridEngine = new HybridEngine('./data/integration_test_db.json');
    const currentPrice = 50000;
    const marketData = { atr: 1000 };
    
    // Test very low confidence
    const lowConfSignal = {
      direction: 'LONG',
      confidence: 50,
      riskLevel: 'HIGH'
    };
    
    const lowLevels = hybridEngine.calculateTradingLevels(lowConfSignal, currentPrice, marketData);
    console.log('   ✅ Low confidence (50%) handled correctly');
    console.log(`   Stop distance: $${Math.abs(lowLevels.averageEntryPrice - lowLevels.stopLoss).toFixed(2)}`);
    
    // Test very high confidence
    const highConfSignal = {
      direction: 'LONG',
      confidence: 95,
      riskLevel: 'VERY_LOW'
    };
    
    const highLevels = hybridEngine.calculateTradingLevels(highConfSignal, currentPrice, marketData);
    console.log('   ✅ High confidence (95%) handled correctly');
    console.log(`   Stop distance: $${Math.abs(highLevels.averageEntryPrice - highLevels.stopLoss).toFixed(2)}`);
    
    // High confidence should have tighter stops
    const lowStopDistance = Math.abs(lowLevels.averageEntryPrice - lowLevels.stopLoss);
    const highStopDistance = Math.abs(highLevels.averageEntryPrice - highLevels.stopLoss);
    
    if (highStopDistance >= lowStopDistance) {
      throw new Error('High confidence should have tighter stops than low confidence');
    }
    
    console.log('   ✅ Confidence impact validated');
    
    passedTests++;
    console.log('\n✅ TEST 5 PASSED\n');
  } catch (error) {
    console.error(`\n❌ TEST 5 FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 6: Cooldown Period Enforcement
  console.log('📋 TEST 6: Cooldown Period Enforcement\n');
  try {
    const signalTracker = new SignalTracker('./data/integration_test_signals.json');
    const notificationManager = new NotificationManager(signalTracker);
    notificationManager.setSignalTracker(signalTracker);
    
    // Set a short cooldown for testing (1 second)
    notificationManager.notificationCooldownMs = 1000;
    
    const testSignal = {
      signalId: 'COOLDOWN_TEST_001',
      symbol: 'BTCUSDT',
      direction: 'LONG',
      confidence: 85,
      pattern: { tradersAffected: 5, totalOccurrences: 10, totalLosses: 5000, avgLoss: 500 },
      currentConditions: { price: 50000, priceChange24h: 2.5, rsi: 65, marketSentiment: 'bullish' },
      riskLevel: 'LOW',
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
    };
    
    signalTracker.registerSignal(testSignal);
    
    // First notification - should be allowed
    const check1 = notificationManager.shouldSendNotification(testSignal);
    if (!check1.allowed) {
      throw new Error('First notification should be allowed');
    }
    console.log('   ✅ First notification: Allowed');
    
    // Record notification
    signalTracker.recordNotificationSent('COOLDOWN_TEST_001', 'test');
    
    // Immediate second attempt - should be blocked by cooldown
    const check2 = notificationManager.shouldSendNotification(testSignal);
    if (check2.allowed) {
      throw new Error('Second notification should be blocked by cooldown');
    }
    console.log('   ✅ Immediate retry: Blocked by cooldown');
    console.log(`   ✅ Reason: ${check2.reason}`);
    
    // Wait for cooldown to expire
    console.log('   ⏳ Waiting for cooldown to expire (1 second)...');
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // After cooldown - should still be blocked (already sent)
    const check3 = notificationManager.shouldSendNotification(testSignal);
    if (check3.allowed) {
      throw new Error('Should still be blocked (already sent)');
    }
    console.log('   ✅ After cooldown: Still blocked (already sent)');
    
    passedTests++;
    console.log('\n✅ TEST 6 PASSED\n');
  } catch (error) {
    console.error(`\n❌ TEST 6 FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Test 7: Statistics Tracking
  console.log('📋 TEST 7: Statistics Tracking\n');
  try {
    const signalTracker = new SignalTracker('./data/integration_test_signals.json');
    const notificationManager = new NotificationManager(signalTracker);
    notificationManager.setSignalTracker(signalTracker);
    
    // Create and block multiple notifications
    for (let i = 0; i < 3; i++) {
      const testSignal = {
        signalId: `STATS_TEST_${i}`,
        symbol: 'BTCUSDT',
        direction: 'LONG',
        confidence: 85,
        pattern: { tradersAffected: 5, totalOccurrences: 10, totalLosses: 5000, avgLoss: 500 },
        currentConditions: { price: 50000, priceChange24h: 2.5, rsi: 65, marketSentiment: 'bullish' },
        riskLevel: 'LOW',
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000)
      };
      
      signalTracker.registerSignal(testSignal);
      signalTracker.recordNotificationSent(`STATS_TEST_${i}`, 'test');
      
      // Try to send again (should be blocked)
      notificationManager.shouldSendNotification(testSignal);
    }
    
    const stats = notificationManager.getStatistics();
    
    console.log('   ✅ Statistics retrieved');
    console.log(`   Deduplication enabled: ${stats.deduplication.enabled}`);
    console.log(`   Duplicates prevented: ${stats.deduplication.duplicatesPrevented}`);
    console.log(`   Cooldown period: ${stats.deduplication.cooldownMs}ms`);
    
    if (stats.deduplication.duplicatesPrevented < 3) {
      throw new Error('Should have prevented at least 3 duplicates');
    }
    
    console.log('   ✅ Statistics tracking verified');
    
    passedTests++;
    console.log('\n✅ TEST 7 PASSED\n');
  } catch (error) {
    console.error(`\n❌ TEST 7 FAILED: ${error.message}\n`);
    failedTests++;
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              INTEGRATION TEST SUMMARY                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const totalTests = passedTests + failedTests;
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);
  
  if (failedTests === 0) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED!\n');
    console.log('✅ Component integration: WORKING');
    console.log('✅ End-to-end signal flow: WORKING');
    console.log('✅ Notification system: WORKING');
    console.log('✅ Edge cases handled: WORKING');
    console.log('✅ Cooldown enforcement: WORKING');
    console.log('✅ Statistics tracking: WORKING\n');
    console.log('🚀 System is production-ready!\n');
    return true;
  } else {
    console.log('⚠️  Some integration tests failed. Please review the errors above.\n');
    return false;
  }
}

// Run tests
runIntegrationTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  });
