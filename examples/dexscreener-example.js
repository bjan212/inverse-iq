#!/usr/bin/env node

/**
 * Dexscreener Integration Example
 * 
 * This example demonstrates how to use the Dexscreener API integration
 * to collect DEX market data and enhance the AI trading system.
 * 
 * Usage:
 *   node examples/dexscreener-example.js
 */

const DexscreenerCollector = require('../src/collectors/dexscreenerCollector');
const HybridEngine = require('../src/ai-engine/hybridEngine');

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        DEXSCREENER API INTEGRATION EXAMPLE                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Initialize collector
  const collector = new DexscreenerCollector();
  
  console.log('Step 1: Test Connection');
  console.log('═'.repeat(60));
  
  // Note: This will fail in sandboxed environments due to firewall
  // but works in production with internet access
  try {
    const connected = await collector.testConnection();
    console.log('✅ Connection successful!\n');
  } catch (error) {
    console.log('⚠️  Connection failed (expected in sandboxed env):', error.message);
    console.log('   This example shows structure - actual API calls work in production\n');
  }
  
  // Example 1: Search for pairs
  console.log('Step 2: Example - Search for Trading Pairs');
  console.log('═'.repeat(60));
  console.log('Command: collector.searchPairs("USDC")');
  console.log('Expected output:');
  console.log('  - List of DEX pairs containing USDC');
  console.log('  - Price, liquidity, and volume data');
  console.log('  - Multi-chain results (Ethereum, BSC, Polygon, etc.)\n');
  
  // Example 2: Get token pairs
  console.log('Step 3: Example - Get Specific Token Data');
  console.log('═'.repeat(60));
  console.log('Command: collector.getTokenPairs(["0x..."])');
  console.log('Expected output:');
  console.log('  - Detailed pair information');
  console.log('  - Liquidity metrics for risk assessment');
  console.log('  - Recent price changes\n');
  
  // Example 3: Get trending tokens
  console.log('Step 4: Example - Get Trending Tokens');
  console.log('═'.repeat(60));
  console.log('Command: collector.getLatestBoostedTokens()');
  console.log('Expected output:');
  console.log('  - List of promoted/trending tokens');
  console.log('  - High interest indicators');
  console.log('  - Potential market sentiment data\n');
  
  // Example 4: Pattern analysis with mock data
  console.log('Step 5: Pattern Analysis (using mock data)');
  console.log('═'.repeat(60));
  
  const mockPairs = [
    {
      baseToken: { symbol: 'PEPE' },
      chainId: 'ethereum',
      volume: { h24: 500000 },
      liquidity: { usd: 25000 }, // Low liquidity - risky
      priceChange: { h24: 120 }  // Extreme move
    },
    {
      baseToken: { symbol: 'SHIB' },
      chainId: 'ethereum',
      volume: { h24: 2000000 },
      liquidity: { usd: 500000 },
      priceChange: { h24: 15 }
    },
    {
      baseToken: { symbol: 'BONK' },
      chainId: 'solana',
      volume: { h24: 150000 },
      liquidity: { usd: 30000 }, // Low liquidity
      priceChange: { h24: -75 }  // Extreme drop
    }
  ];
  
  const analysis = collector.analyzeDEXPatterns(mockPairs);
  
  console.log('Analysis Results:');
  console.log(`  Total pairs: ${analysis.stats.totalPairs}`);
  console.log(`  High volume pairs: ${analysis.stats.highVolumePairs}`);
  console.log(`  Low liquidity pairs: ${analysis.stats.lowLiquidityPairs}`);
  console.log(`  Patterns detected: ${analysis.patterns.length}`);
  
  if (analysis.patterns.length > 0) {
    console.log('\n  Detected Patterns:');
    analysis.patterns.forEach((pattern, i) => {
      console.log(`    ${i + 1}. ${pattern.type}`);
      console.log(`       Symbol: ${pattern.symbol}`);
      console.log(`       Chain: ${pattern.chainId}`);
      console.log(`       Confidence: ${(pattern.confidence * 100).toFixed(0)}%`);
      if (pattern.liquidity) {
        console.log(`       Liquidity: $${pattern.liquidity.toLocaleString()}`);
      }
      if (pattern.priceChange) {
        console.log(`       Price Change: ${pattern.priceChange > 0 ? '+' : ''}${pattern.priceChange}%`);
      }
    });
  }
  
  // Example 5: AI Integration
  console.log('\n\nStep 6: AI Integration Example');
  console.log('═'.repeat(60));
  console.log('Integration with HybridEngine:');
  console.log('');
  console.log('const engine = new HybridEngine();');
  console.log('');
  console.log('// 1. Bootstrap with CEX data');
  console.log('await engine.bootstrapWithPublicData([\'BTCUSDT\', \'ETHUSDT\'], 30);');
  console.log('');
  console.log('// 2. Add DEX data');
  console.log('await engine.bootstrapWithDEXData([], null);');
  console.log('');
  console.log('// 3. Generate signals combining both sources');
  console.log('const signals = await engine.generateSmartSignals([\'BTCUSDT\', \'ETHUSDT\']);');
  console.log('');
  console.log('Expected Result:');
  console.log('  - Patterns from both CEX and DEX markets');
  console.log('  - Higher confidence when patterns confirmed across sources');
  console.log('  - dataSources.dexPatterns tracks DEX contribution\n');
  
  // Example 6: Comprehensive data collection
  console.log('Step 7: Comprehensive Data Collection');
  console.log('═'.repeat(60));
  console.log('Command: collector.getComprehensiveData(tokens, chain)');
  console.log('');
  console.log('This collects:');
  console.log('  ✓ Pair data for specified tokens');
  console.log('  ✓ Latest boosted/trending tokens');
  console.log('  ✓ Token profiles with metadata');
  console.log('  ✓ All in one call with automatic rate limiting\n');
  
  // Usage examples
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    USAGE EXAMPLES                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('Command Line Usage:');
  console.log('─'.repeat(60));
  console.log('# Search for pairs');
  console.log('node scripts/collect.js --platform dexscreener --query USDC\n');
  
  console.log('# Get specific token data');
  console.log('node scripts/collect.js --platform dexscreener \\');
  console.log('  --tokens 0x...,0x... \\');
  console.log('  --chain ethereum\n');
  
  console.log('# Get trending data');
  console.log('node scripts/collect.js --platform dexscreener\n');
  
  console.log('Bootstrap with DEX data:');
  console.log('─'.repeat(60));
  console.log('npm run bootstrap  # Automatically includes DEX data\n');
  
  console.log('JavaScript API Usage:');
  console.log('─'.repeat(60));
  console.log('const collector = new DexscreenerCollector();\n');
  console.log('// Search');
  console.log('const results = await collector.searchPairs("USDC");\n');
  console.log('// Get token data');
  console.log('const pairs = await collector.getTokenPairs(["0x..."]);\n');
  console.log('// Get trending');
  console.log('const boosted = await collector.getLatestBoostedTokens();\n');
  console.log('// Analyze patterns');
  console.log('const analysis = collector.analyzeDEXPatterns(pairs.pairs);\n');
  
  // Best practices
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    BEST PRACTICES                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log('1. Rate Limiting');
  console.log('   - Pairs endpoints: 300 requests/minute');
  console.log('   - Other endpoints: 60 requests/minute');
  console.log('   - Automatic handling built-in\n');
  
  console.log('2. Combine with CEX Data');
  console.log('   - Use DEX data alongside Binance/Bybit data');
  console.log('   - Patterns confirmed by both = highest confidence\n');
  
  console.log('3. Monitor Liquidity');
  console.log('   - Low liquidity (<$50k) = high risk');
  console.log('   - Use liquidity metrics for position sizing\n');
  
  console.log('4. Track Trending Tokens');
  console.log('   - Boosted tokens indicate high interest');
  console.log('   - Good for discovering new opportunities\n');
  
  console.log('5. Cross-Chain Analysis');
  console.log('   - DEX data spans multiple chains');
  console.log('   - Consider chain-specific patterns\n');
  
  console.log('\n✅ Example complete!');
  console.log('\nFor more information, see: docs/DEXSCREENER_INTEGRATION.md\n');
}

// Run the example
main().catch(error => {
  console.error('Example failed:', error);
  process.exit(1);
});
