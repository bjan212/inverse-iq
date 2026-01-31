/**
 * Trade Analyzer
 * 
 * This module analyzes open trades from connected exchanges and provides
 * intelligent recommendations based on margin balance, timeframe, trade setup,
 * direction, and engine metrics.
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class TradeAnalyzer {
  constructor(options = {}) {
    this.options = {
      dataDir: options.dataDir || path.join(__dirname, '../../data'),
      apiKeysFile: options.apiKeysFile || 'exchange_api_keys.json',
      historyFile: options.historyFile || 'trade_analysis_history.json',
      ...options
    };
    
    // Ensure data directory exists
    if (!fs.existsSync(this.options.dataDir)) {
      fs.mkdirSync(this.options.dataDir, { recursive: true });
    }
    
    // Load API keys
    this.apiKeys = this.loadApiKeys();
    
    // Load analysis history
    this.analysisHistory = this.loadAnalysisHistory();
    
    // Initialize exchange connectors
    this.exchangeConnectors = {
      binance: this.createBinanceConnector.bind(this),
      bybit: this.createBybitConnector.bind(this),
      okx: this.createOkxConnector.bind(this),
      mexc: this.createMexcConnector.bind(this)
    };
    
    // Initialize risk metrics
    this.riskMetrics = {
      maxDrawdown: 0.05, // 5% max drawdown
      maxLeverage: 10,   // 10x max leverage
      maxPositionSize: 0.2, // 20% of balance max position size
      minRiskRewardRatio: 2.0 // Minimum 2:1 risk-reward ratio
    };
  }
  
  /**
   * Load API keys from file
   */
  loadApiKeys() {
    const apiKeysPath = path.join(this.options.dataDir, this.options.apiKeysFile);
    
    if (fs.existsSync(apiKeysPath)) {
      try {
        return JSON.parse(fs.readFileSync(apiKeysPath, 'utf8'));
      } catch (error) {
        console.error('Error loading API keys:', error);
        return {};
      }
    }
    
    return {};
  }
  
  /**
   * Save API keys to file
   */
  saveApiKeys() {
    const apiKeysPath = path.join(this.options.dataDir, this.options.apiKeysFile);
    
    try {
      fs.writeFileSync(apiKeysPath, JSON.stringify(this.apiKeys, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving API keys:', error);
    }
  }
  
  /**
   * Load analysis history from file
   */
  loadAnalysisHistory() {
    const historyPath = path.join(this.options.dataDir, this.options.historyFile);
    
    if (fs.existsSync(historyPath)) {
      try {
        return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      } catch (error) {
        console.error('Error loading analysis history:', error);
        return [];
      }
    }
    
    return [];
  }
  
  /**
   * Save analysis history to file
   */
  saveAnalysisHistory() {
    const historyPath = path.join(this.options.dataDir, this.options.historyFile);
    
    try {
      fs.writeFileSync(historyPath, JSON.stringify(this.analysisHistory, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving analysis history:', error);
    }
  }
  
  /**
   * Add or update API keys for an exchange
   */
  setApiKeys(userId, exchange, apiKey, apiSecret, options = {}) {
    if (!this.apiKeys[userId]) {
      this.apiKeys[userId] = {};
    }
    
    this.apiKeys[userId][exchange] = {
      apiKey,
      apiSecret,
      options
    };
    
    this.saveApiKeys();
    
    return true;
  }
  
  /**
   * Get API keys for a user and exchange
   */
  getApiKeys(userId, exchange) {
    if (!this.apiKeys[userId] || !this.apiKeys[userId][exchange]) {
      return null;
    }
    
    return this.apiKeys[userId][exchange];
  }
  
  /**
   * Create a connector for Binance Futures
   */
  createBinanceConnector(apiKey, apiSecret) {
    return {
      getOpenPositions: async () => {
        try {
          const timestamp = Date.now();
          const queryString = `timestamp=${timestamp}`;
          
          const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(queryString)
            .digest('hex');
          
          // Use Binance Futures API endpoint
          const response = await axios.get('https://fapi.binance.com/fapi/v2/positionRisk', {
            headers: {
              'X-MBX-APIKEY': apiKey
            },
            params: {
              timestamp,
              signature
            }
          });
          
          // Filter out positions with zero size
          return response.data.filter(pos => parseFloat(pos.positionAmt) !== 0);
        } catch (error) {
          console.error('Error fetching Binance Futures open positions:', error);
          throw error;
        }
      },
      
      getAccountInfo: async () => {
        try {
          const timestamp = Date.now();
          const queryString = `timestamp=${timestamp}`;
          
          const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(queryString)
            .digest('hex');
          
          // Use Binance Futures API endpoint for account info
          const response = await axios.get('https://fapi.binance.com/fapi/v2/account', {
            headers: {
              'X-MBX-APIKEY': apiKey
            },
            params: {
              timestamp,
              signature
            }
          });
          
          return response.data;
        } catch (error) {
          console.error('Error fetching Binance Futures account info:', error);
          throw error;
        }
      }
    };
  }
  
  /**
   * Create a connector for Bybit
   */
  createBybitConnector(apiKey, apiSecret) {
    return {
      getOpenPositions: async () => {
        try {
          const timestamp = Date.now();
          const queryString = `api_key=${apiKey}&timestamp=${timestamp}`;
          
          const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(queryString)
            .digest('hex');
          
          const response = await axios.get('https://api.bybit.com/v2/private/position/list', {
            params: {
              api_key: apiKey,
              timestamp,
              sign: signature
            }
          });
          
          return response.data;
        } catch (error) {
          console.error('Error fetching Bybit open positions:', error);
          throw error;
        }
      },
      
      getAccountInfo: async () => {
        try {
          const timestamp = Date.now();
          const queryString = `api_key=${apiKey}&timestamp=${timestamp}`;
          
          const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(queryString)
            .digest('hex');
          
          const response = await axios.get('https://api.bybit.com/v2/private/wallet/balance', {
            params: {
              api_key: apiKey,
              timestamp,
              sign: signature
            }
          });
          
          return response.data;
        } catch (error) {
          console.error('Error fetching Bybit account info:', error);
          throw error;
        }
      }
    };
  }
  
  /**
   * Create a connector for OKX
   */
  createOkxConnector(apiKey, apiSecret, options = {}) {
    const passphrase = options.passphrase || '';
    
    return {
      getOpenPositions: async () => {
        try {
          const timestamp = new Date().toISOString();
          const path = '/api/v5/account/positions';
          
          const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(timestamp + 'GET' + path)
            .digest('base64');
          
          const response = await axios.get(`https://www.okx.com${path}`, {
            headers: {
              'OK-ACCESS-KEY': apiKey,
              'OK-ACCESS-SIGN': signature,
              'OK-ACCESS-TIMESTAMP': timestamp,
              'OK-ACCESS-PASSPHRASE': passphrase
            }
          });
          
          return response.data;
        } catch (error) {
          console.error('Error fetching OKX open positions:', error);
          throw error;
        }
      },
      
      getAccountInfo: async () => {
        try {
          const timestamp = new Date().toISOString();
          const path = '/api/v5/account/balance';
          
          const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(timestamp + 'GET' + path)
            .digest('base64');
          
          const response = await axios.get(`https://www.okx.com${path}`, {
            headers: {
              'OK-ACCESS-KEY': apiKey,
              'OK-ACCESS-SIGN': signature,
              'OK-ACCESS-TIMESTAMP': timestamp,
              'OK-ACCESS-PASSPHRASE': passphrase
            }
          });
          
          return response.data;
        } catch (error) {
          console.error('Error fetching OKX account info:', error);
          throw error;
        }
      }
    };
  }
  
  /**
   * Create a connector for MEXC
   */
  createMexcConnector(apiKey, apiSecret) {
    return {
      getOpenPositions: async () => {
        try {
          const timestamp = Date.now();
          const queryString = `timestamp=${timestamp}`;
          
          const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(queryString)
            .digest('hex');
          
          const response = await axios.get('https://api.mexc.com/api/v3/openOrders', {
            headers: {
              'X-MEXC-APIKEY': apiKey
            },
            params: {
              timestamp,
              signature
            }
          });
          
          return response.data;
        } catch (error) {
          console.error('Error fetching MEXC open positions:', error);
          throw error;
        }
      },
      
      getAccountInfo: async () => {
        try {
          const timestamp = Date.now();
          const queryString = `timestamp=${timestamp}`;
          
          const signature = crypto
            .createHmac('sha256', apiSecret)
            .update(queryString)
            .digest('hex');
          
          const response = await axios.get('https://api.mexc.com/api/v3/account', {
            headers: {
              'X-MEXC-APIKEY': apiKey
            },
            params: {
              timestamp,
              signature
            }
          });
          
          return response.data;
        } catch (error) {
          console.error('Error fetching MEXC account info:', error);
          throw error;
        }
      }
    };
  }
  
  /**
   * Get a connector for an exchange
   */
  getExchangeConnector(userId, exchange) {
    const keys = this.getApiKeys(userId, exchange);
    
    if (!keys) {
      throw new Error(`No API keys found for user ${userId} and exchange ${exchange}`);
    }
    
    const connectorCreator = this.exchangeConnectors[exchange.toLowerCase()];
    
    if (!connectorCreator) {
      throw new Error(`Unsupported exchange: ${exchange}`);
    }
    
    return connectorCreator(keys.apiKey, keys.apiSecret, keys.options);
  }
  
  /**
   * Get open positions for a user across all connected exchanges
   */
  async getOpenPositions(userId) {
    const result = {};
    
    if (!this.apiKeys[userId]) {
      return result;
    }
    
    for (const exchange of Object.keys(this.apiKeys[userId])) {
      try {
        const connector = this.getExchangeConnector(userId, exchange);
        const positions = await connector.getOpenPositions();
        
        result[exchange] = positions;
      } catch (error) {
        console.error(`Error fetching positions for ${exchange}:`, error);
        result[exchange] = { error: error.message };
      }
    }
    
    return result;
  }
  
  /**
   * Get account information for a user across all connected exchanges
   */
  async getAccountInfo(userId) {
    const result = {};
    
    if (!this.apiKeys[userId]) {
      return result;
    }
    
    for (const exchange of Object.keys(this.apiKeys[userId])) {
      try {
        const connector = this.getExchangeConnector(userId, exchange);
        const accountInfo = await connector.getAccountInfo();
        
        result[exchange] = accountInfo;
      } catch (error) {
        console.error(`Error fetching account info for ${exchange}:`, error);
        result[exchange] = { error: error.message };
      }
    }
    
    return result;
  }
  
  /**
   * Analyze open trades and provide recommendations
   */
  async analyzeOpenTrades(userId, options = {}) {
    try {
      // Get open positions
      const openPositions = await this.getOpenPositions(userId);
      
      // Get account information
      const accountInfo = await this.getAccountInfo(userId);
      
      // Get performance metrics from SignalPerformanceTracker
      const performanceTracker = options.performanceTracker;
      let performanceMetrics = null;
      
      if (performanceTracker) {
        performanceMetrics = performanceTracker.getStatistics();
      }
      
      // Analyze each position
      const analysis = {
        userId,
        timestamp: Date.now(),
        exchanges: {},
        overallRecommendation: '',
        riskAssessment: {
          totalRisk: 0,
          maxDrawdown: 0,
          riskScore: 0
        }
      };
      
      let totalPositionValue = 0;
      let totalBalance = 0;
      
      // Process each exchange
      for (const exchange of Object.keys(openPositions)) {
        const positions = openPositions[exchange];
        const account = accountInfo[exchange];
        
        if (!positions || positions.error || !account || account.error) {
          analysis.exchanges[exchange] = {
            error: (positions && positions.error) || (account && account.error) || 'Unknown error'
          };
          continue;
        }
        
        // Extract positions and balance information based on exchange
        const { extractedPositions, balance } = this.extractExchangeData(exchange, positions, account);
        
        // Calculate position-specific metrics
        const positionAnalysis = this.analyzePositions(extractedPositions, balance, performanceMetrics);
        
        // Add to total values
        totalPositionValue += positionAnalysis.totalPositionValue;
        totalBalance += balance;
        
        // Store analysis for this exchange
        analysis.exchanges[exchange] = {
          positions: positionAnalysis.positions,
          balance,
          totalPositionValue: positionAnalysis.totalPositionValue,
          riskLevel: positionAnalysis.riskLevel,
          recommendations: positionAnalysis.recommendations
        };
      }
      
      // Calculate overall risk assessment
      analysis.riskAssessment = this.calculateOverallRisk(analysis.exchanges, totalPositionValue, totalBalance);
      
      // Generate overall recommendation
      analysis.overallRecommendation = this.generateOverallRecommendation(analysis);
      
      // Save analysis to history
      this.analysisHistory.push(analysis);
      this.saveAnalysisHistory();
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing open trades:', error);
      throw error;
    }
  }
  
  /**
   * Extract positions and balance information based on exchange
   */
  extractExchangeData(exchange, positions, account) {
    let extractedPositions = [];
    let balance = 0;
    
    switch (exchange.toLowerCase()) {
      case 'binance':
        // Extract Binance Futures positions
        extractedPositions = positions.map(position => ({
          symbol: position.symbol,
          entryPrice: parseFloat(position.entryPrice),
          size: Math.abs(parseFloat(position.positionAmt)),
          direction: parseFloat(position.positionAmt) > 0 ? 'long' : 'short',
          leverage: parseFloat(position.leverage),
          liquidationPrice: parseFloat(position.liquidationPrice),
          unrealizedPnl: parseFloat(position.unRealizedProfit),
          marginBalance: parseFloat(position.isolatedMargin) || 0,
          markPrice: parseFloat(position.markPrice),
          marginType: position.marginType
        }));
        
        // Extract Binance Futures balance
        balance = parseFloat(account.totalWalletBalance) || 0;
        break;
        
      case 'bybit':
        // Extract Bybit positions
        extractedPositions = positions.result.map(position => ({
          symbol: position.symbol,
          entryPrice: parseFloat(position.entry_price),
          size: parseFloat(position.size),
          direction: position.side.toLowerCase(),
          leverage: parseFloat(position.leverage),
          liquidationPrice: parseFloat(position.liq_price),
          unrealizedPnl: parseFloat(position.unrealised_pnl),
          marginBalance: parseFloat(position.position_margin)
        }));
        
        // Extract Bybit balance
        balance = Object.values(account.result).reduce((total, wallet) => {
          return total + parseFloat(wallet.wallet_balance);
        }, 0);
        break;
        
      case 'okx':
        // Extract OKX positions
        extractedPositions = positions.data.map(position => ({
          symbol: position.instId,
          entryPrice: parseFloat(position.avgPx),
          size: parseFloat(position.pos),
          direction: position.posSide.toLowerCase(),
          leverage: parseFloat(position.lever),
          liquidationPrice: parseFloat(position.liqPx),
          unrealizedPnl: parseFloat(position.upl),
          marginBalance: parseFloat(position.margin)
        }));
        
        // Extract OKX balance
        balance = account.data[0].totalEq;
        break;
        
      case 'mexc':
        // Extract MEXC positions (simplified)
        extractedPositions = positions.map(position => ({
          symbol: position.symbol,
          entryPrice: parseFloat(position.price),
          size: parseFloat(position.origQty),
          direction: position.side.toLowerCase(),
          leverage: 1, // Default if not available
          liquidationPrice: 0,
          unrealizedPnl: 0,
          marginBalance: 0
        }));
        
        // Extract MEXC balance
        balance = account.balances
          .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
          .reduce((total, b) => {
            return total + (parseFloat(b.free) + parseFloat(b.locked));
          }, 0);
        break;
        
      default:
        extractedPositions = [];
        balance = 0;
    }
    
    return { extractedPositions, balance };
  }
  
  /**
   * Analyze positions and generate recommendations
   */
  analyzePositions(positions, balance, performanceMetrics) {
    const result = {
      positions: [],
      totalPositionValue: 0,
      riskLevel: 'low',
      recommendations: []
    };
    
    if (positions.length === 0) {
      result.recommendations.push('No open positions found.');
      return result;
    }
    
    // Calculate total position value
    result.totalPositionValue = positions.reduce((total, position) => {
      return total + (position.size * position.entryPrice);
    }, 0);
    
    // Analyze each position
    for (const position of positions) {
      const positionAnalysis = this.analyzePosition(position, balance, performanceMetrics);
      result.positions.push(positionAnalysis);
      
      // Add position-specific recommendations
      if (positionAnalysis.recommendation) {
        result.recommendations.push(`${position.symbol}: ${positionAnalysis.recommendation}`);
      }
    }
    
    // Determine overall risk level
    const positionToBalanceRatio = result.totalPositionValue / balance;
    
    if (positionToBalanceRatio > 0.5) {
      result.riskLevel = 'high';
      result.recommendations.push('Overall position size is too large relative to balance. Consider reducing exposure.');
    } else if (positionToBalanceRatio > 0.3) {
      result.riskLevel = 'medium';
      result.recommendations.push('Position size is moderate relative to balance. Monitor closely.');
    } else {
      result.riskLevel = 'low';
      result.recommendations.push('Position size is conservative relative to balance. Room for additional exposure if desired.');
    }
    
    return result;
  }
  
  /**
   * Analyze a single position
   */
  analyzePosition(position, balance, performanceMetrics) {
    const analysis = {
      ...position,
      riskLevel: 'medium',
      recommendation: ''
    };
    
    // Calculate position value
    const positionValue = position.size * position.entryPrice;
    
    // Calculate position to balance ratio
    const positionRatio = positionValue / balance;
    
    // Check leverage risk
    if (position.leverage > this.riskMetrics.maxLeverage) {
      analysis.riskLevel = 'high';
      analysis.recommendation = `Leverage (${position.leverage}x) exceeds recommended maximum (${this.riskMetrics.maxLeverage}x). Consider reducing leverage.`;
    }
    
    // Check position size risk
    if (positionRatio > this.riskMetrics.maxPositionSize) {
      analysis.riskLevel = 'high';
      analysis.recommendation = `Position size (${(positionRatio * 100).toFixed(2)}% of balance) exceeds recommended maximum (${this.riskMetrics.maxPositionSize * 100}%). Consider reducing position size.`;
    }
    
    // Check liquidation proximity
    if (position.liquidationPrice > 0) {
      const currentPrice = position.entryPrice; // Use entry price as proxy for current price
      const distanceToLiquidation = Math.abs(currentPrice - position.liquidationPrice) / currentPrice;
      
      if (distanceToLiquidation < 0.05) {
        analysis.riskLevel = 'critical';
        analysis.recommendation = `Position is very close to liquidation (${(distanceToLiquidation * 100).toFixed(2)}% away). Consider closing position or adding margin.`;
      } else if (distanceToLiquidation < 0.1) {
        analysis.riskLevel = 'high';
        analysis.recommendation = `Position is close to liquidation (${(distanceToLiquidation * 100).toFixed(2)}% away). Monitor closely or reduce position size.`;
      }
    }
    
    // Check performance metrics if available
    if (performanceMetrics) {
      // Check symbol-specific performance
      const symbolStats = performanceMetrics.symbols[position.symbol];
      
      if (symbolStats) {
        if (symbolStats.winRate < 40) {
          analysis.recommendation = `${position.symbol} has a low win rate (${symbolStats.winRate.toFixed(2)}%). Consider closing position or reducing size.`;
        } else if (symbolStats.winRate > 60) {
          if (analysis.riskLevel !== 'high' && analysis.riskLevel !== 'critical') {
            analysis.recommendation = `${position.symbol} has a high win rate (${symbolStats.winRate.toFixed(2)}%). Consider increasing position size if risk allows.`;
          }
        }
      }
    }
    
    return analysis;
  }
  
  /**
   * Calculate overall risk assessment
   */
  calculateOverallRisk(exchanges, totalPositionValue, totalBalance) {
    const riskAssessment = {
      totalRisk: 0,
      maxDrawdown: 0,
      riskScore: 0
    };
    
    // Calculate total risk based on position value to balance ratio
    riskAssessment.totalRisk = totalPositionValue / totalBalance;
    
    // Calculate max drawdown based on position sizes and leverage
    let maxLeverage = 1;
    let weightedLeverage = 0;
    let totalPositions = 0;
    
    for (const exchange of Object.keys(exchanges)) {
      const exchangeData = exchanges[exchange];
      
      if (exchangeData.error || !exchangeData.positions) {
        continue;
      }
      
      for (const position of exchangeData.positions) {
        maxLeverage = Math.max(maxLeverage, position.leverage || 1);
        weightedLeverage += (position.leverage || 1) * (position.size * position.entryPrice);
        totalPositions++;
      }
    }
    
    // Calculate weighted average leverage
    const avgLeverage = totalPositionValue > 0 ? weightedLeverage / totalPositionValue : 1;
    
    // Estimate max drawdown based on leverage
    riskAssessment.maxDrawdown = (avgLeverage * 0.01) * 100; // 1% price move * leverage
    
    // Calculate risk score (0-100)
    riskAssessment.riskScore = Math.min(100, Math.max(0, 
      (riskAssessment.totalRisk * 50) + // 50% weight to position size
      (avgLeverage / this.riskMetrics.maxLeverage * 30) + // 30% weight to leverage
      (totalPositions > 5 ? 20 : totalPositions * 4) // 20% weight to diversification
    ));
    
    return riskAssessment;
  }
  
  /**
   * Generate overall recommendation
   */
  generateOverallRecommendation(analysis) {
    const { riskAssessment } = analysis;
    
    if (riskAssessment.riskScore > 80) {
      return 'CRITICAL RISK LEVEL: Significantly reduce position sizes and leverage immediately. Portfolio is at high risk of substantial losses.';
    } else if (riskAssessment.riskScore > 60) {
      return 'HIGH RISK LEVEL: Consider reducing overall exposure and leverage. Current positions exceed recommended risk parameters.';
    } else if (riskAssessment.riskScore > 40) {
      return 'MODERATE RISK LEVEL: Portfolio is within acceptable risk parameters but monitor closely. Consider hedging strategies for larger positions.';
    } else if (riskAssessment.riskScore > 20) {
      return 'LOW RISK LEVEL: Portfolio has conservative risk exposure. Opportunity to increase position sizes or leverage if desired.';
    } else {
      return 'VERY LOW RISK LEVEL: Portfolio is extremely conservative. Significant opportunity to increase exposure for potentially higher returns.';
    }
  }
  
  /**
   * Get analysis history for a user
   */
  getAnalysisHistory(userId, limit = 10) {
    return this.analysisHistory
      .filter(analysis => analysis.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
}

module.exports = TradeAnalyzer;
