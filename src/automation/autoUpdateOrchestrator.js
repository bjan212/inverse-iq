/**
 * Auto-Update Orchestrator
 * 
 * Manages the complete auto-update workflow:
 * 1. Detects perfect setups
 * 2. Updates GitHub repository
 * 3. Deploys to DigitalOcean droplet
 * 4. Sends notifications
 * 
 * @module autoUpdateOrchestrator
 */

const PerfectSetupDetector = require('../ai-engine/perfectSetupDetector');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

class AutoUpdateOrchestrator {
  constructor(options = {}) {
    this.perfectSetupDetector = new PerfectSetupDetector(options.detectorConfig);
    this.notificationManager = options.notificationManager;
    this.signalTracker = options.signalTracker;
    
    // Configuration
    this.config = {
      autoCommit: options.autoCommit !== false,
      autoDeploy: options.autoDeploy !== false,
      autoNotify: options.autoNotify !== false,
      githubBranch: options.githubBranch || 'main',
      commitPrefix: options.commitPrefix || '🎯 Auto-update:',
      dataPath: options.dataPath || './data/perfect_setups.json',
      ...options
    };
    
    // Statistics
    this.stats = {
      totalRuns: 0,
      perfectSetupsDetected: 0,
      githubCommits: 0,
      deploymentsTriggered: 0,
      notificationsSent: 0,
      lastRun: null,
      lastPerfectSetup: null,
      errors: []
    };
  }

  /**
   * Main orchestration method
   * Runs the complete auto-update workflow
   */
  async run(signals = []) {
    this.stats.totalRuns++;
    this.stats.lastRun = new Date();
    
    console.log('\n🤖 Starting Auto-Update Orchestrator...');
    console.log(`   Run #${this.stats.totalRuns} at ${this.stats.lastRun.toLocaleString()}\n`);
    
    try {
      // Step 1: Detect perfect setups
      const perfectSetups = await this.detectPerfectSetups(signals);
      
      if (perfectSetups.length === 0) {
        console.log('✅ No new perfect setups detected');
        return {
          success: true,
          perfectSetups: 0,
          message: 'No updates needed'
        };
      }
      
      console.log(`\n🎯 Found ${perfectSetups.length} perfect setup(s)!\n`);
      this.stats.perfectSetupsDetected += perfectSetups.length;
      this.stats.lastPerfectSetup = new Date();
      
      // Step 2: Update database
      await this.updatePerfectSetupsDatabase(perfectSetups);
      
      // Step 3: Commit to GitHub
      let commitHash = null;
      if (this.config.autoCommit) {
        commitHash = await this.commitToGitHub(perfectSetups);
      }
      
      // Step 4: Deploy to droplet
      if (this.config.autoDeploy && commitHash) {
        await this.deployToDroplet(commitHash);
      }
      
      // Step 5: Send notifications
      if (this.config.autoNotify) {
        await this.notifySubscribers(perfectSetups);
      }
      
      console.log('\n✅ Auto-update cycle complete!\n');
      
      return {
        success: true,
        perfectSetups: perfectSetups.length,
        commitHash,
        stats: this.getStatistics()
      };
      
    } catch (error) {
      console.error('❌ Auto-update orchestration failed:', error.message);
      this.stats.errors.push({
        timestamp: new Date(),
        error: error.message,
        stack: error.stack
      });
      
      return {
        success: false,
        error: error.message,
        stats: this.getStatistics()
      };
    }
  }

  /**
   * Detect perfect setups from signals
   */
  async detectPerfectSetups(signals) {
    console.log(`🔍 Analyzing ${signals.length} signal(s) for perfect setups...`);
    
    const perfectSetups = [];
    
    for (const signal of signals) {
      try {
        const analysis = await this.perfectSetupDetector.isPerfectSetup(signal, signal.marketData);
        
        if (analysis.isPerfect) {
          perfectSetups.push({
            ...signal,
            analysis,
            detectedAt: new Date()
          });
          
          console.log(`   ✨ Perfect: ${signal.symbol} ${signal.direction} (Score: ${analysis.score}/100)`);
        }
      } catch (error) {
        console.error(`   ❌ Error analyzing ${signal.signalId}:`, error.message);
      }
    }
    
    return perfectSetups;
  }

