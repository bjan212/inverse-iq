#!/usr/bin/env node

/**
 * Test Script for Dropdown Trading Pairs Feature
 * Tests the new multi-select dropdown functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:8000';
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 8000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const jsonBody = body ? JSON.parse(body) : {};
                    resolve({ status: res.statusCode, body: jsonBody, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, body: body, headers: res.headers });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function runTest(testName, testFn) {
    try {
        log(`\n🧪 Testing: ${testName}`, 'blue');
        await testFn();
        log(`✅ PASSED: ${testName}`, 'green');
        testsPassed++;
    } catch (error) {
        log(`❌ FAILED: ${testName}`, 'red');
        log(`   Error: ${error.message}`, 'red');
        testsFailed++;
    }
}

// Test 1: Page loads with dropdown
async function testPageLoadsWithDropdown() {
    const response = await makeRequest('GET', '/notifications.html');
    
    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.body.includes('additionalPairs')) {
        throw new Error('Dropdown element "additionalPairs" not found in page');
    }
    
    if (!response.body.includes('DOGEUSDT')) {
        throw new Error('DOGE/USDT option not found in dropdown');
    }
    
    log('   ✓ Page loads successfully');
    log('   ✓ Dropdown element present');
    log('   ✓ Trading pairs options included');
}

// Test 2: Subscription with checkbox selections only
async function testCheckboxSelectionsOnly() {
    const testData = {
        email: 'test-checkbox-only@example.com',
        preferences: {
            symbols: ['BTCUSDT', 'ETHUSDT'],
            minConfidence: 70,
            notificationMethods: ['email']
        }
    };
    
    const response = await makeRequest('POST', '/api/notifications/subscribe', testData);
    
    if (!response.body.success) {
        throw new Error(`Subscription failed: ${response.body.error || 'Unknown error'}`);
    }
    
    log('   ✓ Checkbox-only subscription successful');
    log(`   ✓ Subscriber ID: ${response.body.subscriberId}`);
}

// Test 3: Subscription with dropdown selections only
async function testDropdownSelectionsOnly() {
    const testData = {
        email: 'test-dropdown-only@example.com',
        preferences: {
            symbols: ['DOGEUSDT', 'DOTUSDT', 'MATICUSDT'],
            minConfidence: 75,
            notificationMethods: ['email']
        }
    };
    
    const response = await makeRequest('POST', '/api/notifications/subscribe', testData);
    
    if (!response.body.success) {
        throw new Error(`Subscription failed: ${response.body.error || 'Unknown error'}`);
    }
    
    log('   ✓ Dropdown-only subscription successful');
    log(`   ✓ Symbols: ${testData.preferences.symbols.join(', ')}`);
}

// Test 4: Subscription with combined selections
async function testCombinedSelections() {
    const testData = {
        email: 'test-combined@example.com',
        preferences: {
            symbols: ['BTCUSDT', 'ETHUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT'],
            minConfidence: 80,
            notificationMethods: ['email']
        }
    };
    
    const response = await makeRequest('POST', '/api/notifications/subscribe', testData);
    
    if (!response.body.success) {
        throw new Error(`Subscription failed: ${response.body.error || 'Unknown error'}`);
    }
    
    log('   ✓ Combined selection subscription successful');
    log(`   ✓ Total pairs: ${testData.preferences.symbols.length}`);
    log(`   ✓ Checkbox pairs: BTC, ETH`);
    log(`   ✓ Dropdown pairs: DOGE, AVAX, LINK`);
}

// Test 5: Subscription with many dropdown selections
async function testManyDropdownSelections() {
    const testData = {
        email: 'test-many-pairs@example.com',
        preferences: {
            symbols: [
                'DOGEUSDT', 'DOTUSDT', 'MATICUSDT', 'AVAXUSDT', 'LINKUSDT',
                'ATOMUSDT', 'NEARUSDT', 'APTUSDT', 'AAVEUSDT', 'SHIBUSDT'
            ],
            minConfidence: 85,
            notificationMethods: ['email']
        }
    };
    
    const response = await makeRequest('POST', '/api/notifications/subscribe', testData);
    
    if (!response.body.success) {
        throw new Error(`Subscription failed: ${response.body.error || 'Unknown error'}`);
    }
    
    log('   ✓ Multiple dropdown selections successful');
    log(`   ✓ Total pairs selected: ${testData.preferences.symbols.length}`);
}

// Test 6: Duplicate removal (same pair in checkbox and dropdown)
async function testDuplicateRemoval() {
    const testData = {
        email: 'test-duplicates@example.com',
        preferences: {
            symbols: ['BTCUSDT', 'ETHUSDT', 'BTCUSDT', 'DOGEUSDT', 'ETHUSDT'],
            minConfidence: 70,
            notificationMethods: ['email']
        }
    };
    
    const response = await makeRequest('POST', '/api/notifications/subscribe', testData);
    
    if (!response.body.success) {
        throw new Error(`Subscription failed: ${response.body.error || 'Unknown error'}`);
    }
    
    // Note: Duplicate removal happens on frontend, but API should handle it gracefully
    log('   ✓ Subscription with duplicates handled');
    log('   ✓ API accepts duplicate pairs gracefully');
}

// Test 7: All dropdown categories represented
async function testAllCategories() {
    const testData = {
        email: 'test-all-categories@example.com',
        preferences: {
            symbols: [
                'DOGEUSDT',    // Major Crypto
                'ATOMUSDT',    // Layer 1/2
                'AAVEUSDT',    // DeFi
                'SHIBUSDT',    // Meme
                'SANDUSDT',    // Gaming
                'LTCUSDT'      // Other Altcoins
            ],
            minConfidence: 70,
            notificationMethods: ['email']
        }
    };
    
    const response = await makeRequest('POST', '/api/notifications/subscribe', testData);
    
    if (!response.body.success) {
        throw new Error(`Subscription failed: ${response.body.error || 'Unknown error'}`);
    }
    
    log('   ✓ All dropdown categories tested');
    log('   ✓ Major Cryptos: DOGE');
    log('   ✓ Layer 1/2: ATOM');
    log('   ✓ DeFi: AAVE');
    log('   ✓ Meme: SHIB');
    log('   ✓ Gaming: SAND');
    log('   ✓ Altcoins: LTC');
}

// Test 8: Verify database storage
async function testDatabaseStorage() {
    const response = await makeRequest('GET', '/api/notifications/stats');
    
    if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    const stats = response.body;
    
    if (!stats.totalSubscribers || stats.totalSubscribers < 6) {
        throw new Error(`Expected at least 6 new subscribers from tests, got ${stats.totalSubscribers}`);
    }
    
    log('   ✓ Database storing subscriptions');
    log(`   ✓ Total subscribers: ${stats.totalSubscribers}`);
}

// Main test runner
async function runAllTests() {
    log('\n' + '='.repeat(60), 'blue');
    log('  DROPDOWN FEATURE TEST SUITE', 'blue');
    log('='.repeat(60) + '\n', 'blue');
    
    await runTest('Page loads with dropdown element', testPageLoadsWithDropdown);
    await runTest('Subscription with checkbox selections only', testCheckboxSelectionsOnly);
    await runTest('Subscription with dropdown selections only', testDropdownSelectionsOnly);
    await runTest('Subscription with combined selections', testCombinedSelections);
    await runTest('Subscription with many dropdown selections', testManyDropdownSelections);
    await runTest('Duplicate removal handling', testDuplicateRemoval);
    await runTest('All dropdown categories represented', testAllCategories);
    await runTest('Database storage verification', testDatabaseStorage);
    
    // Summary
    log('\n' + '='.repeat(60), 'blue');
    log('  TEST SUMMARY', 'blue');
    log('='.repeat(60), 'blue');
    log(`\n✅ Tests Passed: ${testsPassed}`, 'green');
    log(`❌ Tests Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
    log(`📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`, 
        testsFailed === 0 ? 'green' : 'yellow');
    
    if (testsFailed === 0) {
        log('🎉 All tests passed! Dropdown feature is working correctly.\n', 'green');
    } else {
        log('⚠️  Some tests failed. Please review the errors above.\n', 'yellow');
    }
    
    process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    log(`\n❌ Test suite error: ${error.message}`, 'red');
    process.exit(1);
});
