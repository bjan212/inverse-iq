/**
 * Test Trade Analyzer API Endpoints
 * 
 * This script tests the API endpoints for the Trade Analyzer feature
 * by making actual HTTP requests and verifying the responses.
 */

const axios = require('axios');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000', // Change to your server URL
  testUserId: 'test_user_' + Date.now(),
  testExchange: 'binance',
  testApiKey: 'test_api_key_' + Date.now(),
  testApiSecret: 'test_api_secret_' + Date.now(),
  endpoints: [
    '/api/trade-analyzer/api-keys',
    '/api/trade-analyzer/exchanges/:userId',
    '/api/trade-analyzer/positions/:userId',
    '/api/trade-analyzer/account/:userId',
    '/api/trade-analyzer/analyze/:userId',
    '/api/trade-analyzer/history/:userId'
  ]
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper function to log with timestamp
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Helper function to test an endpoint
async function testEndpoint(endpoint, options = {}) {
  try {
    log(`Testing endpoint: ${endpoint}`);
    
    const url = `${CONFIG.baseUrl}${endpoint}`;
    let response;
    
    if (options.method === 'POST') {
      response = await axios.post(url, options.data || {});
    } else {
      response = await axios.get(url, options.params ? { params: options.params } : undefined);
    }
    
    // Check if response is valid
    assert.strictEqual(response.status, 200, `Expected status 200, got ${response.status}`);
    assert.strictEqual(typeof response.data, 'object', 'Response data should be an object');
    assert.strictEqual(response.data.success, true, 'Success should be true');
    
    if (options.validate) {
      options.validate(response.data);
    }
    
    log(`✅ Endpoint ${endpoint} passed`);
    results.passed++;
    
    return response.data;
  } catch (error) {
    log(`❌ Endpoint ${endpoint} failed: ${error.message}`);
    
    if (error.response) {
      log(`Response status: ${error.response.status}`);
      log(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    
    results.failed++;
    results.errors.push({
      endpoint,
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    
    return null;
  }
}

// Main test function
async function runTests() {
  log('Starting Trade Analyzer API endpoint tests');
  
  // Test 1: Set API keys
  await testEndpoint('/api/trade-analyzer/api-keys', {
    method: 'POST',
    data: {
      userId: CONFIG.testUserId,
      exchange: CONFIG.testExchange,
      apiKey: CONFIG.testApiKey,
      apiSecret: CONFIG.testApiSecret
    },
    validate: (data) => {
      assert.strictEqual(typeof data.message, 'string', 'Response should have a message');
      assert.ok(data.message.includes(CONFIG.testExchange), 'Message should include the exchange name');
    }
  });
  
  // Test 2: Get connected exchanges
  await testEndpoint(`/api/trade-analyzer/exchanges/${CONFIG.testUserId}`, {
    validate: (data) => {
      assert.strictEqual(Array.isArray(data.exchanges), true, 'Exchanges should be an array');
      assert.strictEqual(data.exchanges.includes(CONFIG.testExchange), true, 'Exchanges should include the test exchange');
    }
  });
  
  // Test 3: Get open positions
  await testEndpoint(`/api/trade-analyzer/positions/${CONFIG.testUserId}`, {
    validate: (data) => {
      assert.strictEqual(typeof data.positions, 'object', 'Positions should be an object');
      assert.strictEqual(typeof data.positions[CONFIG.testExchange], 'object', 'Positions should include the test exchange');
    }
  });
  
  // Test 4: Get account information
  await testEndpoint(`/api/trade-analyzer/account/${CONFIG.testUserId}`, {
    validate: (data) => {
      assert.strictEqual(typeof data.accountInfo, 'object', 'Account info should be an object');
      assert.strictEqual(typeof data.accountInfo[CONFIG.testExchange], 'object', 'Account info should include the test exchange');
    }
  });
  
  // Test 5: Analyze open trades
  await testEndpoint(`/api/trade-analyzer/analyze/${CONFIG.testUserId}`, {
    validate: (data) => {
      assert.strictEqual(typeof data.analysis, 'object', 'Analysis should be an object');
      assert.strictEqual(data.analysis.userId, CONFIG.testUserId, 'Analysis should be for the test user');
      assert.strictEqual(typeof data.analysis.riskAssessment, 'object', 'Analysis should include risk assessment');
      assert.strictEqual(typeof data.analysis.overallRecommendation, 'string', 'Analysis should include overall recommendation');
    }
  });
  
  // Test 6: Get analysis history
  await testEndpoint(`/api/trade-analyzer/history/${CONFIG.testUserId}`, {
    validate: (data) => {
      assert.strictEqual(Array.isArray(data.history), true, 'History should be an array');
    }
  });
  
  // Test 7: Error handling - Invalid user ID
  await testEndpoint('/api/trade-analyzer/exchanges/invalid_user_id', {
    expectError: true,
    validate: (data) => {
      assert.strictEqual(data.success, true, 'Success should be true even for empty results');
      assert.strictEqual(Array.isArray(data.exchanges), true, 'Exchanges should be an array');
      assert.strictEqual(data.exchanges.length, 0, 'Exchanges array should be empty');
    }
  });
  
  // Test 8: Error handling - Missing required parameters
  await testEndpoint('/api/trade-analyzer/api-keys', {
    method: 'POST',
    data: {
      userId: CONFIG.testUserId,
      // Missing exchange, apiKey, apiSecret
    },
    expectError: true
  });
  
  // Log results
  log('\n--- Test Results ---');
  log(`Total tests: ${results.passed + results.failed}`);
  log(`Passed: ${results.passed}`);
  log(`Failed: ${results.failed}`);
  
  if (results.failed > 0) {
    log('\nErrors:');
    results.errors.forEach((error, index) => {
      log(`${index + 1}. Endpoint: ${error.endpoint}`);
      log(`   Error: ${error.error}`);
      if (error.response) {
        log(`   Status: ${error.response.status}`);
        log(`   Data: ${JSON.stringify(error.response.data)}`);
      }
    });
  }
}

// Run the tests
runTests().catch(error => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});
