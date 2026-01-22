/**
 * DEX Manager
 * 
 * Manages multiple DEX connectors and provides:
 * - Multi-DEX price aggregation
 * - Arbitrage opportunity detection
 * - Best execution routing
 * - Cross-DEX position monitoring
 */

const UniswapV3SimpleConnector = require('./uniswapV3Simple');

class DEXManager {
  constructor(config = {}) {
    this.config = config;
    this.connectors = {};
    this.priceCache = new Map();
    this.cacheTTL = config.cacheTTL || 30000; // 30 seconds default
    
    // Initialize connectors based on config
    this.initializeConnectors();
  }

  /**
   * Initialize DEX connectors for configured networks
   */
  initializeConnectors() {
    // Ethereum - Uniswap V3
    if (this.config.ethereum?.enabled) {
      this.connectors.uniswap_ethereum = new UniswapV3SimpleConnector({
        rpcUrl: this.config.ethereum.rpcUrl,
        network: 'ethereum',
        privateKey: this.config.ethereum.privateKey
      });
      console.log('✅ Uniswap V3 (Ethereum) initialized');
    }

    // BSC - PancakeSwap V3
    if (this.config.bsc?.enabled) {
      this.connectors.pancakeswap_bsc = new UniswapV3SimpleConnector({
        rpcUrl: this.config.bsc.rpcUrl,
        network: 'bsc',
        privateKey: this.config.bsc.privateKey
      });
      console.log('✅ PancakeSwap V3 (BSC) initialized');
    }

    // Arbitrum - Uniswap V3
    if (this.config.arbitrum?.enabled) {
      this.connectors.uniswap_arbitrum = new UniswapV3SimpleConnector({
        rpcUrl: this.config.arbitrum.rpcUrl,
        network: 'arbitrum',
        privateKey: this.config.arbitrum.privateKey
      });
      console.log('✅ Uniswap V3 (Arbitrum) initialized');
    }

    // Polygon - QuickSwap/Uniswap V3
    if (this.config.polygon?.enabled) {
      this.connectors.uniswap_polygon = new UniswapV3SimpleConnector({
        rpcUrl: this.config.polygon.rpcUrl,
        network: 'polygon',
        privateKey: this.config.polygon.privateKey
      });
      console.log('✅ Uniswap V3 (Polygon) initialized');
    }

    const count = Object.keys(this.connectors).length;
    console.log(`\n📊 DEX Manager initialized with ${count} connector(s)\n`);
  }

  /**
   * Get best price across all DEXs
   * @param {string} tokenA - Token A address
   * @param {string} tokenB - Token B address
   * @param {string} amount - Amount to trade
   * @returns {Promise<Array>} Sorted prices from all DEXs
   */
  async getBestPrice(tokenA, tokenB, amount = '1') {
    const cacheKey = `${tokenA}-${tokenB}-${amount}`;
    
    // Check cache
    const cached = this.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log('💾 Using cached prices');
      return cached.prices;
    }

    const prices = [];

