/**
 * Test API Endpoints for Signal Accountability System
 * 
 * This script tests the API endpoints for the Signal Accountability System
 * by making actual HTTP requests and verifying the responses.
 */

const axios = require('axios');
const assert = require('assert');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000', // Change to your server URL
  endpoints: [
    '/api/performance/stats',
    '/api/performance/history',
    '/api/performance/patterns',
    '/api/performance/symbols',
    '/api/performance/verify/test_verification_id'
  ],
  testSignalId: 'TEST_SIGNAL_ID'
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
  log('Starting API endpoint tests');
  
  // Test 1: Get performance statistics
  await testEndpoint('/api/performance/stats', {
    validate: (data) => {
      assert.strictEqual(typeof data.success, 'boolean', 'Response should have a success field');
      assert.strictEqual(data.success, true, 'Success should be true');
      assert.strictEqual(typeof data.stats, 'object', 'Response should have stats object');
    }
  });
  
  // Test 2: Get performance history
  await testEndpoint('/api/performance/history', {
    params: { limit: 10 },
    validate: (data) => {
      assert.strictEqual(typeof data.success, 'boolean', 'Response should have a success field');
      assert.strictEqual(data.success, true, 'Success should be true');
      assert.strictEqual(typeof data.count, 'number', 'Response should have count field');
      assert.strictEqual(Array.isArray(data.signals), true, 'Signals should be an array');
    }
  });
  
  // Test 3: Get pattern performance
  await testEndpoint('/api/performance/patterns', {
    validate: (data) => {
      assert.strictEqual(typeof data.success, 'boolean', 'Response should have a success field');
      assert.strictEqual(data.success, true, 'Success should be true');
      assert.strictEqual(typeof data.count, 'number', 'Response should have count field');
      assert.strictEqual(Array.isArray(data.patterns), true, 'Patterns should be an array');
    }
  });
  
  // Test 4: Get symbol performance
  await testEndpoint('/api/performance/symbols', {
    validate: (data) => {
      assert.strictEqual(typeof data.success, 'boolean', 'Response should have a success field');
      assert.strictEqual(data.success, true, 'Success should be true');
      assert.strictEqual(typeof data.count, 'number', 'Response should have count field');
      assert.strictEqual(Array.isArray(data.symbols), true, 'Symbols should be an array');
    }
  });
  
  // Test 5: Verify signal (this might fail if no verification ID exists)
  await testEndpoint('/api/performance/verify/test_verification_id');
  
  // Test 6: Track signal (POST request)
  await testEndpoint('/api/performance/track', {
    method: 'POST',
    data: { signalId: CONFIG.testSignalId }
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
