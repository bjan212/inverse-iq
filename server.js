/**
 * Web-Based Submission Server
 * 
 * Provides:
 * - REST API for submissions
 * - WebSocket for real-time updates
 * - CORS support for frontend
 * - Complete automation
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
const AutomatedSubmissionHandler = require('./scripts/automatedSubmissionHandler');
const SelfImprovingEngine = require('./src/ai-engine/selfImprovingEngine');
const DataPipeline = require('./src/ai-engine/dataPipeline');
const SignalTracker = require('./src/tracking/signalTracker');
const NotificationManager = require('./src/notifications/notificationManager');
const BackupManager = require('./src/utils/backupManager');

// Security and validation middleware
const {
  apiLimiter,
  submissionLimiter,
  feedbackLimiter,
  notificationLimiter,
  adminLoginLimiter,
  authenticateAdmin,
  helmetConfig,
  getCorsOptions,
  setupGlobalErrorHandlers,
  requestLogger
} = require('./src/middleware/security');

const {
  validateSubmission,
  validateSignalOutcome,
  validateSubscription,
  validateSubscriberId,
  validateSignalId,
  validateSymbols,
  validateRegisterSignal,
  sanitizeHtml
} = require('./src/middleware/validation');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Honor X-Forwarded-* headers when behind a proxy (nginx)
app.set('trust proxy', 1);

// Secure admin authentication
const { setupSession, requireAdminLogin, handleAdminLogin, handleAdminLogout, enforceAdminIpWhitelist } = require('./src/middleware/adminAuth');
setupSession(app);

// Setup global error handlers
setupGlobalErrorHandlers();

// Security middleware
app.use(helmetConfig);
app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const adminIpWhitelist = enforceAdminIpWhitelist;

// Protect admin.html
app.get('/admin.html', adminIpWhitelist, requireAdminLogin, (req, res, next) => {
  res.sendFile(__dirname + '/public/admin.html');
});

// Admin login page
app.get('/admin-login', adminIpWhitelist, (req, res) => {
  res.sendFile(__dirname + '/public/admin-login.html');
});

// Handle admin login
app.post('/admin-login', adminIpWhitelist, adminLoginLimiter, express.urlencoded({ extended: true }), handleAdminLogin);

// Admin logout
app.get('/admin-logout', adminIpWhitelist, handleAdminLogout);

// Block direct static access to admin.html
app.use((req, res, next) => {
  if (req.path === '/admin.html') {
    return res.status(403).send('Forbidden');
  }
  next();
});

// Serve static files (after admin protection)
app.use(express.static('public'));

// Request logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// Sanitize all inputs
app.use(sanitizeHtml);

// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);

// Store active WebSocket connections
const connections = new Map();

// Initialize AI Engine, Data Pipeline, Signal Tracker, and Notification Manager
const ContinuousLearningEngine = require('./src/ai-engine/continuousLearningEngine');
const aiEngine = new ContinuousLearningEngine();
const dataPipeline = new DataPipeline();
const signalTracker = new SignalTracker('./data/active_signals.json');
const notificationManager = new NotificationManager(signalTracker); // FIXED: Pass signalTracker

// Connect signal tracker to AI engine
aiEngine.setSignalTracker(signalTracker);

// Connect signal tracker to notification manager (redundant but explicit)
notificationManager.setSignalTracker(signalTracker);

// Auto-import online signals on startup
aiEngine.importOnlineSignals();

// Initialize notification manager
notificationManager.initialize().catch(err => {
  console.error('Failed to initialize notification manager:', err);
});

// Export for testing purposes
if (process.env.NODE_ENV === 'test') {
  module.exports.signalTracker = signalTracker;
  module.exports.aiEngine = aiEngine;
  module.exports.notificationManager = notificationManager;
}

// Start data pipeline monitoring
dataPipeline.startMonitoring(60000); // Check every minute

// Periodic cleanup of expired signals (every hour)
setInterval(() => {
  const expired = signalTracker.checkExpiredSignals();
  if (expired > 0) {
    console.log(`⏰ Marked ${expired} signals as expired`);
  }
}, 60 * 60 * 1000);

// WebSocket connection handler
wss.on('connection', (ws) => {
  const connectionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  connections.set(connectionId, ws);
  
  console.log(`WebSocket connected: ${connectionId}`);
  
  ws.on('close', () => {
    connections.delete(connectionId);
    console.log(`WebSocket disconnected: ${connectionId}`);
  });
  
  // Send connection ID to client
  ws.send(JSON.stringify({
    type: 'connected',
    connectionId
  }));
});

// Send update to specific connection
function sendUpdate(connectionId, update) {
  const ws = connections.get(connectionId);
  if (ws && ws.readyState === 1) { // OPEN
    ws.send(JSON.stringify(update));
  }
}

/**
 * API ENDPOINTS
 */

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    activeConnections: connections.size
  });
});

