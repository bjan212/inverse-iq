# Automated GitHub/Droplet Update System with Enhanced Signal Detection

## Executive Summary

This document outlines a comprehensive system that automatically updates the GitHub repository and DigitalOcean droplet with a new "Perfect Setup Detection Mode" that sends real-time notifications when ideal trading setups are identified.

---

## 1. System Architecture Overview

### Current Infrastructure Analysis

**Existing Components:**
- ✅ GitHub Actions deployment workflow (`.github/workflows/deploy.yml`)
- ✅ Signal generation engine (`ContinuousLearningEngine`)
- ✅ Signal tracking system (`SignalTracker`, `SignalPerformanceTracker`)
- ✅ Notification system (`NotificationManager`, Email, Telegram)
- ✅ Subscriber management (`SubscriberDB`)
- ✅ Auto-deployment scripts (`scripts/deploy-online.sh`, `scripts/quick-push-to-github.sh`)
- ✅ PM2 process management on droplet

**New Components to Build:**
1. **Perfect Setup Detector** - Advanced pattern recognition for "perfect" setups
2. **Auto-Update Orchestrator** - Manages GitHub commits and droplet deployments
3. **Enhanced Notification Dashboard** - Feature-rich notification management UI
4. **Setup Testing Framework** - Validates setups against target goals
5. **Asset Selection Manager** - Dynamic asset/pair selection system

---

## 2. Perfect Setup Detection System

### 2.1 Perfect Setup Criteria

```javascript
// src/ai-engine/perfectSetupDetector.js
class PerfectSetupDetector {
  constructor() {
    this.criteria = {
      // Minimum thresholds for "perfect" classification
      minConfidence: 90,           // 90%+ confidence
      minRiskReward: 3.0,          // 1:3 or better R:R
      maxRiskLevel: 'MEDIUM',      // Medium risk or lower
      minPatternOccurrences: 10,   // Pattern seen 10+ times
      minPatternWinRate: 75,       // 75%+ historical win rate
      
      // Market condition requirements
      requiredConditions: {
        volumeSpike: true,         // Above-average volume
        trendAlignment: true,      // Aligns with broader trend
        supportResistance: true,   // Near key S/R levels
        multiTimeframeConfirm: true // Confirmed on multiple timeframes
      },
      
      // Advanced filters
      excludeHighVolatility: true,  // Skip during extreme volatility
      requireLowSpread: true,       // Tight bid-ask spread
      checkNewsEvents: true         // Avoid major news events
    };
  }

  /**
   * Analyze if a signal qualifies as a "perfect setup"
   */
  async isPerfectSetup(signal, marketData) {
    const checks = {
      confidence: signal.confidence >= this.criteria.minConfidence,
      riskReward: this.calculateRiskReward(signal) >= this.criteria.minRiskReward,
      riskLevel: this.isAcceptableRisk(signal.riskLevel),
      patternQuality: await this.validatePatternQuality(signal.pattern),
      marketConditions: await this.checkMarketConditions(signal.symbol, marketData),
      timing: await this.checkTiming(signal)
    };
    
    // All checks must pass
    const isPerfect = Object.values(checks).every(check => check === true);
    
    return {
      isPerfect,
      checks,
      score: this.calculatePerfectionScore(checks),
      reasoning: this.generateReasoning(checks)
    };
  }
}
```

### 2.2 Multi-Timeframe Analysis

```javascript
// Enhanced signal validation across timeframes
async analyzeMultipleTimeframes(symbol) {
  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
  const analyses = {};
  
  for (const tf of timeframes) {
    analyses[tf] = await this.analyzeTimeframe(symbol, tf);
  }
  
  // Check for alignment
  const alignment = this.checkTimeframeAlignment(analyses);
  
  return {
    timeframes: analyses,
    aligned: alignment.score >= 0.8, // 80%+ alignment
    dominantTrend: alignment.trend,
    strength: alignment.score
  };
}
```

---

## 3. Auto-Update System Architecture

### 3.1 GitHub Auto-Update Workflow

