# 🚀 COMPREHENSIVE IMPLEMENTATION PLAN: Advanced Metrics & DEX Integration for DeFi Futures Trading

## 📋 EXECUTIVE SUMMARY

This document provides a complete implementation plan to extend the Xrypt trading platform with:
1. **Advanced Risk Management Metrics** - Sophisticated risk analysis and position sizing
2. **Enhanced Pattern Recognition** - Advanced technical patterns and market structure analysis
3. **DEX Integration** - Uniswap V3 and PancakeSwap V3 perpetual futures trading
4. **DeFi Futures Support** - On-chain perpetual contracts with leverage

---

## 🎯 PROJECT OBJECTIVES

### Primary Goals:
1. ✅ Implement comprehensive risk management system with real-time monitoring
2. ✅ Add advanced pattern recognition (Elliott Wave, Wyckoff, Market Structure)
3. ✅ Integrate Uniswap V3 and PancakeSwap V3 for DEX futures trading
4. ✅ Support on-chain perpetual contracts with leverage (GMX, dYdX, Gains Network)
5. ✅ Create unified interface for CEX + DEX trading signals

### Success Metrics:
- Risk-adjusted returns improved by 30%+
- Pattern detection accuracy >85%
- DEX integration latency <2 seconds
- Support for 10+ DeFi perpetual protocols
- Unified signal generation across CEX and DEX

---

## 🏗️ ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    XRYPT PLATFORM                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │   CEX Module     │      │   DEX Module     │           │
│  │  (Existing)      │      │    (NEW)         │           │
│  │                  │      │                  │           │
│  │ • Binance        │      │ • Uniswap V3     │           │
│  │ • Bybit          │      │ • PancakeSwap V3 │           │
│  │ • OKX            │      │ • GMX            │           │
│  │ • MEXC           │      │ • dYdX           │           │
│  └────────┬─────────┘      └────────┬─────────┘           │
│           │                         │                      │
│           └────────┬────────────────┘                      │
│                    │                                       │
│         ┌──────────▼──────────┐                           │
│         │  Unified Data Layer │                           │
│         │  • Price Feeds      │                           │
│         │  • Liquidity Data   │                           │
│         │  • Volume Analysis  │                           │
│         └──────────┬──────────┘                           │
│                    │                                       │
│         ┌──────────▼──────────────────┐                   │
│         │   Advanced Analytics Engine │                   │
│         │   ┌──────────────────────┐  │                   │
│         │   │ Risk Management      │  │                   │
│         │   │ • Position Sizing    │  │                   │
│         │   │ • Portfolio Risk     │  │                   │
│         │   │ • Drawdown Control   │  │                   │
│         │   │ • Correlation Matrix │  │                   │
│         │   └──────────────────────┘  │                   │
│         │   ┌──────────────────────┐  │                   │
│         │   │ Pattern Recognition  │  │                   │
│         │   │ • Elliott Wave       │  │                   │
│         │   │ • Wyckoff Method     │  │                   │
│         │   │ • Market Structure   │  │                   │
│         │   │ • Order Flow         │  │                   │
│         │   └──────────────────────┘  │                   │
│         └──────────┬──────────────────┘                   │
│                    │                                       │
│         ┌──────────▼──────────┐                           │
│         │  Hybrid AI Engine   │                           │
│         │  (Enhanced)         │                           │
│         └──────────┬──────────┘                           │
│                    │                                       │
│         ┌──────────▼──────────┐                           │
│         │  Signal Generator   │                           │
│         │  • CEX Signals      │                           │
│         │  • DEX Signals      │                           │
│         │  • Arbitrage Opps   │                           │
│         └─────────────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 PHASE 1: ADVANCED RISK MANAGEMENT METRICS

### 1.1 Risk Metrics Module (`src/analytics/riskMetrics.js`)

**Features to Implement:**

