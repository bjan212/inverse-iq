#!/usr/bin/env node

/**
 * Test Script: Hybrid Engine Integration
 * 
 * This script demonstrates how to use the HybridEngine
 * to generate trading signals programmatically.
 */

const HybridEngine = require('../src/ai-engine/hybridEngine');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        HYBRID ENGINE INTEGRATION TEST                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Initialize the Hybrid Engine
    console.log('📦 Initializing Hybrid Engine...');
    const engine = new HybridEngine();
    console.log('✅ Engine initialized successfully\n');

    // Check if pattern database exists
    const dbPath = path.join(__dirname, '../data/hybrid_pattern_database.json');
    if (fs.existsSync(dbPath)) {
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
      console.log('📊 Database Status:');
      console.log(`   Total Patterns: ${db.patterns?.length || 0}`);
      console.log(`   Total Traders: ${db.traders?.length || 0}\n`);
    }

    // Generate signals
    console.log('🎯 Generating trading signals...');
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT'];
    const signals = await engine.generateSmartSignals(symbols);

    console.log(`✅ Generated ${signals.length} signals\n`);

    if (signals.length > 0) {
      console.log('📈 Signal Details:');
      console.log('─'.repeat(60));
      signals.forEach((signal, i) => {
        console.log(`\n Signal ${i + 1}:`);
        console.log(`   Symbol: ${signal.symbol}`);
        console.log(`   Direction: ${signal.direction}`);
        console.log(`   Confidence: ${signal.confidence}%`);
        console.log(`   Type: ${signal.type}`);
        console.log(`   Entry: ${signal.entry}`);
        console.log(`   Target: ${signal.target}`);
        console.log(`   Stop: ${signal.stop}`);
      });
      console.log('\n' + '─'.repeat(60));
    } else {
      console.log('ℹ️  No signals generated at this time.');
      console.log('   Market conditions do not match known patterns.\n');
    }

    // Display recommendations
    console.log('\n💡 Recommendations:');
    console.log('   1. Run AI engine in continuous mode: node scripts/runAIEngine.js --mode continuous');
    console.log('   2. Check for signals periodically');
    console.log('   3. Subscribe to notifications to get alerts: POST /api/notifications/subscribe');
    console.log('   4. Monitor performance: GET /api/notifications/stats\n');

    console.log('✅ Test completed successfully!\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('   1. Make sure you ran: node scripts/bootstrapHybridAI.js');
    console.error('   2. Check that data/hybrid_pattern_database.json exists');
    console.error('   3. Ensure Node.js v18+ is installed\n');
    process.exit(1);
  }
}

main();
