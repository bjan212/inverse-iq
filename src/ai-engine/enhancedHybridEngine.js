/**
 * Enhanced Hybrid AI Engine with DEX Integration
 * 
 * Extends the base Hybrid Engine with:
 * - Advanced risk metrics integration
 * - Advanced pattern detection
 * - DEX signal generation
 * - Unified CEX + DEX signals
 * - Arbitrage detection
 */

const HybridEngine = require('./hybridEngine');
const RiskMetrics = require('../analytics/riskMetrics');
const AdvancedPatternDetector = require('../analytics/advancedPatterns');
const DEXManager = require('../dex/dexManager');

class EnhancedHybridEngine extends HybridEngine {
  constructor(dbPath = './data/enhanced_hybrid_database.json') {
    super(dbPath);
    
    // Initialize advanced analytics
    this.riskMetrics = new RiskMetrics();
    this.patternDetector = new AdvancedPatternDetector();
    
    // Initialize DEX Manager
    this.dexManager = new DEXManager({
      ethereum: {
        enabled: process.env.UNISWAP_ENABLED === 'true',
        rpcUrl: process.env.ETHEREUM_RPC_URL
      },
      bsc: {
        enabled: process.env.PANCAKESWAP_ENABLED === 'true',
        rpcUrl: process.env.BSC_RPC_URL
      },
      arbitrum: {
        enabled: process.env.ARBITRUM_ENABLED === 'true',
        rpcUrl: process.env.ARBITRUM_RPC_URL
      },
      polygon: {
        enabled: process.env.POLYGON_ENABLED === 'true',
        rpcUrl: process.env.POLYGON_RPC_URL
      }
    });
    
    console.log('✅ Enhanced Hybrid Engine initialized with DEX support');
  }

  /**
   * Generate unified signals (CEX + DEX + Advanced Analytics)
   * @param {Array} symbols - Trading symbols
   * @param {object} options - Generation options
   * @returns {Promise<Array>} Enhanced signals
   */
  async generateUnifiedSignals(symbols = ['BTCUSDT', 'ETHUSDT'], options = {}) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║      GENERATING UNIFIED CEX + DEX SIGNALS                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const allSignals = [];
    
    for (const symbol of symbols) {
      try {
        console.log(`\n🔍 Processing ${symbol}...`);
        
        // 1. Generate CEX signals (existing)
        const cexSignals = await this.generateSmartSignals([symbol]);
        console.log(`   📊 CEX Signals: ${cexSignals.length}`);
        
        // 2. Enhance with advanced patterns
        const enhancedSignals = await this.enhanceWithAdvancedPatterns(cexSignals, symbol);
        console.log(`   🎯 Enhanced Signals: ${enhancedSignals.length}`);
        
        // 3. Add risk metrics
        const signalsWithRisk = this.addRiskMetrics(enhancedSignals);
        console.log(`   📈 Risk Metrics Added: ${signalsWithRisk.length}`);
        
        // 4. Generate DEX signals (if enabled)
        if (options.includeDEX !== false) {
          const dexSignals = await this.generateDEXSignals(symbol);
          console.log(`   🔗 DEX Signals: ${dexSignals.length}`);
          allSignals.push(...dexSignals);
        }
        
        allSignals.push(...signalsWithRisk);
        
      } catch (error) {
        console.error(`❌ Error processing ${symbol}:`, error.message);
      }
    }
    
    // 5. Rank all signals by quality
    const rankedSignals = this.rankSignalsByQuality(allSignals);
    
    console.log(`\n✅ Generated ${rankedSignals.length} unified signals`);
    console.log(`   CEX Signals: ${rankedSignals.filter(s => s.source !== 'dex').length}`);
    console.log(`   DEX Signals: ${rankedSignals.filter(s => s.source === 'dex').length}`);
    