```javascript
class RiskMetrics {
  // Position Sizing
  calculateKellyPosition(winRate, avgWin, avgLoss, capital)
  calculateFixedFractional(riskPerTrade, capital, stopLoss)
  calculateVolatilityAdjusted(atr, capital, riskTolerance)
  
  // Portfolio Risk
  calculatePortfolioVaR(positions, confidence = 0.95)
  calculatePortfolioCVaR(positions, confidence = 0.95)
  calculateMaxDrawdown(equity curve)
  calculateSharpeRatio(returns, riskFreeRate = 0)
  calculateSortinoRatio(returns, targetReturn = 0)
  
  // Position Risk
  calculatePositionRisk(entry, stopLoss, size)
  calculateRiskRewardRatio(entry, stopLoss, takeProfit)
  calculateBreakEvenPrice(entry, fees, leverage)
  
  // Correlation & Diversification
  calculateCorrelationMatrix(assets, period = 30)
  calculatePortfolioBeta(positions, marketIndex)
  calculateDiversificationRatio(positions)
  
  // Leverage & Margin
  calculateEffectiveLeverage(positions, capital)
  calculateMarginRequirement(positions, exchange)
  calculateLiquidationPrice(entry, leverage, side)
  
  // Real-time Monitoring
  monitorPositionHealth(position)
  checkMarginCall(account, positions)
  calculateTimeToLiquidation(position, volatility)
}
```

**Implementation Details:**

```javascript
// Example: Kelly Criterion Position Sizing
calculateKellyPosition(winRate, avgWin, avgLoss, capital) {
  // Kelly % = (Win% * AvgWin - Loss% * AvgLoss) / AvgWin
  const lossRate = 1 - winRate;
  const kellyPercent = (winRate * avgWin - lossRate * avgLoss) / avgWin;
  
  // Use fractional Kelly (0.25 - 0.5) for safety
  const fractionalKelly = kellyPercent * 0.25;
  
  // Calculate position size
  const positionSize = capital * Math.max(0, Math.min(fractionalKelly, 0.1));
  
  return {
    kellyPercent: kellyPercent * 100,
    fractionalKelly: fractionalKelly * 100,
    recommendedSize: positionSize,
    maxRisk: positionSize * 0.02 // 2% max risk
  };
}

// Example: Value at Risk (VaR)
calculatePortfolioVaR(positions, confidence = 0.95) {
  // Historical simulation method
  const returns = this.calculateHistoricalReturns(positions);
  const sortedReturns = returns.sort((a, b) => a - b);
  
  // Find VaR at confidence level
  const varIndex = Math.floor((1 - confidence) * sortedReturns.length);
  const var95 = Math.abs(sortedReturns[varIndex]);
  
  return {
    var: var95,
    confidence: confidence * 100,
    interpretation: `95% confident losses won't exceed ${var95.toFixed(2)}%`
  };
}
```

### 1.2 Risk Dashboard (`src/analytics/riskDashboard.js`)

**Real-time Risk Monitoring:**

```javascript
class RiskDashboard {
  constructor() {
    this.riskMetrics = new RiskMetrics();
    this.alerts = [];
    this.thresholds = {
      maxDrawdown: 0.15,        // 15% max drawdown
      maxLeverage: 5,           // 5x max leverage
      maxCorrelation: 0.7,      // 70% max correlation
      minSharpe: 1.0,           // Minimum Sharpe ratio
      maxVaR: 0.05              // 5% max VaR
    };
  }
  
  async monitorRisk(portfolio) {
    const metrics = {
      drawdown: this.riskMetrics.calculateMaxDrawdown(portfolio.equity),
      leverage: this.riskMetrics.calculateEffectiveLeverage(portfolio.positions),
      var: this.riskMetrics.calculatePortfolioVaR(portfolio.positions),
      sharpe: this.riskMetrics.calculateSharpeRatio(portfolio.returns),
      correlation: this.riskMetrics.calculateCorrelationMatrix(portfolio.positions)
    };
    
    // Check thresholds and generate alerts
    this.checkThresholds(metrics);
    
    return {
      metrics,
      alerts: this.alerts,
      riskScore: this.calculateRiskScore(metrics),
      recommendations: this.generateRecommendations(metrics)
    };
  }
  
