/**
 * Test Script for Enhanced Payout Validator
 * 
 * Tests various trader scenarios to ensure accurate payout calculations
 */

const EnhancedPayoutValidator = require('../src/validators/enhancedPayoutValidator');

// Test data scenarios
const testScenarios = [
    {
        name: 'Elite Trader - High Accuracy, High Volume, Large Capital',
        description: '92% win rate, 1200 trades, $55k peak capital',
        tradeData: generateTradeData({
            tradeCount: 1200,
            winRate: 0.92,
            peakCapital: 55000,
            tradingDays: 300,
            tradingSpan: 365,
            symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT']
        }),
        expectedPayout: { min: 400, max: 500 }
    },
    {
        name: 'Master Trader - Very High Accuracy, Medium Volume',
        description: '87% win rate, 600 trades, $25k peak capital',
        tradeData: generateTradeData({
            tradeCount: 600,
            winRate: 0.87,
            peakCapital: 25000,
            tradingDays: 200,
            tradingSpan: 270,
            symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT']
        }),
        expectedPayout: { min: 200, max: 300 }
    },
    {
        name: 'Expert Trader - High Accuracy, Good Volume',
        description: '82% win rate, 450 trades, $15k peak capital',
        tradeData: generateTradeData({
            tradeCount: 450,
            winRate: 0.82,
            peakCapital: 15000,
            tradingDays: 150,
            tradingSpan: 200,
            symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']
        }),
        expectedPayout: { min: 150, max: 200 }
    },
    {
        name: 'Advanced Trader - Good Accuracy, Medium Volume',
        description: '77% win rate, 350 trades, $8k peak capital',
        tradeData: generateTradeData({
            tradeCount: 350,
            winRate: 0.77,
            peakCapital: 8000,
            tradingDays: 120,
            tradingSpan: 180,
            symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
        }),
        expectedPayout: { min: 100, max: 150 }
    },
    {
        name: 'Standard Trader - Decent Accuracy, Low Volume',
        description: '72% win rate, 150 trades, $3k peak capital',
        tradeData: generateTradeData({
            tradeCount: 150,
            winRate: 0.72,
            peakCapital: 3000,
            tradingDays: 80,
            tradingSpan: 120,
            symbols: ['BTCUSDT', 'ETHUSDT']
        }),
        expectedPayout: { min: 50, max: 80 }
    },
    {
        name: 'Basic Trader - Low Accuracy, Minimum Requirements',
        description: '65% win rate, 50 trades, $800 peak capital',
        tradeData: generateTradeData({
            tradeCount: 50,
            winRate: 0.65,
            peakCapital: 800,
            tradingDays: 40,
            tradingSpan: 90,
            symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
        }),
        expectedPayout: { min: 20, max: 40 }
    },
    {
        name: 'Failed Validation - Insufficient Trades',
        description: 'Only 15 trades (minimum is 20)',
        tradeData: generateTradeData({
            tradeCount: 15,
            winRate: 0.80,
            peakCapital: 5000,
            tradingDays: 30,
            tradingSpan: 60,
            symbols: ['BTCUSDT', 'ETHUSDT']
        }),
        expectedPayout: { min: 0, max: 0 },
        shouldFail: true
    },
    {
        name: 'Failed Validation - Insufficient Capital',
        description: '$300 peak capital (minimum is $500)',
        tradeData: generateTradeData({
            tradeCount: 100,
            winRate: 0.75,
            peakCapital: 300,
            tradingDays: 60,
            tradingSpan: 90,
            symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
        }),
        expectedPayout: { min: 0, max: 0 },
        shouldFail: true
    }
];

/**
 * Generate realistic trade data for testing
 */
function generateTradeData(params) {
    const {
        tradeCount,
        winRate,
        peakCapital,
        tradingDays,
        tradingSpan,
        symbols
    } = params;
    
    const trades = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - tradingSpan);
    
    let currentBalance = peakCapital * 0.5; // Start at 50% of peak
    let peakReached = false;
    
    // Generate trades distributed across trading days
    const tradesPerDay = Math.ceil(tradeCount / tradingDays);
    let tradeIndex = 0;
    
    for (let day = 0; day < tradingSpan && tradeIndex < tradeCount; day++) {
        // Skip some days to simulate realistic trading patterns
        if (Math.random() > (tradingDays / tradingSpan)) continue;
        
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + day);
        
        // Generate trades for this day
        const todayTrades = Math.min(
            Math.floor(Math.random() * tradesPerDay) + 1,
            tradeCount - tradeIndex
        );
        
        for (let i = 0; i < todayTrades && tradeIndex < tradeCount; i++) {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const isWin = Math.random() < winRate;
            
            // Generate entry trade
            const entryPrice = 30000 + Math.random() * 10000;
            const quantity = (Math.random() * 0.1 + 0.01).toFixed(3);
            const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
            
            const entryTime = new Date(dayDate);
            entryTime.setHours(Math.floor(Math.random() * 24));
            entryTime.setMinutes(Math.floor(Math.random() * 60));
            
            trades.push({
                symbol,
                side,
                price: entryPrice.toFixed(2),
                qty: quantity,
                time: entryTime.toISOString(),
                orderId: `${tradeIndex * 2 + 1}`,
                tradeId: `${tradeIndex * 2 + 1}`
            });
            
            // Generate exit trade
            const exitTime = new Date(entryTime);
            exitTime.setMinutes(exitTime.getMinutes() + Math.floor(Math.random() * 120) + 10);
            
            const priceChange = isWin 
                ? (Math.random() * 0.03 + 0.01) // 1-4% profit
                : -(Math.random() * 0.02 + 0.005); // 0.5-2.5% loss
            
            const exitPrice = side === 'BUY'
                ? entryPrice * (1 + priceChange)
                : entryPrice * (1 - priceChange);
            
            const pnl = side === 'BUY'
                ? (exitPrice - entryPrice) * parseFloat(quantity)
                : (entryPrice - exitPrice) * parseFloat(quantity);
            
            currentBalance += pnl;
            
            // Track peak capital
            if (currentBalance > peakCapital * 0.9 && !peakReached) {
                currentBalance = peakCapital;
                peakReached = true;
            }
            
            trades.push({
                symbol,
                side: side === 'BUY' ? 'SELL' : 'BUY',
                price: exitPrice.toFixed(2),
                qty: quantity,
                time: exitTime.toISOString(),
                orderId: `${tradeIndex * 2 + 2}`,
                tradeId: `${tradeIndex * 2 + 2}`,
                realizedPnl: parseFloat(pnl.toFixed(2)),
                balance: parseFloat(currentBalance.toFixed(2))
            });
            
            tradeIndex++;
        }
    }
    
    return {
        submissionId: `TEST_${Date.now()}`,
        exchange: 'binance',
        trades: trades.slice(0, tradeCount * 2) // Ensure we don't exceed count
    };
}

