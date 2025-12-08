#!/usr/bin/env node

/**
 * AI Engine Integration Script
 * 
 * This script:
 * 1. Loads collected trading data from database/files
 * 2. Feeds it to the Inverse Signal AI Engine
 * 3. Processes loss patterns across all traders
 * 4. Monitors live market conditions
 * 5. Generates inverse entry signals in real-time
 * 
 * Usage:
 *   node runAIEngine.js --mode process    # Process collected data
 *   node runAIEngine.js --mode monitor    # Monitor live market
 *   node runAIEngine.js --mode continuous # Run continuously
 */

const InverseSignalEngine = require('../src/ai-engine/inverseSignalEngine');
const SelfImprovingEngine = require('../src/ai-engine/selfImprovingEngine');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = { mode: 'continuous' }; // Default mode
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    params[key] = value;
  }
  
  return params;
}

// Load collected trading data
function loadCollectedData() {
  console.log('📂 Loading collected trading data...\n');

  // Load from submissions directory (new automated submissions)
  const submissionsDir = path.join(__dirname, '../output/submissions');

  if (fs.existsSync(submissionsDir)) {
    const submissionFiles = fs.readdirSync(submissionsDir).filter(f => f.endsWith('.json'));

    if (submissionFiles.length > 0) {
      console.log(`Found ${submissionFiles.length} submission files in submissions directory\n`);

      const allTrades = [];

      for (const file of submissionFiles) {
        const filepath = path.join(submissionsDir, file);
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

        if (data.trades && Array.isArray(data.trades)) {
          allTrades.push(...data.trades.map(trade => ({
            ...trade,
            submission_id: data.submissionId
          })));
        }
      }

      console.log(`✅ Loaded ${allTrades.length} trades from ${submissionFiles.length} submissions\n`);
      return allTrades;
    }
  }

  // Fallback to old validation results
  const outputDir = path.join(__dirname, '../output');

  if (!fs.existsSync(outputDir)) {
    console.log('⚠️  No collected data found. Run data collection first!\n');
    return [];
  }

  const files = fs.readdirSync(outputDir).filter(f => f.startsWith('validation_'));

  if (files.length === 0) {
    console.log('⚠️  No validation results found.\n');
    return [];
  }

  console.log(`Found ${files.length} validation result files\n`);

  // Load and combine all data
  const allTrades = [];

  for (const file of files) {
    const filepath = path.join(outputDir, file);
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    // Extract trades from validation result
    // In production, this would be actual trade data collected after payment

    // For demo, create sample trades based on validation data
    if (data.validation && data.validation.passed) {
      const sampleTrades = generateSampleTrades(data);
      allTrades.push(...sampleTrades);
    }
  }

  console.log(`✅ Loaded ${allTrades.length} trades from ${files.length} traders\n`);

  return allTrades;
}

