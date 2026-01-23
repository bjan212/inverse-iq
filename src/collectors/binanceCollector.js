/**
 * Binance Futures Data Collector
 * 
 * Collects trading data from Binance Futures accounts
 * Supports:
 * - Trade history fetching (with pagination)
 * - Account balance history
 * - Position history
 * - Capital verification
 */

const crypto = require('crypto');
const axios = require('axios');

class BinanceCollector {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseURL = 'https://fapi.binance.com';
    this.name = 'Binance Futures';
  }

  /**
   * Generate signature for authenticated requests
   */
  generateSignature(queryString) {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Make authenticated request to Binance API
   */
  async request(endpoint, params = {}) {
    try {
      // Add timestamp
      params.timestamp = Date.now();
      
      // Create query string
      const queryString = Object.keys(params)
        .map(key => `${key}=${params[key]}`)
        .join('&');
      
      // Generate signature
      const signature = this.generateSignature(queryString);
      
      // Make request
      const response = await axios.get(
        `${this.baseURL}${endpoint}?${queryString}&signature=${signature}`,
        {
          headers: {
            'X-MBX-APIKEY': this.apiKey
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Binance API Error: ${error.message}`);
      if (error.response) {
        console.error('Response:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      await this.request('/fapi/v2/account');
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
   * Get current account balance
   */
  async getAccountBalance() {
    try {
      const account = await this.request('/fapi/v2/account');
      
      return {
        totalBalance: parseFloat(account.totalWalletBalance),
        availableBalance: parseFloat(account.availableBalance),
        totalUnrealizedProfit: parseFloat(account.totalUnrealizedProfit),
        totalMarginBalance: parseFloat(account.totalMarginBalance),
        assets: account.assets.map(asset => ({
          asset: asset.asset,
          walletBalance: parseFloat(asset.walletBalance),
          unrealizedProfit: parseFloat(asset.unrealizedProfit),
          marginBalance: parseFloat(asset.marginBalance)
        }))
      };
    } catch (error) {
      console.error('Failed to get account balance:', error.message);
      throw error;
    }
  }

  /**
   * Get account balance history (income history)
   */
  async getBalanceHistory(startTime = null, limit = 1000) {
    try {
      const params = { limit };
      if (startTime) params.startTime = startTime;
      
      const income = await this.request('/fapi/v1/income', params);
      
      return income.map(record => ({
        symbol: record.symbol,
        incomeType: record.incomeType,
        income: parseFloat(record.income),
        asset: record.asset,
        time: record.time,
        info: record.info,
        tranId: record.tranId
      }));
    } catch (error) {
      console.error('Failed to get balance history:', error.message);
      throw error;
    }
  }

  /**
   * Calculate peak capital from income history
   */
  async getPeakCapital() {
    try {
      console.log('Fetching income history to calculate peak capital...');
      
      let allIncome = [];
      let startTime = null;
      let hasMore = true;
      
      // Fetch all income records
      while (hasMore) {
        const batch = await this.getBalanceHistory(startTime, 1000);
        
        if (batch.length === 0) {
          hasMore = false;
        } else {
          allIncome = allIncome.concat(batch);
          startTime = batch[batch.length - 1].time + 1;
          
          // Add delay to respect rate limits
          await this.delay(300);
        }
        
        // Safety limit
        if (allIncome.length >= 10000) {
          console.log('Reached 10,000 records limit');
          hasMore = false;
        }
      }
      
      console.log(`Fetched ${allIncome.length} income records`);
      
      // Calculate balance over time
      let balance = 0;
      let peakBalance = 0;
      let peakTime = null;
      
      // Sort by time
      allIncome.sort((a, b) => a.time - b.time);
      
      for (const record of allIncome) {
        balance += record.income;
        
        if (balance > peakBalance) {
          peakBalance = balance;
          peakTime = record.time;
        }
      }
      
      // Get current balance
      const currentAccount = await this.getAccountBalance();
      const currentBalance = currentAccount.totalBalance;
      
      // Peak is max of historical peak and current balance
      const finalPeak = Math.max(peakBalance, currentBalance);
      
      return {
        peakCapital: finalPeak,
        peakTime: peakTime ? new Date(peakTime) : new Date(),
        currentCapital: currentBalance,
        totalRecords: allIncome.length
      };
    } catch (error) {
      console.error('Failed to calculate peak capital:', error.message);
      throw error;
    }
  }

  /**
   * Fetch all trades for a symbol
   */
  async getTradesForSymbol(symbol, startTime = null, limit = 1000) {
    try {
      const params = { symbol, limit };
      if (startTime) params.startTime = startTime;
      
      const trades = await this.request('/fapi/v1/userTrades', params);
      
      return trades.map(trade => ({
        id: trade.id,
        symbol: trade.symbol,
        orderId: trade.orderId,
        side: trade.side,
        price: parseFloat(trade.price),
        qty: parseFloat(trade.qty),
        realizedPnl: parseFloat(trade.realizedPnl),
        commission: parseFloat(trade.commission),
        commissionAsset: trade.commissionAsset,
        time: trade.time,
        buyer: trade.buyer,
        maker: trade.maker
      }));
    } catch (error) {
      console.error(`Failed to get trades for ${symbol}:`, error.message);
      return [];
    }
  }

  /**
   * Get all trading symbols
   */
  async getTradingSymbols() {
    try {
      const exchangeInfo = await axios.get(`${this.baseURL}/fapi/v1/exchangeInfo`);
      return exchangeInfo.data.symbols
        .filter(s => s.status === 'TRADING')
        .map(s => s.symbol);
    } catch (error) {
      console.error('Failed to get trading symbols:', error.message);
      return [];
    }
  }

  /**
   * Fetch ALL trades from account
   */
  async getAllTrades() {
    try {
      console.log('Fetching all trades from Binance Futures...');
      
      // Get account info to find traded symbols
      const account = await this.request('/fapi/v2/account');
      
      // Get symbols with positions or balance
      const tradedSymbols = new Set();
      
      // Add symbols from current positions
      account.positions.forEach(pos => {
        if (parseFloat(pos.positionAmt) !== 0 || parseFloat(pos.unrealizedProfit) !== 0) {
          tradedSymbols.add(pos.symbol);
        }
      });
      
      // Add symbols from assets with balance
      account.assets.forEach(asset => {
        if (parseFloat(asset.walletBalance) > 0) {
          // We'll need to check common pairs for this asset
          const commonPairs = [`${asset.asset}USDT`, `BTC${asset.asset}`, `ETH${asset.asset}`];
          commonPairs.forEach(pair => tradedSymbols.add(pair));
        }
      });
      
      // If no symbols found, try common ones
      if (tradedSymbols.size === 0) {
        console.log('No symbols found in account, trying common pairs...');
        ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT', 'DOGEUSDT'].forEach(s => tradedSymbols.add(s));
      }
      
      console.log(`Found ${tradedSymbols.size} potential symbols to check`);
      
      let allTrades = [];
      
      // Fetch trades for each symbol
      for (const symbol of tradedSymbols) {
        console.log(`Fetching trades for ${symbol}...`);
        
        let symbolTrades = [];
        let startTime = null;
        let hasMore = true;
        
        while (hasMore) {
          const batch = await this.getTradesForSymbol(symbol, startTime, 1000);
          
          if (batch.length === 0) {
            hasMore = false;
          } else {
            // Use push with spread to mutate in-place instead of creating new array
            symbolTrades.push(...batch);
            startTime = batch[batch.length - 1].time + 1;
            
            // If we got less than 1000, no more data
            if (batch.length < 1000) {
              hasMore = false;
            }
          }
          
          // Add delay to respect rate limits
          await this.delay(300);
        }
        
        if (symbolTrades.length > 0) {
          console.log(`  Found ${symbolTrades.length} trades for ${symbol}`);
          allTrades = allTrades.concat(symbolTrades);
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
      
      // Calculate max gap between trades
      let maxGap = 0;
      for (let i = 1; i < trades.length; i++) {
        const gap = trades[i].time - trades[i-1].time;
        const gapDays = gap / (1000 * 60 * 60 * 24);
        if (gapDays > maxGap) {
          maxGap = gapDays;
        }
      }
      
      // Group trades into positions
      const positions = this.groupTradesIntoPositions(trades);
      
      // Calculate win rate
      const wins = positions.filter(p => p.pnl > 0).length;
      const losses = positions.filter(p => p.pnl < 0).length;
      const winRate = wins / (wins + losses) * 100;
      
      // Calculate profit factor
      const totalProfit = positions.filter(p => p.pnl > 0).reduce((sum, p) => sum + p.pnl, 0);
      const totalLoss = Math.abs(positions.filter(p => p.pnl < 0).reduce((sum, p) => sum + p.pnl, 0));
      const profitFactor = totalLoss === 0 ? Infinity : totalProfit / totalLoss;
      
      // Position diversity (LONG vs SHORT)
      const longs = positions.filter(p => p.side === 'LONG').length;
      const shorts = positions.filter(p => p.side === 'SHORT').length;
      const diversity = Math.min(longs, shorts) / Math.max(longs, shorts) * 100;
      
      return {
        totalTrades: trades.length,
        totalPositions: positions.length,
        symbols: symbols,
        symbolCount: symbols.length,
        spanDays: Math.floor(spanDays),
        maxGap: Math.floor(maxGap),
        firstTradeDate: new Date(firstTrade.time),
        lastTradeDate: new Date(lastTrade.time),
        winRate: winRate.toFixed(2),
        profitFactor: profitFactor.toFixed(2),
        positionDiversity: diversity.toFixed(2),
        wins,
        losses
      };
    } catch (error) {
      console.error('Failed to analyze history:', error.message);
      throw error;
    }
  }

  /**
   * Group individual trades into completed positions
   */
  groupTradesIntoPositions(trades) {
    const positions = [];
    const openPositions = {};
    
    for (const trade of trades) {
      const key = trade.symbol;
      
      if (!openPositions[key]) {
        openPositions[key] = {
          symbol: trade.symbol,
          side: trade.side === 'BUY' ? 'LONG' : 'SHORT',
          qty: 0,
          entryValue: 0,
          exitValue: 0,
          pnl: 0,
          commission: 0,
          trades: []
        };
      }
      
      const pos = openPositions[key];
      pos.trades.push(trade);
      
      if (trade.side === 'BUY') {
        pos.qty += trade.qty;
        pos.entryValue += trade.price * trade.qty;
      } else {
        pos.qty -= trade.qty;
        pos.exitValue += trade.price * trade.qty;
      }
      
      pos.pnl += trade.realizedPnl;
      pos.commission += trade.commission;
      
      // If position closed
      if (Math.abs(pos.qty) < 0.0001) {
        positions.push({
          symbol: pos.symbol,
          side: pos.side,
          pnl: pos.pnl,
          commission: pos.commission,
          trades: pos.trades.length,
          entryTime: pos.trades[0].time,
          exitTime: pos.trades[pos.trades.length - 1].time
        });
        
        delete openPositions[key];
      }
    }
    
    return positions;
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
    console.log('\n=== Binance Futures Validation ===\n');
    
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

      console.log(`   Peak Capital: $${capitalData.peakCapital.toFixed(2)}`);
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
      
      result.checks.tradeCount = historyData.totalPositions >= 100;
      result.checks.maxGap = historyData.maxGap <= 30;
      result.checks.symbolCount = historyData.symbolCount >= 3;
      
      console.log(`   Total Trades: ${historyData.totalTrades}`);
      console.log(`   Total Positions: ${historyData.totalPositions}`);
      console.log(`   Symbols Traded: ${historyData.symbolCount} (${historyData.symbols.join(', ')})`);
      console.log(`   Trading Span: ${historyData.spanDays} days`);
      console.log(`   Max Gap: ${historyData.maxGap} days`);
      console.log(`   Win Rate: ${historyData.winRate}%`);
      console.log(`   Profit Factor: ${historyData.profitFactor}`);
      console.log(`   Position Diversity: ${historyData.positionDiversity}%`);
      
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

module.exports = BinanceCollector;