```yaml
# .github/workflows/auto-update-perfect-setups.yml
name: Auto-Update Perfect Setups

on:
  repository_dispatch:
    types: [perfect-setup-detected]
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes
  workflow_dispatch:

jobs:
  update-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run Perfect Setup Detection
        id: detect
        run: |
          node scripts/detectPerfectSetups.js
          echo "::set-output name=has_updates::$(cat /tmp/has_updates.txt)"
          
      - name: Commit and Push Updates
        if: steps.detect.outputs.has_updates == 'true'
        run: |
          git config --global user.name 'Perfect Setup Bot'
          git config --global user.email 'bot@xrypt.net'
          git add data/perfect_setups.json
          git commit -m "🎯 Auto-update: New perfect setups detected"
          git push
          
      - name: Trigger Droplet Deployment
        if: steps.detect.outputs.has_updates == 'true'
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DO_HOST }}
          username: ${{ secrets.DO_USERNAME }}
          password: ${{ secrets.DO_PASSWORD }}
          script: |
            cd /opt/trading-data-collection-service
            git pull origin main
            npm install --production
            pm2 restart inverseiq
            pm2 save
            
      - name: Send Notification
        if: steps.detect.outputs.has_updates == 'true'
        run: |
          node scripts/notifyPerfectSetupDeployment.js
```

### 3.2 Auto-Update Orchestrator

```javascript
// src/automation/autoUpdateOrchestrator.js
class AutoUpdateOrchestrator {
  constructor() {
    this.perfectSetupDetector = new PerfectSetupDetector();
    this.githubClient = new GitHubClient();
    this.dropletClient = new DropletClient();
    this.notificationManager = new NotificationManager();
  }

  /**
   * Main orchestration loop
   */
  async run() {
    console.log('🤖 Starting Auto-Update Orchestrator...');
    
    // 1. Detect perfect setups
    const perfectSetups = await this.detectPerfectSetups();
    
    if (perfectSetups.length === 0) {
      console.log('✅ No new perfect setups detected');
      return;
    }
    
    console.log(`🎯 Found ${perfectSetups.length} perfect setups!`);
    
    // 2. Update local database
    await this.updatePerfectSetupsDatabase(perfectSetups);
    
    // 3. Commit to GitHub
    const commitHash = await this.commitToGitHub(perfectSetups);
    
    // 4. Deploy to droplet
    await this.deployToDroplet(commitHash);
    
    // 5. Send notifications
    await this.notifySubscribers(perfectSetups);
    
    console.log('✅ Auto-update cycle complete!');
  }

  /**
   * Commit changes to GitHub
   */
  async commitToGitHub(perfectSetups) {
    const message = `🎯 Auto-update: ${perfectSetups.length} perfect setup(s) detected

Symbols: ${perfectSetups.map(s => s.symbol).join(', ')}
Avg Confidence: ${this.calculateAvgConfidence(perfectSetups)}%
Timestamp: ${new Date().toISOString()}`;

    return await this.githubClient.commitAndPush({
      files: ['data/perfect_setups.json'],
      message
    });
  }

  /**
   * Deploy to DigitalOcean droplet
   */
  async deployToDroplet(commitHash) {
    return await this.dropletClient.deploy({
      commitHash,
      restartServices: ['inverseiq'],
      runMigrations: false,
      notifyOnComplete: true
    });
  }
}
```

---

## 4. Enhanced Notification Dashboard

### 4.1 New Notification Page Features

