/**
 * Test Script for DEX Connector
 * 
 * Tests the Uniswap V3 connector with read-only operations
 * Note: Requires RPC URL to be set in environment
 */

const UniswapV3SimpleConnector = require('../src/dex/uniswapV3Simple');

// Common token addresses on Ethereum mainnet
const TOKENS = {
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
};

async function testDEXConnector() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         TESTING DEX CONNECTOR (READ-ONLY MODE)            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check for RPC URL
  const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth.public-rpc.com';
  
  console.log(`🔗 Using RPC: ${rpcUrl.substring(0, 30)}...`);
  console.log('ℹ️  Note: Using public RPC (may be slow). For production, use Alchemy/Infura.\n');

  try {
    // Initialize connector
    console.log('📊 Test 1: Initialize Uniswap V3 Connector');
    console.log('─'.repeat(60));
    
    const uniswap = new UniswapV3SimpleConnector({
      rpcUrl: rpcUrl,
      network: 'ethereum'
    });
    
    console.log('✅ Connector initialized\n');

    // Test 2: Get Network Info
    console.log('📊 Test 2: Get Network Information');
    console.log('─'.repeat(60));
    
    const networkInfo = await uniswap.getNetworkInfo();
    console.log('Network:', networkInfo.name);
    console.log('Chain ID:', networkInfo.chainId);
    console.log('Block Number:', networkInfo.blockNumber);
    console.log('Gas Price:', networkInfo.gasPriceGwei, 'Gwei');
    console.log('✅ Network info retrieved\n');

    // Test 3: Get Pool Address
    console.log('📊 Test 3: Get Pool Address (WETH/USDC)');
    console.log('─'.repeat(60));
    
    const poolAddress = await uniswap.getPoolAddress(TOKENS.WETH, TOKENS.USDC, 3000);
    console.log('Pool Address:', poolAddress);
    console.log('✅ Pool address retrieved\n');

    // Test 4: Get Price
    console.log('📊 Test 4: Get Current Price (WETH/USDC)');
    console.log('─'.repeat(60));
    
    const priceInfo = await uniswap.getPrice(TOKENS.WETH, TOKENS.USDC, 3000);
    console.log('Price:', priceInfo.price);
    console.log('Tick:', priceInfo.tick);
    console.log('Pool:', priceInfo.poolAddress);
    console.log('Fee:', priceInfo.fee / 10000, '%');
    console.log('✅ Price retrieved\n');

    // Test 5: Get Liquidity
    console.log('📊 Test 5: Get Pool Liquidity (WETH/USDC)');
    console.log('─'.repeat(60));
    
    const liquidityInfo = await uniswap.getLiquidity(TOKENS.WETH, TOKENS.USDC, 3000);
    console.log('Liquidity:', liquidityInfo.liquidityFormatted);
    console.log('Pool:', liquidityInfo.poolAddress);
    console.log('✅ Liquidity retrieved\n');

    // Test 6: Get Pool Info
    console.log('📊 Test 6: Get Comprehensive Pool Info (WETH/USDC)');
    console.log('─'.repeat(60));
    
    const poolInfo = await uniswap.getPoolInfo(TOKENS.WETH, TOKENS.USDC, 3000);
    console.log('Pool:', poolInfo.poolAddress);
    console.log('Token 0:', poolInfo.token0.symbol, '-', poolInfo.token0.address);
    console.log('Token 1:', poolInfo.token1.symbol, '-', poolInfo.token1.address);
    console.log('Fee:', poolInfo.fee / 10000, '%');
    console.log('Price:', poolInfo.price);
    console.log('Liquidity:', poolInfo.liquidity);
    console.log('✅ Pool info retrieved\n');

    // Test 7: Get Quote
    console.log('📊 Test 7: Get Swap Quote (1 WETH → USDC)');
    console.log('─'.repeat(60));
    
    const quote = await uniswap.getQuote(TOKENS.WETH, TOKENS.USDC, '1', 3000);
    console.log('Amount In:', quote.amountIn, 'WETH');
    console.log('Amount Out:', quote.amountOut, 'USDC');
    console.log('Price:', quote.price);
    console.log('Fee:', quote.fee / 10000, '%');
    console.log('✅ Quote retrieved\n');

    // Test 8: Get Best Fee Tier
    console.log('📊 Test 8: Find Best Fee Tier (WETH/USDC)');
    console.log('─'.repeat(60));
    
    const bestFee = await uniswap.getBestFeeTier(TOKENS.WETH, TOKENS.USDC);
    console.log('Best Fee Tier:', bestFee.best.name, '-', bestFee.best.fee / 10000, '%');
    console.log('Liquidity:', bestFee.best.liquidityFormatted);
    console.log('\nAll Available Pools:');
    bestFee.all.forEach((pool, i) => {
      console.log(`  ${i + 1}. ${pool.name} (${pool.fee / 10000}%) - Liquidity: ${pool.liquidityFormatted}`);
    });
    console.log('✅ Best fee tier found\n');

    // Test 9: Token Info
    console.log('📊 Test 9: Get Token Information');
    console.log('─'.repeat(60));
    
    const wethSymbol = await uniswap.getTokenSymbol(TOKENS.WETH);
    const usdcSymbol = await uniswap.getTokenSymbol(TOKENS.USDC);
    const wethDecimals = await uniswap.getTokenDecimals(TOKENS.WETH);
    const usdcDecimals = await uniswap.getTokenDecimals(TOKENS.USDC);
    
    console.log('WETH:', wethSymbol, '- Decimals:', wethDecimals);
    console.log('USDC:', usdcSymbol, '- Decimals:', usdcDecimals);
    console.log('✅ Token info retrieved\n');

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              ALL TESTS COMPLETED SUCCESSFULLY              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('✅ DEX Connector: WORKING');
    console.log('✅ Uniswap V3 Integration: WORKING');
    console.log('\n📊 Summary:');
    console.log('  - Network connection: ✅');
    console.log('  - Pool address lookup: ✅');
    console.log('  - Price fetching: ✅');
    console.log('  - Liquidity monitoring: ✅');
    console.log('  - Pool information: ✅');
    console.log('  - Swap quotes: ✅');
    console.log('  - Fee tier analysis: ✅');
    console.log('  - Token information: ✅');

    console.log('\n🎯 Next Steps:');
    console.log('  1. Set up Alchemy/Infura RPC for better performance');
    console.log('  2. Create DEX Manager for multi-DEX support');
    console.log('  3. Implement arbitrage detection');
    console.log('  4. Add PancakeSwap V3 connector (BSC)');
    console.log('  5. Integrate with hybrid AI engine\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\n💡 Common issues:');
    console.error('  - RPC rate limiting (use Alchemy/Infura)');
    console.error('  - Network connectivity');
    console.error('  - Invalid token addresses');
    console.error('\n📝 To fix:');
    console.error('  1. Get free RPC from https://www.alchemy.com or https://infura.io');
    console.error('  2. Set ETHEREUM_RPC_URL in .env file');
    console.error('  3. Retry the test\n');
    process.exit(1);
  }
}

// Run tests
console.log('\n🚀 Starting DEX Connector Tests...\n');
console.log('⚠️  Note: This test uses READ-ONLY operations');
console.log('⚠️  No transactions will be executed');
console.log('⚠️  No private keys required\n');

testDEXConnector();