  calculateRiskScore(metrics) {
    // Composite risk score (0-100, lower is better)
    let score = 0;
    
    score += (metrics.drawdown / this.thresholds.maxDrawdown) * 25;
    score += (metrics.leverage / this.thresholds.maxLeverage) * 25;
    score += (metrics.var.var / this.thresholds.maxVaR) * 25;
    score += (1 - metrics.sharpe / 2) * 25;
    
    return Math.min(100, Math.max(0, score));
  }
}
```

---

## 📦 PHASE 2: ADVANCED PATTERN RECOGNITION

### 2.1 Enhanced Pattern Detector (`src/analytics/advancedPatterns.js`)

**Patterns to Implement:**

```javascript
class AdvancedPatternDetector {
  // Elliott Wave Analysis
  detectElliottWave(candles) {
    // Identify 5-wave impulse and 3-wave correction
    // Return wave count, degree, and projection
  }
  
  // Wyckoff Method
  detectWyckoffPhases(candles, volume) {
    // Accumulation: PS, SC, AR, ST, Spring
    // Distribution: PSY, BC, AR, UT, UTAD
    return {
      phase: 'accumulation' | 'distribution' | 'markup' | 'markdown',
      stage: 'spring' | 'test' | 'breakout',
      confidence: 0-100
    };
  }
  
  // Market Structure
  detectMarketStructure(candles) {
    return {
      trend: 'uptrend' | 'downtrend' | 'ranging',
      higherHighs: [],
      higherLows: [],
      lowerHighs: [],
      lowerLows: [],
      breakOfStructure: boolean,
      changeOfCharacter: boolean
    };
  }
  
  // Order Flow Patterns
  detectOrderFlow(candles, volume, trades) {
    return {
      absorption: boolean,      // Large volume, small price move
      exhaustion: boolean,      // Climactic volume
      iceberg: boolean,         // Hidden orders
      spoofing: boolean,        // Fake walls
      sweepLiquidity: boolean   // Stop hunt
    };
  }
  
  // Smart Money Concepts
  detectSMC(candles) {
    return {
      orderBlocks: [],          // Institutional entry zones
      fairValueGaps: [],        // Imbalance areas
      liquidityPools: [],       // Stop clusters
      breakers: [],             // Failed order blocks
      mitigation: []            // Retest zones
    };
  }
  
  // Volume Profile
  analyzeVolumeProfile(candles, volume) {
    return {
      poc: number,              // Point of Control
      vah: number,              // Value Area High
      val: number,              // Value Area Low
      hvn: [],                  // High Volume Nodes
      lvn: []                   // Low Volume Nodes
    };
  }
}
```

**Implementation Example:**

```javascript
// Wyckoff Accumulation Detection
detectWyckoffPhases(candles, volume) {
  const phases = {
    PS: this.detectPreliminarySupport(candles, volume),
    SC: this.detectSellingClimax(candles, volume),
    AR: this.detectAutomaticRally(candles, volume),
    ST: this.detectSecondaryTest(candles, volume),
    Spring: this.detectSpring(candles, volume)
  };
  
  // Determine current phase
  let currentPhase = 'unknown';
  let confidence = 0;
  
  if (phases.Spring.detected) {
    currentPhase = 'spring';
    confidence = phases.Spring.confidence;
  } else if (phases.ST.detected) {
    currentPhase = 'secondary_test';
    confidence = phases.ST.confidence;
  }
  // ... more logic
  
  return {
    phase: 'accumulation',
    stage: currentPhase,
    confidence: confidence,
    signals: this.generateWyckoffSignals(phases),
    nextExpected: this.predictNextPhase(currentPhase)
  };
}