```html
<!-- public/notifications-enhanced.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Enhanced Notifications - Xrypt</title>
</head>
<body>
    <!-- Feature 1: Supplement New Features -->
    <section id="feature-supplements">
        <h2>🆕 Feature Supplements</h2>
        <div class="feature-toggles">
            <label>
                <input type="checkbox" id="enablePerfectSetups" checked>
                Perfect Setup Alerts (90%+ confidence)
            </label>
            <label>
                <input type="checkbox" id="enableMultiTimeframe">
                Multi-Timeframe Confirmations
            </label>
            <label>
                <input type="checkbox" id="enableVolumeSpikes">
                Volume Spike Alerts
            </label>
            <label>
                <input type="checkbox" id="enableNewsFilter">
                News Event Filtering
            </label>
            <label>
                <input type="checkbox" id="enableSmartTiming">
                Smart Entry Timing Suggestions
            </label>
        </div>
    </section>

    <!-- Feature 2: Choose All Assets -->
    <section id="asset-selection">
        <h2>📊 Asset Selection</h2>
        
        <!-- Quick Select Buttons -->
        <div class="quick-select">
            <button onclick="selectAllAssets()">Select All</button>
            <button onclick="selectNone()">Deselect All</button>
            <button onclick="selectTop10()">Top 10 by Volume</button>
            <button onclick="selectMajors()">Major Pairs Only</button>
            <button onclick="selectDeFi()">DeFi Tokens</button>
            <button onclick="selectMeme()">Meme Coins</button>
        </div>
        
        <!-- Asset Grid with Search -->
        <input type="text" id="assetSearch" placeholder="Search assets...">
        <div id="assetGrid" class="asset-grid">
            <!-- Dynamically populated -->
        </div>
        
        <!-- Custom Asset Addition -->
        <div class="custom-asset">
            <input type="text" id="customAsset" placeholder="Add custom pair (e.g., BTCUSDT)">
            <button onclick="addCustomAsset()">Add</button>
        </div>
    </section>

    <!-- Feature 3: Receive Every Signal -->
    <section id="signal-frequency">
        <h2>🔔 Signal Frequency</h2>
        <div class="frequency-options">
            <label>
                <input type="radio" name="frequency" value="perfect-only">
                Perfect Setups Only (Recommended)
            </label>
            <label>
                <input type="radio" name="frequency" value="high-confidence">
                High Confidence (85%+)
            </label>
            <label>
                <input type="radio" name="frequency" value="all-signals" checked>
                Every Signal Detected
            </label>
            <label>
                <input type="radio" name="frequency" value="custom">
                Custom Threshold: <input type="number" min="50" max="100" value="70">%
            </label>
        </div>
        
        <!-- Rate Limiting -->
        <div class="rate-limit">
            <label>
                Max Notifications Per Hour:
                <select id="maxPerHour">
                    <option value="unlimited">Unlimited</option>
                    <option value="10">10</option>
                    <option value="20" selected>20</option>
                    <option value="50">50</option>
                </select>
            </label>
        </div>
    </section>

    <!-- Feature 4: Save & Test Setups -->
    <section id="setup-testing">
        <h2>🎯 Setup Testing & Goals</h2>
        
        <!-- Save Setup Configuration -->
        <div class="save-setup">
            <h3>Save Current Configuration</h3>
            <input type="text" id="setupName" placeholder="Setup name (e.g., 'Scalping BTC')">
            <button onclick="saveSetup()">💾 Save Setup</button>
        </div>
        
        <!-- Saved Setups List -->
        <div class="saved-setups">
            <h3>Your Saved Setups</h3>
            <div id="setupsList">
                <!-- Dynamically populated -->
            </div>
        </div>
        
        <!-- Goal Testing -->
        <div class="goal-testing">
            <h3>Test Setup Against Goals</h3>
            <div class="goal-config">
                <label>
                    Target Win Rate:
                    <input type="number" id="targetWinRate" min="0" max="100" value="70">%
                </label>
                <label>
                    Target Profit Factor:
                    <input type="number" id="targetProfitFactor" min="1" max="10" step="0.1" value="2.0">
                </label>
                <label>
                    Testing Timeframe:
                    <select id="testingTimeframe">
                        <option value="1d">1 Day</option>
                        <option value="3d">3 Days</option>
                        <option value="7d" selected>7 Days</option>
                        <option value="14d">14 Days</option>
                        <option value="30d">30 Days</option>
                    </select>
                </label>
                <label>
                    Minimum Signals Required:
                    <input type="number" id="minSignals" min="1" max="100" value="10">
                </label>
            </div>
            
            <button onclick="startGoalTest()">🧪 Start Goal Test</button>
            
            <!-- Test Results -->
            <div id="testResults" class="test-results">
                <!-- Populated after test completion -->
            </div>
        </div>
    </section>

    <!-- Real-time Setup Performance -->
    <section id="live-performance">
        <h2>📈 Live Setup Performance</h2>
        <div id="performanceMetrics">
            <!-- Real-time metrics -->
        </div>
    </section>
</body>
</html>
```

### 4.2 Backend API Endpoints

