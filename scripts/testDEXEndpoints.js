#!/usr/bin/env node

/**
 * Test script for DEX trading endpoints
 * This script tests the DEX API endpoints to ensure they're working correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';
const TEST_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e90F1A6A1D7'; // Example Ethereum address

async function testEndpoint(method, endpoint, data = null) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`\n🔍 Testing ${method} ${endpoint}`);
    
    let response;
    if (method === 'GET') {
      response = await axios.get(url, { params: data });
    } else if (method === 'POST') {
      response = await axios.post(url, data);
    }
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Response:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
    
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Response:`, JSON.stringify(error.response.data, null, 2).substring(0, 200));
    }
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting DEX Endpoint Tests');
  console.log('========================================\n');
  
  // Test 1: Get network info
  await testEndpoint('GET', '/api/dex/network-info');
  
  // Test 2: Get network info for Ethereum
  await testEndpoint('GET', '/api/dex/network-info', { chainId: 1 });
  
  // Test 3: Get supported tokens
  await testEndpoint('GET', '/api/dex/tokens');
  
  // Test 4: Get tokens for Ethereum
  await testEndpoint('GET', '/api/dex/tokens', { chainId: 1 });
  
  // Test 5: Test wallet status
  await testEndpoint('GET', '/api/dex/wallet/status', { address: TEST_WALLET });
  
  // Test 6: Test DEX connectivity
  await testEndpoint('GET', '/api/dex/test');
  
  // Test 7: Get AI signals (prerequisite for trading)
  const signalsResult = await testEndpoint('GET', '/api/signals');
  
  // Test 8: Test quote endpoint (if we have a signal)
  if (signalsResult.success && signalsResult.data.signals && signalsResult.data.signals.length > 0) {
    const signal = signalsResult.data.signals[0];
    console.log(`\n📡 Found signal: ${signal.signalId} (${signal.symbol})`);
    
    // Test quote
    await testEndpoint('POST', '/api/dex/quote', {
      tokenIn: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
      tokenOut: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      amountIn: '100',
      chainId: 1
    });
    
    // Test trade execution (simulated)
    await testEndpoint('POST', '/api/dex/execute-signal-trade', {
      signalId: signal.signalId,
      amount: '100',
      walletAddress: TEST_WALLET,
      chainId: 1
    });
  } else {
    console.log('\n⚠️  No signals found, skipping trade tests');
    console.log('   To generate signals, ensure AI engine is running');
  }
  
  // Test 9: Test wallet connection
  await testEndpoint('POST', '/api/dex/wallet/connect', {
    address: TEST_WALLET,
    signature: '0xsignatureplaceholder',
    message: 'Connect to Xrypt DEX'
  });
  
  console.log('\n========================================');
  console.log('🎯 DEX Endpoint Tests Complete');
  console.log('\nNext steps:');
  console.log('1. Open http://localhost:8000/trade-signals.html');
  console.log('2. Connect your wallet (MetaMask)');
  console.log('3. Test trading with AI signals');
  console.log('4. Check server logs for transaction details');
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api/health`, { timeout: 2000 });
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('   Start the server with: npm start');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('\n💡 Starting server automatically...');
    // You could start the server here, but for simplicity we'll just exit
    console.log('   Please start the server first: npm start');
    console.log('   Then run: node scripts/testDEXEndpoints.js');
    process.exit(1);
  }
  
  await runTests();
}

main().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