// Generate sample trades for demo (in production, use real collected data)
function generateSampleTrades(validationData) {
  const trades = [];
  const symbols = validationData.validation.data.history.symbols || ['BTCUSDT', 'ETHUSDT'];
  const tradeCount = validationData.validation.data.history.totalTrades || 100;
  const traderId = `trader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate sample trades (mix of wins and losses)
  for (let i = 0; i < Math.min(tradeCount, 200); i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const side = Math.random() > 0.5 ? 'LONG' : 'SHORT';
    const isWin = Math.random() > 0.4; // 60% win rate
    
    trades.push({
      submission_id: traderId,
      symbol,
      side,
      pnl: isWin ? Math.random() * 500 + 50 : -(Math.random() * 800 + 100),
      time: Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000, // Last 90 days
      entryTime: Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000
    });
  }
  
  return trades;
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           INVERSE SIGNAL AI ENGINE - INTEGRATION          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const params = parseArgs();
  const mode = params.mode;
  
  console.log(`Mode: ${mode.toUpperCase()}\n`);
  console.log('═'.repeat(60));
  
  // Initialize AI Engine
  const engine = new SelfImprovingEngine();
  
  if (mode === 'process' || mode === 'continuous') {
    // STEP 1: Load collected data
    const collectedData = loadCollectedData();
    
    if (collectedData.length === 0) {
      console.log('\n❌ No data to process. Exiting.\n');
      process.exit(1);
    }
    
    // STEP 2: Process data through AI engine
    console.log('═'.repeat(60));
    const processResult = await engine.processCollectedData(collectedData);
    
    // STEP 3: Aggregate loss patterns
    console.log('\n═'.repeat(60));
    const aggregated = engine.aggregateLossPatterns();
    
    console.log('\n📊 TOP LOSS PATTERNS:\n');
    
    for (let i = 0; i < Math.min(5, aggregated.length); i++) {
      const pattern = aggregated[i];
      console.log(`${i + 1}. ${pattern.symbol} - ${pattern.originalDirection} → INVERSE: ${pattern.inverseDirection}`);
      console.log(`   Traders affected: ${pattern.traderCount}`);
      console.log(`   Total occurrences: ${pattern.occurrences}`);
      console.log(`   Total losses: $${pattern.totalLoss.toFixed(2)}`);
      console.log(`   Confidence: ${pattern.confidence}%`);
      console.log(`   Reason: ${pattern.reason.substring(0, 150)}...`);
      console.log('');
    }
  }
  
  if (mode === 'monitor' || mode === 'continuous') {
    // STEP 4: Monitor live market
    console.log('═'.repeat(60));
    console.log('\n🎯 GENERATING LIVE SIGNALS...\n');
    
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    const signals = await engine.monitorLiveMarket(symbols);
    
    if (signals.length === 0) {
      console.log('✅ No signals at this time. Market conditions do not match known loss patterns.\n');
    } else {
      console.log(`\n🚨 ACTIVE SIGNALS: ${signals.length}\n`);
      console.log('═'.repeat(60));
      
      for (const signal of signals) {
        console.log(`\n📍 SIGNAL: ${signal.symbol} - ${signal.direction}`);
        console.log(`   Confidence: ${signal.confidence}%`);
        console.log(`   Risk Level: ${signal.riskLevel}`);
        console.log(`   Generated: ${signal.generatedAt.toLocaleString()}`);
        console.log(`   Expires: ${signal.expiresAt.toLocaleString()}`);
        console.log(`\n   📊 Pattern Details:`);
        console.log(`      Traders affected: ${signal.pattern.tradersAffected}`);
        console.log(`      Total occurrences: ${signal.pattern.totalOccurrences}`);
        console.log(`      Total losses: $${signal.pattern.totalLosses.toFixed(2)}`);
        console.log(`      Original direction: ${signal.pattern.originalDirection}`);
        console.log(`\n   💡 Reason:`);
        console.log(`      ${signal.reason}`);
        console.log(`\n   📈 Current Market:`);
        console.log(`      Price: $${signal.currentConditions.price.toFixed(2)}`);
        console.log(`      24h Change: ${signal.currentConditions.priceChange24h.toFixed(2)}%`);
        console.log(`      RSI: ${signal.currentConditions.rsi}`);
        console.log(`      Sentiment: ${signal.currentConditions.marketSentiment}`);
        console.log(`      Fear & Greed: ${signal.currentConditions.fearGreedIndex}`);
        console.log(`      Funding Rate: ${(signal.currentConditions.fundingRate * 100).toFixed(4)}%`);
        console.log('\n' + '═'.repeat(60));
      }
      
      // Save signals to file
      const signalsDir = path.join(__dirname, '../signals');
      if (!fs.existsSync(signalsDir)) {
        fs.mkdirSync(signalsDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `signals_${timestamp}.json`;
      const filepath = path.join(signalsDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(signals, null, 2));
      
      console.log(`\n💾 Signals saved to: ${filepath}\n`);
    }
  }
  
  if (mode === 'continuous') {
    console.log('\n🔄 CONTINUOUS MODE: Monitoring market and new submissions every 5 minutes...\n');
    console.log('Press Ctrl+C to stop\n');

    // Run every 5 minutes
    setInterval(async () => {
      console.log(`\n[${new Date().toLocaleString()}] Checking for new submissions and market conditions...\n`);

      // Check for new submissions and process them
      const newData = loadCollectedData();
      if (newData.length > 0) {
        console.log(`📥 Processing ${newData.length} new trades...\n`);
        await engine.processCollectedData(newData);
        console.log('✅ New data processed into AI engine\n');
      }

      // Generate signals
      const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
      const signals = await engine.generateSmartSignals(symbols);

      if (signals.length > 0) {
        console.log(`🚨 ${signals.length} NEW SIGNAL(S) DETECTED!\n`);

        for (const signal of signals) {
          console.log(`   ${signal.symbol} ${signal.direction} (Confidence: ${signal.confidence}%)`);
          console.log(`   Pattern: ${signal.pattern.tradersAffected} traders, ${signal.pattern.totalOccurrences} occurrences`);
        }

        // Save signals
        const signalsDir = path.join(__dirname, '../signals');
        if (!fs.existsSync(signalsDir)) {
          fs.mkdirSync(signalsDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `signals_${timestamp}.json`;
        const filepath = path.join(signalsDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(signals, null, 2));
        console.log(`   Saved to: ${filename}\n`);
      } else {
        console.log('   No signals at this time.\n');
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Keep process alive
    process.stdin.resume();
  }
  
  // Display statistics
  console.log('\n═'.repeat(60));
  console.log('📊 AI ENGINE STATISTICS:\n');
  
  const stats = engine.getStatistics();
  console.log(`   Total traders processed: ${stats.totalTraders}`);
  console.log(`   Total loss patterns: ${stats.totalLossPatterns}`);
  console.log(`   Active signals: ${stats.activeSignals}`);
  console.log('');
  
  if (mode !== 'continuous') {
    console.log('✅ AI Engine run complete!\n');
    process.exit(0);
  }
}

// Run main function
main().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
});

