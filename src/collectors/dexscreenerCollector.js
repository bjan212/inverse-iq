/**
 * Dexscreener Public Data Collector
 * 
 * Collects DEX market data from Dexscreener's public APIs
 * WITHOUT requiring authentication.
 * 
 * This provides:
 * - DEX pair information (liquidity, price, volume)
 * - Token profiles and metadata
 * - Trending/boosted tokens
 * - Multi-chain DEX trading data
 * 
 * Use this to enhance AI with DEX market patterns
 * alongside CEX data from Binance, Bybit, etc.
 * 
 * API Documentation: https://docs.dexscreener.com/api/reference
 * 
 * Rate Limits:
 * - Pairs endpoints: 300 requests/minute
 * - Other endpoints: 60 requests/minute
 */

const axios = require('axios');

class DexscreenerCollector {
  constructor() {
    this.baseURL = 'https://api.dexscreener.com';
    this.name = 'Dexscreener DEX Data';
    
    // Rate limiting
    this.pairsRateLimit = 300; // requests per minute
    this.otherRateLimit = 60; // requests per minute
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.rateLimitWindow = 60000; // 1 minute in ms
  }

  /**
   * Sleep helper for rate limiting
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Rate limiting handler
   * @param {boolean} isPairsEndpoint - Whether this is a pairs endpoint (higher limit)
   */
  async handleRateLimit(isPairsEndpoint = false) {
    const now = Date.now();
    const limit = isPairsEndpoint ? this.pairsRateLimit : this.otherRateLimit;
    
    // Reset counter if window has passed
    if (now - this.lastRequestTime > this.rateLimitWindow) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    
    // Check if we've hit the limit
    if (this.requestCount >= limit) {
      const waitTime = this.rateLimitWindow - (now - this.lastRequestTime);
      console.log(`⏳ Rate limit reached, waiting ${Math.ceil(waitTime / 1000)}s...`);
      await this.sleep(waitTime + 1000); // Add 1s buffer
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }
    
    this.requestCount++;
  }

