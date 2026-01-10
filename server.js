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

// Security and validation middleware
const {
  apiLimiter,
  submissionLimiter,
  feedbackLimiter,
  notificationLimiter,
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

// Secure admin authentication
const { setupSession, requireAdminLogin, handleAdminLogin, handleAdminLogout } = require('./src/middleware/adminAuth');
setupSession(app);

// Setup global error handlers
setupGlobalErrorHandlers();

// Security middleware
app.use(helmetConfig);
app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Protect admin.html
app.get('/admin.html', requireAdminLogin, (req, res, next) => {
  res.sendFile(__dirname + '/public/admin.html');
});

// Admin login page
app.get('/admin-login', (req, res) => {
  res.sendFile(__dirname + '/public/admin-login.html');
});

// Handle admin login
app.post('/admin-login', express.urlencoded({ extended: true }), handleAdminLogin);

// Admin logout
app.get('/admin-logout', handleAdminLogout);

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
const HybridEngine = require('./src/ai-engine/hybridEngine');
const aiEngine = new HybridEngine();
const dataPipeline = new DataPipeline();
const signalTracker = new SignalTracker('./data/active_signals.json');
const notificationManager = new NotificationManager();

// Connect signal tracker to AI engine
aiEngine.setSignalTracker(signalTracker);

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

// Get current AI signals (using Hybrid Engine)
app.get('/api/signals', validateSymbols, async (req, res) => {
  try {
    const HybridEngine = require('./src/ai-engine/hybridEngine');
    const engine = new HybridEngine();
    
    // Connect signal tracker to engine
    engine.setSignalTracker(signalTracker);
    
    const symbols = req.query.symbols ? req.query.symbols.split(',') : ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    const signals = await engine.generateSmartSignals(symbols);
    
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
    const stats = engine.getHybridStatistics();
    
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