    // Query all DEXs in parallel
    const promises = Object.entries(this.connectors).map(async ([name, connector]) => {
      try {
        const priceInfo = await connector.getPrice(tokenA, tokenB, 3000);
        const liquidityInfo = await connector.getLiquidity(tokenA, tokenB, 3000);

        return {
          dex: name,
          network: connector.network,
          price: parseFloat(priceInfo.price),
          liquidity: liquidityInfo.liquidity,
          poolAddress: priceInfo.poolAddress,
          available: true
        };
      } catch (error) {
        console.error(`❌ ${name} price fetch failed:`, error.message);
        return {
          dex: name,
          network: connector.network,
          available: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(promises);
    
    // Filter available prices and sort by best price
    const availablePrices = results.filter(r => r.available);
    availablePrices.sort((a, b) => b.price - a.price);

    // Cache results
    this.priceCache.set(cacheKey, {
      prices: availablePrices,
      timestamp: Date.now()
    });

    return availablePrices;
  }

  /**
   * Find arbitrage opportunities
   * @param {string} tokenA - Token A address
   * @param {string} tokenB - Token B address
   * @param {string} amount - Amount to trade
   * @returns {Promise<object|null>} Arbitrage opportunity or null
   */
  async findArbitrage(tokenA, tokenB, amount = '1') {
    console.log(`\n🔍 Searching for arbitrage: ${tokenA}/${tokenB}`);
    
    const prices = await this.getBestPrice(tokenA, tokenB, amount);

    if (prices.length < 2) {
      console.log('⚠️  Need at least 2 DEXs for arbitrage');
      return null;
    }

    const highest = prices[0];
    const lowest = prices[prices.length - 1];

    // Calculate spread
    const spread = ((highest.price - lowest.price) / lowest.price) * 100;
    
    // Estimate fees (0.3% per swap = 0.6% total)
    const estimatedFees = 0.6;
    const netProfit = spread - estimatedFees;

    console.log(`\n📊 Arbitrage Analysis:`);
    console.log(`   Buy from: ${lowest.dex} @ ${lowest.price}`);
    console.log(`   Sell to: ${highest.dex} @ ${highest.price}`);
    console.log(`   Spread: ${spread.toFixed(2)}%`);
    console.log(`   Est. Fees: ${estimatedFees}%`);
    console.log(`   Net Profit: ${netProfit.toFixed(2)}%`);

    // Minimum profitable spread (0.5% after fees)
    if (netProfit > 0.5) {
      console.log(`✅ Profitable arbitrage found!`);
      
      return {
        profitable: true,
        buyFrom: {
          dex: lowest.dex,
          network: lowest.network,
          price: lowest.price,
          poolAddress: lowest.poolAddress
        },
        sellTo: {
          dex: highest.dex,
          network: highest.network,
          price: highest.price,
          poolAddress: highest.poolAddress
        },
        spread: spread.toFixed(2) + '%',
        estimatedFees: estimatedFees + '%',
        netProfit: netProfit.toFixed(2) + '%',
        profitAmount: (parseFloat(amount) * netProfit / 100).toFixed(4),
        timestamp: new Date()
      };
    } else {
      console.log(`❌ Not profitable (${netProfit.toFixed(2)}% < 0.5%)`);
      return {
        profitable: false,
        spread: spread.toFixed(2) + '%',
        netProfit: netProfit.toFixed(2) + '%',
        reason: 'Spread too small after fees'
      };
    }
  }

  /**
   * Execute trade on best DEX
   * @param {string} dexName - DEX name
   * @param {object} tradeParams - Trade parameters
   * @returns {Promise<object>} Transaction result
   */
  async executeTrade(dexName, tradeParams) {
    const connector = this.connectors[dexName];
    
    if (!connector) {
      throw new Error(`DEX ${dexName} not configured`);
    }

    console.log(`\n🔄 Executing trade on ${dexName}...`);
    
    return await connector.executeTrade(tradeParams);
  }

  /**
   * Get all positions across DEXs
   * @param {string} account - Account address
   * @returns {Promise<object>} Positions by DEX
   */
  async getAllPositions(account) {
    const positions = {};

    for (const [name, connector] of Object.entries(this.connectors)) {
      if (connector.getPositions) {
        try {
          positions[name] = await connector.getPositions(account);
        } catch (error) {
          console.error(`Failed to get positions from ${name}:`, error.message);
          positions[name] = { error: error.message };
        }
      }
    }

    return positions;
  }

  /**
   * Monitor all DEXs for opportunities
   * @param {string} tokenA - Token A address
   * @param {string} tokenB - Token B address
   * @param {function} callback - Callback for opportunities
   */
  async monitorArbitrage(tokenA, tokenB, callback) {
    console.log(`\n👀 Monitoring arbitrage for ${tokenA}/${tokenB}...`);
    
    const checkArbitrage = async () => {
      try {
        const opportunity = await this.findArbitrage(tokenA, tokenB);
        
        if (opportunity && opportunity.profitable) {
          callback(opportunity);
        }
      } catch (error) {
        console.error('Arbitrage check failed:', error.message);
      }
    };

    // Check immediately
    await checkArbitrage();

    // Then check every 30 seconds
    const interval = setInterval(checkArbitrage, 30000);

    return () => clearInterval(interval);
  }

  /**
   * Get DEX statistics
   * @returns {object} Statistics for all DEXs
   */
  getStatistics() {
    return {
      totalDEXs: Object.keys(this.connectors).length,
      connectors: Object.keys(this.connectors),
      cacheSize: this.priceCache.size,
      cacheTTL: this.cacheTTL
    };
  }

  /**
   * Clear price cache
   */
  clearCache() {
    this.priceCache.clear();
    console.log('🗑️  Price cache cleared');
  }

  /**
   * Get connector by name
   * @param {string} name - Connector name
   * @returns {object} Connector instance
   */
  getConnector(name) {
    return this.connectors[name];
  }

  /**
   * Check if DEX is available
   * @param {string} name - DEX name
   * @returns {boolean} Availability status
   */
  isDEXAvailable(name) {
    return !!this.connectors[name];
  }

  /**
   * Get supported networks
   * @returns {Array} List of supported networks
   */
  getSupportedNetworks() {
    const networks = new Set();
    
    Object.values(this.connectors).forEach(connector => {
      networks.add(connector.network);
    });

    return Array.from(networks);
  }

  /**
   * Route trade to best DEX
   * @param {string} tokenA - Token A address
   * @param {string} tokenB - Token B address
   * @param {string} amount - Amount to trade
   * @returns {Promise<object>} Best route
   */
  async getBestRoute(tokenA, tokenB, amount) {
    const prices = await this.getBestPrice(tokenA, tokenB, amount);

    if (prices.length === 0) {
      throw new Error('No DEXs available for this pair');
    }

    const best = prices[0];

    return {
      dex: best.dex,
      network: best.network,
      price: best.price,
      liquidity: best.liquidity,
      poolAddress: best.poolAddress,
      estimatedOutput: (parseFloat(amount) * best.price).toFixed(6)
    };
  }

  /**
   * Compare prices across DEXs
   * @param {string} tokenA - Token A address
   * @param {string} tokenB - Token B address
   * @returns {Promise<object>} Price comparison
   */
  async comparePrices(tokenA, tokenB) {
    const prices = await this.getBestPrice(tokenA, tokenB, '1');

    if (prices.length === 0) {
      return { available: false, message: 'No prices available' };
    }

    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const maxSpread = ((prices[0].price - prices[prices.length - 1].price) / prices[prices.length - 1].price) * 100;

    return {
      available: true,
      prices: prices.map(p => ({
        dex: p.dex,
        network: p.network,
        price: p.price,
        deviation: (((p.price - avgPrice) / avgPrice) * 100).toFixed(2) + '%'
      })),
      avgPrice: avgPrice.toFixed(6),
      maxSpread: maxSpread.toFixed(2) + '%',
      best: prices[0],
      worst: prices[prices.length - 1]
    };
  }
}

module.exports = DEXManager;
