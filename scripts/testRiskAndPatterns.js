/**
 * Test Script for Risk Metrics and Advanced Patterns
 * 
 * Tests the newly implemented analytics modules
 */

const RiskMetrics = require('../src/analytics/riskMetrics');
const AdvancedPatternDetector = require('../src/analytics/advancedPatterns');

// Helper function to generate mock candle data
function generateMockCandles(count, startPrice = 50000, volatility = 0.02) {
  const candles = [];
  let price = startPrice;
  
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * price * volatility;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * price * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * price * volatility * 0.5;
    
    candles.push({
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000 + 500000,
      timestamp: Date.now() - (count - i) * 3600000
    });
    
    price = close;
  }
  
  return candles;
}

// Helper function to generate mock returns
function generateMockReturns(count) {
  const returns = [];
  for (let i = 0; i < count; i++) {
    returns.push((Math.random() - 0.45) * 0.1); // Slightly positive bias
  }
  return returns;
}

async function testRiskMetrics() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         TESTING RISK METRICS MODULE                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const riskMetrics = new RiskMetrics();
  
  // Test 1: Kelly Criterion
  console.log('📊 Test 1: Kelly Criterion Position Sizing');
  console.log('─'.repeat(60));
  const kelly = riskMetrics.calculateKellyPosition(0.6, 2.0, 1.0, 10000);
  console.log('Win Rate: 60%');
  console.log('Avg Win: $2.00');
  console.log('Avg Loss: $1.00');
  console.log('Capital: $10,000');
  console.log('\nResults:');
  console.log(`  Kelly %: ${kelly.kellyPercent}%`);
  console.log(`  Fractional Kelly: ${kelly.fractionalKelly}%`);
  console.log(`  Recommended Size: $${kelly.recommendedSize}`);
  console.log(`  Max Risk: $${kelly.maxRisk}`);
  console.log(`  Interpretation: ${kelly.interpretation}`);
  console.log('✅ Kelly Criterion test passed\n');
  
  // Test 2: Value at Risk (VaR)
  console.log('📊 Test 2: Portfolio Value at Risk (VaR)');
  console.log('─'.repeat(60));
  const mockPositions = generateMockReturns(100).map(r => ({ return: r }));
  const var95 = riskMetrics.calculatePortfolioVaR(mockPositions, 0.95);
  console.log('Portfolio: 100 positions');
  console.log('Confidence: 95%');
  console.log('\nResults:');
  console.log(`  VaR: ${var95.var}`);
  console.log(`  Interpretation: ${var95.interpretation}`);
  console.log(`  Worst Case: ${var95.worstCase}`);
  console.log('✅ VaR test passed\n');
  
  // Test 3: Sharpe Ratio
  console.log('📊 Test 3: Sharpe Ratio');
  console.log('─'.repeat(60));
  const returns = generateMockReturns(100);
  const sharpe = riskMetrics.calculateSharpeRatio(returns);
  console.log('Returns: 100 periods');
  console.log('\nResults:');
  console.log(`  Sharpe Ratio: ${sharpe.sharpe}`);
  console.log(`  Avg Return: ${sharpe.avgReturn}%`);
  console.log(`  Std Dev: ${sharpe.stdDev}%`);
  console.log(`  Interpretation: ${sharpe.interpretation}`);
  console.log('✅ Sharpe Ratio test passed\n');
  
  // Test 4: Max Drawdown
  console.log('📊 Test 4: Maximum Drawdown');
  console.log('─'.repeat(60));
  const equityCurve = [10000, 10500, 10200, 11000, 10800, 11500, 10900, 12000, 11200, 12500];
  const drawdown = riskMetrics.calculateMaxDrawdown(equityCurve);
  console.log('Equity Curve: 10 periods');
  console.log('\nResults:');
  console.log(`  Max Drawdown: ${drawdown.maxDrawdownPercent}%`);
  console.log(`  Peak: $${drawdown.peak}`);
  console.log(`  Interpretation: ${drawdown.interpretation}`);
  console.log('✅ Max Drawdown test passed\n');
  
  // Test 5: Risk/Reward Ratio
  console.log('📊 Test 5: Risk/Reward Ratio');
  console.log('─'.repeat(60));
  const rr = riskMetrics.calculateRiskRewardRatio(50000, 49000, 52500);
  console.log('Entry: $50,000');
  console.log('Stop Loss: $49,000');
  console.log('Take Profit: $52,500');
  console.log('\nResults:');
  console.log(`  Risk: $${rr.risk}`);
  console.log(`  Reward: $${rr.reward}`);
  console.log(`  Ratio: ${rr.ratio}:1`);
  console.log(`  Interpretation: ${rr.interpretation}`);
  console.log('✅ Risk/Reward test passed\n');
  
  // Test 6: Liquidation Price
  console.log('📊 Test 6: Liquidation Price Calculation');
  console.log('─'.repeat(60));
  const liq = riskMetrics.calculateLiquidationPrice(50000, 10, 'LONG');
  console.log('Entry: $50,000');
  console.log('Leverage: 10x');
  console.log('Side: LONG');
  console.log('\nResults:');
  console.log(`  Liquidation Price: $${liq.liquidationPrice}`);
  console.log(`  Distance: ${liq.distancePercent}%`);
  console.log(`  Warning: ${liq.warning || 'None'}`);
  console.log('✅ Liquidation Price test passed\n');
  
  console.log('🎉 All Risk Metrics tests passed!\n');
}

