/**
 * DEX Connector Base Class
 * 
 * Provides common functionality for all DEX connectors including:
 * - RPC provider setup
 * - Wallet integration
 * - Gas price utilities
 * - Transaction helpers
 */

const { ethers } = require('ethers');

class DEXConnector {
  constructor(config) {
    this.config = config;
    this.network = config.network || 'ethereum';
    this.rpcUrl = config.rpcUrl;
    
    // Initialize provider
    if (this.rpcUrl) {
      this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
    } else {
      throw new Error('RPC URL is required');
    }
    
    // Initialize wallet if private key provided
    if (config.privateKey) {
      this.wallet = new ethers.Wallet(config.privateKey, this.provider);
      console.log(`✅ Wallet initialized: ${this.wallet.address}`);
    } else {
      this.wallet = null;
      console.log('ℹ️  Read-only mode (no private key provided)');
    }
    
    // Network configurations
    this.networkConfigs = {
      ethereum: {
        chainId: 1,
        name: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
      },
      bsc: {
        chainId: 56,
        name: 'Binance Smart Chain',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }
      },
      arbitrum: {
        chainId: 42161,
        name: 'Arbitrum One',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
      },
      polygon: {
        chainId: 137,
        name: 'Polygon',
        nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
      }
    };
  }

  /**
   * Abstract methods to be implemented by specific DEX connectors
   */
  
  async getPrice(tokenA, tokenB) {
    throw new Error('getPrice() must be implemented by subclass');
  }

  async getLiquidity(tokenA, tokenB) {
    throw new Error('getLiquidity() must be implemented by subclass');
  }

  async getPoolInfo(poolAddress) {
    throw new Error('getPoolInfo() must be implemented by subclass');
  }

  async executeTrade(params) {
    throw new Error('executeTrade() must be implemented by subclass');
  }

  /**
   * COMMON UTILITY METHODS
   */

  /**
   * Get current gas price
   * @returns {Promise<BigNumber>} Gas price in wei
   */
  async getGasPrice() {
    try {
      const gasPrice = await this.provider.getGasPrice();
      return gasPrice;
    } catch (error) {
      console.error('Error fetching gas price:', error.message);
      throw error;
    }
  }

  /**
   * Get gas price in Gwei
   * @returns {Promise<string>} Gas price in Gwei
   */
  async getGasPriceGwei() {
    const gasPrice = await this.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  }

  /**
   * Estimate gas for a transaction
   * @param {object} transaction - Transaction object
   * @returns {Promise<BigNumber>} Estimated gas
   */
  async estimateGas(transaction) {
    try {
      const gasEstimate = await this.provider.estimateGas(transaction);
      return gasEstimate;
    } catch (error) {
      console.error('Error estimating gas:', error.message);
      throw error;
    }
  }

  /**
   * Get current block number
   * @returns {Promise<number>} Current block number
   */
  async getBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error('Error fetching block number:', error.message);
      throw error;
    }
  }

  /**
   * Get block by number
   * @param {number} blockNumber - Block number
   * @returns {Promise<object>} Block data
   */
  async getBlock(blockNumber) {
    try {
      return await this.provider.getBlock(blockNumber);
    } catch (error) {
      console.error('Error fetching block:', error.message);
      throw error;
    }
  }

  /**
   * Get transaction receipt
   * @param {string} txHash - Transaction hash
   * @returns {Promise<object>} Transaction receipt
   */
  async getTransactionReceipt(txHash) {
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('Error fetching transaction receipt:', error.message);
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   * @param {string} txHash - Transaction hash
   * @param {number} confirmations - Number of confirmations to wait for
   * @returns {Promise<object>} Transaction receipt
   */
  async waitForTransaction(txHash, confirmations = 1) {
    try {
      console.log(`⏳ Waiting for ${confirmations} confirmation(s) for tx: ${txHash}`);
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      return receipt;
    } catch (error) {
      console.error('Error waiting for transaction:', error.message);
      throw error;
    }
  }

  /**
   * Get account balance
   * @param {string} address - Account address
   * @returns {Promise<string>} Balance in native currency
   */
  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error fetching balance:', error.message);
      throw error;
    }
  }

  /**
   * Get ERC20 token balance
   * @param {string} tokenAddress - Token contract address
   * @param {string} accountAddress - Account address
   * @returns {Promise<string>} Token balance
   */
  async getTokenBalance(tokenAddress, accountAddress) {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );
      
      const balance = await tokenContract.balanceOf(accountAddress);
      return balance.toString();
    } catch (error) {
      console.error('Error fetching token balance:', error.message);
      throw error;
    }
  }

  /**
   * Get token decimals
   * @param {string} tokenAddress - Token contract address
   * @returns {Promise<number>} Token decimals
   */
  async getTokenDecimals(tokenAddress) {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function decimals() view returns (uint8)'],
        this.provider
      );
      
      return await tokenContract.decimals();
    } catch (error) {
      console.error('Error fetching token decimals:', error.message);
      return 18; // Default to 18 decimals
    }
  }

  /**
   * Get token symbol
   * @param {string} tokenAddress - Token contract address
   * @returns {Promise<string>} Token symbol
   */
  async getTokenSymbol(tokenAddress) {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function symbol() view returns (string)'],
        this.provider
      );
      
      return await tokenContract.symbol();
    } catch (error) {
      console.error('Error fetching token symbol:', error.message);
      return 'UNKNOWN';
    }
  }

  /**
   * Approve token spending
   * @param {string} tokenAddress - Token contract address
   * @param {string} spenderAddress - Spender contract address
   * @param {string} amount - Amount to approve (in wei)
   * @returns {Promise<object>} Transaction receipt
   */
  async approveToken(tokenAddress, spenderAddress, amount) {
    if (!this.wallet) {
      throw new Error('Wallet not configured for transactions');
    }

    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        this.wallet
      );

      console.log(`📝 Approving ${amount} tokens for ${spenderAddress}...`);
      
      const tx = await tokenContract.approve(spenderAddress, amount);
      console.log(`⏳ Approval transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Approval confirmed in block ${receipt.blockNumber}`);
      
      return receipt;
    } catch (error) {
      console.error('Error approving token:', error.message);
      throw error;
    }
  }

  /**
   * Check token allowance
   * @param {string} tokenAddress - Token contract address
   * @param {string} ownerAddress - Owner address
   * @param {string} spenderAddress - Spender address
   * @returns {Promise<string>} Allowance amount
   */
  async getTokenAllowance(tokenAddress, ownerAddress, spenderAddress) {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function allowance(address owner, address spender) view returns (uint256)'],
        this.provider
      );
      
      const allowance = await tokenContract.allowance(ownerAddress, spenderAddress);
      return allowance.toString();
    } catch (error) {
      console.error('Error fetching token allowance:', error.message);
      throw error;
    }
  }

  /**
   * Get network information
   * @returns {Promise<object>} Network info
   */
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.getBlockNumber();
      const gasPrice = await this.getGasPriceGwei();
      
      return {
        chainId: network.chainId,
        name: network.name,
        blockNumber,
        gasPriceGwei: gasPrice,
        config: this.networkConfigs[this.network]
      };
    } catch (error) {
      console.error('Error fetching network info:', error.message);
      throw error;
    }
  }

  /**
   * Format token amount
   * @param {string} amount - Amount in wei
   * @param {number} decimals - Token decimals
   * @returns {string} Formatted amount
   */
  formatTokenAmount(amount, decimals = 18) {
    return ethers.utils.formatUnits(amount, decimals);
  }

  /**
   * Parse token amount
   * @param {string} amount - Human-readable amount
   * @param {number} decimals - Token decimals
   * @returns {BigNumber} Amount in wei
   */
  parseTokenAmount(amount, decimals = 18) {
    return ethers.utils.parseUnits(amount, decimals);
  }

  /**
   * Check if address is valid
   * @param {string} address - Address to check
   * @returns {boolean} True if valid
   */
  isValidAddress(address) {
    return ethers.utils.isAddress(address);
  }

  /**
   * Get checksum address
   * @param {string} address - Address
   * @returns {string} Checksum address
   */
  getChecksumAddress(address) {
    return ethers.utils.getAddress(address);
  }

  /**
   * Calculate transaction cost
   * @param {BigNumber} gasUsed - Gas used
   * @param {BigNumber} gasPrice - Gas price
   * @returns {string} Cost in native currency
   */
  calculateTransactionCost(gasUsed, gasPrice) {
    const cost = gasUsed.mul(gasPrice);
    return ethers.utils.formatEther(cost);
  }

  /**
   * Get optimal gas price (with multiplier for faster confirmation)
   * @param {number} speedMultiplier - Speed multiplier (1 = normal, 1.2 = fast, 1.5 = very fast)
   * @returns {Promise<BigNumber>} Optimal gas price
   */
  async getOptimalGasPrice(speedMultiplier = 1.2) {
    const baseGasPrice = await this.getGasPrice();
    const multiplier = Math.floor(speedMultiplier * 100);
    return baseGasPrice.mul(multiplier).div(100);
  }

  /**
   * Monitor pending transaction
   * @param {string} txHash - Transaction hash
   * @param {function} callback - Callback function for updates
   */
  async monitorTransaction(txHash, callback) {
    console.log(`👀 Monitoring transaction: ${txHash}`);
    
    const checkStatus = async () => {
      try {
        const receipt = await this.getTransactionReceipt(txHash);
        
        if (receipt) {
          const status = receipt.status === 1 ? 'success' : 'failed';
          callback({
            status,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            receipt
          });
          return true;
        }
        return false;
      } catch (error) {
        callback({ status: 'error', error: error.message });
        return true;
      }
    };
    
    // Check every 3 seconds
    const interval = setInterval(async () => {
      const done = await checkStatus();
      if (done) {
        clearInterval(interval);
      }
    }, 3000);
  }
}

module.exports = DEXConnector;
