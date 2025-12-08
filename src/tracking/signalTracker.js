/**
 * Signal Tracker
 * 
 * Tracks generated signals for performance feedback loop.
 * Stores signals in memory and persists to disk for recovery.
 * 
 * Features:
 * - Register new signals
 * - Lookup signals by ID
 * - Track signal lifecycle
 * - Persist to JSON file
 * - Link signals to patterns
 */

const fs = require('fs');
const path = require('path');

class SignalTracker {
  constructor(storagePath = './data/active_signals.json') {
    this.storagePath = storagePath;
    this.signals = new Map();
    this.loadSignals();
  }

  /**
   * Register a new signal
   */
  registerSignal(signal) {
    if (!signal.signalId) {
      throw new Error('Signal must have a signalId');
    }

    const trackedSignal = {
      signalId: signal.signalId,
      symbol: signal.symbol,
      direction: signal.direction,
      confidence: signal.confidence,
      
      // Pattern information
      patternKey: signal.pattern?.key || null,
      patternSource: signal.pattern?.source || null,
      
      // Timestamps
      generatedAt: signal.generatedAt || new Date(),
      expiresAt: signal.expiresAt || null,
      closedAt: null,
      
      // Status
      status: 'active', // active, expired, closed
      
      // Outcome (filled when feedback received)
      outcome: null, // win, loss
      entryPrice: null,
      exitPrice: null,
      pnl: null,
      pnlPercentage: null,
      duration: null,
      
      // Full signal data for reference
      fullSignal: signal
    };

    this.signals.set(signal.signalId, trackedSignal);
    this.saveSignals();

    console.log(`📍 Signal tracked: ${signal.signalId} (${signal.symbol} ${signal.direction})`);

    return trackedSignal;
  }

  /**
   * Get signal by ID
   */
  getSignal(signalId) {
    return this.signals.get(signalId);
  }

  /**
   * Check if signal exists
   */
  hasSignal(signalId) {
    return this.signals.has(signalId);
  }

  /**
   * Update signal with outcome
   */
  updateSignalOutcome(signalId, outcome) {
    const signal = this.signals.get(signalId);
    
    if (!signal) {
      throw new Error(`Signal not found: ${signalId}`);
    }

    if (signal.status === 'closed') {
      throw new Error(`Signal already closed: ${signalId}`);
    }

    // Validate outcome
    if (!outcome.outcome || !['win', 'loss'].includes(outcome.outcome)) {
      throw new Error('Outcome must be "win" or "loss"');
    }

    // Update signal
    signal.outcome = outcome.outcome;
    signal.entryPrice = outcome.entryPrice || null;
    signal.exitPrice = outcome.exitPrice || null;
    signal.pnl = outcome.pnl || 0;
    signal.pnlPercentage = outcome.pnlPercentage || 0;
    signal.duration = outcome.duration || null;
    signal.closedAt = new Date();
    signal.status = 'closed';

    this.signals.set(signalId, signal);
    this.saveSignals();

    console.log(`✅ Signal outcome recorded: ${signalId} → ${outcome.outcome.toUpperCase()}`);

    return signal;
  }

  /**
   * Mark signal as expired
   */
  expireSignal(signalId) {
    const signal = this.signals.get(signalId);
    
    if (!signal) {
      return false;
    }

    if (signal.status === 'active') {
      signal.status = 'expired';
      signal.closedAt = new Date();
      this.signals.set(signalId, signal);
      this.saveSignals();
      
      console.log(`⏰ Signal expired: ${signalId}`);
      return true;
    }

    return false;
  }

  /**
   * Get all signals
   */
  getAllSignals() {
    return Array.from(this.signals.values());
  }

  /**
   * Get signals by status
   */
  getSignalsByStatus(status) {
    return this.getAllSignals().filter(s => s.status === status);
  }

  /**
   * Get signals by symbol
   */
  getSignalsBySymbol(symbol) {
    return this.getAllSignals().filter(s => s.symbol === symbol);
  }

