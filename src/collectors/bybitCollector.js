/**
 * Bybit Futures Data Collector
 * 
 * Collects trading data from Bybit Futures accounts
 * Supports V5 API
 */

const crypto = require('crypto');
const axios = require('axios');

class BybitCollector {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = 'https://api.bybit.com';
    this.name = 'Bybit Futures';
  }

  /**
   * Generate signature for authenticated requests
   */
  generateSignature(timestamp, params) {
    const paramString = timestamp + this.apiKey + '5000' + params;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(paramString)
      .digest('hex');
  }

  /**
   * Make authenticated request to Bybit API
   */
  async request(endpoint, params = {}) {
    try {
      const timestamp = Date.now().toString();
      const paramString = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
      
      const signature = this.generateSignature(timestamp, paramString);
      
      const response = await axios.get(
        `${this.baseURL}${endpoint}?${paramString}`,
        {
          headers: {
            'X-BAPI-API-KEY': this.apiKey,
            'X-BAPI-TIMESTAMP': timestamp,
            'X-BAPI-SIGN': signature,
            'X-BAPI-RECV-WINDOW': '5000'
          }
        }
      );
      
      if (response.data.retCode !== 0) {
        throw new Error(`Bybit API Error: ${response.data.retMsg}`);
      }
      
      return response.data.result;
    } catch (error) {
      console.error(`Bybit API Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      await this.request('/v5/account/wallet-balance', { accountType: 'UNIFIED' });
      return { success: true, platform: this.name };
    } catch (error) {
      return { 
        success: false, 
        platform: this.name,
        error: error.message 
      };
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance() {
    try {
      const result = await this.request('/v5/account/wallet-balance', { accountType: 'UNIFIED' });
      
      const account = result.list[0];
      
      return {
        totalBalance: parseFloat(account.totalEquity),
        availableBalance: parseFloat(account.totalAvailableBalance),
        totalUnrealizedProfit: parseFloat(account.totalPerpUPL),
        assets: account.coin.map(coin => ({
          asset: coin.coin,
          walletBalance: parseFloat(coin.walletBalance),
          unrealizedProfit: parseFloat(coin.unrealisedPnl || 0)
        }))
      };
    } catch (error) {
      console.error('Failed to get account balance:', error.message);
      throw error;
    }
  }

  /**
   * Get trade history
   */
  async getTrades(category = 'linear', symbol = '', cursor = '') {
    try {
      const params = { category, limit: 100 };
      if (symbol) params.symbol = symbol;
      if (cursor) params.cursor = cursor;
      
      const result = await this.request('/v5/execution/list', params);
      
      return {
        trades: result.list.map(trade => ({
          symbol: trade.symbol,
          orderId: trade.orderId,
          side: trade.side,
          price: parseFloat(trade.execPrice),
          qty: parseFloat(trade.execQty),
          commission: parseFloat(trade.execFee),
          time: parseInt(trade.execTime),
          closedPnl: parseFloat(trade.closedSize) > 0 ? parseFloat(trade.closedPnl || 0) : 0
        })),
        nextCursor: result.nextPageCursor
      };
    } catch (error) {
      console.error('Failed to get trades:', error.message);
      return { trades: [], nextCursor: '' };
    }
  }

  /**
   * Fetch ALL trades
   */
  async getAllTrades() {
    try {
      console.log('Fetching all trades from Bybit Futures...');
      
      let allTrades = [];
      let cursor = '';
      let hasMore = true;
      
      while (hasMore) {
        const { trades, nextCursor } = await this.getTrades('linear', '', cursor);
        
        if (trades.length === 0 || !nextCursor) {
          hasMore = false;
        } else {
          allTrades = allTrades.concat(trades);
          cursor = nextCursor;
          
          console.log(`  Fetched ${allTrades.length} trades so far...`);
          
          // Add delay
          await this.delay(300);
        }
        
        // Safety limit
        if (allTrades.length >= 10000) {
          console.log('Reached 10,000 trades limit');
          hasMore = false;
        }
      }
      
      console.log(`Total trades fetched: ${allTrades.length}`);
      
      // Sort by time
      allTrades.sort((a, b) => a.time - b.time);
      
      return allTrades;
    } catch (error) {
      console.error('Failed to fetch all trades:', error.message);
      throw error;
    }
  }

  /**
   * Analyze trading history
   */
  async analyzeHistory() {
    try {
      console.log('Analyzing trading history...');
      
      const trades = await this.getAllTrades();
      
      if (trades.length === 0) {
        return {
          totalTrades: 0,
          symbols: [],
          spanDays: 0,
          maxGap: 0,
          error: 'No trades found'
        };
      }
      
      // Get unique symbols
      const symbols = [...new Set(trades.map(t => t.symbol))];
      
      // Calculate time span
      const firstTrade = trades[0];
      const lastTrade = trades[trades.length - 1];
      const spanMs = lastTrade.time - firstTrade.time;
      const spanDays = Math.floor(spanMs / (1000 * 60 * 60 * 24));
      
      // Calculate max gap
      let maxGap = 0;
      for (let i = 1; i < trades.length; i++) {
        const gap = trades[i].time - trades[i-1].time;
        const gapDays = gap / (1000 * 60 * 60 * 24);
        if (gapDays > maxGap) {
          maxGap = gapDays;
        }
      }
      
      // Calculate total PnL
      const totalPnl = trades.reduce((sum, t) => sum + t.closedPnl, 0);
      const wins = trades.filter(t => t.closedPnl > 0).length;
      const losses = trades.filter(t => t.closedPnl < 0).length;
      const winRate = wins / (wins + losses) * 100 || 0;
      
      return {
        totalTrades: trades.length,
        symbols: symbols,
        symbolCount: symbols.length,
        spanDays: Math.floor(spanDays),
        maxGap: Math.floor(maxGap),
        firstTradeDate: new Date(firstTrade.time),
        lastTradeDate: new Date(lastTrade.time),
        totalPnl: totalPnl.toFixed(2),
        winRate: winRate.toFixed(2),
        wins,
        losses
      };
    } catch (error) {
      console.error('Failed to analyze history:', error.message);
      throw error;
    }
  }

  /**
   * Get peak capital (estimate from current balance + total PnL)
   */
  async getPeakCapital() {
    try {
      const balance = await this.getAccountBalance();
      const history = await this.analyzeHistory();
      
      // Estimate peak as current balance (rough estimate)
      // Bybit doesn't provide historical balance easily
      const peakCapital = balance.totalBalance;
      
      return {
        peakCapital,
        currentCapital: balance.totalBalance,
        note: 'Peak capital estimated from current balance (Bybit limitation)'
      };
    } catch (error) {
      console.error('Failed to get peak capital:', error.message);
      throw error;
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Complete validation check
   */
  async validate() {
    console.log('\n=== Bybit Futures Validation ===\n');
    
    const result = {
      platform: this.name,
      passed: false,
      checks: {},
      data: {}
    };
    
    try {
      // 1. Test connection
      console.log('1. Testing API connection...');
      const connectionTest = await this.testConnection();
      result.checks.connection = connectionTest.success;
      
      if (!connectionTest.success) {
        result.error = 'API connection failed';
        return result;
      }
      console.log('   ✓ Connection successful\n');
      
      // 2. Check capital
      console.log('2. Checking capital requirements...');
      const capitalData = await this.getPeakCapital();
      result.data.capital = capitalData;
      result.checks.capital = capitalData.peakCapital >= 500;
      
      console.log(`   Peak Capital: $${capitalData.peakCapital.toFixed(2)} ${capitalData.note ? '(' + capitalData.note + ')' : ''}`);
      console.log(`   Current Capital: $${capitalData.currentCapital.toFixed(2)}`);
      console.log(`   ${result.checks.capital ? '✓' : '✗'} Capital requirement ${result.checks.capital ? 'met' : 'not met'}\n`);
      
      if (!result.checks.capital) {
        result.error = `Peak capital $${capitalData.peakCapital.toFixed(2)} < $500 minimum`;
        return result;
      }
      
      // 3. Check trading history
      console.log('3. Checking trading history...');
      const historyData = await this.analyzeHistory();
      result.data.history = historyData;
      
      result.checks.tradeCount = historyData.totalTrades >= 100;
      result.checks.maxGap = historyData.maxGap <= 30;
      result.checks.symbolCount = historyData.symbolCount >= 3;
      
      console.log(`   Total Trades: ${historyData.totalTrades}`);
      console.log(`   Symbols Traded: ${historyData.symbolCount} (${historyData.symbols.join(', ')})`);
      console.log(`   Trading Span: ${historyData.spanDays} days`);
      console.log(`   Max Gap: ${historyData.maxGap} days`);
      console.log(`   Win Rate: ${historyData.winRate}%`);
      console.log(`   Total PnL: $${historyData.totalPnl}`);
      
      console.log(`\n   ${result.checks.tradeCount ? '✓' : '✗'} Trade count ${result.checks.tradeCount ? 'sufficient' : 'insufficient'}`);
      console.log(`   ${result.checks.maxGap ? '✓' : '✗'} Max gap ${result.checks.maxGap ? 'acceptable' : 'too large'}`);
      console.log(`   ${result.checks.symbolCount ? '✓' : '✗'} Symbol diversity ${result.checks.symbolCount ? 'sufficient' : 'insufficient'}\n`);
      
      // 4. Overall result
      result.passed = result.checks.connection && 
                      result.checks.capital && 
                      result.checks.tradeCount && 
                      result.checks.maxGap && 
                      result.checks.symbolCount;
      
      if (result.passed) {
        console.log('✅ VALIDATION PASSED!\n');
      } else {
        console.log('❌ VALIDATION FAILED\n');
        result.error = 'One or more validation checks failed';
      }
      
      return result;
    } catch (error) {
      console.error('Validation error:', error.message);
      result.error = error.message;
      return result;
    }
  }
}

module.exports = BybitCollector;

