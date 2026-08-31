#!/usr/bin/env node

/**
 * Trading Data Collection Script
 * 
 * Usage:
 *   node collect.js --platform binance --api-key YOUR_KEY --api-secret YOUR_SECRET
 *   node collect.js --platform bybit --api-key YOUR_KEY --api-secret YOUR_SECRET
 * 
 * This script validates a trader's account and collects their trading data
 */

const BinanceCollector = require('../src/collectors/binanceCollector');
const BybitCollector = require('../src/collectors/bybitCollector');
const OKXCollector = require('../src/collectors/okxCollector');
const MEXCCollector = require('../src/collectors/mexcCollector');
const DexscreenerCollector = require('../src/collectors/dexscreenerCollector');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    params[key] = value;
  }
  
  return params;
}

// Main function
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     TRADING DATA COLLECTION & VALIDATION SERVICE          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const params = parseArgs();
  
  // Validate required parameters
  if (!params.platform) {
    console.error('❌ Missing required parameter: --platform\n');
    console.log('Usage:');
    console.log('  node collect.js --platform <platform> [options]\n');
    console.log('Supported platforms:');
    console.log('  - binance (Binance Futures) - requires --api-key and --api-secret');
    console.log('  - bybit (Bybit Futures) - requires --api-key and --api-secret');
    console.log('  - okx (OKX Futures) - requires --api-key, --api-secret, and --passphrase');
    console.log('  - mexc (MEXC Futures) - requires --api-key and --api-secret');
    console.log('  - dexscreener (DEX data, no authentication required)\n');
    console.log('Examples:');
    console.log('  node collect.js --platform binance --api-key abc123 --api-secret xyz789');
    console.log('  node collect.js --platform dexscreener --query USDC');
    console.log('  node collect.js --platform dexscreener --tokens 0x... --chain ethereum\n');
    process.exit(1);
  }
  
  const platform = params.platform.toLowerCase();
  
  // For non-DEX platforms, require API credentials
  if (platform !== 'dexscreener' && (!params['api-key'] || !params['api-secret'])) {
    console.error('❌ Missing required parameters: --api-key and --api-secret\n');
    console.log(`Usage for ${platform}:`);
    console.log(`  node collect.js --platform ${platform} --api-key <key> --api-secret <secret>\n`);
    process.exit(1);
  }
  
  const apiKey = params['api-key'];
  const apiSecret = params['api-secret'];
  
  console.log(`Platform: ${platform.toUpperCase()}`);
  if (apiKey) {
    console.log(`API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  }
  console.log('');
  
  // Create collector based on platform
  let collector;
  
  switch (platform) {
    case 'binance':
      collector = new BinanceCollector(apiKey, apiSecret);
      break;
    
    case 'bybit':
      collector = new BybitCollector(apiKey, apiSecret);
      break;
    
    case 'okx':
      const passphrase = params.passphrase;
      if (!passphrase) {
        console.error('❌ OKX requires --passphrase parameter!');
        console.log('\nUsage for OKX:');
        console.log('  node collect.js --platform okx --api-key <key> --api-secret <secret> --passphrase <passphrase>\n');
        process.exit(1);
      }
      collector = new OKXCollector(apiKey, apiSecret, passphrase);
      break;
    
    case 'mexc':
      collector = new MEXCCollector(apiKey, apiSecret);
      break;
    
    case 'dexscreener':
      collector = new DexscreenerCollector();
      console.log('📊 Using Dexscreener (public DEX data, no authentication needed)\n');
      
      // For dexscreener, run a different workflow
      try {
        if (params.query) {
          console.log(`🔍 Searching for: ${params.query}\n`);
          const result = await collector.searchPairs(params.query);
          console.log(`\n✅ Search complete! Found ${result.pairs?.length || 0} pairs\n`);
          
          // Save result
          const outputPath = path.join('./output', `dex_search_${Date.now()}.json`);
          fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
          console.log(`💾 Results saved to: ${outputPath}\n`);
          
        } else if (params.tokens) {
          const tokens = params.tokens.split(',');
          const chain = params.chain || null;
          
          console.log(`📊 Fetching data for ${tokens.length} token(s)...\n`);
          const result = await collector.getComprehensiveData(tokens, chain);
          console.log(`\n✅ Collection complete!\n`);
          
          // Save result
          const outputPath = path.join('./output', `dex_data_${Date.now()}.json`);
          fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
          console.log(`💾 Results saved to: ${outputPath}\n`);
          
        } else {
          console.log('📊 Fetching trending DEX data...\n');
          const result = await collector.getComprehensiveData([], null);
          console.log(`\n✅ Collection complete!\n`);
          
          // Save result
          const outputPath = path.join('./output', `dex_trending_${Date.now()}.json`);
          fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
          console.log(`💾 Results saved to: ${outputPath}\n`);
        }
        
        process.exit(0);
      } catch (error) {
        console.error('❌ DEX data collection failed:', error.message);
        process.exit(1);
      }
      break;
    
    default:
      console.error(`❌ Unsupported platform: ${platform}`);
      console.log('\nSupported platforms: binance, bybit, okx, mexc');
      process.exit(1);
  }
  
  // Run validation
  console.log('Starting validation process...\n');
  console.log('═'.repeat(60));
  
  const startTime = Date.now();
  const result = await collector.validate();
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('═'.repeat(60));
  console.log(`\nValidation completed in ${duration}s\n`);
  
  // Display results
  if (result.passed) {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ VALIDATION PASSED!                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    // Calculate quality grade
    const grade = calculateGrade(result.data);
    const payment = calculatePayment(grade, result.data);
    
    console.log('📊 DATA QUALITY REPORT:\n');
    console.log(`   Grade: ${grade.grade}`);
    console.log(`   Score: ${grade.score}/100`);
    console.log(`   Payment: $${payment.toFixed(2)}\n`);
    
    console.log('📈 STATISTICS:\n');
    console.log(`   Capital:`);
    console.log(`     Peak: $${result.data.capital.peakCapital.toFixed(2)}`);
    console.log(`     Current: $${result.data.capital.currentCapital.toFixed(2)}\n`);
    
    console.log(`   Trading History:`);
    console.log(`     Total Trades: ${result.data.history.totalTrades}`);
    if (result.data.history.totalPositions) {
      console.log(`     Total Positions: ${result.data.history.totalPositions}`);
    }
    console.log(`     Symbols: ${result.data.history.symbolCount} (${result.data.history.symbols.slice(0, 5).join(', ')}${result.data.history.symbols.length > 5 ? '...' : ''})`);
    console.log(`     Time Span: ${result.data.history.spanDays} days`);
    console.log(`     Max Gap: ${result.data.history.maxGap} days`);
    console.log(`     Win Rate: ${result.data.history.winRate}%`);
    if (result.data.history.profitFactor) {
      console.log(`     Profit Factor: ${result.data.history.profitFactor}`);
    }
    console.log('');
    
    // Save results to file
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `validation_${platform}_${timestamp}.json`;
    const filepath = path.join(outputDir, filename);
    
    const output = {
      platform,
      timestamp: new Date().toISOString(),
      validation: result,
      grade: grade,
      payment: payment
    };
    
    fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
    
    console.log(`💾 Results saved to: ${filepath}\n`);
    
    console.log('═'.repeat(60));
    console.log('NEXT STEPS:');
    console.log('═'.repeat(60));
    console.log(`1. Review the validation results above`);
    console.log(`2. Payment required: $${payment.toFixed(2)}`);
    console.log(`3. After payment, we will collect your trading data`);
    console.log(`4. Your data will be anonymized and used for AI training`);
    console.log(`5. You will receive a confirmation email\n`);
    
    console.log('📧 Contact: support@quantumfutures.ai');
    console.log('💳 Payment methods: USDT (TRC20), Credit Card\n');
    
  } else {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                  ❌ VALIDATION FAILED                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('❌ REJECTION REASONS:\n');
    
    if (!result.checks.connection) {
      console.log('   • API connection failed');
      console.log('     → Check your API key and secret');
      console.log('     → Ensure API has read permissions\n');
    }
    
    if (!result.checks.capital) {
      console.log('   • Capital requirement not met');
      console.log(`     → Peak capital: $${result.data.capital?.peakCapital?.toFixed(2) || 0}`);
      console.log('     → Minimum required: $500\n');
    }
    
    if (!result.checks.tradeCount) {
      console.log('   • Insufficient trading history');
      console.log(`     → Total trades: ${result.data.history?.totalTrades || 0}`);
      console.log('     → Minimum required: 20 trades\n');
    }
    
    if (!result.checks.maxGap) {
      console.log('   • Trading gaps too large');
      console.log(`     → Max gap: ${result.data.history?.maxGap || 0} days`);
      console.log('     → Maximum allowed: 30 days\n');
    }
    
    if (!result.checks.symbolCount) {
      console.log('   • Insufficient symbol diversity');
      console.log(`     → Symbols traded: ${result.data.history?.symbolCount || 0}`);
      console.log('     → Minimum required: 3 symbols\n');
    }
    
    console.log('═'.repeat(60));
    console.log('SUGGESTIONS:');
    console.log('═'.repeat(60));
    console.log('• Continue trading to build more history');
    console.log('• Trade multiple symbols for diversity');
    console.log('• Maintain consistent trading activity');
    console.log('• Resubmit when requirements are met\n');
    
    console.log('📧 Questions? Contact: support@quantumfutures.ai\n');
  }
  
  process.exit(result.passed ? 0 : 1);
}

/**
 * Calculate quality grade
 */
function calculateGrade(data) {
  const capital = data.capital;
  const history = data.history;
  
  let score = 0;
  
  // Capital score (0-25 points)
  if (capital.peakCapital >= 50000) score += 25;
  else if (capital.peakCapital >= 20000) score += 20;
  else if (capital.peakCapital >= 10000) score += 15;
  else if (capital.peakCapital >= 5000) score += 10;
  else score += 5;
  
  // Trade count score (0-25 points)
  const tradeCount = history.totalPositions || history.totalTrades;
  if (tradeCount >= 1000) score += 25;
  else if (tradeCount >= 500) score += 20;
  else if (tradeCount >= 300) score += 15;
  else if (tradeCount >= 100) score += 10;
  else score += 5;
  
  // Symbol diversity score (0-15 points)
  if (history.symbolCount >= 10) score += 15;
  else if (history.symbolCount >= 7) score += 12;
  else if (history.symbolCount >= 5) score += 9;
  else if (history.symbolCount >= 3) score += 6;
  else score += 3;
  
  // Consistency score (0-15 points)
  if (history.maxGap <= 7) score += 15;
  else if (history.maxGap <= 14) score += 12;
  else if (history.maxGap <= 21) score += 9;
  else if (history.maxGap <= 30) score += 6;
  else score += 3;
  
  // Win rate score (0-10 points)
  const winRate = parseFloat(history.winRate);
  if (winRate >= 70) score += 10;
  else if (winRate >= 60) score += 8;
  else if (winRate >= 50) score += 6;
  else if (winRate >= 40) score += 4;
  else score += 2;
  
  // Profit factor score (0-10 points)
  if (history.profitFactor) {
    const pf = parseFloat(history.profitFactor);
    if (pf >= 3.0) score += 10;
    else if (pf >= 2.0) score += 8;
    else if (pf >= 1.5) score += 6;
    else if (pf >= 1.0) score += 4;
    else score += 2;
  } else {
    score += 5; // Default for platforms without profit factor
  }
  
  // Determine grade
  let grade;
  if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else grade = 'D';
  
  return { grade, score };
}

/**
 * Calculate payment amount
 */
function calculatePayment(grade, data) {
  const basePayment = {
    'A': 200,
    'B': 150,
    'C': 100,
    'D': 0
  }[grade.grade];
  
  let multiplier = 1.0;
  
  const history = data.history;
  
  // Bonus for high win rate
  if (parseFloat(history.winRate) >= 60) multiplier += 0.2;
  
  // Bonus for high profit factor
  if (history.profitFactor && parseFloat(history.profitFactor) >= 2.0) {
    multiplier += 0.2;
  }
  
  // Bonus for long history
  if (history.spanDays >= 365) multiplier += 0.3;
  
  return Math.round(basePayment * multiplier);
}

// Run main function
main().catch(error => {
  console.error('\n❌ FATAL ERROR:', error.message);
  console.error('\nStack trace:', error.stack);
  process.exit(1);
});