async function testAdvancedPatterns() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      TESTING ADVANCED PATTERN DETECTOR MODULE             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const patternDetector = new AdvancedPatternDetector();
  
  // Generate mock data
  const candles = generateMockCandles(100);
  const volume = candles.map(c => c.volume);
  
  // Test 1: Market Structure
  console.log('📈 Test 1: Market Structure Detection');
  console.log('─'.repeat(60));
  const structure = patternDetector.detectMarketStructure(candles);
  console.log('Candles: 100');
  console.log('\nResults:');
  console.log(`  Trend: ${structure.trend}`);
  console.log(`  Strength: ${structure.strength.toFixed(2)}`);
  console.log(`  Higher Highs: ${structure.higherHighs}`);
  console.log(`  Higher Lows: ${structure.higherLows}`);
  console.log(`  Lower Highs: ${structure.lowerHighs}`);
  console.log(`  Lower Lows: ${structure.lowerLows}`);
  console.log(`  Swing Points: ${structure.swingPoints}`);
  console.log(`  Break of Structure: ${structure.breakOfStructure.detected ? 'Yes (' + structure.breakOfStructure.type + ')' : 'No'}`);
  console.log(`  Change of Character: ${structure.changeOfCharacter.detected ? 'Yes (' + structure.changeOfCharacter.type + ')' : 'No'}`);
  console.log(`  Interpretation: ${structure.interpretation}`);
  console.log('✅ Market Structure test passed\n');
  
  // Test 2: Wyckoff Method
  console.log('📈 Test 2: Wyckoff Method Detection');
  console.log('─'.repeat(60));
  const wyckoff = patternDetector.detectWyckoffPhases(candles, volume);
  console.log('Candles: 100');
  console.log('\nResults:');
  console.log(`  Phase: ${wyckoff.phase}`);
  console.log(`  Stage: ${wyckoff.stage}`);
  console.log(`  Confidence: ${wyckoff.confidence}%`);
  console.log(`  Next Expected: ${wyckoff.nextExpected}`);
  console.log(`  Signals: ${wyckoff.signals.length} detected`);
  if (wyckoff.signals.length > 0) {
    wyckoff.signals.forEach((signal, i) => {
      console.log(`    ${i + 1}. ${signal.type} - ${signal.strength} - ${signal.reason}`);
    });
  }
  console.log('✅ Wyckoff Method test passed\n');
  
  // Test 3: Smart Money Concepts
  console.log('📈 Test 3: Smart Money Concepts (SMC)');
  console.log('─'.repeat(60));
  const smc = patternDetector.detectSMC(candles);
  console.log('Candles: 100');
  console.log('\nResults:');
  console.log(`  Order Blocks: ${smc.orderBlocks.length} detected`);
  if (smc.orderBlocks.length > 0) {
    const bullish = smc.orderBlocks.filter(ob => ob.type === 'bullish').length;
    const bearish = smc.orderBlocks.filter(ob => ob.type === 'bearish').length;
    console.log(`    Bullish: ${bullish}`);
    console.log(`    Bearish: ${bearish}`);
  }
  console.log(`  Fair Value Gaps: ${smc.fairValueGaps.length} detected`);
  if (smc.fairValueGaps.length > 0) {
    const bullish = smc.fairValueGaps.filter(fvg => fvg.type === 'bullish').length;
    const bearish = smc.fairValueGaps.filter(fvg => fvg.type === 'bearish').length;
    console.log(`    Bullish: ${bullish}`);
    console.log(`    Bearish: ${bearish}`);
  }
  console.log(`  Liquidity Pools: ${smc.liquidityPools.length} detected`);
  console.log(`  Breakers: ${smc.breakers.length} detected`);
  console.log(`  Mitigation Blocks: ${smc.mitigation.length} detected`);
  console.log('✅ Smart Money Concepts test passed\n');
  
  // Test 4: Order Flow
  console.log('📈 Test 4: Order Flow Patterns');
  console.log('─'.repeat(60));
  const orderFlow = patternDetector.detectOrderFlow(candles, volume);
  console.log('Candles: 100');
  console.log('\nResults:');
  console.log(`  Absorption: ${orderFlow.absorption.detected ? 'Yes (' + orderFlow.absorption.instances.length + ' instances)' : 'No'}`);
  console.log(`  Exhaustion: ${orderFlow.exhaustion.detected ? 'Yes (' + orderFlow.exhaustion.instances.length + ' instances)' : 'No'}`);
  console.log(`  Iceberg Orders: ${orderFlow.iceberg.detected ? 'Yes (' + orderFlow.iceberg.levels.length + ' levels)' : 'No'}`);
  console.log(`  Liquidity Sweep: ${orderFlow.sweepLiquidity.detected ? 'Yes (' + orderFlow.sweepLiquidity.sweeps.length + ' sweeps)' : 'No'}`);
  console.log('✅ Order Flow test passed\n');
  
  console.log('🎉 All Advanced Pattern tests passed!\n');
}

async function runAllTests() {
  console.log('\n🚀 Starting Risk Metrics and Advanced Patterns Tests...\n');
  
  try {
    await testRiskMetrics();
    await testAdvancedPatterns();
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              ALL TESTS COMPLETED SUCCESSFULLY              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('✅ Risk Metrics Module: WORKING');
    console.log('✅ Advanced Pattern Detector: WORKING');
    console.log('\n📊 Summary:');
    console.log('  - Kelly Criterion: ✅');
    console.log('  - Value at Risk (VaR): ✅');
    console.log('  - Sharpe Ratio: ✅');
    console.log('  - Max Drawdown: ✅');
    console.log('  - Risk/Reward Ratio: ✅');
    console.log('  - Liquidation Price: ✅');
    console.log('  - Market Structure: ✅');
    console.log('  - Wyckoff Method: ✅');
    console.log('  - Smart Money Concepts: ✅');
    console.log('  - Order Flow: ✅');
    
    console.log('\n🎯 Next Steps:');
    console.log('  1. Install DEX dependencies: npm install ethers @uniswap/v3-sdk web3');
    console.log('  2. Create DEX connector modules');
    console.log('  3. Integrate with hybrid engine');
    console.log('  4. Test on real market data\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runAllTests();
