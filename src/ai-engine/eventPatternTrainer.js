/**
 * Event Pattern Trainer
 * 
 * Machine Learning trainer for market event patterns.
 * Trains the AI to recognize patterns BEFORE events occur by:
 * 
 * 1. Collecting historical event data
 * 2. Extracting features from pre-event periods
 * 3. Building pattern recognition models
 * 4. Validating accuracy with backtesting
 * 5. Continuously improving with new data
 * 
 * This creates a predictive model that can identify:
 * - Token unlock patterns before they happen
 * - Exchange listing signals before announcements
 * - Team reveal indicators before price peaks
 * - Influencer campaign coordination before dumps
 */

const BinancePublicCollector = require('../collectors/binancePublicCollector');
const fs = require('fs');
const path = require('path');

class EventPatternTrainer {
  constructor() {
    this.collector = new BinancePublicCollector();
    
    // Training data storage
    this.trainingData = {
      tokenUnlocks: [],
      exchangeListings: [],
      teamReveals: [],
      influencerCampaigns: []
    };
    
    // Trained model parameters
    this.trainedModels = {
      tokenUnlock: null,
      exchangeListing: null,
      teamReveal: null,
      influencerCampaign: null
    };
    
    // Training statistics
    this.trainingStats = {
      totalSamples: 0,
      trainingAccuracy: 0,
      validationAccuracy: 0,
      lastTrainingDate: null
    };
  }

