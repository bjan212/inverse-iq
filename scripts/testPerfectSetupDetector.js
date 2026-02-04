/**
 * Test Script for Perfect Setup Detector
 * 
 * Tests the perfect setup detection system with various signal scenarios
 */

const PerfectSetupDetector = require('../src/ai-engine/perfectSetupDetector');

// Test signals with different characteristics
const testSignals = [
  {
    name: 'Perfect Setup - All Criteria Met',
    signal: {
      signalId: 'TEST_PERFECT_001',
      symbol: 'BTCUSDT',
      direction: 'LONG',
      confidence: 95,
      riskLevel: 'LOW',
      averageEntryPrice: 50000,
      stopLoss: 49000,
      takeProfit1: 53000,
      takeProfit2: 55000,
      pattern: {
        key: 'LIQUIDATION_CASCADE',
        totalOccurrences: 25,
        winRate: 82,
        avgLoss: 150
      },
      generatedAt: new Date()
    },
    marketData: {
      volume: 15000000,
      avgVolume: 8000000,
      trend: 'bullish',
      nearKeyLevel: true,
      volatility: 'normal',
      spread: 0.05
    }
  },
  {
    name: 'Good Setup - High Confidence but Medium Risk',
    signal: {
      signalId: 'TEST_GOOD_001',
      symbol: 'ETHUSDT',
      direction: 'SHORT',
      confidence: 92,
      riskLevel: 'MEDIUM',
      averageEntryPrice: 3000,
      stopLoss: 3100,
      takeProfit1: 2700,
      takeProfit2: 2500,
      pattern: {
        key: 'STOP_HUNT',
        totalOccurrences: 18,
        winRate: 76,
        avgLoss: 200
      },
      generatedAt: new Date()
    },
    marketData: {
      volume: 5000000,
      avgVolume: 4000000,
      trend: 'bearish',
      nearKeyLevel: true,
      volatility: 'normal',
      spread: 0.08
    }
  },
  {
    name: 'Marginal Setup - Low Confidence',
    signal: {
      signalId: 'TEST_MARGINAL_001',
      symbol: 'BNBUSDT',
      direction: 'LONG',
      confidence: 75,
      riskLevel: 'MEDIUM',
      averageEntryPrice: 500,
      stopLoss: 485,
      takeProfit1: 530,
      takeProfit2: 550,
      pattern: {
        key: 'WHALE_TRAP',
        totalOccurrences: 8,
        winRate: 65,
        avgLoss: 100
      },
      generatedAt: new Date()
    },
    marketData: {
      volume: 2000000,
      avgVolume: 2500000,
      trend: 'sideways',
      nearKeyLevel: false,
      volatility: 'high',
      spread: 0.12
    }
  },
  {
    name: 'Poor Setup - Multiple Failures',
    signal: {
      signalId: 'TEST_POOR_001',
      symbol: 'SOLUSDT',
      direction: 'SHORT',
      confidence: 68,
      riskLevel: 'HIGH',
      averageEntryPrice: 100,
      stopLoss: 105,
      takeProfit1: 95,
      takeProfit2: 90,
      pattern: {
        key: 'WEAK_PATTERN',
        totalOccurrences: 3,
        winRate: 45,
        avgLoss: 300
      },
      generatedAt: new Date()
    },
    marketData: {
      volume: 500000,
      avgVolume: 1000000,
      trend: 'sideways',
      nearKeyLevel: false,
      volatility: 'extreme',
      spread: 0.25
    }
  },
  {
    name: 'Excellent R:R but Low Pattern Quality',
    signal: {
      signalId: 'TEST_MIXED_001',
      symbol: 'ADAUSDT',
      direction: 'LONG',
      confidence: 91,
      riskLevel: 'LOW',
      averageEntryPrice: 0.50,
      stopLoss: 0.48,
      takeProfit1: 0.56,
      takeProfit2: 0.60,
      pattern: {
        key: 'NEW_PATTERN',
        totalOccurrences: 5,
        winRate: 60,
        avgLoss: 50
      },
      generatedAt: new Date()
    },
    marketData: {
      volume: 8000000,
      avgVolume: 5000000,
      trend: 'bullish',
      nearKeyLevel: true,
      volatility: 'normal',
      spread: 0.06
    }
  }
];

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Perfect Setup Detector - Test Suite                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Initialize detector
  const detector = new PerfectSetupDetector({
    minConfidence: 90,
    minRiskReward: 3.0,
    maxRiskLevel: 'MEDIUM',
    minPatternOccurrences: 10,
    minPatternWinRate: 75
  });

  console.log('📋 Test Configuration:');
  console.log(`   Min Confidence: ${detector.criteria.minConfidence}%`);
  console.log(`   Min Risk/Reward: ${detector.criteria.minRiskReward}:1`);
  console.log(`   Max Risk Level: ${detector.criteria.maxRiskLevel}`);
  console.log(`   Min Pattern Occurrences: ${detector.criteria.minPatternOccurrences}`);
  console.log(`   Min Pattern Win Rate: ${detector.criteria.minPatternWinRate}%\n`);

  // Run tests
  const results = [];
  
  for (const test of testSignals) {
    console.log('═'.repeat(60));
    console.log(`\n🧪 Test: ${test.name}\n`);
    
    const result = await detector.isPerfectSetup(test.signal, test.marketData);
    
    results.push({
      name: test.name,
      isPerfect: result.isPerfect,
      score: result.score,
      signal: test.signal
    });
    
    // Display results
    console.log(`\n📊 Results:`);
    console.log(`   Perfect Setup: ${result.isPerfect ? '✅ YES' : '❌ NO'}`);
    console.log(`   Score: ${result.score}/100`);
    console.log(`   Assessment: ${result.reasoning.assessment}\n`);
    
    console.log(`   Detailed Checks:`);
    for (const [key, check] of Object.entries(result.checks)) {
      const icon = check.passed ? '✅' : '❌';
      console.log(`   ${icon} ${key}: ${check.message}`);
    }
    
    console.log(`\n   Reasoning:`);
    result.reasoning.details.forEach(detail => {
      console.log(`   ${detail}`);
    });
    
    console.log('\n');
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('\n📈 Test Summary\n');
  
  const perfectCount = results.filter(r => r.isPerfect).length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  
  console.log(`   Total Tests: ${results.length}`);
  console.log(`   Perfect Setups Found: ${perfectCount}`);
  console.log(`   Perfect Setup Rate: ${((perfectCount / results.length) * 100).toFixed(1)}%`);
  console.log(`   Average Score: ${avgScore.toFixed(1)}/100\n`);
  
  console.log('   Results by Test:');
  results.forEach(r => {
    const status = r.isPerfect ? '✨ PERFECT' : '❌ NOT PERFECT';
    console.log(`   ${status} - ${r.name} (Score: ${r.score}/100)`);
  });
  
  // Detector statistics
  console.log('\n📊 Detector Statistics:\n');
  const stats = detector.getStatistics();
  console.log(`   Total Analyzed: ${stats.totalAnalyzed}`);
  console.log(`   Perfect Setups Found: ${stats.perfectSetupsFound}`);
  console.log(`   Perfect Setup Rate: ${stats.perfectSetupRate}`);
  console.log(`   Average Perfection Score: ${stats.averagePerfectionScore.toFixed(1)}/100`);
  console.log(`   Stored Setups: ${stats.storedSetups}\n`);
  
  // Test recent perfect setups retrieval
  console.log('═'.repeat(60));
  console.log('\n🔍 Testing Perfect Setup Retrieval\n');
  
  const recentSetups = detector.getRecentPerfectSetups({ timeframe: '24h', limit: 10 });
  console.log(`   Found ${recentSetups.length} perfect setup(s) in last 24 hours\n`);
  
  if (recentSetups.length > 0) {
    console.log('   Perfect Setups:');
    recentSetups.forEach((setup, index) => {
      console.log(`   ${index + 1}. ${setup.symbol} ${setup.direction} - Score: ${setup.analysis.score}/100`);
      console.log(`      Confidence: ${setup.confidence}%, Detected: ${new Date(setup.detectedAt).toLocaleString()}`);
    });
  }
  
  console.log('\n═'.repeat(60));
  console.log('\n✅ All tests completed!\n');
  
  // Test criteria update
  console.log('🔧 Testing Criteria Update\n');
  detector.updateCriteria({
    minConfidence: 85,
    minRiskReward: 2.5
  });
  console.log('   Updated criteria:');
  console.log(`   Min Confidence: ${detector.criteria.minConfidence}%`);
  console.log(`   Min Risk/Reward: ${detector.criteria.minRiskReward}:1\n`);
  
  // Re-test with new criteria
  console.log('🔄 Re-testing first signal with updated criteria\n');
  const retestResult = await detector.isPerfectSetup(testSignals[0].signal, testSignals[0].marketData);
  console.log(`   Perfect Setup: ${retestResult.isPerfect ? '✅ YES' : '❌ NO'}`);
  console.log(`   Score: ${retestResult.score}/100\n`);
  
  console.log('═'.repeat(60));
  console.log('\n🎉 Perfect Setup Detector Test Suite Complete!\n');
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