  /**
   * Get signals by pattern
   */
  getSignalsByPattern(patternKey) {
    return this.getAllSignals().filter(s => s.patternKey === patternKey);
  }

  /**
   * Get performance statistics
   */
  getStatistics() {
    const all = this.getAllSignals();
    const closed = all.filter(s => s.status === 'closed' && s.outcome);
    const wins = closed.filter(s => s.outcome === 'win');
    const losses = closed.filter(s => s.outcome === 'loss');

    const totalPnl = closed.reduce((sum, s) => sum + (s.pnl || 0), 0);
    const avgPnl = closed.length > 0 ? totalPnl / closed.length : 0;

    return {
      total: all.length,
      active: all.filter(s => s.status === 'active').length,
      closed: closed.length,
      expired: all.filter(s => s.status === 'expired').length,
      
      wins: wins.length,
      losses: losses.length,
      winRate: closed.length > 0 ? (wins.length / closed.length * 100).toFixed(2) : 0,
      
      totalPnl: totalPnl.toFixed(2),
      avgPnl: avgPnl.toFixed(2),
      
      avgConfidence: all.length > 0 
        ? (all.reduce((sum, s) => sum + s.confidence, 0) / all.length).toFixed(2)
        : 0
    };
  }

  /**
   * Clean up old signals (older than 30 days)
   */
  cleanup(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let removed = 0;

    for (const [signalId, signal] of this.signals.entries()) {
      const signalDate = new Date(signal.generatedAt);
      
      if (signalDate < cutoffDate && signal.status !== 'active') {
        this.signals.delete(signalId);
        removed++;
      }
    }

    if (removed > 0) {
      this.saveSignals();
      console.log(`🧹 Cleaned up ${removed} old signals`);
    }

    return removed;
  }

  /**
   * Check for expired signals and mark them
   */
  checkExpiredSignals() {
    const now = new Date();
    let expired = 0;

    for (const [signalId, signal] of this.signals.entries()) {
      if (signal.status === 'active' && signal.expiresAt) {
        const expiryDate = new Date(signal.expiresAt);
        
        if (now > expiryDate) {
          this.expireSignal(signalId);
          expired++;
        }
      }
    }

    return expired;
  }

  /**
   * Load signals from disk
   */
  loadSignals() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        const signalsArray = JSON.parse(data);
        
        this.signals = new Map(signalsArray.map(s => [s.signalId, s]));
        
        console.log(`✅ Loaded ${this.signals.size} tracked signals`);
      } else {
        console.log('📝 No existing signal tracking data found');
      }
    } catch (error) {
      console.error('Failed to load signals:', error.message);
      this.signals = new Map();
    }
  }

  /**
   * Save signals to disk
   */
  saveSignals() {
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const signalsArray = Array.from(this.signals.values());
      fs.writeFileSync(this.storagePath, JSON.stringify(signalsArray, null, 2));
      
      // Silent save - don't log every time
    } catch (error) {
      console.error('Failed to save signals:', error.message);
    }
  }

  /**
   * Export signals for analysis
   */
  exportSignals(format = 'json') {
    const signals = this.getAllSignals();

    if (format === 'json') {
      return JSON.stringify(signals, null, 2);
    }

    if (format === 'csv') {
      const headers = ['signalId', 'symbol', 'direction', 'confidence', 'status', 'outcome', 'pnl', 'generatedAt', 'closedAt'];
      const rows = signals.map(s => [
        s.signalId,
        s.symbol,
        s.direction,
        s.confidence,
        s.status,
        s.outcome || '',
        s.pnl || '',
        s.generatedAt,
        s.closedAt || ''
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return signals;
  }

  /**
   * Clear all signals (use with caution!)
   */
  clearAll() {
    this.signals.clear();
    this.saveSignals();
    console.log('🗑️  All signals cleared');
  }
}

module.exports = SignalTracker;
