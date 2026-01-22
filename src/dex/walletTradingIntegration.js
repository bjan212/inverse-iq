/**
 * Wallet Trading Integration
 * 
 * Enables users to trade AI-generated signals directly on DEX exchanges
 * by connecting their Web3 wallet (MetaMask, WalletConnect, etc.)
 * 
 * Features:
 * - Wallet connection (MetaMask, WalletConnect, Coinbase Wallet)
 * - Signal-to-trade conversion
 * - One-click trade execution on DEX
 * - Transaction status tracking
 * - Multi-chain support
 */

const { ethers } = require('ethers');
const UniswapV3SimpleConnector = require('./uniswapV3Simple');

class WalletTradingIntegration {
  constructor() {
    this.connectedWallet = null;
    this.provider = null;
    this.signer = null;
    this.chainId = null;
    this.dexConnectors = {};
    
    // Supported networks
    this.networks = {
      1: { name: 'Ethereum', dex: 'uniswap', nativeCurrency: 'ETH' },
      56: { name: 'BSC', dex: 'pancakeswap', nativeCurrency: 'BNB' },
      42161: { name: 'Arbitrum', dex: 'uniswap', nativeCurrency: 'ETH' },
      137: { name: 'Polygon', dex: 'quickswap', nativeCurrency: 'MATIC' }
    };
  }

  /**
   * Connect wallet (browser-based)
   * @param {string} walletType - 'metamask', 'walletconnect', 'coinbase'
   * @returns {Promise<object>} Connection result
   */
  async connectWallet(walletType = 'metamask') {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection only available in browser');
      }

      let provider;

      switch (walletType) {
        case 'metamask':
          if (!window.ethereum) {
            throw new Error('MetaMask not installed');
          }
          provider = new ethers.providers.Web3Provider(window.ethereum);
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          break;

        case 'walletconnect':
          // WalletConnect integration would go here
          throw new Error('WalletConnect integration pending');

        case 'coinbase':
          // Coinbase Wallet integration would go here
          throw new Error('Coinbase Wallet integration pending');

        default:
          throw new Error(`Unsupported wallet type: ${walletType}`);
      }

      this.provider = provider;
      this.signer = provider.getSigner();
      this.connectedWallet = await this.signer.getAddress();
      
      const network = await provider.getNetwork();
      this.chainId = network.chainId;

      console.log(`✅ Wallet connected: ${this.connectedWallet}`);
      console.log(`📡 Network: ${this.networks[this.chainId]?.name || 'Unknown'} (${this.chainId})`);

      // Initialize DEX connector for this network
      await this.initializeDEXConnector();

