/**
 * Simplified Uniswap V3 Connector
 * 
 * Provides core Uniswap V3 functionality without complex SDK dependencies:
 * - Price fetching from pools
 * - Liquidity monitoring
 * - Pool information
 * - Basic swap execution
 */

const DEXConnector = require('./dexConnector');
const { ethers } = require('ethers');

// Minimal ABIs for Uniswap V3
const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];

const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'
];

const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)'
];

const ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)'
];

class UniswapV3SimpleConnector extends DEXConnector {
  constructor(config) {
    super(config);
    
    // Uniswap V3 contract addresses (Ethereum mainnet)
    this.contracts = {
      factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      nftManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
    };
    
    // Common fee tiers (in basis points)
    this.feeTiers = {
      LOWEST: 100,    // 0.01%
      LOW: 500,       // 0.05%
      MEDIUM: 3000,   // 0.3%
      HIGH: 10000     // 1%
    };
    
    // Initialize contract instances
    this.factory = new ethers.Contract(
      this.contracts.factory,
      FACTORY_ABI,
      this.provider
    );
    
    this.quoter = new ethers.Contract(
      this.contracts.quoter,
      QUOTER_ABI,
      this.provider
    );
    
    if (this.wallet) {
      this.router = new ethers.Contract(
        this.contracts.router,
        ROUTER_ABI,
        this.wallet
      );
    }
    
    console.log('✅ Uniswap V3 connector initialized');
  }

  /**
   * Get pool address for token pair
   * @param {string} tokenA - Token A address
   * @param {string} tokenB - Token B address
   * @param {number} fee - Fee tier (default: 3000 = 0.3%)
   * @returns {Promise<string>} Pool address
   */
  async getPoolAddress(tokenA, tokenB, fee = 3000) {
    try {
      const poolAddress = await this.factory.getPool(tokenA, tokenB, fee);
      
      if (poolAddress === ethers.constants.AddressZero) {
        throw new Error(`Pool not found for ${tokenA}/${tokenB} with fee ${fee}`);
      }
      
      return poolAddress;
    } catch (error) {
      console.error('Error getting pool address:', error.message);
      throw error;
    }
  }

  /**
   * Get current price from pool
   * @param {string} tokenA - Token A address
   * @param {string} tokenB - Token B address
   * @param {number} fee - Fee tier
   * @returns {Promise<object>} Price information
   */
  async getPrice(tokenA, tokenB, fee = 3000) {
    try {
      const poolAddress = await this.getPoolAddress(tokenA, tokenB, fee);
      const pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
      
      const slot0 = await pool.slot0();
      const sqrtPriceX96 = slot0.sqrtPriceX96;
      
      // Convert sqrtPriceX96 to actual price
      // price = (sqrtPriceX96 / 2^96) ^ 2
      const Q96 = ethers.BigNumber.from(2).pow(96);
      const price = sqrtPriceX96.mul(sqrtPriceX96).mul(ethers.BigNumber.from(10).pow(18)).div(Q96).div(Q96);
      
      return {
        price: ethers.utils.formatUnits(price, 18),
        sqrtPriceX96: sqrtPriceX96.toString(),
        tick: slot0.tick,
        poolAddress,
        fee
      };
    } catch (error) {
      console.error('Error getting price:', error.message);
      throw error;
    }
  }

