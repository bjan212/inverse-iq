#!/usr/bin/env node

/**
 * Example: Using HybridEngine to Generate Signals
 * 
 * This demonstrates the exact code pattern from IMPLEMENTATION_SUMMARY.md
 */

const HybridEngine = require('../src/ai-engine/hybridEngine');

async function main() {
  try {
    console.log('🚀 Initializing Hybrid Engine...\n');
    
    // Initialize engine
    const engine = new HybridEngine();
    
    console.log('📊 Generating signals for BTCUSDT and ETHUSDT...\n');
    
    // Generate signals
    const signals = await engine.generateSmartSignals(['BTCUSDT', 'ETHUSDT']);
    
    // Display results - this is the code from the docs!
    console.log('📈 Trading Signals:\n');
    for (const signal of signals) {
      console.log(`${signal.symbol}: ${signal.direction} (${signal.confidence}%)`);
    }
    
    if (signals.length === 0) {
      console.log('(No signals at this time - market conditions don\'t match patterns yet)\n');
    }
    
    console.log('\n✅ Complete!\n');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
