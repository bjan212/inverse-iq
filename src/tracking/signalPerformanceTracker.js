/**
 * Signal Performance Tracker
 * 
 * Tracks real-time performance of signals against market data.
 * Provides accountability metrics for trading signals.
 * 
 * Features:
 * - Real-time price tracking for active signals
 * - Performance metrics calculation (win rate, avg PnL, etc.)
 * - Historical performance data storage
 * - Pattern-specific performance tracking
 * - Public verification endpoints
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

class SignalPerformanceTracker {
  constructor(storagePath = './data/signal_performance.json') {
    this.storagePath = storagePath;
    this.performance = {
      version: 1,
      lastUpdated: new Date(),
      signals: {}, // signalId -> performance data
      patterns: {}, // patternKey -> performance data
      symbols: {}, // symbol -> performance data
      overall: {
        totalSignals: 0,
        activeSignals: 0,
        closedSignals: 0,
        winCount: 0,
        lossCount: 0,
        winRate: 0,
        totalPnl: 0,
        avgPnl: 0,
        bestTrade: null,
        worstTrade: null
      },
      timeframes: {
        daily: {},
        weekly: {},
        monthly: {}
      }
    };
    
    // Price tracking
    this.priceCache = new Map();
    this.priceCacheTTL = 60 * 1000; // 1 minute
    
    // Active tracking intervals
    this.trackingIntervals = new Map();
    
    // Load existing performance data
    this.loadPerformance();
  }

  /**
   * Start tracking a signal in real-time
   * @param {Object} signal The signal to track
   * @param {Object} signalTracker Reference to SignalTracker for updates
   */
  async startTracking(signal, signalTracker) {
    if (!signal || !signal.signalId) {
      console.error('Invalid signal provided for tracking');
      return false;
    }
    
    // Don't track already tracked signals
    if (this.trackingIntervals.has(signal.signalId)) {
      return false;
    }
    
    console.log(`📊 Starting performance tracking for signal: ${signal.signalId}`);
    
    // Initialize performance record
    this.performance.signals[signal.signalId] = {
      signalId: signal.signalId,
      symbol: signal.symbol,
      direction: signal.direction,
      confidence: signal.confidence,
      riskLevel: signal.riskLevel,
      patternKey: signal.pattern?.key || null,
      
      // Entry data
      entryPrice: signal.averageEntryPrice || null,
      stopLoss: signal.stopLoss || null,
      takeProfit1: signal.takeProfit1 || null,
      takeProfit2: signal.takeProfit2 || null,
      
      // Tracking data
      startPrice: null,
      currentPrice: null,
      highestPrice: null,
      lowestPrice: null,
      
      // Performance metrics
      currentPnl: 0,
      currentPnlPercent: 0,
      maxPnl: 0,
      maxPnlPercent: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      
      // Status
      status: 'active',
      hitStopLoss: false,
      hitTakeProfit1: false,
      hitTakeProfit2: false,
      
      // Timestamps
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
      closedAt: null,
      
      // Price history (for charts)
      priceHistory: [],
      
      // Outcome (filled when closed)
      outcome: null,
      finalPnl: null,
      finalPnlPercent: null,
      
      // Verification
      verificationUrl: null,
      publicVerificationId: this.generateVerificationId()
    };
    
    // Get initial price
    try {
      const currentPrice = await this.getCurrentPrice(signal.symbol);
      
      this.performance.signals[signal.signalId].startPrice = currentPrice;
      this.performance.signals[signal.signalId].currentPrice = currentPrice;
      this.performance.signals[signal.signalId].highestPrice = currentPrice;
      this.performance.signals[signal.signalId].lowestPrice = currentPrice;
      
      // Add first price point
      this.performance.signals[signal.signalId].priceHistory.push({
        timestamp: new Date(),
        price: currentPrice,
        pnl: 0,
        pnlPercent: 0
      });
      
      // Update overall stats
      this.performance.overall.totalSignals++;
      this.performance.overall.activeSignals++;
      
      // Update pattern stats
      if (signal.pattern?.key) {
        if (!this.performance.patterns[signal.pattern.key]) {
          this.performance.patterns[signal.pattern.key] = {
            key: signal.pattern.key,
            totalSignals: 0,
            activeSignals: 0,
            closedSignals: 0,
            winCount: 0,
            lossCount: 0,
            winRate: 0,
            totalPnl: 0,
            avgPnl: 0,
            signals: []
          };
        }
        
        this.performance.patterns[signal.pattern.key].totalSignals++;
        this.performance.patterns[signal.pattern.key].activeSignals++;
        this.performance.patterns[signal.pattern.key].signals.push(signal.signalId);
      }
      
      // Update symbol stats
      if (!this.performance.symbols[signal.symbol]) {
        this.performance.symbols[signal.symbol] = {
          symbol: signal.symbol,
          totalSignals: 0,
          activeSignals: 0,
          closedSignals: 0,
          winCount: 0,
          lossCount: 0,
          winRate: 0,
          totalPnl: 0,
          avgPnl: 0
        };
      }
      
      this.performance.symbols[signal.symbol].totalSignals++;
      this.performance.symbols[signal.symbol].activeSignals++;
      
      // Start tracking interval (every 5 minutes)
      const intervalId = setInterval(async () => {
        await this.updateSignalPerformance(signal.signalId, signalTracker);
      }, 5 * 60 * 1000);
      
      this.trackingIntervals.set(signal.signalId, intervalId);
      
      // Save performance data
      await this.savePerformance();
      
      return true;
    } catch (error) {
      console.error(`Failed to start tracking signal ${signal.signalId}:`, error.message);
      return false;
    }
  }

  /**
   * Update performance metrics for a signal
   * @param {string} signalId The ID of the signal to update
   * @param {Object} signalTracker Reference to SignalTracker for updates
   */
  async updateSignalPerformance(signalId, signalTracker) {
    const signalPerf = this.performance.signals[signalId];
    
    if (!signalPerf) {
      console.error(`Signal not found for performance update: ${signalId}`);
      return false;
    }
    
    try {
      // Get current price
      const currentPrice = await this.getCurrentPrice(signalPerf.symbol);
      
      // Update price tracking
      signalPerf.currentPrice = currentPrice;
      signalPerf.highestPrice = Math.max(signalPerf.highestPrice, currentPrice);
      signalPerf.lowestPrice = Math.min(signalPerf.lowestPrice, currentPrice);
      signalPerf.lastUpdatedAt = new Date();
      
      // Calculate PnL based on direction
      let pnl = 0;
      let pnlPercent = 0;
      
      if (signalPerf.direction === 'LONG') {
        pnl = currentPrice - (signalPerf.entryPrice || signalPerf.startPrice);
        pnlPercent = (pnl / (signalPerf.entryPrice || signalPerf.startPrice)) * 100;
      } else { // SHORT
        pnl = (signalPerf.entryPrice || signalPerf.startPrice) - currentPrice;
        pnlPercent = (pnl / (signalPerf.entryPrice || signalPerf.startPrice)) * 100;
      }
      
      signalPerf.currentPnl = pnl;
      signalPerf.currentPnlPercent = pnlPercent;
      
      // Update max PnL
      if (pnl > signalPerf.maxPnl) {
        signalPerf.maxPnl = pnl;
        signalPerf.maxPnlPercent = pnlPercent;
      }
      
      // Update max drawdown
      const drawdown = signalPerf.maxPnl - pnl;
      const drawdownPercent = (drawdown / (signalPerf.entryPrice || signalPerf.startPrice)) * 100;
      
      if (drawdown > signalPerf.maxDrawdown) {
        signalPerf.maxDrawdown = drawdown;
        signalPerf.maxDrawdownPercent = drawdownPercent;
      }
      
      // Add price point to history (limit to 288 points = 24 hours at 5 min intervals)
      signalPerf.priceHistory.push({
        timestamp: new Date(),
        price: currentPrice,
        pnl,
        pnlPercent
      });
      
      if (signalPerf.priceHistory.length > 288) {
        signalPerf.priceHistory.shift();
      }
      
      // Check for stop loss / take profit hits
      if (signalPerf.stopLoss && !signalPerf.hitStopLoss) {
        if (signalPerf.direction === 'LONG' && currentPrice <= signalPerf.stopLoss) {
          signalPerf.hitStopLoss = true;
          this.closeSignal(signalId, 'loss', currentPrice, signalTracker);
        } else if (signalPerf.direction === 'SHORT' && currentPrice >= signalPerf.stopLoss) {
          signalPerf.hitStopLoss = true;
          this.closeSignal(signalId, 'loss', currentPrice, signalTracker);
        }
      }
      
      if (signalPerf.takeProfit1 && !signalPerf.hitTakeProfit1) {
        if (signalPerf.direction === 'LONG' && currentPrice >= signalPerf.takeProfit1) {
          signalPerf.hitTakeProfit1 = true;
          // Don't close, just mark as hit
        } else if (signalPerf.direction === 'SHORT' && currentPrice <= signalPerf.takeProfit1) {
          signalPerf.hitTakeProfit1 = true;
          // Don't close, just mark as hit
        }
      }
      
      if (signalPerf.takeProfit2 && !signalPerf.hitTakeProfit2) {
        if (signalPerf.direction === 'LONG' && currentPrice >= signalPerf.takeProfit2) {
          signalPerf.hitTakeProfit2 = true;
          this.closeSignal(signalId, 'win', currentPrice, signalTracker);
        } else if (signalPerf.direction === 'SHORT' && currentPrice <= signalPerf.takeProfit2) {
          signalPerf.hitTakeProfit2 = true;
          this.closeSignal(signalId, 'win', currentPrice, signalTracker);
        }
      }
      
      // Save performance data
      await this.savePerformance();
      
      return true;
    } catch (error) {
      console.error(`Failed to update signal performance ${signalId}:`, error.message);
      return false;
    }
  }

  /**
   * Close a signal and record final performance
   * @param {string} signalId The ID of the signal to close
   * @param {string} outcome 'win' or 'loss'
   * @param {number} exitPrice The exit price
   * @param {Object} signalTracker Reference to SignalTracker for updates
   */
  async closeSignal(signalId, outcome, exitPrice, signalTracker) {
    const signalPerf = this.performance.signals[signalId];
    
    if (!signalPerf) {
      console.error(`Signal not found for closing: ${signalId}`);
      return false;
    }
    
    try {
      // Stop tracking interval
      if (this.trackingIntervals.has(signalId)) {
        clearInterval(this.trackingIntervals.get(signalId));
        this.trackingIntervals.delete(signalId);
      }
      
      // Calculate final PnL
      let finalPnl = 0;
      let finalPnlPercent = 0;
      
      if (signalPerf.direction === 'LONG') {
        finalPnl = exitPrice - (signalPerf.entryPrice || signalPerf.startPrice);
        finalPnlPercent = (finalPnl / (signalPerf.entryPrice || signalPerf.startPrice)) * 100;
      } else { // SHORT
        finalPnl = (signalPerf.entryPrice || signalPerf.startPrice) - exitPrice;
        finalPnlPercent = (finalPnl / (signalPerf.entryPrice || signalPerf.startPrice)) * 100;
      }
      
      // Update signal performance
      signalPerf.status = 'closed';
      signalPerf.outcome = outcome;
      signalPerf.finalPnl = finalPnl;
      signalPerf.finalPnlPercent = finalPnlPercent;
      signalPerf.closedAt = new Date();
      
      // Update overall stats
      this.performance.overall.activeSignals--;
      this.performance.overall.closedSignals++;
      this.performance.overall.totalPnl += finalPnl;
      
      if (outcome === 'win') {
        this.performance.overall.winCount++;
      } else {
        this.performance.overall.lossCount++;
      }
      
      // Recalculate win rate
      if (this.performance.overall.closedSignals > 0) {
        this.performance.overall.winRate = (this.performance.overall.winCount / this.performance.overall.closedSignals) * 100;
      }
      
      // Recalculate average PnL
      if (this.performance.overall.closedSignals > 0) {
        this.performance.overall.avgPnl = this.performance.overall.totalPnl / this.performance.overall.closedSignals;
      }
      
      // Update best/worst trade
      if (!this.performance.overall.bestTrade || finalPnl > this.performance.overall.bestTrade.pnl) {
        this.performance.overall.bestTrade = {
          signalId,
          symbol: signalPerf.symbol,
          direction: signalPerf.direction,
          pnl: finalPnl,
          pnlPercent: finalPnlPercent,
          date: new Date()
        };
      }
      
      if (!this.performance.overall.worstTrade || finalPnl < this.performance.overall.worstTrade.pnl) {
        this.performance.overall.worstTrade = {
          signalId,
          symbol: signalPerf.symbol,
          direction: signalPerf.direction,
          pnl: finalPnl,
          pnlPercent: finalPnlPercent,
          date: new Date()
        };
      }
      
      // Update pattern stats
      if (signalPerf.patternKey && this.performance.patterns[signalPerf.patternKey]) {
        const patternStats = this.performance.patterns[signalPerf.patternKey];
        
        patternStats.activeSignals--;
        patternStats.closedSignals++;
        patternStats.totalPnl += finalPnl;
        
        if (outcome === 'win') {
          patternStats.winCount++;
        } else {
          patternStats.lossCount++;
        }
        
        // Recalculate win rate
        if (patternStats.closedSignals > 0) {
          patternStats.winRate = (patternStats.winCount / patternStats.closedSignals) * 100;
        }
        
        // Recalculate average PnL
        if (patternStats.closedSignals > 0) {
          patternStats.avgPnl = patternStats.totalPnl / patternStats.closedSignals;
        }
      }
      
      // Update symbol stats
      if (this.performance.symbols[signalPerf.symbol]) {
        const symbolStats = this.performance.symbols[signalPerf.symbol];
        
        symbolStats.activeSignals--;
        symbolStats.closedSignals++;
        symbolStats.totalPnl += finalPnl;
        
        if (outcome === 'win') {
          symbolStats.winCount++;
        } else {
          symbolStats.lossCount++;
        }
        
        // Recalculate win rate
        if (symbolStats.closedSignals > 0) {
          symbolStats.winRate = (symbolStats.winCount / symbolStats.closedSignals) * 100;
        }
        
        // Recalculate average PnL
        if (symbolStats.closedSignals > 0) {
          symbolStats.avgPnl = symbolStats.totalPnl / symbolStats.closedSignals;
        }
      }
      
      // Update timeframe stats
      this.updateTimeframeStats(signalPerf, finalPnl, outcome);
      
      // Update signal tracker if provided
      if (signalTracker) {
        try {
          await signalTracker.updateSignalOutcome(signalId, {
            outcome,
            entryPrice: signalPerf.entryPrice || signalPerf.startPrice,
            exitPrice,
            pnl: finalPnl,
            pnlPercentage: finalPnlPercent,
            duration: new Date() - new Date(signalPerf.startedAt)
          });
        } catch (error) {
          console.error(`Failed to update signal tracker for ${signalId}:`, error.message);
        }
      }
      
      // Save performance data
      await this.savePerformance();
      
      console.log(`📊 Signal closed: ${signalId} (${outcome.toUpperCase()}, PnL: ${finalPnl.toFixed(2)})`);
      
      return true;
    } catch (error) {
      console.error(`Failed to close signal ${signalId}:`, error.message);
      return false;
    }
  }

  /**
   * Update timeframe statistics
   * @param {Object} signalPerf Signal performance data
   * @param {number} pnl Final PnL
   * @param {string} outcome 'win' or 'loss'
   */
  updateTimeframeStats(signalPerf, pnl, outcome) {
    // Get date keys
    const now = new Date();
    const dailyKey = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const weeklyKey = this.getWeekNumber(now);
    const monthlyKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    
    // Update daily stats
    if (!this.performance.timeframes.daily[dailyKey]) {
      this.performance.timeframes.daily[dailyKey] = {
        date: dailyKey,
        signals: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        pnl: 0
      };
    }
    
    const dailyStats = this.performance.timeframes.daily[dailyKey];
    dailyStats.signals++;
    dailyStats.pnl += pnl;
    
    if (outcome === 'win') {
      dailyStats.wins++;
    } else {
      dailyStats.losses++;
    }
    
    dailyStats.winRate = (dailyStats.wins / dailyStats.signals) * 100;
    
    // Update weekly stats
    if (!this.performance.timeframes.weekly[weeklyKey]) {
      this.performance.timeframes.weekly[weeklyKey] = {
        week: weeklyKey,
        signals: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        pnl: 0
      };
    }
    
    const weeklyStats = this.performance.timeframes.weekly[weeklyKey];
    weeklyStats.signals++;
    weeklyStats.pnl += pnl;
    
    if (outcome === 'win') {
      weeklyStats.wins++;
    } else {
      weeklyStats.losses++;
    }
    
    weeklyStats.winRate = (weeklyStats.wins / weeklyStats.signals) * 100;
    
    // Update monthly stats
    if (!this.performance.timeframes.monthly[monthlyKey]) {
      this.performance.timeframes.monthly[monthlyKey] = {
        month: monthlyKey,
        signals: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        pnl: 0
      };
    }
    
    const monthlyStats = this.performance.timeframes.monthly[monthlyKey];
    monthlyStats.signals++;
    monthlyStats.pnl += pnl;
    
    if (outcome === 'win') {
      monthlyStats.wins++;
    } else {
      monthlyStats.losses++;
    }
    
    monthlyStats.winRate = (monthlyStats.wins / monthlyStats.signals) * 100;
  }

  /**
   * Get week number for a date (YYYY-WW format)
   * @param {Date} date The date to get week number for
   * @returns {string} Week number in YYYY-WW format
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-${String(weekNo).padStart(2, '0')}`;
  }

  /**
   * Get current price for a symbol
   * @param {string} symbol The symbol to get price for
   * @returns {Promise<number>} Current price
   */
  async getCurrentPrice(symbol) {
    // Check cache first
    const cacheKey = `price_${symbol}`;
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.priceCacheTTL) {
      return cached.price;
    }
    
    try {
      // In production, this would call a real price API
      // For now, simulate with random price movement
      let basePrice = 0;
      
      if (symbol === 'BTCUSDT') {
        basePrice = 50000;
      } else if (symbol === 'ETHUSDT') {
        basePrice = 3000;
      } else if (symbol === 'BNBUSDT') {
        basePrice = 500;
      } else if (symbol === 'SOLUSDT') {
        basePrice = 100;
      } else {
        basePrice = 100;
      }
      
      // Random movement ±2%
      const movement = (Math.random() * 4 - 2) / 100;
      const price = basePrice * (1 + movement);
      
      // Cache the price
      this.priceCache.set(cacheKey, {
        price,
        timestamp: Date.now()
      });
      
      return price;
    } catch (error) {
      console.error(`Failed to get price for ${symbol}:`, error.message);
      
      // Return last known price or estimate
      if (cached) {
        return cached.price;
      }
      
      // Fallback prices
      if (symbol === 'BTCUSDT') return 50000;
      if (symbol === 'ETHUSDT') return 3000;
      if (symbol === 'BNBUSDT') return 500;
      if (symbol === 'SOLUSDT') return 100;
      return 100;
    }
  }

  /**
   * Get performance statistics
   * @param {Object} options Filter options
   * @returns {Object} Performance statistics
   */
  getStatistics(options = {}) {
    const { timeframe, symbol, pattern, limit } = options;
    
    // Clone to avoid modifying original
    const stats = JSON.parse(JSON.stringify(this.performance.overall));
    
    // Add timeframe stats
    if (timeframe === 'daily') {
      stats.timeframe = this.getTimeframeStats('daily', limit || 30);
    } else if (timeframe === 'weekly') {
      stats.timeframe = this.getTimeframeStats('weekly', limit || 12);
    } else if (timeframe === 'monthly') {
      stats.timeframe = this.getTimeframeStats('monthly', limit || 12);
    }
    
    // Add symbol stats
    if (symbol) {
      stats.symbol = this.performance.symbols[symbol] || null;
    }
    
    // Add pattern stats
    if (pattern) {
      stats.pattern = this.performance.patterns[pattern] || null;
    }
    
    return stats;
  }

  /**
   * Get timeframe statistics
   * @param {string} timeframe 'daily', 'weekly', or 'monthly'
   * @param {number} limit Maximum number of entries to return
   * @returns {Array} Timeframe statistics
   */
  getTimeframeStats(timeframe, limit) {
    const stats = Object.values(this.performance.timeframes[timeframe] || {});
    
    // Sort by date (newest first)
    stats.sort((a, b) => {
      if (a.date) return b.date.localeCompare(a.date);
      if (a.week) return b.week.localeCompare(a.week);
      if (a.month) return b.month.localeCompare(a.month);
      return 0;
    });
    
    // Limit results
    return stats.slice(0, limit);
  }

  /**
   * Get performance data for a specific signal
   * @param {string} signalId The ID of the signal
   * @returns {Object} Signal performance data
   */
  getSignalPerformance(signalId) {
    return this.performance.signals[signalId] || null;
  }

  /**
   * Get performance data for a specific pattern
   * @param {string} patternKey The pattern key
   * @returns {Object} Pattern performance data
   */
  getPatternPerformance(patternKey) {
    return this.performance.patterns[patternKey] || null;
  }

  /**
   * Get performance data for a specific symbol
   * @param {string} symbol The symbol
   * @returns {Object} Symbol performance data
   */
  getSymbolPerformance(symbol) {
    return this.performance.symbols[symbol] || null;
  }

  /**
   * Get public verification data for a signal
   * @param {string} verificationId The verification ID
   * @returns {Object} Verification data
   */
  getVerificationData(verificationId) {
    // Find signal by verification ID
    const signalId = Object.keys(this.performance.signals).find(id => 
      this.performance.signals[id].publicVerificationId === verificationId
    );
    
    if (!signalId) {
      return null;
    }
    
    const signal = this.performance.signals[signalId];
    
    // Return public verification data
    return {
      verificationId,
      symbol: signal.symbol,
      direction: signal.direction,
      confidence: signal.confidence,
      riskLevel: signal.riskLevel,
      
      // Entry data
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit1: signal.takeProfit1,
      takeProfit2: signal.takeProfit2,
      
      // Performance
      startPrice: signal.startPrice,
      currentPrice: signal.currentPrice,
      currentPnl: signal.currentPnl,
      currentPnlPercent: signal.currentPnlPercent,
      
      // Status
      status: signal.status,
      hitStopLoss: signal.hitStopLoss,
      hitTakeProfit1: signal.hitTakeProfit1,
      hitTakeProfit2: signal.hitTakeProfit2,
      
      // Outcome
      outcome: signal.outcome,
      finalPnl: signal.finalPnl,
      finalPnlPercent: signal.finalPnlPercent,
      
      // Timestamps
      startedAt: signal.startedAt,
      lastUpdatedAt: signal.lastUpdatedAt,
      closedAt: signal.closedAt,
      
      // Price history (for charts)
      priceHistory: signal.priceHistory
    };
  }

  /**
   * Generate a unique verification ID
   * @returns {string} Verification ID
   */
  generateVerificationId() {
    return `verify_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Load performance data from disk
   */
  async loadPerformance() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.storagePath)) {
        const data = await fs.promises.readFile(this.storagePath, 'utf8');
        this.performance = JSON.parse(data);
        console.log(`✅ Loaded performance data: ${Object.keys(this.performance.signals).length} signals`);
      } else {
        console.log('📝 Creating new performance database');
      }
    } catch (error) {
      console.error('Failed to load performance data:', error.message);
    }
  }

  /**
   * Save performance data to disk
   */
  async savePerformance() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.performance.lastUpdated = new Date();
      await fs.promises.writeFile(this.storagePath, JSON.stringify(this.performance, null, 2));
      
      // Silent save - don't log every time
    } catch (error) {
      console.error('Failed to save performance data:', error.message);
    }
  }

  /**
   * Clean up old performance data
   * @param {number} daysToKeep Number of days to keep data for
   */
  async cleanup(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let removed = 0;
    const signalIds = Object.keys(this.performance.signals);

    for (const signalId of signalIds) {
      const signal = this.performance.signals[signalId];
      
      if (signal.status === 'closed' && new Date(signal.closedAt) < cutoffDate) {
        delete this.performance.signals[signalId];
        removed++;
      }
    }

    if (removed > 0) {
      await this.savePerformance();
      console.log(`🧹 Cleaned up ${removed} old signal performance records`);
    }

    return removed;
  }
}

module.exports = SignalPerformanceTracker;