// Market Structure Break Detection
detectMarketStructure(candles) {
  const swings = this.identifySwingPoints(candles);
  const highs = swings.filter(s => s.type === 'high');
  const lows = swings.filter(s => s.type === 'low');
  
  // Check for higher highs and higher lows (uptrend)
  const higherHighs = this.checkHigherHighs(highs);
  const higherLows = this.checkHigherLows(lows);
  
  // Check for lower highs and lower lows (downtrend)
  const lowerHighs = this.checkLowerHighs(highs);
  const lowerLows = this.checkLowerLows(lows);
  
  // Detect break of structure
  const bos = this.detectBreakOfStructure(candles, swings);
  const choch = this.detectChangeOfCharacter(candles, swings);
  
  return {
    trend: this.determineTrend(higherHighs, higherLows, lowerHighs, lowerLows),
    higherHighs,
    higherLows,
    lowerHighs,
    lowerLows,
    breakOfStructure: bos,
    changeOfCharacter: choch,
    strength: this.calculateTrendStrength(swings)
  };
}
```

### 2.2 Pattern Integration with Hybrid Engine

**Enhance `src/ai-engine/hybridEngine.js`:**

```javascript
// Add to HybridEngine class
async generateAdvancedSignals(symbols) {
  const patternDetector = new AdvancedPatternDetector();
  const signals = [];
  
  for (const symbol of symbols) {
    const candles = await this.getCandles(symbol);
    const volume = await this.getVolume(symbol);
    
    // Detect patterns
    const wyckoff = patternDetector.detectWyckoffPhases(candles, volume);
    const structure = patternDetector.detectMarketStructure(candles);
    const orderFlow = patternDetector.detectOrderFlow(candles, volume);
    const smc = patternDetector.detectSMC(candles);
    
    // Combine with existing pattern database
    const existingPatterns = this.findMatchingPatternsFromDB(symbol);
    
    // Generate enhanced signal
    if (this.shouldGenerateSignal(wyckoff, structure, orderFlow, smc, existingPatterns)) {
      const signal = this.createAdvancedSignal({
        symbol,
        wyckoff,
        structure,
        orderFlow,
        smc,
        existingPatterns
      });
      
      signals.push(signal);
    }
  }
  
  return signals;
}
```

---

## 📦 PHASE 3: DEX INTEGRATION - UNISWAP V3 & PANCAKESWAP V3

### 3.1 DEX Connector Base (`src/dex/dexConnector.js`)

```javascript
const { ethers } = require('ethers');

class DEXConnector {
  constructor(config) {
    this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
    this.wallet = config.privateKey 
      ? new ethers.Wallet(config.privateKey, this.provider)
      : null;
    this.network = config.network; // 'ethereum', 'bsc', 'arbitrum', 'polygon'
  }
  
  // Abstract methods to be implemented by specific DEX
  async getPrice(tokenA, tokenB) { throw new Error('Not implemented'); }
  async getLiquidity(tokenA, tokenB) { throw new Error('Not implemented'); }
  async getPoolInfo(poolAddress) { throw new Error('Not implemented'); }
  async executeTrade(params) { throw new Error('Not implemented'); }
  
  // Common utilities
  async getGasPrice() {
    return await this.provider.getGasPrice();
  }
  
  async estimateGas(transaction) {
    return await this.provider.estimateGas(transaction);
  }
  
  async getBlockNumber() {
    return await this.provider.getBlockNumber();
  }
}

module.exports = DEXConnector;
```

### 3.2 Uniswap V3 Integration (`src/dex/uniswapV3.js`)

```javascript
const DEXConnector = require('./dexConnector');
const { ethers } = require('ethers');

// Uniswap V3 ABIs
const FACTORY_ABI = require('./abis/uniswapV3Factory.json');
const POOL_ABI = require('./abis/uniswapV3Pool.json');
const QUOTER_ABI = require('./abis/uniswapV3Quoter.json');
const ROUTER_ABI = require('./abis/uniswapV3Router.json');

class UniswapV3Connector extends DEXConnector {
  constructor(config) {
    super(config);
    
    // Uniswap V3 contract addresses (Ethereum mainnet)
    this.contracts = {
      factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      nftManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
    };
    
    // Initialize contract instances
    this.factory = new ethers.Contract(
      this.contracts.factory,
      FACTORY_ABI,
      this.provider
    );
    
    this.router = new ethers.Contract(
      this.contracts.router,
      ROUTER_ABI,
      this.wallet || this.provider
    );
    
    this.quoter = new ethers.Contract(
      this.contracts.quoter,
      QUOTER_ABI,
      this.provider
    );
  }
  
