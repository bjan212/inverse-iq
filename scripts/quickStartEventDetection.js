/**
 * Quick Start - Market Event Detection
 * 
 * Simple script to quickly test the event detection system
 */

const MarketEventDetector = require('../src/ai-engine/marketEventDetector');

async function quickStart() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     MARKET EVENT DETECTION - QUICK START                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const detector = new MarketEventDetector();

  // Test with a few popular symbols
  const symbols = ['BTCUSDT', 'ETHUSDT', 'ARBUSDT'];

  console.log(`🔍 Analyzing ${symbols.length} symbols for market events...\n`);

  for (const symbol of symbols) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Analyzing: ${symbol}`);
    console.log('='.repeat(60));

    try {
      const events = await detector.detectMarketEvents(symbol, 90);

      if (events.detectedEvents.length > 0) {
        console.log(`\n✅ Found ${events.detectedEvents.length} event(s)!\n`);

        events.detectedEvents.forEach((event, index) => {
          console.log(`Event ${index + 1}: ${event.eventType}`);
          console.log(`  📊 Phase: ${event.phase}`);
          console.log(`  🎯 Confidence: ${event.confidence}%`);
          console.log(`  💡 Prediction: ${event.prediction}`);
          console.log(`  📈 Trading Signal:`);
          console.log(`     Direction: ${event.tradingSignal.direction}`);
          console.log(`     Timing: ${event.tradingSignal.timing}`);
          console.log(`     Expected Move: ${event.tradingSignal.expectedMove}`);
          console.log(`     Risk Level: ${event.tradingSignal.riskLevel}`);
          
          if (event.tradingSignal.warning) {
            console.log(`     ${event.tradingSignal.warning}`);
          }
          
          console.log('');
        });
      } else {
        console.log('\n   ℹ️  No significant events detected');
        console.log('   (This is normal - events are rare by nature)\n');
      }

      // Rate limiting
      await sleep(3000);

    } catch (error) {
      console.error(`\n❌ Error: ${error.message}\n`);
    }
  }

  // Show statistics
  const stats = detector.getStatistics();
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    SUMMARY                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Total Events Detected: ${stats.totalDetections}`);
  console.log(`  - Token Unlocks: ${stats.tokenUnlockDetections}`);
  console.log(`  - Exchange Listings: ${stats.listingDetections}`);
  console.log(`  - Team Reveals: ${stats.teamRevealDetections}`);
  console.log(`  - Influencer Campaigns: ${stats.influencerCampaignDetections}`);
  
  console.log('\n💡 Next Steps:\n');
  console.log('1. Review the detected events above');
  console.log('2. Check the confidence scores');
  console.log('3. Consider the trading signals provided');
  console.log('4. Run full test suite: node scripts/testEventDetection.js');
  console.log('5. Integrate with your dashboard and notifications\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run quick start
if (require.main === module) {
  quickStart()
    .then(() => {
      console.log('✅ Quick start complete!\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Quick start failed:', error);
      process.exit(1);
    });
}

module.exports = quickStart;