  /**
   * Train model on historical token unlock events
   */
  async trainTokenUnlockModel(historicalEvents) {
    console.log('\n🎓 Training Token Unlock Detection Model...\n');
    
    const features = [];
    const labels = [];
    
    for (const event of historicalEvents) {
      try {
        // Collect data around the event
        const eventDate = new Date(event.unlockDate);
        const endTime = eventDate.getTime();
        const startTime = endTime - (30 * 24 * 60 * 60 * 1000); // 30 days before
        
        const data = await this.collector.getHistoricalKlines(
          event.symbol,
          '1h',
          startTime,
          endTime,
          1000
        );
        
        // Extract features from pre-event period
        const eventFeatures = this.extractTokenUnlockFeatures(data, event);
        features.push(eventFeatures);
        labels.push(event.actualOutcome); // 1 = pattern occurred, 0 = didn't
        
        await this.sleep(1000); // Rate limiting
        
      } catch (error) {
        console.error(`Failed to process event for ${event.symbol}:`, error.message);
      }
    }
    
    // Train the model using extracted features
    const model = this.trainClassifier(features, labels);
    
    // Validate the model
    const accuracy = this.validateModel(model, features, labels);
    
    this.trainedModels.tokenUnlock = model;
    this.trainingStats.tokenUnlock = {
      samples: features.length,
      accuracy: accuracy,
      trainedAt: new Date()
    };
    
    console.log(`✅ Token Unlock Model Trained:`);
    console.log(`   Samples: ${features.length}`);
    console.log(`   Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    
    return model;
  }

  /**
   * Extract features for token unlock pattern
   */
  extractTokenUnlockFeatures(klines, event) {
    if (!klines || klines.length < 20) {
      return this.getDefaultFeatures();
    }
    
    // Feature 1: Price trend (14 days before event)
    const preTrendPeriod = klines.slice(-14 * 24);
    const priceTrend = this.calculatePriceTrend(preTrendPeriod);
    
    // Feature 2: Volume increase
    const recentVolume = this.calculateAvgVolume(klines.slice(-7 * 24));
    const historicalVolume = this.calculateAvgVolume(klines.slice(-30 * 24, -7 * 24));
    const volumeRatio = recentVolume / historicalVolume;
    
    // Feature 3: Volatility increase
    const recentVolatility = this.calculateVolatility(klines.slice(-7 * 24));
    const historicalVolatility = this.calculateVolatility(klines.slice(-30 * 24, -7 * 24));
    const volatilityRatio = recentVolatility / historicalVolatility;
    
    // Feature 4: Sell pressure
    const sellPressure = this.calculateSellPressure(klines.slice(-7 * 24));
    
    // Feature 5: Price distance from peak
    const peak = Math.max(...klines.map(k => k.high));
    const current = klines[klines.length - 1].close;
    const distanceFromPeak = (current - peak) / peak;
    
    // Feature 6: Unlock size (if available)
    const unlockSize = event.unlockPercentage || 0;
    
    return {
      priceTrend,
      volumeRatio,
      volatilityRatio,
      sellPressure,
      distanceFromPeak,
      unlockSize
    };
  }

  /**
   * Extract features for exchange listing pattern
   */
  extractExchangeListingFeatures(klines, event) {
    if (!klines || klines.length < 20) {
      return this.getDefaultFeatures();
    }
    
    // Feature 1: Recent price pump
    const recentCandles = klines.slice(-5 * 24);
    const pumpMagnitude = this.calculatePriceTrend(recentCandles);
    
    // Feature 2: Volume spike
    const recentVolume = this.calculateAvgVolume(recentCandles);
    const normalVolume = this.calculateAvgVolume(klines.slice(-30 * 24, -5 * 24));
    const volumeSpike = recentVolume / normalVolume;
    
    // Feature 3: Buy pressure
    const buyPressure = this.calculateBuyPressure(recentCandles);
    
    // Feature 4: Social media mentions (if available)
    const socialMentions = event.socialMentionIncrease || 0;
    
    // Feature 5: New wallet activity (if available)
    const newWallets = event.newWalletActivity || 0;
    
    // Feature 6: Price acceleration
    const acceleration = this.calculatePriceAcceleration(klines);
    
    return {
      pumpMagnitude,
      volumeSpike,
      buyPressure,
      socialMentions,
      newWallets,
      acceleration
    };
  }

  /**
   * Simple classifier using weighted features
   * (In production, you could use more sophisticated ML libraries)
   */
  trainClassifier(features, labels) {
    if (features.length === 0) {
      return this.getDefaultModel();
    }
    
    // Calculate optimal weights for each feature
    const weights = {};
    const featureKeys = Object.keys(features[0]);
    
    for (const key of featureKeys) {
      // Calculate correlation between feature and label
      const correlation = this.calculateCorrelation(
        features.map(f => f[key]),
        labels
      );
      weights[key] = Math.abs(correlation);
    }
    
    // Normalize weights
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    for (const key in weights) {
      weights[key] = weights[key] / totalWeight;
    }
    
    // Calculate optimal threshold
    const scores = features.map(f => this.calculateScore(f, weights));
    const threshold = this.findOptimalThreshold(scores, labels);
    
    return {
      weights,
      threshold,
      featureKeys
    };
  }

  /**
   * Calculate correlation between feature and labels
   */
  calculateCorrelation(values, labels) {
    if (values.length !== labels.length || values.length === 0) return 0;
    
    const n = values.length;
    const meanX = values.reduce((a, b) => a + b, 0) / n;
    const meanY = labels.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = values[i] - meanX;
      const dy = labels[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }
    
    if (denomX === 0 || denomY === 0) return 0;
    
    return numerator / Math.sqrt(denomX * denomY);
  }

  /**
   * Calculate score for a feature set
   */
  calculateScore(features, weights) {
    let score = 0;
    for (const key in features) {
      if (weights[key]) {
        score += features[key] * weights[key];
      }
    }
    return score;
  }

  /**
   * Find optimal threshold for classification
   */
  findOptimalThreshold(scores, labels) {
    const sortedScores = [...scores].sort((a, b) => a - b);
    let bestThreshold = 0;
    let bestAccuracy = 0;
    
    for (const threshold of sortedScores) {
      const predictions = scores.map(s => s >= threshold ? 1 : 0);
      const accuracy = this.calculateAccuracy(predictions, labels);
      
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestThreshold = threshold;
      }
    }
    
    return bestThreshold;
  }

  /**
   * Calculate accuracy
   */
  calculateAccuracy(predictions, labels) {
    if (predictions.length !== labels.length || predictions.length === 0) return 0;
    
    let correct = 0;
    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i] === labels[i]) correct++;
    }
    
    return correct / predictions.length;
  }

  /**
   * Validate model
   */
  validateModel(model, features, labels) {
    const predictions = features.map(f => {
      const score = this.calculateScore(f, model.weights);
      return score >= model.threshold ? 1 : 0;
    });
    
    return this.calculateAccuracy(predictions, labels);
  }

  /**
   * Predict using trained model
   */
  predict(model, features) {
    if (!model || !model.weights) return 0;
    
    const score = this.calculateScore(features, model.weights);
    return score >= model.threshold ? 1 : 0;
  }

  /**
   * Get prediction confidence
   */
  getPredictionConfidence(model, features) {
    if (!model || !model.weights) return 0;
    
    const score = this.calculateScore(features, model.weights);
    const distance = Math.abs(score - model.threshold);
    
    // Convert distance to confidence (0-100%)
    return Math.min(100, distance * 100);
  }

  /**
   * Helper: Calculate price trend
   */
  calculatePriceTrend(candles) {
    if (!candles || candles.length < 2) return 0;
    
    const startPrice = candles[0].close;
    const endPrice = candles[candles.length - 1].close;
    
    return (endPrice - startPrice) / startPrice;
  }

  /**
   * Helper: Calculate average volume
   */
  calculateAvgVolume(candles) {
    if (!candles || candles.length === 0) return 0;
    return candles.reduce((acc, c) => acc + c.volume, 0) / candles.length;
  }

  /**
   * Helper: Calculate volatility
   */
  calculateVolatility(candles) {
    if (!candles || candles.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < candles.length; i++) {
      const ret = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
      returns.push(ret);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Helper: Calculate sell pressure
   */
  calculateSellPressure(candles) {
    if (!candles || candles.length === 0) return 0;
    
    const bearishCandles = candles.filter(c => c.close < c.open).length;
    return bearishCandles / candles.length;
  }

  /**
   * Helper: Calculate buy pressure
   */
  calculateBuyPressure(candles) {
    if (!candles || candles.length === 0) return 0;
    
    const bullishCandles = candles.filter(c => c.close > c.open).length;
    return bullishCandles / candles.length;
  }

  /**
   * Helper: Calculate price acceleration
   */
  calculatePriceAcceleration(candles) {
    if (!candles || candles.length < 10) return 0;
    
    const recent = candles.slice(-5);
    const earlier = candles.slice(-10, -5);
    
    const recentTrend = this.calculatePriceTrend(recent);
    const earlierTrend = this.calculatePriceTrend(earlier);
    
    return recentTrend - earlierTrend;
  }

  /**
   * Get default features
   */
  getDefaultFeatures() {
    return {
      priceTrend: 0,
      volumeRatio: 1,
      volatilityRatio: 1,
      sellPressure: 0.5,
      distanceFromPeak: 0,
      unlockSize: 0
    };
  }

  /**
   * Get default model
   */
  getDefaultModel() {
    return {
      weights: {
        priceTrend: 0.2,
        volumeRatio: 0.2,
        volatilityRatio: 0.15,
        sellPressure: 0.15,
        distanceFromPeak: 0.15,
        unlockSize: 0.15
      },
      threshold: 0.5,
      featureKeys: ['priceTrend', 'volumeRatio', 'volatilityRatio', 'sellPressure', 'distanceFromPeak', 'unlockSize']
    };
  }

  /**
   * Save trained models to disk
   */
  saveModels(filename = 'trained_event_models.json') {
    const outputDir = './data/models';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filepath = path.join(outputDir, filename);
    const data = {
      models: this.trainedModels,
      stats: this.trainingStats,
      savedAt: new Date()
    };
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`💾 Models saved to: ${filepath}`);
    
    return filepath;
  }

  /**
   * Load trained models from disk
   */
  loadModels(filename = 'trained_event_models.json') {
    const filepath = path.join('./data/models', filename);
    
    if (!fs.existsSync(filepath)) {
      console.log('⚠️  No saved models found, using defaults');
      return false;
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      this.trainedModels = data.models;
      this.trainingStats = data.stats;
      
      console.log(`✅ Models loaded from: ${filepath}`);
      console.log(`   Last trained: ${data.savedAt}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to load models:', error.message);
      return false;
    }
  }

