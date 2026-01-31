/**
 * Test Trade Analyzer UI Functionality
 * 
 * This script tests the Trade Analyzer UI functionality by launching a browser
 * and interacting with the UI elements to verify that they work as expected.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000', // Change to your server URL
  screenshotsDir: path.join(__dirname, '../screenshots'),
  testUserId: 'test_user_' + Date.now(),
  testExchange: 'binance',
  testApiKey: 'test_api_key_' + Date.now(),
  testApiSecret: 'test_api_secret_' + Date.now()
};

// Ensure screenshots directory exists
if (!fs.existsSync(CONFIG.screenshotsDir)) {
  fs.mkdirSync(CONFIG.screenshotsDir, { recursive: true });
}

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

// Helper function to take a screenshot
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(CONFIG.screenshotsDir, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  log(`Screenshot saved to ${screenshotPath}`);
  return screenshotPath;
}

// Helper function to test a UI feature
async function testFeature(name, testFn) {
  try {
    log(`Testing feature: ${name}`);
    await testFn();
    log(`✅ Feature ${name} passed`);
    results.passed++;
  } catch (error) {
    log(`❌ Feature ${name} failed: ${error.message}`);
    results.failed++;
    results.errors.push({
      feature: name,
      error: error.message
    });
  }
}

// Main test function
async function runTests() {
  log('Starting Trade Analyzer UI tests');
  
  const browser = await puppeteer.launch({
    headless: false, // Set to true for headless testing
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // Test 1: Load the Trade Analyzer page
    await testFeature('Page Load', async () => {
      await page.goto(`${CONFIG.baseUrl}/trade-analyzer.html`);
      await page.waitForSelector('h1');
      
      const title = await page.$eval('h1', el => el.textContent);
      if (!title.includes('Trade Analyzer')) {
        throw new Error(`Expected title to include 'Trade Analyzer', got '${title}'`);
      }
      
      await takeScreenshot(page, 'page-load');
    });
    
    // Test 2: Change User ID
    await testFeature('Change User ID', async () => {
      await page.click('#changeUserBtn');
      await page.waitForSelector('#userIdModal:not(.hidden)');
      
      await takeScreenshot(page, 'user-id-modal');
      
      await page.type('#userIdInput', CONFIG.testUserId);
      await page.click('#saveUserIdBtn');
      
      await page.waitForFunction(
        (expectedUserId) => document.getElementById('currentUserId').textContent === expectedUserId,
        {},
        CONFIG.testUserId
      );
      
      await takeScreenshot(page, 'user-id-changed');
    });
    
    // Test 3: Navigate to Exchanges tab
    await testFeature('Navigate to Exchanges Tab', async () => {
      await page.click('.tab[data-tab="exchanges"]');
      await page.waitForSelector('#exchanges-tab.active');
      
      await takeScreenshot(page, 'exchanges-tab');
    });
    
    // Test 4: Add Exchange
    await testFeature('Add Exchange', async () => {
      await page.click('#addExchangeBtn');
      await page.waitForSelector('#addExchangeForm:not(.hidden)');
      
      await takeScreenshot(page, 'add-exchange-form');
      
      await page.select('#exchangeSelect', CONFIG.testExchange);
      await page.type('#apiKeyInput', CONFIG.testApiKey);
      await page.type('#apiSecretInput', CONFIG.testApiSecret);
      
      // Submit form
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForResponse(response => 
          response.url().includes('/api/trade-analyzer/api-keys') && 
          response.status() === 200
        )
      ]);
      
      // Wait for the form to be hidden
      await page.waitForSelector('#addExchangeForm.hidden');
      
      await takeScreenshot(page, 'exchange-added');
    });
    
    // Test 5: Navigate to Positions tab
    await testFeature('Navigate to Positions Tab', async () => {
      await page.click('.tab[data-tab="positions"]');
      await page.waitForSelector('#positions-tab.active');
      
      await takeScreenshot(page, 'positions-tab');
    });
    
    // Test 6: Refresh Positions
    await testFeature('Refresh Positions', async () => {
      await page.click('#refreshPositionsBtn');
      
      // Wait for positions to load
      await page.waitForFunction(
        () => !document.querySelector('#positionsContainer').textContent.includes('Loading')
      );
      
      await takeScreenshot(page, 'positions-refreshed');
    });
    
    // Test 7: Navigate to Analysis tab
    await testFeature('Navigate to Analysis Tab', async () => {
      await page.click('.tab[data-tab="analysis"]');
      await page.waitForSelector('#analysis-tab.active');
      
      await takeScreenshot(page, 'analysis-tab');
    });
    
    // Test 8: Run Analysis
    await testFeature('Run Analysis', async () => {
      await page.click('#runAnalysisBtn');
      
      // Wait for analysis to load
      await page.waitForFunction(
        () => !document.querySelector('#analysisContainer').textContent.includes('Loading')
      );
      
      await takeScreenshot(page, 'analysis-run');
    });
    
    // Test 9: Navigate to History tab
    await testFeature('Navigate to History Tab', async () => {
      await page.click('.tab[data-tab="history"]');
      await page.waitForSelector('#history-tab.active');
      
      await takeScreenshot(page, 'history-tab');
    });
    
    // Test 10: Refresh History
    await testFeature('Refresh History', async () => {
      await page.click('#refreshHistoryBtn');
      
      // Wait for history to load
      await page.waitForFunction(
        () => !document.querySelector('#historyContainer').textContent.includes('Loading')
      );
      
      await takeScreenshot(page, 'history-refreshed');
    });
    
    // Test 11: Navigate back to Dashboard
    await testFeature('Navigate to Dashboard', async () => {
      await page.click('.tab[data-tab="dashboard"]');
      await page.waitForSelector('#dashboard-tab.active');
      
      await takeScreenshot(page, 'dashboard-tab');
    });
    
    // Test 12: Quick Actions
    await testFeature('Quick Actions', async () => {
      // Test Analyze Trades button
      await page.click('#analyzeTradesBtn');
      await page.waitForSelector('#analysis-tab.active');
      
      await takeScreenshot(page, 'quick-action-analyze');
      
      // Test View Positions button
      await page.click('#viewPositionsBtn');
      await page.waitForSelector('#positions-tab.active');
      
      await takeScreenshot(page, 'quick-action-positions');
    });
    
    // Log results
    log('\n--- Test Results ---');
    log(`Total tests: ${results.passed + results.failed}`);
    log(`Passed: ${results.passed}`);
    log(`Failed: ${results.failed}`);
    
    if (results.failed > 0) {
      log('\nErrors:');
      results.errors.forEach((error, index) => {
        log(`${index + 1}. Feature: ${error.feature}`);
        log(`   Error: ${error.error}`);
      });
    }
    
    log(`\nScreenshots saved to ${CONFIG.screenshotsDir}`);
  } finally {
    await browser.close();
  }
}

// Run the tests
runTests().catch(error => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});