  /**
   * Make API request with error handling
   */
  async makeRequest(endpoint, isPairsEndpoint = false) {
    await this.handleRateLimit(isPairsEndpoint);
    
    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Xrypt-Trading-Service/1.0'
        }
      });
      
      return response.data;
    } catch (error) {
      if (error.response) {
        // API returned an error response
        const status = error.response.status;
        const message = error.response.data?.message || error.message;
        
        if (status === 429) {
          console.error('❌ Rate limit exceeded. Waiting before retry...');
          await this.sleep(5000);
          throw new Error('Rate limit exceeded. Please retry later.');
        } else if (status === 404) {
          throw new Error(`Resource not found: ${endpoint}`);
        } else {
          throw new Error(`API error (${status}): ${message}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Dexscreener API may be slow or down.');
      } else {
        throw new Error(`Network error: ${error.message}`);
      }
    }
  }

  /**
   * Search for DEX pairs by query
   * @param {string} query - Search query (token name, symbol, or address)
   * @returns {Promise<Object>} - Search results with pair information
   */
  async searchPairs(query) {
    console.log(`\n🔍 Searching DEX pairs for: ${query}...`);
    
    try {
      const data = await this.makeRequest(`/latest/dex/search?q=${encodeURIComponent(query)}`, true);
      
      if (!data || !data.pairs) {
        console.log('   No pairs found');
        return { pairs: [] };
      }
      
      console.log(`✅ Found ${data.pairs.length} pairs`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to search pairs:`, error.message);
      throw error;
    }
  }

  /**
   * Get pairs by token addresses
   * @param {string|string[]} tokenAddresses - Token address or array of addresses (max 30)
   * @returns {Promise<Object>} - Pair information
   */
  async getTokenPairs(tokenAddresses) {
    const addresses = Array.isArray(tokenAddresses) ? tokenAddresses : [tokenAddresses];
    
    if (addresses.length > 30) {
      throw new Error('Maximum 30 token addresses allowed per request');
    }
    
    console.log(`\n📊 Fetching pairs for ${addresses.length} token(s)...`);
    
    try {
      const addressString = addresses.join(',');
      const data = await this.makeRequest(`/latest/dex/tokens/${addressString}`, true);
      
      if (!data || !data.pairs) {
        console.log('   No pairs found');
        return { pairs: [] };
      }
      
      console.log(`✅ Found ${data.pairs.length} pairs`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch token pairs:`, error.message);
      throw error;
    }
  }

  /**
   * Get specific pair by chain and pair address
   * @param {string} chainId - Blockchain identifier (e.g., 'ethereum', 'bsc', 'polygon')
   * @param {string} pairAddress - DEX pair contract address
   * @returns {Promise<Object>} - Detailed pair information
   */
  async getPairByChainAndAddress(chainId, pairAddress) {
    console.log(`\n📊 Fetching pair ${pairAddress} on ${chainId}...`);
    
    try {
      const data = await this.makeRequest(`/latest/dex/pairs/${chainId}/${pairAddress}`, true);
      
      if (!data || !data.pair) {
        console.log('   Pair not found');
        return null;
      }
      
      console.log(`✅ Pair found: ${data.pair.baseToken?.symbol || 'Unknown'}`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch pair:`, error.message);
      throw error;
    }
  }

  /**
   * Get latest boosted tokens (trending tokens with paid promotion)
   * @returns {Promise<Array>} - Array of boosted token information
   */
  async getLatestBoostedTokens() {
    console.log(`\n🚀 Fetching latest boosted tokens...`);
    
    try {
      const data = await this.makeRequest('/token-boosts/latest/v1', false);
      
      if (!Array.isArray(data)) {
        console.log('   No boosted tokens found');
        return [];
      }
      
      console.log(`✅ Found ${data.length} boosted tokens`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch boosted tokens:`, error.message);
      throw error;
    }
  }

  /**
   * Get top boosted tokens (most actively promoted)
   * @returns {Promise<Array>} - Array of top boosted tokens
   */
  async getTopBoostedTokens() {
    console.log(`\n🏆 Fetching top boosted tokens...`);
    
    try {
      const data = await this.makeRequest('/token-boosts/top/v1', false);
      
      if (!Array.isArray(data)) {
        console.log('   No boosted tokens found');
        return [];
      }
      
      console.log(`✅ Found ${data.length} top boosted tokens`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch top boosted tokens:`, error.message);
      throw error;
    }
  }

  /**
   * Get latest token profiles (tokens with detailed metadata)
   * @returns {Promise<Array>} - Array of token profiles
   */
  async getLatestTokenProfiles() {
    console.log(`\n📋 Fetching latest token profiles...`);
    
    try {
      const data = await this.makeRequest('/token-profiles/latest/v1', false);
      
      if (!Array.isArray(data)) {
        console.log('   No token profiles found');
        return [];
      }
      
      console.log(`✅ Found ${data.length} token profiles`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch token profiles:`, error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive DEX data for multiple tokens
   * Useful for bootstrapping AI with DEX market patterns
   * @param {Array<string>} tokenAddresses - Array of token addresses
   * @param {string} chainId - Target blockchain
   * @returns {Promise<Object>} - Comprehensive market data
   */
  async getComprehensiveData(tokenAddresses, chainId = null) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         COLLECTING COMPREHENSIVE DEX DATA                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const results = {
      pairs: [],
      profiles: [],
      boosted: [],
      timestamp: Date.now()
    };
    
    try {
      // Get pair data for all tokens
      if (tokenAddresses && tokenAddresses.length > 0) {
        console.log(`📊 Fetching pair data for ${tokenAddresses.length} tokens...`);
        const pairData = await this.getTokenPairs(tokenAddresses);
        results.pairs = pairData.pairs || [];
        
        // Add delay between batches
        await this.sleep(1000);
      }
      
      // Get latest boosted tokens
      console.log('\n🚀 Fetching trending data...');
      results.boosted = await this.getLatestBoostedTokens();
      await this.sleep(1000);
      
      // Get token profiles
      console.log('\n📋 Fetching token profiles...');
      results.profiles = await this.getLatestTokenProfiles();
      
      console.log('\n✅ Comprehensive data collection complete!');
      console.log(`   Pairs: ${results.pairs.length}`);
      console.log(`   Boosted: ${results.boosted.length}`);
      console.log(`   Profiles: ${results.profiles.length}`);
      
      return results;
    } catch (error) {
      console.error('❌ Failed to collect comprehensive data:', error.message);
      throw error;
    }
  }

  /**
   * Analyze DEX pair data for patterns (similar to CEX analysis)
   * @param {Array} pairs - Array of pair data from API
   * @returns {Object} - Analysis results with patterns
   */
  analyzeDEXPatterns(pairs) {
    if (!pairs || pairs.length === 0) {
      return {
        patterns: [],
        stats: {
          totalPairs: 0,
          highVolumePairs: 0,
          lowLiquidityPairs: 0,
          priceChanges: []
        }
      };
    }
    
    const patterns = [];
    const stats = {
      totalPairs: pairs.length,
      highVolumePairs: 0,
      lowLiquidityPairs: 0,
      priceChanges: []
    };
    
    for (const pair of pairs) {
      try {
        const priceChangeData = pair.priceChange || {};
        const volume24h = parseFloat(pair.volume?.h24 || 0);
        const liquidity = parseFloat(pair.liquidity?.usd || 0);
        
        // Track high volume pairs (potential for large moves)
        if (volume24h > 100000) {
          stats.highVolumePairs++;
        }
        
        // Track low liquidity (high risk)
        if (liquidity < 50000) {
          stats.lowLiquidityPairs++;
          patterns.push({
            type: 'low_liquidity_risk',
            symbol: pair.baseToken?.symbol || 'Unknown',
            chainId: pair.chainId,
            liquidity: liquidity,
            confidence: 0.75
          });
        }
        
        // Track price changes
        const priceChange24h = parseFloat(priceChangeData.h24 || 0);
        if (!isNaN(priceChange24h)) {
          stats.priceChanges.push(priceChange24h);
          
          // Extreme moves (potential reversal patterns)
          if (Math.abs(priceChange24h) > 50) {
            patterns.push({
              type: 'extreme_price_move',
              symbol: pair.baseToken?.symbol || 'Unknown',
              chainId: pair.chainId,
              priceChange: priceChange24h,
              volume: volume24h,
              confidence: 0.70
            });
          }
        }
      } catch (error) {
        console.error('Error analyzing pair:', error.message);
      }
    }
    
    return { patterns, stats };
  }

  /**
   * Test connection to Dexscreener API
   * @returns {Promise<boolean>} - True if connection successful
   */
  async testConnection() {
    console.log('\n🔌 Testing Dexscreener API connection...');
    
    try {
      // Simple search to test connectivity
      const data = await this.searchPairs('USDC');
      console.log('✅ Connection successful!');
      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
  }
}

module.exports = DexscreenerCollector;