    return rankedSignals;
  }

  /**
   * Enhance signals with advanced pattern detection
   * @param {Array} signals - Base signals
   * @param {string} symbol - Trading symbol
   * @returns {Promise<Array>} Enhanced signals
   */
  async enhanceWithAdvancedPatterns(signals, symbol) {
    try {
      // Get candle data
      const candles = await this.getCandles(symbol, '1h', 100);
      if (!candles || candles.length < 50) {
        return signals; // Not enough data
      }
      
      const volume = candles.map(c => c.volume);
      
      // Detect advanced patterns
      const structure = this.patternDetector.detectMarketStructure(candles);
      const wyckoff = this.patternDetector.detectWyckoffPhases(candles, volume);
      const smc = this.patternDetector.detectSMC(candles);
      const orderFlow = this.patternDetector.detectOrderFlow(candles, volume);
      
      // Enhance each signal with pattern data
      return signals.map(signal => ({
        ...signal,
        advancedPatterns: {
          marketStructure: structure,
          wyckoff: wyckoff,
          smartMoneyConcepts: smc,
          orderFlow: orderFlow
        },
        patternConfirmation: this.calculatePatternConfirmation(signal, structure, wyckoff, smc)
      }));
      
    } catch (error) {
      console.error('Pattern enhancement failed:', error.message);
      return signals;
    }
  }

  /**
   * Calculate pattern confirmation score
   * @param {object} signal - Base signal
   * @param {object} structure - Market structure
   * @param {object} wyckoff - Wyckoff analysis
   * @param {object} smc - SMC analysis
   * @returns {number} Confirmation score (0-100)
   */
  calculatePatternConfirmation(signal, structure, wyckoff, smc) {
    let score = 0;
    
    // Market structure alignment
    if (signal.direction === 'LONG' && structure.trend === 'uptrend') score += 25;
    if (signal.direction === 'SHORT' && structure.trend === 'downtrend') score += 25;
    
    // Wyckoff confirmation
    if (wyckoff.stage === 'spring' && signal.direction === 'LONG') score += 25;
    if (wyckoff.confidence > 70) score += 15;
    
    // SMC confirmation
    if (smc.orderBlocks && smc.orderBlocks.length > 0) {
      const relevantOBs = smc.orderBlocks.filter(ob => 
        (signal.direction === 'LONG' && ob.type === 'bullish') ||
        (signal.direction === 'SHORT' && ob.type === 'bearish')
      );
      score += Math.min(20, relevantOBs.length * 10);
    }
    
    // Structure strength
    score += Math.min(15, structure.strength / 5);
    
    return Math.min(100, Math.round(score));
  }

  /**
   * Add risk metrics to signals
   * @param {Array} signals - Signals to enhance
   * @returns {Array} Signals with risk metrics
   */
  addRiskMetrics(signals) {
    return signals.map(signal => {
      const entry = signal.averageEntryPrice;
      const stopLoss = signal.stopLoss;
      const takeProfit = signal.takeProfit1;
      
      // Calculate risk metrics
      const riskReward = this.riskMetrics.calculateRiskRewardRatio(entry, stopLoss, takeProfit);
      const positionRisk = this.riskMetrics.calculatePositionRisk(entry, stopLoss, 1);
      
      // Calculate recommended position size using Kelly
      const kellyPosition = this.riskMetrics.calculateKellyPosition(
        signal.confidence / 100,
        parseFloat(signal.riskRewardRatio1) || 2.0,
        1.0,
        10000 // Assume $10k capital
      );
      
      return {
        ...signal,
        riskMetrics: {
          riskReward: riskReward,
          positionRisk: positionRisk,
          recommendedPosition: kellyPosition,
          riskLevel: this.categorizeRisk(signal.confidence, riskReward.ratio)
        }
      };
    });
  }

  /**
   * Categorize risk level
   * @param {number} confidence - Signal confidence
   * @param {number} rrRatio - Risk/reward ratio
   * @returns {string} Risk category
   */
  categorizeRisk(confidence, rrRatio) {
    if (confidence >= 85 && rrRatio >= 2.5) return 'VERY_LOW';
    if (confidence >= 75 && rrRatio >= 2.0) return 'LOW';
    if (confidence >= 65 && rrRatio >= 1.5) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Generate DEX-specific signals
   * @param {string} symbol - Trading symbol
   * @returns {Promise<Array>} DEX signals
   */
  async generateDEXSignals(symbol) {
    const signals = [];
    
    try {
      // Convert symbol to token pair
      const tokenPair = this.symbolToTokenPair(symbol);
      
      // Check for arbitrage opportunities
      const arbitrage = await this.dexManager.findArbitrage(
        tokenPair.tokenA,
        tokenPair.tokenB,
        '1'
      );
      
      if (arbitrage && arbitrage.profitable) {
        signals.push({
          signalId: `DEX_ARB_${symbol}_${Date.now()}`,
          type: 'arbitrage',
          symbol: symbol,
          direction: 'NEUTRAL',
          confidence: 95,
          source: 'dex',
          arbitrage: arbitrage,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 300000) // 5 minutes
        });
      }
      
      // Get DEX prices for comparison
      const dexPrices = await this.dexManager.getBestPrice(
        tokenPair.tokenA,
        tokenPair.tokenB,
        '1'
      );
      
      // Add DEX price info to signals
      signals.forEach(signal => {
        signal.dexPrices = dexPrices;
      });
      
    } catch (error) {
      console.error(`DEX signal generation failed for ${symbol}:`, error.message);
    }
    
    return signals;
  }

  /**
   * Convert trading symbol to token pair
   * @param {string} symbol - Trading symbol (e.g., 'ETHUSDT')
   * @returns {object} Token addresses
   */
  symbolToTokenPair(symbol) {
    // Token address mappings (Ethereum mainnet)
    const tokenMap = {
      'ETHUSDT': {
        tokenA: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        tokenB: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        symbolA: 'WETH',
        symbolB: 'USDT'
      },
      'BTCUSDT': {
        tokenA: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
        tokenB: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        symbolA: 'WBTC',
        symbolB: 'USDT'
      },
      'ETHUSDC': {
        tokenA: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        tokenB: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        symbolA: 'WETH',
        symbolB: 'USDC'
      }
    };
    
    return tokenMap[symbol] || tokenMap['ETHUSDT'];
  }

  /**
   * Rank signals by quality (confidence, source, patterns)
   * @param {Array} signals - All signals
   * @returns {Array} Ranked signals
   */
  rankSignalsByQuality(signals) {
    return signals.sort((a, b) => {
      // 1. Prioritize by confidence
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      
      // 2. Then by source quality
      const sourceRank = {
        'combined': 5,
        'trader': 4,
        'public': 3,
        'dex': 2
      };
      
      const rankA = sourceRank[a.source] || 1;
      const rankB = sourceRank[b.source] || 1;
      
      if (rankB !== rankA) {
        return rankB - rankA;
      }
      
      // 3. Then by pattern confirmation
      const confirmA = a.patternConfirmation || 0;
      const confirmB = b.patternConfirmation || 0;
      
      return confirmB - confirmA;
    });
  }

  /**
   * Get candles for pattern analysis
   * @param {string} symbol - Trading symbol
   * @param {string} interval - Timeframe
   * @param {number} limit - Number of candles
   * @returns {Promise<Array>} Candle data
   */
  async getCandles(symbol, interval = '1h', limit = 100) {
    try {
      const data = await this.publicCollector.getComprehensiveData(symbol, interval, limit / 24);
      return data.klines || [];
    } catch (error) {
      console.error(`Failed to get candles for ${symbol}:`, error.message);
      return [];
    }
  }

  /**
   * Generate comprehensive market analysis
   * @param {string} symbol - Trading symbol
   * @returns {Promise<object>} Market analysis
   */
  async generateMarketAnalysis(symbol) {
    console.log(`\n📊 Generating comprehensive analysis for ${symbol}...`);
    
    try {
      // Get candle data
      const candles = await this.getCandles(symbol, '1h', 100);
      if (candles.length < 50) {
        return { error: 'Insufficient data' };
      }
      
      const volume = candles.map(c => c.volume);
      const currentPrice = candles[candles.length - 1].close;
      
      // Detect all patterns
      const structure = this.patternDetector.detectMarketStructure(candles);
      const wyckoff = this.patternDetector.detectWyckoffPhases(candles, volume);
      const smc = this.patternDetector.detectSMC(candles);
      const orderFlow = this.patternDetector.detectOrderFlow(candles, volume);
      
      // Get DEX data
      const tokenPair = this.symbolToTokenPair(symbol);
      const dexPrices = await this.dexManager.comparePrices(
        tokenPair.tokenA,
        tokenPair.tokenB
      );
      
      // Check arbitrage
      const arbitrage = await this.dexManager.findArbitrage(
        tokenPair.tokenA,
        tokenPair.tokenB,
        '1'
      );
      
      return {
        symbol,
        currentPrice,
        timestamp: new Date(),
        patterns: {
          marketStructure: structure,
          wyckoff: wyckoff,
          smartMoneyConcepts: smc,
          orderFlow: orderFlow
        },
        dex: {
          prices: dexPrices,
          arbitrage: arbitrage
        },
        recommendation: this.generateRecommendation(structure, wyckoff, smc, orderFlow)
      };
      
    } catch (error) {
      console.error(`Analysis failed for ${symbol}:`, error.message);
      return { error: error.message };
    }
  }

  /**
   * Generate trading recommendation from patterns
   * @param {object} structure - Market structure
   * @param {object} wyckoff - Wyckoff analysis
   * @param {object} smc - SMC analysis
   * @param {object} orderFlow - Order flow
   * @returns {object} Recommendation
   */
  generateRecommendation(structure, wyckoff, smc, orderFlow) {
    let bias = 'NEUTRAL';
    let strength = 0;
    let reasons = [];
    
    // Market structure
    if (structure.trend === 'uptrend') {
      bias = 'BULLISH';
      strength += structure.strength;
      reasons.push(`Uptrend with ${structure.strength.toFixed(0)}% strength`);
    } else if (structure.trend === 'downtrend') {
      bias = 'BEARISH';
      strength += structure.strength;
      reasons.push(`Downtrend with ${structure.strength.toFixed(0)}% strength`);
    }
    
    // Wyckoff
    if (wyckoff.stage === 'spring') {
      bias = 'BULLISH';
      strength += wyckoff.confidence;
      reasons.push(`Wyckoff Spring detected (${wyckoff.confidence}% confidence)`);
    }
    
    // SMC
    if (smc.orderBlocks && smc.orderBlocks.length > 0) {
      const bullishOBs = smc.orderBlocks.filter(ob => ob.type === 'bullish').length;
      const bearishOBs = smc.orderBlocks.filter(ob => ob.type === 'bearish').length;
      
      if (bullishOBs > bearishOBs) {
        reasons.push(`${bullishOBs} bullish order blocks`);
        strength += 10;
      } else if (bearishOBs > bullishOBs) {
        reasons.push(`${bearishOBs} bearish order blocks`);
        strength += 10;
      }
    }
    
    // Order flow
    if (orderFlow.sweepLiquidity && orderFlow.sweepLiquidity.detected) {
      const recentSweeps = orderFlow.sweepLiquidity.sweeps.slice(-3);
      const bullishSweeps = recentSweeps.filter(s => s.type === 'bullish').length;
      const bearishSweeps = recentSweeps.filter(s => s.type === 'bearish').length;
      
      if (bullishSweeps > bearishSweeps) {
        reasons.push(`${bullishSweeps} bullish liquidity sweeps`);
      }
    }
    
    return {
      bias,
      strength: Math.min(100, strength),
      reasons,
      confidence: Math.min(100, Math.round(strength / reasons.length))
    };
  }

  /**
   * Get enhanced statistics
   * @returns {object} Enhanced statistics
   */
  getEnhancedStatistics() {
    const baseStats = this.getHybridStatistics();
    const dexStats = this.dexManager.getStatistics();
    
    return {
      ...baseStats,
      dex: dexStats,
      analytics: {
        riskMetricsEnabled: true,
        advancedPatternsEnabled: true,
        dexIntegrationEnabled: dexStats.totalDEXs > 0
      }
    };
  }
}

module.exports = EnhancedHybridEngine;