  /**
   * Get pool address for token pair
   */
  async getPoolAddress(tokenA, tokenB, fee = 3000) {
    return await this.factory.getPool(tokenA, tokenB, fee);
  }
  
  /**
   * Get current price from pool
   */
  async getPrice(tokenA, tokenB, fee = 3000) {
    const poolAddress = await this.getPoolAddress(tokenA, tokenB, fee);
    const pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
    
    const slot0 = await pool.slot0();
    const sqrtPriceX96 = slot0.sqrtPriceX96;
    
    // Convert sqrtPriceX96 to actual price
    const price = (sqrtPriceX96 / (2 ** 96)) ** 2;
    
    return {
      price,
      sqrtPriceX96: sqrtPriceX96.toString(),
      tick: slot0.tick,
      observationIndex: slot0.observationIndex,
      observationCardinality: slot0.observationCardinality
    };
  }
  
  /**
   * Get pool liquidity
   */
  async getLiquidity(tokenA, tokenB, fee = 3000) {
    const poolAddress = await this.getPoolAddress(tokenA, tokenB, fee);
    const pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
    
    const liquidity = await pool.liquidity();
    
    return {
      liquidity: liquidity.toString(),
      liquidityFormatted: ethers.utils.formatUnits(liquidity, 18)
    };
  }
  
  /**
   * Get comprehensive pool information
   */
  async getPoolInfo(tokenA, tokenB, fee = 3000) {
    const poolAddress = await this.getPoolAddress(tokenA, tokenB, fee);
    const pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
    
    const [slot0, liquidity, token0, token1, feeProtocol] = await Promise.all([
      pool.slot0(),
      pool.liquidity(),
      pool.token0(),
      pool.token1(),
      pool.feeProtocol()
    ]);
    
    return {
      poolAddress,
      token0,
      token1,
      fee,
      liquidity: liquidity.toString(),
      sqrtPriceX96: slot0.sqrtPriceX96.toString(),
      tick: slot0.tick,
      price: (slot0.sqrtPriceX96 / (2 ** 96)) ** 2,
      feeProtocol
    };
  }
  
  /**
   * Get quote for swap
   */
  async getQuote(tokenIn, tokenOut, amountIn, fee = 3000) {
    try {
      const quotedAmountOut = await this.quoter.callStatic.quoteExactInputSingle(
        tokenIn,
        tokenOut,
        fee,
        amountIn,
        0 // sqrtPriceLimitX96 (0 = no limit)
      );
      
      return {
        amountIn: amountIn.toString(),
        amountOut: quotedAmountOut.toString(),
        amountOutFormatted: ethers.utils.formatUnits(quotedAmountOut, 18)
      };
    } catch (error) {
      console.error('Quote error:', error);
      throw error;
    }
  }
  
  /**
   * Execute swap
   */
  async executeTrade(params) {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      amountOutMinimum,
      fee = 3000,
      recipient,
      deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes
    } = params;
    
    if (!this.wallet) {
      throw new Error('Wallet not configured for trading');
    }
    
    const swapParams = {
      tokenIn,
      tokenOut,
      fee,
      recipient: recipient || this.wallet.address,
      deadline,
      amountIn,
      amountOutMinimum,
      sqrtPriceLimitX96: 0
    };
    
    // Estimate gas
    const gasEstimate = await this.router.estimateGas.exactInputSingle(swapParams);
    
    // Execute swap
    const tx = await this.router.exactInputSingle(swapParams, {
      gasLimit: gasEstimate.mul(120).div(100) // 20% buffer
    });
    