  /**
   * Generate synthetic training data from historical market data
   * (Use when you don't have labeled event data)
   */
  async generateSyntheticTrainingData(symbols, days = 180) {
    console.log('\n🔬 Generating synthetic training data...\n');
    
    const syntheticData = [];
    
    for (const symbol of symbols) {
      try {
        const data = await this.collector.getComprehensiveData(symbol, '1h', days);
        
        // Identify potential events from price patterns
        const events = this.identifyPotentialEvents(data);
        syntheticData.push(...events);
        
        await this.sleep(2000);
        
      } catch (error) {
        console.error(`Failed to generate data for ${symbol}:`, error.message);
      }
    }
    
    console.log(`✅ Generated ${syntheticData.length} synthetic training samples`);
    
    return syntheticData;
  }

  /**
   * Identify potential events from price patterns
   */
  identifyPotentialEvents(data) {
    const events = [];
    const klines = data.klines;
    
    if (!klines || klines.length < 100) return events;
    
    // Look for significant price movements that could be events
    for (let i = 50; i < klines.length - 20; i++) {
      const before = klines.slice(i - 30, i);
      const after = klines.slice(i, i + 20);
      
      const beforeTrend = this.calculatePriceTrend(before);
      const afterTrend = this.calculatePriceTrend(after);
      
      // Potential token unlock: decline before, recovery after
      if (beforeTrend < -0.15 && afterTrend > 0.15) {
        events.push({
          type: 'TOKEN_UNLOCK',
          symbol: data.symbol,
          timestamp: klines[i].openTime,
          beforeTrend,
          afterTrend,
          confidence: 0.7
        });
      }
      
      // Potential listing: pump before, dump after
      if (beforeTrend > 0.25 && afterTrend < -0.20) {
        events.push({
          type: 'EXCHANGE_LISTING',
          symbol: data.symbol,
          timestamp: klines[i].openTime,
          beforeTrend,
          afterTrend,
          confidence: 0.8
        });
      }
    }
    
    return events;
  }

  /**
   * Helper: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = EventPatternTrainer;
