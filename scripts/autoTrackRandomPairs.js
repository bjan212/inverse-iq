/**
 * Auto Track Random Pairs
 * 
 * This script automatically tracks signals for two randomly selected trading pairs
 * on the DigitalOcean droplet. It runs continuously, monitoring the selected pairs
 * and recording performance metrics for all signals generated.
 */

const SignalTracker = require('../src/tracking/signalTracker');
const SignalPerformanceTracker = require('../src/tracking/signalPerformanceTracker');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // List of available trading pairs
  availablePairs: [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 
    'DOGEUSDT', 'XRPUSDT', 'DOTUSDT', 'AVAXUSDT', 'MATICUSDT'
  ],
  // Number of pairs to track
  pairsToTrack: 2,
  // How often to check for new signals (in milliseconds)
  checkInterval: 60000, // 1 minute
  // How often to rotate pairs (in milliseconds)
  rotateInterval: 86400000, // 24 hours
  // Data file paths
  dataDir: path.join(__dirname, '../data'),
  logFile: path.join(__dirname, '../logs/auto_track.log')
};

// Ensure directories exist
if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

const logsDir = path.dirname(CONFIG.logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize trackers
const signalTracker = new SignalTracker(path.join(CONFIG.dataDir, 'signals.json'));
const performanceTracker = new SignalPerformanceTracker(path.join(CONFIG.dataDir, 'performance.json'));

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  console.log(logMessage.trim());
  
  fs.appendFileSync(CONFIG.logFile, logMessage);
}

// Select random pairs
function selectRandomPairs() {
  const shuffled = [...CONFIG.availablePairs].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, CONFIG.pairsToTrack);
}

// Current tracked pairs
let currentPairs = [];

// Track new signals for the selected pairs
async function trackNewSignals() {
  try {
    // Get all signals
    const allSignals = signalTracker.getAllSignals();
    
    // Filter signals for the current pairs that aren't already being tracked
    const trackedSignalIds = Object.keys(performanceTracker.performance.signals || {});
    
    const newSignals = allSignals.filter(signal => {
      return currentPairs.includes(signal.symbol) && 
             !trackedSignalIds.includes(signal.signalId);
    });
    
    // Start tracking new signals
    for (const signal of newSignals) {
      const result = await performanceTracker.startTracking(signal, signalTracker);
      
      if (result) {
        log(`Started tracking new signal: ${signal.signalId} (${signal.symbol} ${signal.direction})`);
      } else {
        log(`Failed to start tracking signal: ${signal.signalId}`);
      }
    }
    
    // Update existing tracked signals
    for (const signalId of trackedSignalIds) {
      const signal = performanceTracker.performance.signals[signalId];
      
      // Only update active signals
      if (signal && signal.status === 'active') {
        await performanceTracker.updateSignalPerformance(signalId, signalTracker);
      }
    }
    
    // Log statistics
    const stats = performanceTracker.getStatistics();
    log(`Current statistics: ${stats.totalSignals} signals, ${stats.winRate.toFixed(2)}% win rate, $${stats.avgPnl.toFixed(2)} avg PnL`);
    
    // Log pair-specific statistics
    for (const pair of currentPairs) {
      const pairStats = performanceTracker.getStatistics({ symbol: pair });
      if (pairStats.totalSignals > 0) {
        log(`${pair} statistics: ${pairStats.totalSignals} signals, ${pairStats.winRate.toFixed(2)}% win rate, $${pairStats.avgPnl.toFixed(2)} avg PnL`);
      }
    }
  } catch (error) {
    log(`Error tracking signals: ${error.message}`);
  }
}

// Rotate pairs
function rotatePairs() {
  const newPairs = selectRandomPairs();
  log(`Rotating pairs: ${currentPairs.join(', ')} -> ${newPairs.join(', ')}`);
  currentPairs = newPairs;
}

// Main function
async function main() {
  log('Starting Auto Track Random Pairs');
  
  // Initial pair selection
  currentPairs = selectRandomPairs();
  log(`Initially tracking pairs: ${currentPairs.join(', ')}`);
  
  // Set up intervals
  const checkIntervalId = setInterval(trackNewSignals, CONFIG.checkInterval);
  const rotateIntervalId = setInterval(rotatePairs, CONFIG.rotateInterval);
  
  // Handle process termination
  process.on('SIGINT', () => {
    log('Stopping Auto Track Random Pairs');
    clearInterval(checkIntervalId);
    clearInterval(rotateIntervalId);
    process.exit(0);
  });
  
  // Initial check
  await trackNewSignals();
}

// Run the main function
main().catch(error => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});