    console.log(`🔄 Swap transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    
    console.log(`✅ Swap confirmed in block ${receipt.blockNumber}`);
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? 'success' : 'failed'
    };
  }
  
  /**
   * Monitor pool for price changes
   */
  async monitorPool(tokenA, tokenB, fee, callback) {
    const poolAddress = await this.getPoolAddress(tokenA, tokenB, fee);
    const pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
    
    // Listen for Swap events
    pool.on('Swap', (sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick, event) => {
      const price = (sqrtPriceX96 / (2 ** 96)) ** 2;
      
      callback({
        event: 'swap',
        sender,
        recipient,
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        price,
        tick,
        liquidity: liquidity.toString(),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash
      });
    });
    
    console.log(`👀 Monitoring Uniswap V3 pool: ${poolAddress}`);
  }
}

module.exports = UniswapV3Connector;
```

### 3.3 PancakeSwap V3 Integration (`src/dex/pancakeswapV3.js`)

```javascript
const UniswapV3Connector = require('./uniswapV3');

class PancakeSwapV3Connector extends UniswapV3Connector {
  constructor(config) {
    super(config);
    
    // PancakeSwap V3 contract addresses (BSC mainnet)
    this.contracts = {
      factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
      router: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
      quoter: '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997',
      nftManager: '0x46A15B0b27311cedF172AB29E4f4766fbE7F4364'
    };
    
    // Re-initialize with PancakeSwap addresses
    this.factory = new ethers.Contract(
      this.contracts.factory,
      FACTORY_ABI,
      this.provider
    );
    
    this.router = new ethers.Contract(
      this.contracts.router,
      ROUTER_ABI,
      this.wallet || this.provider
    );
    
    this.quoter = new ethers.Contract(
      this.contracts.quoter,
      QUOTER_ABI,
      this.provider
    );
  }
}

module.exports = PancakeSwapV3Connector;
```

---

## 📦 PHASE 4: DEFI PERPETUAL FUTURES INTEGRATION

### 4.1 GMX Integration (`src/dex/perpetuals/gmx.js`)

```javascript
const DEXConnector = require('../dexConnector');
const { ethers } = require('ethers');

class GMXConnector extends DEXConnector {
  constructor(config) {
    super(config);
    
    // GMX contract addresses (Arbitrum)
    this.contracts = {
      vault: '0x489ee077994B6658eAfA855C308275EAd8097C4A',
      router: '0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064',
      positionRouter: '0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868',
      reader: '0x22199a49A999c351eF7927602CFB187ec3cae489'
    };
    
    this.vault = new ethers.Contract(
      this.contracts.vault,
      GMX_VAULT_ABI,
      this.wallet || this.provider
    );
    
    this.positionRouter = new ethers.Contract(
      this.contracts.positionRouter,
      POSITION_ROUTER_ABI,
      this.wallet || this.provider
    );
  }
  
  /**
   * Get current price for perpetual
   */
  async getPrice(token) {
    const price = await this.vault.getMinPrice(token);
    return ethers.utils.formatUnits(price, 30);
  }
  
  /**
   * Open long position
   */
  async openLong(params) {
    const {
      indexToken,
      collateralToken,
      collateralAmount,
      sizeDelta,
      acceptablePrice
    } = params;
    
    const path = [collateralToken];
    
    const tx = await this.positionRouter.createIncreasePosition(
      path,
      indexToken,
      collateralAmount,
      0, // minOut
      sizeDelta,
      true, // isLong
      acceptablePrice,
      this.executionFee,
      ethers.constants.HashZero,
      ethers.constants.AddressZero
    );
    
    return await tx.wait();
  }
  
  /**
   * Open short position
   */
  async openShort(params) {
    // Similar to openLong but with isLong = false
  }
  
  /**
   * Close position
   */
  async closePosition(params) {
    const {
      indexToken,
      collateralToken,
      collateralDelta,
      sizeDelta,
      isLong,
      acceptablePrice
    } = params;
    
    const path = [collateralToken];
    
    const tx = await this.positionRouter.createDecreasePosition(
      path,
      indexToken,
      collateralDelta,
      sizeDelta,
      isLong,
      this.wallet.address,
      acceptablePrice,
      0, // minOut
      this.executionFee,
      false,
      ethers.constants.AddressZero
    );
    
    return await tx.wait();
  }
  
  /**
   * Get position info
   */
  async getPosition(account, collateralToken, indexToken, isLong) {
    const position = await this.vault.getPosition(
      account,
      collateralToken,
      indexToken,
      isLong
    );
    
    return {
      size: ethers.utils.formatUnits(position[0], 30),
      collateral: ethers.