/**
 * Run all test scenarios
 */
async function runTests() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         ENHANCED PAYOUT VALIDATOR TEST SUITE              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const validator = new EnhancedPayoutValidator();
    const results = [];
    
    for (let i = 0; i < testScenarios.length; i++) {
        const scenario = testScenarios[i];
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`TEST ${i + 1}/${testScenarios.length}: ${scenario.name}`);
        console.log(`Description: ${scenario.description}`);
        console.log(`${'='.repeat(60)}\n`);
        
        try {
            const result = await validator.validateAndScore(scenario.tradeData);
            
            const passed = scenario.shouldFail 
                ? !result.passed
                : result.passed && 
                  result.payment >= scenario.expectedPayout.min &&
                  result.payment <= scenario.expectedPayout.max;
            
            results.push({
                scenario: scenario.name,
                passed,
                expected: scenario.shouldFail ? 'FAIL' : `$${scenario.expectedPayout.min}-$${scenario.expectedPayout.max}`,
                actual: result.passed ? `$${result.payment}` : 'FAILED',
                details: result
            });
            
            if (passed) {
                console.log(`✅ TEST PASSED`);
            } else {
                console.log(`❌ TEST FAILED`);
                console.log(`   Expected: ${scenario.shouldFail ? 'FAIL' : `$${scenario.expectedPayout.min}-$${scenario.expectedPayout.max}`}`);
                console.log(`   Actual: ${result.passed ? `$${result.payment}` : 'FAILED'}`);
            }
            
            if (result.passed && result.paymentBreakdown) {
                console.log(`\n📊 Payment Breakdown:`);
                console.log(`   Base Payment: $${result.paymentBreakdown.basePayment}`);
                console.log(`   Quality Tier: ${result.paymentBreakdown.qualityTier}`);
                if (result.paymentBreakdown.accuracy) {
                    console.log(`   Win Rate: ${result.paymentBreakdown.accuracy.toFixed(1)}%`);
                    console.log(`   Accuracy Tier: ${result.paymentBreakdown.accuracyTier}`);
                    console.log(`   Multiplier: ${result.paymentBreakdown.accuracyMultiplier}x`);
                }
                if (result.paymentBreakdown.volumeBonus) {
                    console.log(`   Volume Bonus: +$${result.paymentBreakdown.volumeBonus}`);
                }
                if (result.paymentBreakdown.capitalBonus) {
                    console.log(`   Capital Bonus: +$${result.paymentBreakdown.capitalBonus}`);
                }
                if (result.paymentBreakdown.consistencyBonus) {
                    console.log(`   Consistency Bonus: +$${result.paymentBreakdown.consistencyBonus}`);
                }
            }
            
        } catch (error) {
            console.log(`❌ TEST ERROR: ${error.message}`);
            results.push({
                scenario: scenario.name,
                passed: false,
                expected: scenario.shouldFail ? 'FAIL' : `$${scenario.expectedPayout.min}-$${scenario.expectedPayout.max}`,
                actual: `ERROR: ${error.message}`,
                details: null
            });
        }
    }
    
    // Print summary
    console.log(`\n\n${'='.repeat(60)}`);
    console.log('TEST SUMMARY');
    console.log(`${'='.repeat(60)}\n`);
    
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);
    
    // Detailed results
    console.log('Detailed Results:');
    console.log('-'.repeat(60));
    results.forEach((result, index) => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${index + 1}. ${result.scenario}`);
        console.log(`   Expected: ${result.expected}`);
        console.log(`   Actual: ${result.actual}`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! Enhanced payout system is working correctly.');
    } else {
        console.log('⚠️  SOME TESTS FAILED. Please review the results above.');
    }
    
    console.log('='.repeat(60) + '\n');
    
    return results;
}

// Run tests if executed directly
if (require.main === module) {
    runTests()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Test suite error:', error);
            process.exit(1);
        });
}

module.exports = { runTests, generateTradeData };
