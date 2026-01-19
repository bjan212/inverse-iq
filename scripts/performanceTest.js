#!/usr/bin/env node

/**
 * Performance Test Script
 *
 * Tests the performance improvements made to the trading data collection service.
 * Measures I/O operations, signal generation speed, and memory usage.
 */

const fs = require('fs');
const path = require('path');

class PerformanceTest {
  constructor() {
    this.results = {
      ioOperations: {},
      signalGeneration: {},
      memoryUsage: {},
      cachePerformance: {}
    };
  }

  /**
   * Test I/O operations performance
   */
  async testIOOperations() {
    console.log('\n🧪 Testing I/O Operations Performance...\n');

    const testFile = './data/performance_test.json';
    const testData = { test: 'data', timestamp: Date.now(), largeArray: Array.from({length: 1000}, (_, i) => ({id: i, value: Math.random()})) };

    // Test sync write (old way - blocking)
    const syncStart = Date.now();
    fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));
    const syncWriteTime = Date.now() - syncStart;

    // Test async write (new way - non-blocking)
    const asyncStart = Date.now();
    await fs.promises.writeFile(testFile, JSON.stringify(testData, null, 2));
    const asyncWriteTime = Date.now() - asyncStart;

    // Test read operations
    const syncReadStart = Date.now();
    const syncData = JSON.parse(fs.readFileSync(testFile, 'utf8'));
    const syncReadTime = Date.now() - syncReadStart;

    const asyncReadStart = Date.now();
    const asyncData = JSON.parse(await fs.promises.readFile(testFile, 'utf8'));
    const asyncReadTime = Date.now() - asyncReadStart;

    // Cleanup
    fs.unlinkSync(testFile);

    this.results.ioOperations = {
      syncWrite: syncWriteTime,
      asyncWrite: asyncWriteTime,
      syncRead: syncReadTime,
      asyncRead: asyncReadTime,
      improvement: {
        write: ((syncWriteTime - asyncWriteTime) / syncWriteTime * 100).toFixed(2) + '%',
        read: ((syncReadTime - asyncReadTime) / syncReadTime * 100).toFixed(2) + '%'
      }
    };

    console.log(`✅ Sync write: ${syncWriteTime}ms`);
    console.log(`✅ Async write: ${asyncWriteTime}ms`);
    console.log(`✅ Sync read: ${syncReadTime}ms`);
    console.log(`✅ Async read: ${asyncReadTime}ms`);
    console.log(`📈 I/O Performance improvement: Write ${this.results.ioOperations.improvement.write}, Read ${this.results.ioOperations.improvement.read}`);
  }

  /**
   * Test signal generation performance
   */
  async testSignalGeneration() {
    console.log('\n🧪 Testing Signal Generation Performance...\n');

    try {
      const SelfImprovingEngine = require('../src/ai-engine/selfImprovingEngine');
      const engine = new SelfImprovingEngine('./data/test_pattern_database.json');

      // Wait for database to load
      await engine.loadDatabase();

      const symbols = ['BTCUSDT', 'ETHUSDT'];
      const iterations = 10;

      console.log(`Testing signal generation for ${symbols.length} symbols, ${iterations} times each...`);

      let totalTime = 0;
      let totalSignals = 0;

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        for (const symbol of symbols) {
          const signals = await engine.generateSmartSignals([symbol]);
          totalSignals += signals.length;
        }

        const endTime = Date.now();
        totalTime += (endTime - startTime);
      }

      const avgTime = totalTime / iterations;
      const signalsPerSecond = (totalSignals / iterations) / (avgTime / 1000);

      this.results.signalGeneration = {
        totalIterations: iterations,
        totalSignals: totalSignals,
        avgTimePerIteration: avgTime.toFixed(2) + 'ms',
        signalsPerSecond: signalsPerSecond.toFixed(2),
        cacheSize: engine.patternCache.size
      };

      console.log(`✅ Average time per iteration: ${avgTime.toFixed(2)}ms`);
      console.log(`✅ Total signals generated: ${totalSignals}`);
      console.log(`✅ Signals per second: ${signalsPerSecond.toFixed(2)}`);
      console.log(`✅ Cache size: ${engine.patternCache.size} patterns`);

      // Cleanup test database
      if (fs.existsSync('./data/test_pattern_database.json')) {
        fs.unlinkSync('./data/test_pattern_database.json');
      }

    } catch (error) {
      console.error('Signal generation test failed:', error.message);
      this.results.signalGeneration = { error: error.message };
    }
  }

  /**
   * Test memory usage
   */
  testMemoryUsage() {
    console.log('\n🧪 Testing Memory Usage...\n');

    const memUsage = process.memoryUsage();

    this.results.memoryUsage = {
      rss: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
      heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      external: (memUsage.external / 1024 / 1024).toFixed(2) + ' MB'
    };

    console.log(`✅ RSS: ${this.results.memoryUsage.rss}`);
    console.log(`✅ Heap Total: ${this.results.memoryUsage.heapTotal}`);
    console.log(`✅ Heap Used: ${this.results.memoryUsage.heapUsed}`);
    console.log(`✅ External: ${this.results.memoryUsage.external}`);
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Performance Tests...\n');

    const startTime = Date.now();

    await this.testIOOperations();
    await this.testSignalGeneration();
    this.testMemoryUsage();

    const totalTime = Date.now() - startTime;

    console.log('\n🎯 Performance Test Results Summary:');
    console.log('=====================================');
    console.log(JSON.stringify(this.results, null, 2));
    console.log(`\n⏱️  Total test time: ${totalTime}ms`);

    // Save results
    const resultsFile = './data/performance_test_results.json';
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      duration: totalTime,
      results: this.results
    }, null, 2));

    console.log(`💾 Results saved to: ${resultsFile}`);
    console.log('\n✅ Performance tests completed!');
  }
}

// Run tests if called directly
if (require.main === module) {
  const test = new PerformanceTest();
  test.runAllTests().catch(console.error);
}

module.exports = PerformanceTest;