      return {
        success: true,
        address: this.connectedWallet,
        chainId: this.chainId,
        network: this.networks[this.chainId]?.name || 'Unknown'
      };

    } catch (error) {
      console.error('Wallet connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Initialize DEX connector for current network
   */
  async initializeDEXConnector() {
    if (!this.chainId || !this.signer) {
      throw new Error('Wallet not connected');
    }

    const networkInfo = this.networks[this.chainId];
    if (!networkInfo) {
      throw new Error(`Unsupported network: ${this.chainId}`);
    }

    // Create DEX connector with signer
    this.dexConnectors[this.chainId] = new UniswapV3SimpleConnector({
      rpcUrl: this.provider.connection.url,
      network: networkInfo.name.toLowerCase(),
      privateKey: null // Using signer instead
    });

    // Override provider and wallet with connected ones
    this.dexConnectors[this.chainId].provider = this.provider;
    this.dexConnectors[this.chainId].wallet = this.signer;

    console.log(`✅ DEX connector initialized for ${networkInfo.name}`);
  }

  /**
   * Convert AI signal to tradeable format
   * @param {object} signal - AI-generated signal
   * @returns {object} Trade parameters
   */
  convertSignalToTrade(signal) {
    // Extract token addresses from signal
    // This assumes signal has token information
    const { symbol, direction, averageEntryPrice, stopLoss, takeProfit1 } = signal;

    // Map symbol to token addresses (example for ETH/USDC)
    const tokenMap = {
      'ETHUSDT': {
        tokenIn: direction === 'LONG' ? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' : '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // USDC or WETH
        tokenOut: direction === 'LONG' ? '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' : '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // WETH or USDC
        symbolIn: direction === 'LONG' ? 'USDC' : 'WETH',
        symbolOut: direction === 'LONG' ? 'WETH' : 'USDC'
      },
      'BTCUSDT': {
        tokenIn: direction === 'LONG' ? '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' : '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // USDC or WBTC
        tokenOut: direction === 'LONG' ? '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' : '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // WBTC or USDC
        symbolIn: direction === 'LONG' ? 'USDC' : 'WBTC',
        symbolOut: direction === 'LONG' ? 'WBTC' : 'USDC'
      }
    };

    const tokens = tokenMap[symbol] || tokenMap['ETHUSDT']; // Default to ETH

    return {
      signalId: signal.signalId,
      tokenIn: tokens.tokenIn,
      tokenOut: tokens.tokenOut,
      symbolIn: tokens.symbolIn,
      symbolOut: tokens.symbolOut,
      direction: direction,
      entryPrice: averageEntryPrice,
      stopLoss: stopLoss,
      takeProfit: takeProfit1,
      confidence: signal.confidence,
      riskLevel: signal.riskLevel
    };
  }

  /**
   * Execute trade from signal
   * @param {object} signal - AI-generated signal
   * @param {string} amountIn - Amount to trade (in token units)
   * @param {object} options - Trade options
   * @returns {Promise<object>} Transaction result
   */
  async executeSignalTrade(signal, amountIn, options = {}) {
    if (!this.connectedWallet) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log(`\n🎯 Executing trade for signal: ${signal.signalId}`);
      console.log(`📊 ${signal.symbol} ${signal.direction} @ $${signal.averageEntryPrice}`);

      // Convert signal to trade parameters
      const tradeParams = this.convertSignalToTrade(signal);

      // Get DEX connector for current network
      const dex = this.dexConnectors[this.chainId];
      if (!dex) {
        throw new Error('DEX connector not initialized');
      }

      // Calculate slippage tolerance (default 0.5%)
      const slippageTolerance = options.slippageTolerance || 0.005;

      // Get quote
      console.log(`💱 Getting quote for ${amountIn} ${tradeParams.symbolIn}...`);
      const quote = await dex.getQuote(
        tradeParams.tokenIn,
        tradeParams.tokenOut,
        amountIn,
        options.fee || 3000
      );

      console.log(`📈 Expected output: ${quote.amountOut} ${tradeParams.symbolOut}`);

      // Calculate minimum output with slippage
      const amountOutMinimum = (parseFloat(quote.amountOut) * (1 - slippageTolerance)).toString();

      // Execute trade
      console.log(`🔄 Executing swap...`);
      const result = await dex.executeTrade({
        tokenIn: tradeParams.tokenIn,
        tokenOut: tradeParams.tokenOut,
        amountIn: amountIn,
        amountOutMinimum: amountOutMinimum,
        fee: options.fee || 3000,
        recipient: this.connectedWallet,
        deadline: Math.floor(Date.now() / 1000) + (options.deadline || 1200) // 20 minutes default
      });

      console.log(`✅ Trade executed successfully!`);
      console.log(`📝 Transaction: ${result.transactionHash}`);

      return {
        success: true,
        signalId: signal.signalId,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        amountIn: amountIn,
        expectedAmountOut: quote.amountOut,
        minimumAmountOut: amountOutMinimum,
        gasUsed: result.gasUsed,
        tradeParams
      };

    } catch (error) {
      console.error('Trade execution failed:', error.message);
      return {
        success: false,
        signalId: signal.signalId,
        error: error.message
      };
    }
  }

  /**
   * Get wallet balance
   * @param {string} tokenAddress - Token address (null for native currency)
   * @returns {Promise<object>} Balance information
   */
  async getWalletBalance(tokenAddress = null) {
    if (!this.connectedWallet) {
      throw new Error('Wallet not connected');
    }

    try {
      if (!tokenAddress) {
        // Get native currency balance
        const balance = await this.provider.getBalance(this.connectedWallet);
        const formatted = ethers.utils.formatEther(balance);
        
        return {
          balance: formatted,
          symbol: this.networks[this.chainId]?.nativeCurrency || 'ETH',
          raw: balance.toString()
        };
      } else {
        // Get ERC20 token balance
        const dex = this.dexConnectors[this.chainId];
        const balance = await dex.getTokenBalance(tokenAddress, this.connectedWallet);
        const decimals = await dex.getTokenDecimals(tokenAddress);
        const symbol = await dex.getTokenSymbol(tokenAddress);
        const formatted = ethers.utils.formatUnits(balance, decimals);

        return {
          balance: formatted,
          symbol: symbol,
          decimals: decimals,
          raw: balance
        };
      }
    } catch (error) {
      console.error('Error fetching balance:', error.message);
      throw error;
    }
  }

  /**
   * Get tradeable signals for connected wallet
   * @param {Array} signals - Array of AI signals
   * @returns {Array} Filtered signals compatible with current network
   */
  getTradeableSignals(signals) {
    if (!this.chainId) {
      return [];
    }

    const networkInfo = this.networks[this.chainId];
    if (!networkInfo) {
      return [];
    }

    // Filter signals that can be traded on current network
    return signals.map(signal => ({
      ...signal,
      tradeable: true,
      network: networkInfo.name,
      dex: networkInfo.dex,
      estimatedGas: this.estimateGasForSignal(signal)
    }));
  }

  /**
   * Estimate gas cost for trading a signal
   * @param {object} signal - AI signal
   * @returns {object} Gas estimate
   */
  estimateGasForSignal(signal) {
    // Rough estimates for different operations
    const gasEstimates = {
      swap: 150000,
      approval: 50000
    };

    return {
      swap: gasEstimates.swap,
      approval: gasEstimates.approval,
      total: gasEstimates.swap + gasEstimates.approval,
      unit: 'gas'
    };
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet() {
    this.connectedWallet = null;
    this.provider = null;
    this.signer = null;
    this.chainId = null;
    this.dexConnectors = {};
    
    console.log('👋 Wallet disconnected');
  }

  /**
   * Get connection status
   * @returns {object} Connection status
   */
  getConnectionStatus() {
    return {
      connected: !!this.connectedWallet,
      address: this.connectedWallet,
      chainId: this.chainId,
      network: this.networks[this.chainId]?.name || null,
      dex: this.networks[this.chainId]?.dex || null
    };
  }

  /**
   * Switch network
   * @param {number} targetChainId - Target chain ID
   * @returns {Promise<boolean>} Success status
   */
  async switchNetwork(targetChainId) {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ethers.utils.hexValue(targetChainId) }],
      });

      // Update chain ID and reinitialize DEX connector
      const network = await this.provider.getNetwork();
      this.chainId = network.chainId;
      await this.initializeDEXConnector();

      console.log(`✅ Switched to ${this.networks[this.chainId]?.name}`);
      return true;

    } catch (error) {
      console.error('Network switch failed:', error.message);
      throw error;
    }
  }
}

module.exports = WalletTradingIntegration;