```javascript
// server.js - New endpoints

/**
 * Get all available assets for signal generation
 * GET /api/assets/available
 */
app.get('/api/assets/available', async (req, res) => {
  try {
    const assets = await assetManager.getAllAvailableAssets();
    
    res.json({
      success: true,
      count: assets.length,
      assets: assets.map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        category: asset.category,
        volume24h: asset.volume24h,
        marketCap: asset.marketCap,
        supported: asset.supported
      })),
      categories: assetManager.getCategories()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Save a notification setup configuration
 * POST /api/notifications/setups/save
 */
app.post('/api/notifications/setups/save', async (req, res) => {
  try {
    const { subscriberId, setupName, configuration } = req.body;
    
    const setup = await setupManager.saveSetup({
      subscriberId,
      name: setupName,
      config: configuration,
      createdAt: new Date()
    });
    
    res.json({
      success: true,
      setup: {
        id: setup.id,
        name: setup.name,
        createdAt: setup.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test a setup against target goals
 * POST /api/notifications/setups/test
 */
app.post('/api/notifications/setups/test', async (req, res) => {
  try {
    const { setupId, goals, timeframe } = req.body;
    
    // Start background test
    const testId = await setupTester.startTest({
      setupId,
      goals,
      timeframe
    });
    
    res.json({
      success: true,
      testId,
      message: 'Test started. Results will be available after the timeframe completes.',
      estimatedCompletion: setupTester.estimateCompletion(timeframe)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get test results for a setup
 * GET /api/notifications/setups/test/:testId
 */
app.get('/api/notifications/setups/test/:testId', async (req, res) => {
  try {
    const results = await setupTester.getTestResults(req.params.testId);
    
    if (!results) {
      return res.status(404).json({
        success: false,
        error: 'Test not found or still in progress'
      });
    }
    
    res.json({
      success: true,
      results: {
        testId: results.testId,
        status: results.status,
        startedAt: results.startedAt,
        completedAt: results.completedAt,
        
        // Performance metrics
        totalSignals: results.totalSignals,
        winCount: results.winCount,
        lossCount: results.lossCount,
        winRate: results.winRate,
        profitFactor: results.profitFactor,
        totalPnl: results.totalPnl,
        avgPnl: results.avgPnl,
        
        // Goal achievement
        goals: results.goals,
        goalsAchieved: results.goalsAchieved,
        goalsMet: results.goalsMet,
        
        // Recommendations
        recommendations: results.recommendations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get perfect setups detected
 * GET /api/signals/perfect-setups
 */
app.get('/api/signals/perfect-setups', async (req, res) => {
  try {
    const { timeframe, limit } = req.query;
    
    const perfectSetups = await perfectSetupDetector.getRecentPerfectSetups({
      timeframe: timeframe || '24h',
      limit: limit ? parseInt(limit) : 50
    });
    
    res.json({
      success: true,
      count: perfectSetups.length,
      setups: perfectSetups,
      stats: {
        avgConfidence: perfectSetups.reduce((sum, s) => sum + s.confidence, 0) / perfectSetups.length,
        avgRiskReward: perfectSetups.reduce((sum, s) => sum + s.riskReward, 0) / perfectSetups.length,
        symbols: [...new Set(perfectSetups.map(s => s.symbol))]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

---

## 5. Setup Testing Framework

### 5.1 Setup Tester Implementation

```javascript
// src/testing/setupTester.js
class SetupTester {
  constructor() {
    this.activeTests = new Map();
    this.completedTests = new Map();
    this.signalTracker = new SignalTracker();
    this.performanceTracker = new SignalPerformanceTracker();
  }

  /**
   * Start a new setup test
   */
  async startTest(options) {
    const { setupId, goals, timeframe } = options;
    
    const testId = this.generateTestId();
    const endTime = this.calculateEndTime(timeframe);
    
    const test = {
      testId,
      setupId,
      goals,
      timeframe,
      startedAt: new Date(),
      endTime,
      status: 'active',
      
      // Tracking
      signals: [],
      results: {
        totalSignals: 0,
        winCount: 0,
        lossCount: 0,
        totalPnl: 0
      }
    };
    
    this.activeTests.set(testId, test);
    
    // Start monitoring
    this.monitorTest(testId);
    
    return testId;
  }