// Submit trading data
app.post('/api/submit', submissionLimiter, validateSubmission, async (req, res) => {
  const { exchange, apiKey, apiSecret, walletAddress, network, connectionId } = req.body;
  
  try {
    // Create handler with WebSocket updates
    const handler = new AutomatedSubmissionHandler();
    
    // Override console.log to send updates via WebSocket
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      if (connectionId) {
        const message = args.join(' ');
        sendUpdate(connectionId, {
          type: 'log',
          message,
          timestamp: new Date()
        });
      }
    };
    
    // Send initial update
    if (connectionId) {
      sendUpdate(connectionId, {
        type: 'status',
        status: 'processing',
        message: 'Starting submission processing...'
      });
    }
    
    // Process submission
    const result = await handler.processSubmission({
      exchange,
      apiKey,
      apiSecret,
      walletAddress,
      network: network || 'TRC20'
    });

    // Restore console.log
    console.log = originalLog;

    // Trigger AI engine update asynchronously (don't block response)
    if (result.status === 'completed') {
      setImmediate(async () => {
        try {
          // The handler already fed data to AI, but we can trigger additional processing
          console.log('🧠 Triggering AI engine refresh...');
          const stats = aiEngine.getStatistics();
          console.log(`📊 AI Engine now has ${stats.database.totalPatterns} patterns from ${stats.database.totalTraders} traders`);

          // Send AI update notification via WebSocket
          if (connectionId) {
            sendUpdate(connectionId, {
              type: 'ai_update',
              message: `AI Engine updated with new trading data. Total patterns: ${stats.database.totalPatterns}`,
              stats: {
                totalPatterns: stats.database.totalPatterns,
                totalTraders: stats.database.totalTraders,
                avgConfidence: stats.patterns.avgConfidence
              }
            });
          }
        } catch (aiError) {
          console.error('AI engine refresh error:', aiError.message);
        }
      });
    }

    // Send final result via WebSocket
    if (connectionId) {
      sendUpdate(connectionId, {
        type: 'complete',
        result
      });
    }
    
    // Return result
    if (result.status === 'completed') {
      res.json({
        success: true,
        result: result.finalResult
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || result.rejectionReason,
        result
      });
    }
    
  } catch (error) {
    console.error('Submission error:', error);
    
    if (connectionId) {
      sendUpdate(connectionId, {
        type: 'error',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get submission status
app.get('/api/status/:submissionId', (req, res) => {
  const handler = new AutomatedSubmissionHandler();
  const status = handler.getSubmissionStatus(req.params.submissionId);
  
  if (status.found) {
    res.json(status);
  } else {
    res.status(404).json({
      error: 'Submission not found'
    });
  }
});

// Get supported exchanges
app.get('/api/exchanges', (req, res) => {
  res.json({
    exchanges: [
      {
        id: 'binance',
        name: 'Binance Futures',
        supported: true,
        speed: 'Fast (10-60 seconds)',
        recommended: true
      },
      {
        id: 'bybit',
        name: 'Bybit Futures',
        supported: true,
        speed: 'Medium (30-300 seconds)',
        recommended: true
      },
      {
        id: 'okx',
        name: 'OKX Futures',
        supported: false,
        speed: 'Coming soon',
        recommended: false
      }
    ]
  });
});

// Get supported networks
app.get('/api/networks', (req, res) => {
  const CryptoPaymentProcessor = require('./src/payment/cryptoPaymentProcessor');
  const processor = new CryptoPaymentProcessor();
  
  res.json({
    networks: processor.getSupportedNetworks()
  });
});

// Get quality requirements
app.get('/api/requirements', (req, res) => {
  const DataQualityValidator = require('./src/validators/dataQualityValidator');
  const validator = new DataQualityValidator();

  res.json({
    minimumRequirements: validator.minimumRequirements,
    scoringWeights: validator.scoringWeights,
    paymentTiers: validator.paymentTiers
  });
});

// Get enhanced payout tiers and multipliers
app.get('/api/enhanced-payouts/info', (req, res) => {
  const EnhancedPayoutValidator = require('./src/validators/enhancedPayoutValidator');
  const validator = new EnhancedPayoutValidator();

  res.json({
    success: true,
    system: 'Enhanced Payout System with Accuracy Multipliers',
    basePaymentTiers: validator.paymentTiers,
    accuracyMultipliers: validator.accuracyMultipliers,
    volumeBonuses: validator.volumeBonuses,
    capitalBonuses: validator.capitalBonuses,
    examples: [
      {
        profile: 'Elite Trader',
        winRate: '92%',
        trades: 1200,
        capital: '$55k',
        estimatedPayout: '$295-$475 USDT'
      },
      {
        profile: 'Master Trader',
        winRate: '87%',
        trades: 600,
        capital: '$25k',
        estimatedPayout: '$152-$277 USDT'
      },
      {
        profile: 'Advanced Trader',
        winRate: '77%',
        trades: 350,
        capital: '$8k',
        estimatedPayout: '$72-$125 USDT'
      }
    ]
  });
});

// Test enhanced payout calculation with sample data
app.post('/api/enhanced-payouts/calculate', async (req, res) => {
  try {
    const { tradeCount, winRate, peakCapital, tradingDays, tradingSpan, symbols } = req.body;

    // Validate input
    if (!tradeCount || !winRate || !peakCapital) {
      return res.status(400).json({
        success: false,
        error: 'tradeCount, winRate, and peakCapital are required'
      });
    }

    // Generate sample trade data
    const { generateTradeData } = require('./scripts/testEnhancedPayouts');
    const tradeData = generateTradeData({
      tradeCount: parseInt(tradeCount),
      winRate: parseFloat(winRate) / 100,
      peakCapital: parseFloat(peakCapital),
      tradingDays: parseInt(tradingDays) || 180,
      tradingSpan: parseInt(tradingSpan) || 365,
      symbols: symbols || ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
    });

    // Calculate payout using enhanced validator
    const EnhancedPayoutValidator = require('./src/validators/enhancedPayoutValidator');
    const validator = new EnhancedPayoutValidator();
    const result = await validator.validateAndScore(tradeData);

    if (result.passed) {
      res.json({
        success: true,
        result: {
          passed: true,
          totalPayout: result.payment,
          paymentCurrency: result.paymentCurrency,
          breakdown: result.paymentBreakdown,
          qualityScore: result.score,
          qualityTier: result.tier,
          metrics: result.enhancedPayout?.metrics
        }
      });
    } else {
      res.json({
        success: false,
        result: {
          passed: false,
          failureReason: result.failureReason,
          requirements: result.requirements
        }
      });
    }

  } catch (error) {
    console.error('Enhanced payout calculation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update payout settings (Admin only)
app.post('/api/admin/payouts', authenticateAdmin, (req, res) => {
  const { tier, amount } = req.body;

  if (!tier || amount === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Missing tier or amount'
    });
  }

  try {
    const DataQualityValidator = require('./src/validators/dataQualityValidator');

    // Update the payment tier
    const tierIndex = DataQualityValidator.prototype.paymentTiers.findIndex(t =>
      t.label.toLowerCase() === tier.toLowerCase()
    );

    if (tierIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier'
      });
    }

    // Update the payment amount
    DataQualityValidator.prototype.paymentTiers[tierIndex].payment = parseFloat(amount);

    console.log(`✅ Updated ${tier} payout to ${amount} USDT`);

    res.json({
      success: true,
      message: `Updated ${tier} payout to ${amount} USDT`,
      updatedTier: DataQualityValidator.prototype.paymentTiers[tierIndex]
    });

  } catch (error) {
    console.error('Payout update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get admin statistics
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  try {
    // In production, this would fetch from database
    // For now, return mock data
    const stats = {
      totalSubmissions: 47,
      completedSubmissions: 42,
      totalPaid: 1250,
      avgQualityScore: 78
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get recent submissions (Admin only)
app.get('/api/admin/submissions', authenticateAdmin, (req, res) => {
  try {
    // In production, this would fetch from database
    // For now, return mock data
    const submissions = [
      {
        id: 'SUB123456',
        exchange: 'Binance',
        qualityScore: 89,
        payment: 40,
        status: 'completed',
        timestamp: '2024-11-03T10:30:00Z'
      },
      {
        id: 'SUB123455',
        exchange: 'Bybit',
        qualityScore: 76,
        payment: 25,
        status: 'completed',
        timestamp: '2024-11-02T15:45:00Z'
      },
      {
        id: 'SUB123454',
        exchange: 'Binance',
        qualityScore: 82,
        payment: 25,
        status: 'completed',
        timestamp: '2024-11-02T09:20:00Z'
      }
    ];

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get AI engine statistics
app.get('/api/ai/stats', (req, res) => {
  try {
    const stats = aiEngine.getStatistics();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get continuous learning statistics
app.get('/api/ai/continuous-learning', (req, res) => {
  try {
    const stats = aiEngine.getContinuousLearningStats();

    // Clean up circular references for JSON serialization
    const cleanStats = {
      enabled: stats.continuousLearning.enabled,
      uptime: stats.continuousLearning.uptime,
      dataPointsPerHour: stats.continuousLearning.dataPointsPerHour,
      learningEfficiency: stats.continuousLearning.learningEfficiency,
      dataSourceContributions: stats.continuousLearning.learningMetrics.dataSourceContributions,
      totalDataPoints: stats.continuousLearning.learningMetrics.totalDataPoints,
      patternsLearned: stats.continuousLearning.learningMetrics.patternsLearned,
      learningRate: stats.continuousLearning.learningMetrics.learningRate,
      lastAccuracyCheck: stats.continuousLearning.learningMetrics.lastAccuracyCheck,
      dataSources: {}
    };

    // Clean data sources info
    for (const [name, config] of Object.entries(stats.continuousLearning.dataSources)) {
      cleanStats.dataSources[name] = {
        active: config.active,
        interval: config.interval,
        lastUpdate: config.lastUpdate ? config.lastUpdate.toISOString() : null
      };
    }

    res.json({
      success: true,
      continuousLearning: cleanStats,
      hybridStats: {
        totalPatterns: stats.database.totalPatterns,
        totalTraders: stats.database.totalTraders,
        combinedPatterns: stats.hybrid.bySource.combined,
        accuracy: stats.performance.accuracy
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Show continuous learning status (Admin only)
app.get('/api/ai/continuous-learning/status', authenticateAdmin, (req, res) => {
  try {
    aiEngine.showContinuousLearningStatus();
    res.json({
      success: true,
      message: 'Continuous learning status logged to console'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Control data sources (Admin only)
app.post('/api/ai/data-sources/:action', authenticateAdmin, (req, res) => {
  try {
    const { action } = req.params;
    const { sourceName } = req.body;

    if (!sourceName) {
      return res.status(400).json({
        success: false,
        error: 'sourceName is required'
      });
    }

    switch (action) {
      case 'enable':
        if (aiEngine.dataSources[sourceName]) {
          aiEngine.dataSources[sourceName].active = true;
          aiEngine.startDataSource(sourceName, aiEngine.dataSources[sourceName]);
          console.log(`✅ Enabled data source: ${sourceName}`);
          res.json({
            success: true,
            message: `Enabled data source: ${sourceName}`
          });
        } else {
          res.status(400).json({
            success: false,
            error: `Unknown data source: ${sourceName}`
          });
        }
        break;

      case 'disable':
        if (aiEngine.dataSources[sourceName]) {
          aiEngine.dataSources[sourceName].active = false;
          if (aiEngine.dataSources[sourceName].intervalId) {
            clearInterval(aiEngine.dataSources[sourceName].intervalId);
            aiEngine.dataSources[sourceName].intervalId = null;
          }
          console.log(`🛑 Disabled data source: ${sourceName}`);
          res.json({
            success: true,
            message: `Disabled data source: ${sourceName}`
          });
        } else {
          res.status(400).json({
            success: false,
            error: `Unknown data source: ${sourceName}`
          });
        }
        break;

      default:
        res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Use 'enable' or 'disable'`
        });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Force data collection from specific source (Admin only)
app.post('/api/ai/collect/:sourceName', authenticateAdmin, async (req, res) => {
  try {
    const { sourceName } = req.params;

    if (!aiEngine.dataSources[sourceName]) {
      return res.status(400).json({
        success: false,
        error: `Unknown data source: ${sourceName}`
      });
    }

    console.log(`🔄 Forcing data collection from: ${sourceName}`);
    await aiEngine.collectDataFromSource(sourceName);

    res.json({
      success: true,
      message: `Data collection completed for: ${sourceName}`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available data sources
app.get('/api/ai/data-sources', (req, res) => {
  try {
    const dataSources = {};

    for (const [name, config] of Object.entries(aiEngine.dataSources)) {
      dataSources[name] = {
        active: config.active,
        interval: config.interval,
        lastUpdate: config.lastUpdate,
        description: aiEngine.getDataSourceDescription(name)
      };
    }

    res.json({
      success: true,
      dataSources
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get signal cache statistics
app.get('/api/ai/cache', (req, res) => {
  try {
    const cacheStats = aiEngine.getCacheStats();
    res.json({
      success: true,
      cache: cacheStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear signal cache (Admin only)
app.post('/api/ai/cache/clear', authenticateAdmin, (req, res) => {
  try {
    const { symbol } = req.body;
    aiEngine.clearCache(symbol);
    
    res.json({
      success: true,
      message: symbol ? `Cache cleared for ${symbol}` : 'All cache cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current AI signals (using Hybrid Engine)
app.get('/api/signals', validateSymbols, async (req, res) => {
  try {
    // FIXED: Use the SAME aiEngine instance instead of creating a new one
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    const signals = await aiEngine.generateSmartSignals(symbols);
    
    // Send notifications for new signals (async, don't block response)
    if (signals.length > 0 && notificationManager.isReady()) {
      setImmediate(async () => {
        for (const signal of signals) {
          try {
            await notificationManager.notifySignal(signal);
          } catch (error) {
            console.error(`Failed to send notifications for signal ${signal.signalId}:`, error.message);
          }
        }
      });
    }
    
    // Get database stats
    const stats = aiEngine.getHybridStatistics();
    
    res.json({
      success: true,
      signals,
      stats: {
        activeSignals: signals.length,
        avgConfidence: signals.length > 0 
          ? (signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length).toFixed(1)
          : 0,
        totalPatterns: stats.database.totalPatterns,
        combinedPatterns: stats.hybrid.bySource.combined,
        dataSources: stats.database.totalTraders
      },
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Signal generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      signals: [],
      stats: {
        activeSignals: 0,
        avgConfidence: 0,
        totalPatterns: 0,
        combinedPatterns: 0,
        dataSources: 0
      }
    });
  }
});

// ============================================================================
// PERFORMANCE FEEDBACK ENDPOINTS
// ============================================================================

/**
 * Register a signal manually (for testing/debugging)
 * POST /api/feedback/register-signal
 */
app.post('/api/feedback/register-signal', feedbackLimiter, validateRegisterSignal, (req, res) => {
  try {
    const { signalId, symbol, direction, confidence, pattern } = req.body;

    if (!signalId || !symbol || !direction) {
      return res.status(400).json({
        success: false,
        error: 'signalId, symbol, and direction are required'
      });
    }

    const signal = {
      signalId,
      symbol,
      direction,
      confidence: confidence || 75,
      pattern: pattern || { key: 'MANUAL_TEST_PATTERN' },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      reason: 'Manually registered for testing'
    };

    const tracked = signalTracker.registerSignal(signal);

    res.json({
      success: true,
      message: 'Signal registered successfully',
      signal: tracked
    });

  } catch (error) {
    console.error('Signal registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Submit signal outcome for performance feedback
 * POST /api/feedback/signal-outcome
 */
app.post('/api/feedback/signal-outcome', feedbackLimiter, validateSignalOutcome, async (req, res) => {
  try {
    const { signalId, outcome, entryPrice, exitPrice, pnl, pnlPercentage, duration, notes } = req.body;

    // Validate required fields
    if (!signalId) {
      return res.status(400).json({
        success: false,
        error: 'signalId is required'
      });
    }

    if (!outcome || !['win', 'loss'].includes(outcome)) {
      return res.status(400).json({
        success: false,
        error: 'outcome must be "win" or "loss"'
      });
    }

    // Check if signal exists
    if (!signalTracker.hasSignal(signalId)) {
      return res.status(404).json({
        success: false,
        error: `Signal not found: ${signalId}`,
        hint: 'Signal may have expired or was never generated'
      });
    }

    // Update signal with outcome
    const updatedSignal = signalTracker.updateSignalOutcome(signalId, {
      outcome,
      entryPrice,
      exitPrice,
      pnl: pnl || 0,
      pnlPercentage: pnlPercentage || 0,
      duration,
      notes
    });

    // Record outcome in AI engine for learning
    const outcomeData = {
      success: outcome === 'win',
      pnl: pnl || 0,
      pnlPercentage: pnlPercentage || 0,
      duration,
      notes
    };

    const performance = await aiEngine.recordSignalOutcome(signalId, outcomeData);

    // Get updated statistics
    const trackerStats = signalTracker.getStatistics();
    const aiStats = aiEngine.getStatistics();

    console.log(`\n📊 Feedback recorded for ${signalId}:`);
    console.log(`   Outcome: ${outcome.toUpperCase()}`);
    console.log(`   PnL: ${pnl || 0}`);
    console.log(`   Overall Win Rate: ${trackerStats.winRate}%`);
    console.log(`   AI Accuracy: ${aiStats.performance.accuracy}%\n`);

    res.json({
      success: true,
      message: 'Signal outcome recorded successfully',
      signal: {
        signalId: updatedSignal.signalId,
        symbol: updatedSignal.symbol,
        outcome: updatedSignal.outcome,
        pnl: updatedSignal.pnl,
        status: updatedSignal.status
      },
      performance,
      stats: {
        trackerStats,
        aiAccuracy: aiStats.performance.accuracy
      }
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Submit batch signal outcomes
 * POST /api/feedback/batch
 */
app.post('/api/feedback/batch', feedbackLimiter, async (req, res) => {
  try {
    const { outcomes } = req.body;

    if (!Array.isArray(outcomes) || outcomes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'outcomes must be a non-empty array'
      });
    }

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const outcome of outcomes) {
      results.processed++;

      try {
        // Validate
        if (!outcome.signalId || !outcome.outcome) {
          throw new Error('Missing signalId or outcome');
        }

        // Update signal
        signalTracker.updateSignalOutcome(outcome.signalId, outcome);

        // Record in AI engine
        await aiEngine.recordSignalOutcome(outcome.signalId, {
          success: outcome.outcome === 'win',
          pnl: outcome.pnl || 0,
          pnlPercentage: outcome.pnlPercentage || 0
        });

        results.successful++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          signalId: outcome.signalId,
          error: error.message
        });
      }
    }

    console.log(`\n📊 Batch feedback processed:`);
    console.log(`   Total: ${results.processed}`);
    console.log(`   Successful: ${results.successful}`);
    console.log(`   Failed: ${results.failed}\n`);

    res.json({
      success: true,
      message: `Processed ${results.processed} outcomes`,
      results
    });

  } catch (error) {
    console.error('Batch feedback error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get signal tracking statistics
 * GET /api/feedback/stats
 */
app.get('/api/feedback/stats', (req, res) => {
  try {
    const trackerStats = signalTracker.getStatistics();
    const aiStats = aiEngine.getStatistics();

    res.json({
      success: true,
      tracker: trackerStats,
      ai: {
        totalPatterns: aiStats.database.totalPatterns,
        totalTraders: aiStats.database.totalTraders,
        accuracy: aiStats.performance.accuracy,
        totalSignals: aiStats.performance.totalSignals,
        successfulSignals: aiStats.performance.successfulSignals,
        failedSignals: aiStats.performance.failedSignals
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
 * Get signal history
 * GET /api/feedback/history
 */
app.get('/api/feedback/history', (req, res) => {
  try {
    const { symbol, status, limit } = req.query;

    let signals = signalTracker.getAllSignals();

    // Filter by symbol
    if (symbol) {
      signals = signals.filter(s => s.symbol === symbol);
    }

    // Filter by status
    if (status) {
      signals = signals.filter(s => s.status === status);
    }

    // Sort by date (newest first)
    signals.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

    // Limit results
    if (limit) {
      signals = signals.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      count: signals.length,
      signals
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get specific signal details
 * GET /api/feedback/signal/:signalId
 */
app.get('/api/feedback/signal/:signalId', validateSignalId, (req, res) => {
  try {
    const signal = signalTracker.getSignal(req.params.signalId);

    if (!signal) {
      return res.status(404).json({
        success: false,
        error: 'Signal not found'
      });
    }

    res.json({
      success: true,
      signal
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// NOTIFICATION SUBSCRIPTION ENDPOINTS
// ============================================================================

/**
 * Subscribe to notifications
 * POST /api/notifications/subscribe
 */
app.post('/api/notifications/subscribe', notificationLimiter, validateSubscription, async (req, res) => {
  try {
    const { email, telegramChatId, preferences } = req.body;

    // Validate input
    if (!email && !telegramChatId) {
      return res.status(400).json({
        success: false,
        error: 'At least one contact method (email or telegramChatId) is required'
      });
    }

    // Add subscriber
    const subscriberDB = notificationManager.getSubscriberDB();
    const subscriber = subscriberDB.addSubscriber({
      email,
      telegramChatId,
      preferences
    });

    console.log(`✅ New subscriber added: ${subscriber.id}`);

    res.json({
      success: true,
      message: 'Successfully subscribed to notifications',
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        telegramChatId: subscriber.telegramChatId,
        preferences: subscriber.preferences,
        createdAt: subscriber.createdAt
      }
    });

  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get subscriber information
 * GET /api/notifications/subscriber/:id
 */
app.get('/api/notifications/subscriber/:id', validateSubscriberId, (req, res) => {
  try {
    const subscriberDB = notificationManager.getSubscriberDB();
    const subscriber = subscriberDB.getSubscriber(req.params.id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        error: 'Subscriber not found'
      });
    }

    res.json({
      success: true,
      subscriber
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update notification preferences
 * PUT /api/notifications/preferences/:id
 */
app.put('/api/notifications/preferences/:id', notificationLimiter, validateSubscriberId, (req, res) => {
  try {
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: 'Preferences object is required'
      });
    }

    const subscriberDB = notificationManager.getSubscriberDB();
    const subscriber = subscriberDB.updatePreferences(req.params.id, preferences);

    console.log(`✅ Updated preferences for subscriber: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      subscriber
    });

  } catch (error) {
    console.error('Preference update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update contact information
 * PUT /api/notifications/contact/:id
 */
app.put('/api/notifications/contact/:id', notificationLimiter, validateSubscriberId, (req, res) => {
  try {
    const { email, telegramChatId } = req.body;

    const subscriberDB = notificationManager.getSubscriberDB();
    const subscriber = subscriberDB.updateContact(req.params.id, {
      email,
      telegramChatId
    });

    console.log(`✅ Updated contact info for subscriber: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Contact information updated successfully',
      subscriber
    });

  } catch (error) {
    console.error('Contact update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Unsubscribe from notifications
 * DELETE /api/notifications/unsubscribe/:id
 */
app.delete('/api/notifications/unsubscribe/:id', validateSubscriberId, (req, res) => {
  try {
    const subscriberDB = notificationManager.getSubscriberDB();
    const subscriber = subscriberDB.deactivateSubscriber(req.params.id);

    console.log(`✅ Unsubscribed: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Successfully unsubscribed from notifications',
      subscriber
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Reactivate subscription
 * POST /api/notifications/reactivate/:id
 */
app.post('/api/notifications/reactivate/:id', notificationLimiter, validateSubscriberId, (req, res) => {
  try {
    const subscriberDB = notificationManager.getSubscriberDB();
    const subscriber = subscriberDB.reactivateSubscriber(req.params.id);

    console.log(`✅ Reactivated subscription: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      subscriber
    });

  } catch (error) {
    console.error('Reactivation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Send test notification
 * POST /api/notifications/test/:id
 */
app.post('/api/notifications/test/:id', notificationLimiter, validateSubscriberId, async (req, res) => {
  try {
    const result = await notificationManager.sendTestNotification(req.params.id);

    console.log(`✅ Test notification sent to subscriber: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Test notification sent',
      result
    });

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
app.get('/api/notifications/stats', (req, res) => {
  try {
    const stats = notificationManager.getStatistics();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all subscribers (Admin only)
 * GET /api/notifications/subscribers
 */
app.get('/api/notifications/subscribers', authenticateAdmin, (req, res) => {
  try {
    const subscriberDB = notificationManager.getSubscriberDB();
    const subscribers = subscriberDB.getAllSubscribers();

    res.json({
      success: true,
      count: subscribers.length,
      subscribers
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Legacy endpoint for backward compatibility
app.get('/api/ai/signals', async (req, res) => {
  try {
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    const signals = await dataPipeline.generateSignals(symbols);
    res.json({
      success: true,
      signals,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get data pipeline statistics
app.get('/api/pipeline/stats', (req, res) => {
  try {
    const stats = dataPipeline.getStatistics();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// DEX TRADING ENDPOINTS
// ============================================================================

// Import DEX trading integration
const WalletTradingIntegration = require('./src/dex/walletTradingIntegration');

// Initialize wallet trading integration
const walletTrading = new WalletTradingIntegration();

/**
 * Get DEX network information
 * GET /api/dex/network-info
 */
app.get('/api/dex/network-info', (req, res) => {
  try {
    const { chainId } = req.query;
    
    // This would normally connect to the network and get info
    // For now, return static network info
    const networks = {
      1: { name: 'Ethereum', dex: 'uniswap', nativeCurrency: 'ETH' },
      56: { name: 'BSC', dex: 'pancakeswap', nativeCurrency: 'BNB' },
      42161: { name: 'Arbitrum', dex: 'uniswap', nativeCurrency: 'ETH' },
      137: { name: 'Polygon', dex: 'quickswap', nativeCurrency: 'MATIC' }
    };
    
    if (chainId) {
      const network = networks[parseInt(chainId)];
      if (network) {
        res.json({
          success: true,
          network,
          chainId: parseInt(chainId)
        });
      } else {
        res.status(400).json({
          success: false,
          error: `Unsupported chain ID: ${chainId}`
        });
      }
    } else {
      res.json({
        success: true,
        networks: Object.entries(networks).map(([id, info]) => ({
          chainId: parseInt(id),
          ...info
        }))
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get trade quote
 * POST /api/dex/quote
 */
app.post('/api/dex/quote', async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn, chainId, fee } = req.body;
    
    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({
        success: false,
        error: 'tokenIn, tokenOut, and amountIn are required'
      });
    }
    
    // For now, return a mock quote
    // In production, this would call the DEX connector
    const mockQuote = {
      amountIn,
      amountOut: (parseFloat(amountIn) * 0.99).toString(), // 1% slippage
      priceImpact: '0.5',
      gasEstimate: '150000',
      gasPriceGwei: '30',
      route: [
        { token: tokenIn, symbol: 'USDC' },
        { token: tokenOut, symbol: 'WETH' }
      ]
    };
    
    res.json({
      success: true,
      quote: mockQuote,
      timestamp: new Date()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute signal trade
 * POST /api/dex/execute-signal-trade
 */
app.post('/api/dex/execute-signal-trade', async (req, res) => {
  try {
    const { signalId, amount, walletAddress, chainId } = req.body;
    
    if (!signalId || !amount || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'signalId, amount, and walletAddress are required'
      });
    }
    
    // Get the signal from tracker
    const signal = signalTracker.getSignal(signalId);
    if (!signal) {
      return res.status(404).json({
        success: false,
        error: `Signal not found: ${signalId}`
      });
    }
    
    console.log(`🎯 Executing DEX trade for signal: ${signalId}`);
    console.log(`   Symbol: ${signal.symbol}, Direction: ${signal.direction}`);
    console.log(`   Amount: ${amount}, Wallet: ${walletAddress.substring(0, 10)}...`);
    
    // In production, this would:
    // 1. Connect to user's wallet (via signed message)
    // 2. Get quote from DEX
    // 3. Execute trade
    // 4. Return transaction hash
    
    // For now, return a mock transaction
    const mockTransaction = {
      success: true,
      transactionHash: `0x${Date.now().toString(16)}${Math.random().toString(16).substring(2)}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      gasUsed: '150000',
      gasPrice: '30000000000',
      amountIn: amount,
      amountOut: (parseFloat(amount) * 0.99).toString(),
      timestamp: new Date(),
      network: chainId ? `Chain ${chainId}` : 'Ethereum'
    };
    
    // Record the trade in signal tracker
    signalTracker.updateSignalOutcome(signalId, {
      outcome: 'pending',
      executedAt: new Date(),
      transactionHash: mockTransaction.transactionHash,
      amount: amount
    });
    
    res.json({
      success: true,
      message: 'Trade executed successfully (simulated)',
      transaction: mockTransaction,
      signal: {
        signalId: signal.signalId,
        symbol: signal.symbol,
        direction: signal.direction,
        confidence: signal.confidence
      }
    });
    
  } catch (error) {
    console.error('Trade execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get wallet connection status
 * GET /api/dex/wallet/status
 */
app.get('/api/dex/wallet/status', (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }
    
    // Check if address is valid
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
    
    if (!isValidAddress) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }
    
    // For now, return mock status
    // In production, this would check actual connection and balances
    res.json({
      success: true,
      connected: true,
      address: address,
      formattedAddress: `${address.substring(0, 6)}...${address.substring(38)}`,
      networks: [
        { chainId: 1, name: 'Ethereum', connected: true },
        { chainId: 56, name: 'BSC', connected: false },
        { chainId: 137, name: 'Polygon', connected: false }
      ],
      timestamp: new Date()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Connect wallet (simulated for backend)
 * POST /api/dex/wallet/connect
 */
app.post('/api/dex/wallet/connect', (req, res) => {
  try {
    const { address, signature, message } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address is required'
      });
    }
    
    // Validate address format
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
    if (!isValidAddress) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }
    
    // In production, this would:
    // 1. Verify signature against message
    // 2. Create session/token for the wallet
    // 3. Store connection state
    
    console.log(`✅ Wallet connected: ${address}`);
    
    res.json({
      success: true,
      message: 'Wallet connected successfully',
      address: address,
      formattedAddress: `${address.substring(0, 6)}...${address.substring(38)}`,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      timestamp: new Date()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get supported tokens for trading
 * GET /api/dex/tokens
 */
app.get('/api/dex/tokens', (req, res) => {
  try {
    const { chainId } = req.query;
    
    // Common tokens for different networks
    const tokensByChain = {
      1: [ // Ethereum
        { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', name: 'Wrapped Ether', decimals: 18 },
        { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
        { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 }
      ],
      56: [ // BSC
        { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', symbol: 'WBNB', name: 'Wrapped BNB', decimals: 18 },
        { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USD Coin', decimals: 18 },
        { address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'Tether USD', decimals: 18 }
      ],
      137: [ // Polygon
        { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', symbol: 'WMATIC', name: 'Wrapped MATIC', decimals: 18 },
        { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
        { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'Tether USD', decimals: 6 }
      ]
    };
    
    if (chainId) {
      const tokens = tokensByChain[parseInt(chainId)] || tokensByChain[1];
      res.json({
        success: true,
        chainId: parseInt(chainId),
        tokens
      });
    } else {
      res.json({
        success: true,
        chains: Object.entries(tokensByChain).map(([id, tokens]) => ({
          chainId: parseInt(id),
          tokenCount: tokens.length
        }))
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Test DEX connectivity
 * GET /api/dex/test
 */
app.get('/api/dex/test', async (req, res) => {
  try {
    // Test DEX connector
    const DEXConnector = require('./src/dex/dexConnector');
    
    // Use Ethereum RPC from environment
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://eth.public-rpc.com';
    
    console.log(`Testing DEX connectivity with RPC: ${rpcUrl.substring(0, 30)}...`);
    
    // Create a read-only connector
    const connector = new DEXConnector({
      rpcUrl: rpcUrl,
      network: 'ethereum'
    });
    
    // Test basic connectivity
    const blockNumber = await connector.getBlockNumber();
    const gasPrice = await connector.getGasPriceGwei();
    
    res.json({
      success: true,
      message: 'DEX connectivity test passed',
      rpcUrl: rpcUrl.substring(0, 50) + '...',
      blockNumber,
      gasPriceGwei: gasPrice,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('DEX test failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'DEX connectivity test failed. Check RPC URL in .env file.',
      hint: 'Run: ./scripts/setupRPCConfig.sh to configure RPC endpoints'
    });
  }
});

// ============================================================================
// BACKUP MANAGEMENT ENDPOINTS (Admin only)
// ============================================================================

/**
 * Create a database backup
 * POST /api/admin/backup/create
 */
app.post('/api/admin/backup/create', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    const backupManager = new BackupManager();

    const result = await backupManager.createBackup(name);

    if (result.success) {
      res.json({
        success: true,
        message: 'Backup created successfully',
        backup: {
          name: result.backupName,
          path: result.path,
          size: result.info.totalSizeKB + ' KB',
          databases: result.info.databases.length
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Backup creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Restore from a backup
 * POST /api/admin/backup/restore
 */
app.post('/api/admin/backup/restore', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Backup name is required'
      });
    }

    const backupManager = new BackupManager();
    const result = await backupManager.restoreBackup(name);

    if (result.success) {
      res.json({
        success: true,
        message: 'Backup restored successfully',
        restored: result.restored,
        failed: result.failed
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Backup restore error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List all backups
 * GET /api/admin/backup/list
 */
app.get('/api/admin/backup/list', authenticateAdmin, async (req, res) => {
  try {
    const backupManager = new BackupManager();
    const backups = await backupManager.listBackups();

    res.json({
      success: true,
      count: backups.length,
      backups: backups.map(backup => ({
        name: backup.name,
        created: backup.created,
        size: backup.size,
        databases: backup.metadata?.databases?.length || 0
      }))
    });

  } catch (error) {
    console.error('Backup list error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get backup statistics
 * GET /api/admin/backup/stats
 */
app.get('/api/admin/backup/stats', authenticateAdmin, async (req, res) => {
  try {
    const backupManager = new BackupManager();
    const stats = await backupManager.getStats();

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Backup stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate backup integrity
 * POST /api/admin/backup/validate
 */
app.post('/api/admin/backup/validate', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Backup name is required'
      });
    }

    const backupManager = new BackupManager();
    const result = await backupManager.validateBackup(name);

    res.json({
      success: true,
      validation: result
    });

  } catch (error) {
    console.error('Backup validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete a backup
 * DELETE /api/admin/backup/delete
 */
app.delete('/api/admin/backup/delete', authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Backup name is required'
      });
    }

    const backupManager = new BackupManager();
    const result = await backupManager.deleteBackup(name);

    if (result.success) {
      res.json({
        success: true,
        message: 'Backup deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Backup deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║  Trading Data Collection Server                           ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝\n`);
  console.log(`  🌐 Server running on port ${PORT}`);
  console.log(`  📡 WebSocket server active`);
  console.log(`  🔗 API: http://localhost:${PORT}/api`);
  console.log(`  🌍 Web: http://localhost:${PORT}`);
  console.log(`  ⚙️ Admin: http://localhost:${PORT}/admin.html`);
  console.log(`\n  Ready to accept submissions!\n`);
});

module.exports = { app, server };

