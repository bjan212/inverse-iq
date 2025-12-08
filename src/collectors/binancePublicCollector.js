/**
 * Binance Public Data Collector
 * 
 * Collects historical market data from Binance public APIs
 * WITHOUT requiring user API keys or authentication.
 * 
 * This provides:
 * - Historical OHLCV data (klines/candlesticks)
 * - Funding rate history
 * - Market statistics
 * - Order book data
 * 
 * Use this to bootstrap your AI with public market patterns
 * before collecting private trader data.
 */

const axios = require('axios');

class BinancePublicCollector {
  constructor() {
    this.baseURL = 'https://api.binance.com';
    this.futuresURL = 'https://fapi.binance.com';
    this.name = 'Binance Public Data';
  }

  /**
   * Fetch historical klines (OHLCV candlestick data)
   * @param {string} symbol - Trading pair (e.g., 'BTCUSDT')
   * @param {string} interval - Timeframe ('1m', '5m', '15m', '1h', '4h', '1d')
   * @param {number} startTime - Start timestamp in milliseconds
   * @param {number} endTime - End timestamp in milliseconds
   * @param {number} limit - Max records per request (default 1000)
   */
  async getHistoricalKlines(symbol, interval, startTime, endTime, limit = 1000) {
    console.log(`\n📊 Fetching historical data for ${symbol} (${interval})...`);
    
    const allKlines = [];
    let currentStart = startTime;
    let requestCount = 0;
    
    try {
      while (currentStart < endTime) {
        const params = {
          symbol,
          interval,
          startTime: currentStart,
          limit
        };
        
        const url = `${this.baseURL}/api/v3/klines`;
        const response = await axios.get(url, { params });
        const klines = response.data;
        
        if (klines.length === 0) break;
        
        allKlines.push(...klines);
        requestCount++;
        
        // Update start time for next batch
        currentStart = klines[klines.length - 1][0] + 1;
        
        // Rate limiting - be nice to Binance servers
        await this.sleep(100);
        
        // Progress update every 10 requests
        if (requestCount % 10 === 0) {
          console.log(`   Fetched ${allKlines.length} candles...`);
        }
        
        // Safety limit
        if (requestCount > 1000) {
          console.log('   ⚠️  Reached safety limit of 1000 requests');
          break;
        }
      }
      
      console.log(`✅ Fetched ${allKlines.length} candles in ${requestCount} requests`);
      
      // Format the data
      return allKlines.map(k => ({
        openTime: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        closeTime: k[6],
        quoteVolume: parseFloat(k[7]),
        trades: parseInt(k[8]),
        takerBuyBaseVolume: parseFloat(k[9]),
        takerBuyQuoteVolume: parseFloat(k[10])
      }));
      
    } catch (error) {
      console.error(`❌ Failed to fetch klines for ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch funding rate history (Futures only)
   * @param {string} symbol - Futures pair (e.g., 'BTCUSDT')
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   */
  async getFundingRateHistory(symbol, startTime, endTime) {
    console.log(`\n💰 Fetching funding rate history for ${symbol}...`);
    
    try {
      const allRates = [];
      let currentStart = startTime;
      
      while (currentStart < endTime) {
        const params = {
          symbol,
          startTime: currentStart,
          limit: 1000
        };
        
        const url = `${this.futuresURL}/fapi/v1/fundingRate`;
        const response = await axios.get(url, { params });
        const rates = response.data;
        
        if (rates.length === 0) break;
        
        allRates.push(...rates);
        currentStart = rates[rates.length - 1].fundingTime + 1;
        
        await this.sleep(100);
      }
      
      console.log(`✅ Fetched ${allRates.length} funding rate records`);
      
      return allRates.map(r => ({
        symbol: r.symbol,
        fundingRate: parseFloat(r.fundingRate),
        fundingTime: r.fundingTime,
        markPrice: parseFloat(r.markPrice)
      }));
      
    } catch (error) {
      console.error(`❌ Failed to fetch funding rates:`, error.message);
      return [];
    }
  }

  /**
   * Fetch 24hr ticker statistics
   * @param {string} symbol - Trading pair
   */
  async get24hrStats(symbol) {
    try {
      const url = `${this.futuresURL}/fapi/v1/ticker/24hr`;
      const response = await axios.get(url, { params: { symbol } });
      const data = response.data;
      
      return {
        symbol: data.symbol,
        priceChange: parseFloat(data.priceChange),
        priceChangePercent: parseFloat(data.priceChangePercent),
        lastPrice: parseFloat(data.lastPrice),
        volume: parseFloat(data.volume),
        quoteVolume: parseFloat(data.quoteVolume),
        openPrice: parseFloat(data.openPrice),
        highPrice: parseFloat(data.highPrice),
        lowPrice: parseFloat(data.lowPrice),
        trades: parseInt(data.count)
      };
    } catch (error) {
      console.error(`❌ Failed to fetch 24hr stats:`, error.message);
      return null;
    }
  }

  /**
   * Fetch open interest (Futures only)
   * @param {string} symbol - Futures pair
   */
  async getOpenInterest(symbol) {
    try {
      const url = `${this.futuresURL}/fapi/v1/openInterest`;
      const response = await axios.get(url, { params: { symbol } });
      const data = response.data;
      
      return {
        symbol: data.symbol,
        openInterest: parseFloat(data.openInterest),
        time: data.time
      };
    } catch (error) {
      console.error(`❌ Failed to fetch open interest:`, error.message);
      return null;
    }
  }

  /**
   * Fetch long/short ratio
   * @param {string} symbol - Futures pair
   * @param {string} period - Time period ('5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d')
   */
  async getLongShortRatio(symbol, period = '1h') {
    try {
      const url = `${this.futuresURL}/futures/data/globalLongShortAccountRatio`;
      const response = await axios.get(url, { 
        params: { 
          symbol,
          period,
          limit: 30
        } 
      });
      
      return response.data.map(d => ({
        symbol: d.symbol,
        longShortRatio: parseFloat(d.longShortRatio),
        longAccount: parseFloat(d.longAccount),
        shortAccount: parseFloat(d.shortAccount),
        timestamp: d.timestamp
      }));
    } catch (error) {
      console.error(`❌ Failed to fetch long/short ratio:`, error.message);
      return [];
    }
  }

  /**
   * Fetch recent trades
   * @param {string} symbol - Trading pair
   * @param {number} limit - Number of trades (max 1000)
   */
  async getRecentTrades(symbol, limit = 1000) {
    try {
      const url = `${this.futuresURL}/fapi/v1/trades`;
      const response = await axios.get(url, { params: { symbol, limit } });
      
      return response.data.map(t => ({
        id: t.id,
        price: parseFloat(t.price),
        qty: parseFloat(t.qty),
        quoteQty: parseFloat(t.quoteQty),
        time: t.time,
        isBuyerMaker: t.isBuyerMaker
      }));
    } catch (error) {
      console.error(`❌ Failed to fetch recent trades:`, error.message);
      return [];
    }
  }

  /**
   * Get comprehensive market data for a symbol
   * @param {string} symbol - Trading pair
   * @param {string} interval - Timeframe
   * @param {number} days - Number of days of history
   */
  async getComprehensiveData(symbol, interval = '1h', days = 90) {
    console.log(`\n🔍 Collecting comprehensive data for ${symbol}...`);
    
    const endTime = Date.now();
    const startTime = endTime - (days * 24 * 60 * 60 * 1000);
    
    const data = {
      symbol,
      interval,
      period: `${days} days`,
      collectedAt: new Date(),
      klines: null,
      fundingRates: null,
      stats24hr: null,
      openInterest: null,
      longShortRatio: null,
      recentTrades: null
    };
    
    try {
      // Fetch all data in parallel
      const [klines, fundingRates, stats24hr, openInterest, longShortRatio, recentTrades] = await Promise.all([
        this.getHistoricalKlines(symbol, interval, startTime, endTime),
        this.getFundingRateHistory(symbol, startTime, endTime),
        this.get24hrStats(symbol),
        this.getOpenInterest(symbol),
        this.getLongShortRatio(symbol, '1h'),
        this.getRecentTrades(symbol, 1000)
      ]);
      
      data.klines = klines;
      data.fundingRates = fundingRates;
      data.stats24hr = stats24hr;
      data.openInterest = openInterest;
      data.longShortRatio = longShortRatio;
      data.recentTrades = recentTrades;
      
      console.log(`\n✅ Comprehensive data collection complete:`);
      console.log(`   Klines: ${klines.length}`);
      console.log(`   Funding rates: ${fundingRates.length}`);
      console.log(`   Recent trades: ${recentTrades.length}`);
      console.log(`   Long/Short ratios: ${longShortRatio.length}`);
      
      return data;
      
    } catch (error) {
      console.error(`❌ Failed to collect comprehensive data:`, error.message);
      throw error;
    }
  }

  /**
   * Get multiple symbols data
   * @param {Array<string>} symbols - Array of trading pairs
   * @param {string} interval - Timeframe
   * @param {number} days - Number of days of history
   */
  async getMultiSymbolData(symbols, interval = '1h', days = 90) {
    console.log(`\n📊 Collecting data for ${symbols.length} symbols...`);
    
    const results = {};
    
    for (const symbol of symbols) {
      try {
        results[symbol] = await this.getComprehensiveData(symbol, interval, days);
        
        // Rate limiting between symbols
        await this.sleep(1000);
        
      } catch (error) {
        console.error(`❌ Failed to collect data for ${symbol}:`, error.message);
        results[symbol] = { error: error.message };
      }
    }
    
    console.log(`\n✅ Multi-symbol collection complete`);
    
    return results;
  }

  /**
   * Save data to file
   * @param {Object} data - Data to save
   * @param {string} filename - Output filename
   */
  saveToFile(data, filename) {
    const fs = require('fs');
    const path = require('path');
    
    const outputDir = './data/public';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    
    console.log(`💾 Data saved to: ${filepath}`);
    
    return filepath;
  }

  /**
   * Helper: Sleep function for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test connection to Binance API
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.futuresURL}/fapi/v1/ping`);
      console.log('✅ Binance API connection successful');
      return true;
    } catch (error) {
      console.error('❌ Binance API connection failed:', error.message);
      return false;
    }
  }
}

module.exports = BinancePublicCollector;
