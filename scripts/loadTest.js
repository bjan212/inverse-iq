#!/usr/bin/env node

/**
 * Load Testing Script
 *
 * Tests the trading data collection service under various load conditions
 * to ensure performance optimizations work correctly.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class LoadTest {
  constructor() {
    this.results = {
      concurrentRequests: {},
      sustainedLoad: {},
      memoryPressure: {},
      apiThrottling: {}
    };
  }

  /**
   * Test concurrent API requests
   */
  async testConcurrentRequests() {
    console.log('\n🧪 Testing Concurrent API Requests...\n');

    const concurrentRequests = [10, 50, 100, 200];
    const baseUrl = 'http://localhost:3000';

    for (const count of concurrentRequests) {
      console.log(`Testing ${count} concurrent requests...`);

      const startTime = Date.now();
      const promises = [];

      // Create concurrent requests
      for (let i = 0; i < count; i++) {
        const promise = this.makeRequest(`${baseUrl}/api/ai/signals?symbols=BTCUSDT`)
          .catch(error => ({ error: error.message }));
        promises.push(promise);
      }

      // Wait for all requests to complete
      const results = await Promise.all(promises);
      const endTime = Date.now();

      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;
      const avgResponseTime = (endTime - startTime) / count;

      this.results.concurrentRequests[count] = {
        totalRequests: count,
        successful: successful,
        failed: failed,
        successRate: (successful / count * 100).toFixed(2) + '%',
        avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
        totalTime: (endTime - startTime) + 'ms'
      };

      console.log(`✅ ${count} requests: ${successful} success, ${failed} failed`);
      console.log(`   Success rate: ${this.results.concurrentRequests[count].successRate}`);
      console.log(`   Avg response time: ${this.results.concurrentRequests[count].avgResponseTime}`);

      // Small delay between test batches
      await this.sleep(1000);
    }
  }

  /**
   * Test sustained load over time
   */
  async testSustainedLoad() {
    console.log('\n🧪 Testing Sustained Load...\n');

    const duration = 30000; // 30 seconds
    const requestInterval = 100; // 100ms between requests
    const startTime = Date.now();

    let requestCount = 0;
    let successCount = 0;
    let errorCount = 0;
    const responseTimes = [];

    console.log(`Running sustained load test for ${duration / 1000} seconds...`);

    const interval = setInterval(async () => {
      if (Date.now() - startTime >= duration) {
        clearInterval(interval);
        return;
      }

      requestCount++;
      const reqStart = Date.now();

      try {
        await this.makeRequest('http://localhost:3000/api/ai/signals?symbols=BTCUSDT');
        successCount++;
        responseTimes.push(Date.now() - reqStart);
      } catch (error) {
        errorCount++;
      }
    }, requestInterval);

    // Wait for test to complete
    await new Promise(resolve => setTimeout(resolve, duration + 1000));

    const avgResponseTime = responseTimes.length > 0
      ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    const requestsPerSecond = (requestCount / duration * 1000).toFixed(2);

    this.results.sustainedLoad = {
      duration: duration + 'ms',
      totalRequests: requestCount,
      successful: successCount,
      failed: errorCount,
      successRate: (successCount / requestCount * 100).toFixed(2) + '%',
      requestsPerSecond: requestsPerSecond,
      avgResponseTime: avgResponseTime.toFixed(2) + 'ms'
    };

    console.log(`✅ Sustained load test complete:`);
    console.log(`   Total requests: ${requestCount}`);
    console.log(`   Success rate: ${this.results.sustainedLoad.successRate}`);
    console.log(`   Requests/second: ${requestsPerSecond}`);
    console.log(`   Avg response time: ${this.results.sustainedLoad.avgResponseTime}`);
  }

  /**
   * Test memory pressure
   */
  async testMemoryPressure() {
    console.log('\n🧪 Testing Memory Pressure...\n');

    const initialMem = process.memoryUsage();
    console.log(`Initial memory: RSS ${(initialMem.rss / 1024 / 1024).toFixed(2)} MB`);

    // Create many concurrent requests to stress memory
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(this.makeRequest('http://localhost:3000/api/ai/signals?symbols=BTCUSDT,ETHUSDT,BNBUSDT'));
    }

    await Promise.all(promises);

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      await this.sleep(1000);
    }

    const finalMem = process.memoryUsage();
    const memIncrease = finalMem.rss - initialMem.rss;

    this.results.memoryPressure = {
      initialRSS: (initialMem.rss / 1024 / 1024).toFixed(2) + ' MB',
      finalRSS: (finalMem.rss / 1024 / 1024).toFixed(2) + ' MB',
      increase: (memIncrease / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (finalMem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      external: (finalMem.external / 1024 / 1024).toFixed(2) + ' MB'
    };

    console.log(`✅ Memory pressure test:`);
    console.log(`   Initial RSS: ${this.results.memoryPressure.initialRSS}`);
    console.log(`   Final RSS: ${this.results.memoryPressure.finalRSS}`);
    console.log(`   Memory increase: ${this.results.memoryPressure.increase}`);
  }

  /**
   * Test API throttling behavior
   */
  async testAPIThrottling() {
    console.log('\n🧪 Testing API Throttling...\n');

    const rapidRequests = 50;
    const promises = [];

    console.log(`Making ${rapidRequests} rapid requests to test throttling...`);

    for (let i = 0; i < rapidRequests; i++) {
      promises.push(
        this.makeRequest('http://localhost:3000/api/ai/signals?symbols=BTCUSDT')
          .then(() => ({ success: true }))
          .catch(() => ({ success: false }))
      );
    }

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    const throttled = results.filter(r => !r.success).length;

    this.results.apiThrottling = {
      totalRequests: rapidRequests,
      successful: successful,
      throttled: throttled,
      throttleRate: (throttled / rapidRequests * 100).toFixed(2) + '%'
    };

    console.log(`✅ API throttling test:`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Throttled: ${throttled}`);
    console.log(`   Throttle rate: ${this.results.apiThrottling.throttleRate}`);
  }

  /**
   * Make HTTP request
   */
  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const http = require('http');
      const https = require('https');

      const isHttps = url.startsWith('https:');
      const client = isHttps ? https : http;

      const req = client.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if server is running
   */
  async checkServer() {
    try {
      await this.makeRequest('http://localhost:3000/api/ai/signals?symbols=BTCUSDT');
      return true;
    } catch (error) {
      console.log('❌ Server not running. Please start the server first: npm start');
      return false;
    }
  }

  /**
   * Run all load tests
   */
  async runAllTests() {
    console.log('🚀 Starting Load Tests...\n');

    // Check if server is running
    if (!(await this.checkServer())) {
      return;
    }

    const startTime = Date.now();

    try {
      await this.testConcurrentRequests();
      await this.testSustainedLoad();
      await this.testMemoryPressure();
      await this.testAPIThrottling();
    } catch (error) {
      console.error('Load test failed:', error.message);
    }

    const totalTime = Date.now() - startTime;

    console.log('\n🎯 Load Test Results Summary:');
    console.log('=============================');
    console.log(JSON.stringify(this.results, null, 2));
    console.log(`\n⏱️  Total test time: ${totalTime}ms`);

    // Save results
    const resultsFile = './data/load_test_results.json';
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      duration: totalTime,
      results: this.results
    }, null, 2));

    console.log(`💾 Results saved to: ${resultsFile}`);
    console.log('\n✅ Load tests completed!');
  }
}

// Run tests if called directly
if (require.main === module) {
  const test = new LoadTest();
  test.runAllTests().catch(console.error);
}

module.exports = LoadTest;
