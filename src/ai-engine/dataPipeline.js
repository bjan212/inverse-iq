/**
 * Data Pipeline for AI Engine Integration
 *
 * This module provides utilities for seamless data flow between
 * the trading data collection service and the AI engine.
 */

const fs = require('fs');
const path = require('path');
const SelfImprovingEngine = require('./selfImprovingEngine');

class DataPipeline {
  constructor() {
    this.aiEngine = new SelfImprovingEngine();
    this.submissionsDir = path.join(__dirname, '../../output/submissions');
    this.processedSubmissions = new Set();
    this.isMonitoring = false;
  }

  /**
   * Process a single submission file
   */
  async processSubmissionFile(filename) {
    const filepath = path.join(this.submissionsDir, filename);

    if (!fs.existsSync(filepath)) {
      console.log(`⚠️  Submission file not found: ${filename}`);
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      if (!data.trades || !Array.isArray(data.trades)) {
        console.log(`⚠️  No trades found in ${filename}`);
        return null;
      }

      console.log(`📥 Processing submission: ${data.submissionId} (${data.trades.length} trades)`);

      const traderData = {
        traderId: data.submissionId,
        trades: data.trades
      };

      const result = await this.aiEngine.addNewTraderData(traderData);

      console.log(`✅ AI Engine updated: +${result.patternsAdded} patterns, strengthened ${result.patternsUpdated}`);

      this.processedSubmissions.add(data.submissionId);

      return {
        submissionId: data.submissionId,
        tradesProcessed: data.trades.length,
        patternsAdded: result.patternsAdded,
        patternsUpdated: result.patternsUpdated,
        totalPatterns: result.totalPatterns,
        totalTraders: result.totalTraders
      };

    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message);
      return null;
    }
  }

  /**
   * Process all new submissions
   */
  async processNewSubmissions() {
    if (!fs.existsSync(this.submissionsDir)) {
      console.log('⚠️  Submissions directory does not exist');
      return [];
    }

    const files = fs.readdirSync(this.submissionsDir)
      .filter(f => f.endsWith('.json'))
      .sort(); // Process in chronological order

    const results = [];

    for (const file of files) {
      const filepath = path.join(this.submissionsDir, file);
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      // Skip already processed submissions
      if (this.processedSubmissions.has(data.submissionId)) {
        continue;
      }

      const result = await this.processSubmissionFile(file);
      if (result) {
        results.push(result);
      }
    }

    if (results.length > 0) {
      console.log(`\n📊 Batch processing complete: ${results.length} new submissions processed`);
      console.log(`📈 Total patterns in database: ${results[results.length - 1].totalPatterns}`);
    }

    return results;
  }

  /**
   * Start continuous monitoring for new submissions
   */
  startMonitoring(intervalMs = 30000) { // Default 30 seconds
    if (this.isMonitoring) {
      console.log('📡 Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log(`📡 Starting data pipeline monitoring (every ${intervalMs / 1000}s)...`);

    this.monitorInterval = setInterval(async () => {
      try {
        const results = await this.processNewSubmissions();
        if (results.length > 0) {
          // Could emit events or send notifications here
          console.log(`🔄 Processed ${results.length} new submissions`);
        }
      } catch (error) {
        console.error('Monitoring error:', error.message);
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log('📡 Data pipeline monitoring stopped');
  }

  /**
   * Get pipeline statistics
   */
  getStatistics() {
    return {
      isMonitoring: this.isMonitoring,
      processedSubmissions: this.processedSubmissions.size,
      aiEngineStats: this.aiEngine.getStatistics()
    };
  }

  /**
   * Force reprocessing of all submissions (for recovery)
   */
  async reprocessAll() {
    console.log('🔄 Reprocessing all submissions...');
    this.processedSubmissions.clear();
    return await this.processNewSubmissions();
  }

  /**
   * Generate signals using current AI engine state
   */
  async generateSignals(symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT']) {
    return await this.aiEngine.generateSmartSignals(symbols);
  }
}

module.exports = DataPipeline;