  /**
   * Monitor test progress
   */
  async monitorTest(testId) {
    const test = this.activeTests.get(testId);
    
    if (!test) return;
    
    // Check if test period has ended
    if (new Date() >= test.endTime) {
      await this.completeTest(testId);
      return;
    }
    
    // Continue monitoring
    setTimeout(() => this.monitorTest(testId), 60 * 1000); // Check every minute
  }

  /**
   * Complete a test and generate results
   */
  async completeTest(testId) {
    const test = this.activeTests.get(testId);
    
    if (!test) return;
    
    // Calculate final metrics
    const winRate = (test.results.winCount / test.results.totalSignals) * 100;
    const profitFactor = this.calculateProfitFactor(test.signals);
    const avgPnl = test.results.totalPnl / test.results.totalSignals;
    
    // Check goal achievement
    const goalsAchieved = this.checkGoals(test.goals, {
      winRate,
      profitFactor,
      totalSignals: test.results.totalSignals
    });
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(test, goalsAchieved);
    
    // Finalize test
    test.status = 'completed';
    test.completedAt = new Date();
    test.winRate = winRate;
    test.profitFactor = profitFactor;
    test.avgPnl = avgPnl;
    test.goalsAchieved = goalsAchieved;
    test.recommendations = recommendations;
    
    // Move to completed tests
    this.completedTests.set(testId, test);
    this.activeTests.delete(testId);
    
    // Notify subscriber
    await this.notifyTestCompletion(test);
    
    return test;
  }