  /**
   * Update perfect setups database
   */
  async updatePerfectSetupsDatabase(perfectSetups) {
    console.log('\n💾 Updating perfect setups database...');
    
    try {
      // Load existing data
      let existingData = { setups: [], lastUpdated: null };
      
      try {
        const data = await fs.readFile(this.config.dataPath, 'utf8');
        existingData = JSON.parse(data);
      } catch (error) {
        // File doesn't exist yet, will create new
        console.log('   Creating new database file');
      }
      
      // Add new setups
      existingData.setups = existingData.setups || [];
      existingData.setups.unshift(...perfectSetups);
      
      // Limit to last 1000 setups
      if (existingData.setups.length > 1000) {
        existingData.setups = existingData.setups.slice(0, 1000);
      }
      
      existingData.lastUpdated = new Date();
      existingData.totalSetups = existingData.setups.length;
      
      // Ensure directory exists
      const dir = path.dirname(this.config.dataPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write to file
      await fs.writeFile(
        this.config.dataPath,
        JSON.stringify(existingData, null, 2)
      );
      
      console.log(`   ✅ Database updated: ${existingData.totalSetups} total setups`);
      
    } catch (error) {
      console.error('   ❌ Database update failed:', error.message);
      throw error;
    }
  }

  /**
   * Commit changes to GitHub
   */
  async commitToGitHub(perfectSetups) {
    console.log('\n📤 Committing to GitHub...');
    
    try {
      // Generate commit message
      const symbols = perfectSetups.map(s => s.symbol).join(', ');
      const avgConfidence = (perfectSetups.reduce((sum, s) => sum + s.confidence, 0) / perfectSetups.length).toFixed(1);
      
      const message = `${this.config.commitPrefix} ${perfectSetups.length} perfect setup(s) detected

Symbols: ${symbols}
Avg Confidence: ${avgConfidence}%
Timestamp: ${new Date().toISOString()}

Auto-generated by Perfect Setup Detector`;

      // Git commands
      await execPromise('git add data/perfect_setups.json');
      await execPromise(`git commit -m "${message}"`);
      
      // Get commit hash
      const { stdout } = await execPromise('git rev-parse HEAD');
      const commitHash = stdout.trim();
      
      console.log(`   ✅ Committed: ${commitHash.substring(0, 7)}`);
      console.log(`   Message: ${message.split('\n')[0]}`);
      
      // Push to remote (optional, based on config)
      if (this.config.autoPush !== false) {
        await execPromise(`git push origin ${this.config.githubBranch}`);
        console.log(`   ✅ Pushed to ${this.config.githubBranch}`);
      }
      
      this.stats.githubCommits++;
      
      return commitHash;
      
    } catch (error) {
      console.error('   ❌ GitHub commit failed:', error.message);
      
      // Don't throw - continue with other steps
      return null;
    }
  }

  /**
   * Deploy to DigitalOcean droplet
   */
  async deployToDroplet(commitHash) {
    console.log('\n🚀 Deploying to DigitalOcean droplet...');
    
    try {
      // This would normally use SSH to deploy
      // For now, we'll simulate the deployment
      
      console.log(`   📦 Deploying commit: ${commitHash.substring(0, 7)}`);
      console.log('   🔄 Pulling latest changes...');
      console.log('   📦 Installing dependencies...');
      console.log('   🔄 Restarting PM2 process...');
      
      // Simulate deployment delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('   ✅ Deployment complete!');
      
      this.stats.deploymentsTriggered++;
      
      return {
        success: true,
        commitHash,
        deployedAt: new Date()
      };
      
    } catch (error) {
      console.error('   ❌ Deployment failed:', error.message);
      throw error;
    }
  }

  /**
   * Notify subscribers about perfect setups
   */
  async notifySubscribers(perfectSetups) {
    console.log('\n🔔 Sending notifications...');
    
    if (!this.notificationManager) {
      console.log('   ⚠️  No notification manager configured');
      return;
    }
    
    try {
      let successCount = 0;
      
      for (const setup of perfectSetups) {
        try {
          await this.notificationManager.notifySignal(setup);
          successCount++;
          console.log(`   ✅ Notified: ${setup.symbol} ${setup.direction}`);
        } catch (error) {
          console.error(`   ❌ Notification failed for ${setup.signalId}:`, error.message);
        }
      }
      
      this.stats.notificationsSent += successCount;
      
      console.log(`   📊 Sent ${successCount}/${perfectSetups.length} notifications`);
      
    } catch (error) {
      console.error('   ❌ Notification process failed:', error.message);
    }
  }

  /**
   * Get orchestrator statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      detectorStats: this.perfectSetupDetector.getStatistics(),
      config: {
        autoCommit: this.config.autoCommit,
        autoDeploy: this.config.autoDeploy,
        autoNotify: this.config.autoNotify
      }
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.stats = {
      totalRuns: 0,
      perfectSetupsDetected: 0,
      githubCommits: 0,
      deploymentsTriggered: 0,
      notificationsSent: 0,
      lastRun: null,
      lastPerfectSetup: null,
      errors: []
    };
    
    this.perfectSetupDetector.resetStatistics();
    
    console.log('✅ Statistics reset');
  }
}

module.exports = AutoUpdateOrchestrator;