  /**
   * Get pool liquidity
   * @param {string} tokenA - Token A address
   * @param {string} tokenB - Token B address
   * @param {number} fee - Fee tier
   * @returns {Promise<object>} Liquidity information
   */
  async getLiquidity(tokenA, tokenB, fee = 3000) {
    try {
      const poolAddress = await this.getPoolAddress(tokenA, tokenB, fee);
      const pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
      
      const liquidity = await pool.liquidity();
      
      return {
        liquidity: liquidity.toString(),
        liquidityFormatted: ethers.utils.formatUnits(liquidity, 18),
        poolAddress
      };
    } catch (error) {
      console.error('Error getting liquidity:', error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive pool information
   * @param {string} tokenA - Token A address
   * @param {string} tokenB - Token B address
   * @param {number} fee - Fee tier
   * @returns {Promise<object>} Pool information
   */
  async getPoolInfo(tokenA, tokenB, fee = 3000) {
    try {
      const poolAddress = await this.getPoolAddress(tokenA, tokenB, fee);
      const pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
      
      const [slot0, liquidity, token0, token1, poolFee] = await Promise.all([
        pool.slot0(),
        pool.liquidity(),
        pool.token0(),
        pool.token1(),
        pool.fee()
      ]);
      
      // Get token symbols
      const [symbol0, symbol1] = await Promise.all([
        this.getTokenSymbol(token0),
        this.getTokenSymbol(token1)
      ]);
      
      // Calculate price
      const Q96 = ethers.BigNumber.from(2).pow(96);
      const price = slot0.sqrtPriceX96.mul(slot0.sqrtPriceX96).mul(ethers.BigNumber.from(10).pow(18)).div(Q96).div(Q96);
      
      return {
        poolAddress,
        token0: {
          address: token0,
          symbol: symbol0
        },
        token1: {
          address: token1,
          symbol: symbol1
        },
        fee: poolFee,
        liquidity: liquidity.toString(),
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        tick: slot0.tick,
        price: ethers.utils.formatUnits(price, 18),
        feeProtocol: slot0.feeProtocol
      };
    } catch (error) {
      console.error('Error getting pool info:', error.message);
      throw error;
    }
  }

  /**
   * Get quote for swap (read-only, no gas cost)
   * @param {string} tokenIn - Input token address
   * @param {string} tokenOut - Output token address
   * @param {string} amountIn - Amount in (in token units)
   * @param {number} fee - Fee tier
   * @returns {Promise<object>} Quote information
   */
  async getQuote(tokenIn, tokenOut, amountIn, fee = 3000) {
    try {
      // Note: quoteExactInputSingle is a state-changing function in Quoter V2
      // For read-only quotes, we'll use the price from the pool
      const priceInfo = await this.getPrice(tokenIn, tokenOut, fee);
      
      // Simple calculation: amountOut = amountIn * price
      const amountInBN = ethers.utils.parseUnits(amountIn, 18);
      const priceBN = ethers.utils.parseUnits(priceInfo.price, 18);
      const amountOutBN = amountInBN.mul(priceBN).div(ethers.BigNumber.from(10).pow(18));
      
      return {
        amountIn: amountIn,
        amountOut: ethers.utils.formatUnits(amountOutBN, 18),
        price: priceInfo.price,
        fee,
        poolAddress: priceInfo.poolAddress
      };
    } catch (error) {
      console.error('Error getting quote:', error.message);
      throw error;
    }
  }

  /**
   * Execute swap
   * @param {object} params - Swap parameters
   * @returns {Promise<object>} Transaction receipt
   */
  async executeTrade(params) {
    if (!this.wallet) {
      throw new Error('Wallet not configured for trading');
    }

    const {
      tokenIn,
      tokenOut,
      amountIn,
      amountOutMinimum,
      fee = 3000,
      recipient,
      deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes
    } = params;

    try {
      // Check and approve token if needed
      const allowance = await this.getTokenAllowance(
        tokenIn,
        this.wallet.address,
        this.contracts.router
      );

      const amountInBN = ethers.utils.parseUnits(amountIn, 18);

      if (ethers.BigNumber.from(allowance).lt(amountInBN)) {
        console.log('📝 Approving token for swap...');
        await this.approveToken(
          tokenIn,
          this.contracts.router,
          ethers.constants.MaxUint256.toString()
        );
      }

      // Prepare swap parameters
      const swapParams = {
        tokenIn,
        tokenOut,
        fee,
        recipient: recipient || this.wallet.address,
        deadline,
        amountIn: amountInBN,
        amountOutMinimum: ethers.utils.parseUnits(amountOutMinimum || '0', 18),
        sqrtPriceLimitX96: 0
      };

      // Estimate gas
      const gasEstimate = await this.router.estimateGas.exactInputSingle(swapParams);
      const gasLimit = gasEstimate.mul(120).div(100); // 20% buffer

      // Execute swap
      console.log('🔄 Executing swap...');
      const tx = await this.router.exactInputSingle(swapParams, {
        gasLimit
      });

      console.log(`⏳ Swap transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();

      console.log(`✅ Swap confirmed in block ${receipt.blockNumber}`);

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed',
        from: receipt.from,
        to: receipt.to
      };
    } catch (error) {
      console.error('Error executing swap:', error.message);
      throw error;
    }
  }

  /**
   * Monitor pool for price changes
   * @param {string} tokenA - Token A address
   * @param {string} tokenB - Token B address
   * @param {number} fee - Fee tier
   * @param {function} callback - Callback function for events
   */
  async monitorPool(tokenA, tokenB, fee, callback) {
    try {
      const poolAddress = await this.getPoolAddress(tokenA, tokenB, fee);
      const pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);

      console.log(`👀 Monitoring Uniswap V3 pool: ${poolAddress}`);

      // Listen for Swap events
      pool.on('Swap', (sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick, event) => {
        // Calculate price from sqrtPriceX96
        const Q96 = ethers.BigNumber.from(2).pow(96);
        const priceBN = sqrtPriceX96.mul(sqrtPriceX96).mul(ethers.BigNumber.from(10).pow(18)).div(Q96).div(Q96);
        const price = ethers.utils.formatUnits(priceBN, 18);

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
          transactionHash: event.transactionHash,
          poolAddress
        });
      });

      return pool;
    } catch (error) {
      console.error('Error monitoring pool:', error.message);
      throw error;
    }
  }

  /**
   * Get best fee tier for token pair
   * @param {string} tokenA - Token A address
   * @param {string} tokenB - Token B address
   * @returns {Promise<object>} Best fee tier info
   */
  async getBestFeeTier(tokenA, tokenB) {
    const results = [];

    for (const [name, fee] of Object.entries(this.feeTiers)) {
      try {
        const poolAddress = await this.factory.getPool(tokenA, tokenB, fee);
        
        if (poolAddress !== ethers.constants.AddressZero) {
          const pool = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
          const liquidity = await pool.liquidity();
          
          results.push({
            name,
            fee,
            poolAddress,
            liquidity: liquidity.toString(),
            liquidityFormatted: ethers.utils.formatUnits(liquidity, 18)
          });
        }
      } catch (error) {
        // Pool doesn't exist for this fee tier
        continue;
      }
    }

    if (results.length === 0) {
      throw new Error('No pools found for this token pair');
    }

    // Sort by liquidity (highest first)
    results.sort((a, b) => {
      return ethers.BigNumber.from(b.liquidity).gt(ethers.BigNumber.from(a.liquidity)) ? 1 : -1;
    });

    return {
      best: results[0],
      all: results
    };
  }
}

module.exports = UniswapV3SimpleConnector;