  /**
   * Check if goals were met
   */
  checkGoals(goals, results) {
    return {
      winRate: {
        target: goals.targetWinRate,
        actual: results.winRate,
        met: results.winRate >= goals.targetWinRate
      },
      profitFactor: {
        target: goals.targetProfitFactor,
        actual: results.profitFactor,
        met: results.profitFactor >= goals.targetProfitFactor
      },
      minSignals: {
        target: goals.minSignals,
        actual: results.totalSignals,
        met: results.totalSignals >= goals.minSignals
      }
    };
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations(test, goalsAchieved) {
    const recommendations = [];
    
    // Win rate recommendations
    if (!goalsAchieved.winRate.met) {
      recommendations.push({
        type: 'win_rate',
        severity: 'high',
        message: `Win rate (${goalsAchieved.winRate.actual.toFixed(1)}%) is below target (${goalsAchieved.winRate.target}%)`,
        suggestions: [
          'Increase minimum confidence threshold',
          'Add more filters to reduce false signals',
          'Focus on specific market conditions'
        ]
      });
    }
    
    // Profit factor recommendations
    if (!goalsAchieved.profitFactor.met) {
      recommendations.push({
        type: 'profit_factor',
        severity: 'high',
        message: `Profit factor (${goalsAchieved.profitFactor.actual.toFixed(2)}) is below target (${goalsAchieved.profitFactor.target})`,
        suggestions: [
          'Improve risk/reward ratio on entries',
          'Tighten stop losses',
          'Let winners run longer'
        ]
      });
    }
    
    // Sample size recommendations
    if (!goalsAchieved.minSignals.met) {
      recommendations.push({
        type: 'sample_size',
        severity: 'medium',
        message: `Only ${goalsAchieved.minSignals.actual} signals generated (target: ${goalsAchieved.minSignals.target})`,
        suggestions: [
          'Extend testing timeframe',
          'Add more trading pairs',
          'Lower confidence threshold slightly'
        ]
      });
    }
    
    // Success recommendations
    if (Object.values(goalsAchieved).every(goal => goal.met)) {
      recommendations.push({
        type: 'success',
        severity: 'low',
        message: 'All goals achieved! Setup is performing well.',
        suggestions: [
          'Consider going live with this setup',
          'Monitor performance in real trading',
          'Gradually increase position sizes'
        ]
      });
    }
    
    return recommendations;
  }
}
```

---

## 6. Implementation Roadmap

### Phase 1: Perfect Setup Detection (Week 1)
- [ ] Create `PerfectSetupDetector` class
- [ ] Implement multi-timeframe analysis
- [ ] Add market condition validators
- [ ] Create perfect setup database schema
- [ ] Test detection accuracy

### Phase 2: Auto-Update System (Week 2)
- [ ] Build `AutoUpdateOrchestrator`
- [ ] Create GitHub Actions workflow
- [ ] Implement droplet deployment automation
- [ ] Add rollback mechanisms
- [ ] Test end-to-end automation

### Phase 3: Enhanced Notification Dashboard (Week 3)
- [ ] Design new notification page UI
- [ ] Implement asset selection manager
- [ ] Add feature supplement toggles
- [ ] Create signal frequency controls
- [ ] Build real-time performance display

### Phase 4: Setup Testing Framework (Week 4)
- [ ] Implement `SetupTester` class
- [ ] Create setup save/load functionality
- [ ] Build goal testing engine
- [ ] Add recommendation generator
- [ ] Create test results dashboard

### Phase 5: Integration & Testing (Week 5)
- [ ] Integrate all components
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

### Phase 6: Deployment (Week 6)
- [ ] Deploy to staging environment
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor and iterate

---

## 7. File Structure

```
trading-data-collection-service/
├── src/
│   ├── ai-engine/
│   │   ├── perfectSetupDetector.js          # NEW
│   │   └── multiTimeframeAnalyzer.js        # NEW
│   ├── automation/
│   │   ├── autoUpdateOrchestrator.js        # NEW
│   │   ├── githubClient.js                  # NEW
│   │   └── dropletClient.js                 # NEW
│   ├── testing/
│   │   ├── setupTester.js                   # NEW
│   │   └── goalValidator.js                 # NEW
│   ├── management/
│   │   ├── assetManager.js                  # NEW
│   │   └── setupManager.js                  # NEW
│   └── notifications/
│       └── enhancedNotificationManager.js   # ENHANCED
├── public/
│   └── notifications-enhanced.html          # NEW
├── scripts/
│   ├── detectPerfectSetups.js              # NEW
│   ├── notifyPerfectSetupDeployment.js     # NEW
│   └── testSetupGoals.js                   # NEW
├── data/
│   ├── perfect_setups.json                 # NEW
│   ├── saved_setups.json                   # NEW
│   └── setup_tests.json                    # NEW
├── .github/
│   └── workflows/
│       └── auto-update-perfect-setups.yml  # NEW
└── docs/
    ├── PERFECT_SETUP_DETECTION.md          # NEW
    ├── AUTO_UPDATE_SYSTEM.md               # NEW
    └── SETUP_TESTING_GUIDE.md              # NEW
```

---

## 8. JSON Output Format

### Perfect Setup Detection Output

```json
{
  "features": {
    "perfectSetupDetection": {
      "enabled": true,
      "criteria": {
        "minConfidence": 90,
        "minRiskReward": 3.0,
        "maxRiskLevel": "MEDIUM",
        "minPatternOccurrences": 10,
        "minPatternWinRate": 75
      },
      "filters": {
        "volumeSpike": true,
        "trendAlignment": true,
        "supportResistance": true,
        "multiTimeframeConfirm": true,
        "excludeHighVolatility": true,
        "requireLowSpread": true,
        "checkNewsEvents": true
      }
    },
    "supplementNewFeatures": {
      "perfectSetupAlerts": true,
      "multiTimeframeConfirmations": true,
      "volumeSpikeAlerts": true,
      "newsEventFiltering": true,
      "smartEntryTiming": true
    },
    "chooseAssets": {
      "selectionMode": "custom",
      "quickSelects": ["all", "top10", "majors", "defi", "meme"],
      "customAssets": ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
      "totalAssets": 150,
      "categories": ["major", "defi", "meme", "gaming", "layer1", "layer2"]
    },
    "receiveAllSignals": {
      "frequency": "all-signals",
      "options": ["perfect-only", "high-confidence", "all-signals", "custom"],
      "customThreshold": 70,
      "rateLimiting": {
        "enabled": true,
        "maxPerHour": 20
      }
    },
    "saveAndTestSetup": {
      "saveEnabled": true,
      "testingEnabled": true,
      "goals": {
        "targetWinRate": 70,
        "targetProfitFactor": 2.0,
        "testingTimeframe": "7d",
        "minSignalsRequired": 10
      },
      "savedSet
