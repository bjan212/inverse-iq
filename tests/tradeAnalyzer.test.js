/**
 * Unit Tests for TradeAnalyzer Class
 * 
 * This file contains comprehensive unit tests for the TradeAnalyzer class,
 * covering all major functionality including API key management, exchange
 * connections, position analysis, and risk assessment.
 */

const TradeAnalyzer = require('../src/analytics/tradeAnalyzer');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('axios');
jest.mock('crypto');
jest.mock('fs');
jest.mock('path');

const axios = require('axios');
const crypto = require('crypto');

describe('TradeAnalyzer', () => {
  let tradeAnalyzer;
  let mockDataDir;
  let mockApiKeysFile;
  let mockHistoryFile;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock file system
    mockDataDir = '/mock/data';
    mockApiKeysFile = 'api_keys.json';
    mockHistoryFile = 'history.json';

    // Mock path.join
    path.join = jest.fn((...args) => args.join('/'));

    // Mock fs.existsSync
    fs.existsSync = jest.fn().mockReturnValue(false);

    // Mock fs.mkdirSync
    fs.mkdirSync = jest.fn();

    // Mock fs.readFileSync
    fs.readFileSync = jest.fn().mockReturnValue('{}');

    // Mock fs.writeFileSync
    fs.writeFileSync = jest.fn();

    // Create TradeAnalyzer instance
    tradeAnalyzer = new TradeAnalyzer({
      dataDir: mockDataDir,
      apiKeysFile: mockApiKeysFile,
      historyFile: mockHistoryFile
    });
  });

  describe('Initialization', () => {
    test('should initialize with default options', () => {
      const defaultAnalyzer = new TradeAnalyzer();

      expect(defaultAnalyzer.options.dataDir).toContain('data');
      expect(defaultAnalyzer.options.apiKeysFile).toBe('exchange_api_keys.json');
      expect(defaultAnalyzer.options.historyFile).toBe('trade_analysis_history.json');
    });

    test('should initialize with custom options', () => {
      expect(tradeAnalyzer.options.dataDir).toBe(mockDataDir);
      expect(tradeAnalyzer.options.apiKeysFile).toBe(mockApiKeysFile);
      expect(tradeAnalyzer.options.historyFile).toBe(mockHistoryFile);
    });

    test('should create data directory if it does not exist', () => {
      expect(fs.existsSync).toHaveBeenCalledWith(mockDataDir);
      expect(fs.mkdirSync).toHaveBeenCalledWith(mockDataDir, { recursive: true });
    });

    test('should load existing API keys', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        user1: { binance: { apiKey: 'key1', apiSecret: 'secret1' } }
      }));

      const newAnalyzer = new TradeAnalyzer();

      expect(newAnalyzer.apiKeys).toEqual({
        user1: { binance: { apiKey: 'key1', apiSecret: 'secret1' } }
      });
    });

    test('should handle invalid API keys file', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');

      const newAnalyzer = new TradeAnalyzer();

      expect(newAnalyzer.apiKeys).toEqual({});
    });
  });

  describe('API Key Management', () => {
    test('should set API keys for a user and exchange', () => {
      const result = tradeAnalyzer.setApiKeys('user1', 'binance', 'apiKey123', 'apiSecret456');

      expect(result).toBe(true);
      expect(tradeAnalyzer.apiKeys.user1.binance).toEqual({
        apiKey: 'apiKey123',
        apiSecret: 'apiSecret456',
        options: {}
      });
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('should set API keys with options', () => {
      const options = { passphrase: 'pass123' };
      tradeAnalyzer.setApiKeys('user1', 'okx', 'apiKey123', 'apiSecret456', options);

      expect(tradeAnalyzer.apiKeys.user1.okx).toEqual({
        apiKey: 'apiKey123',
        apiSecret: 'apiSecret456',
        options
      });
    });

    test('should get API keys for a user and exchange', () => {
      tradeAnalyzer.setApiKeys('user1', 'binance', 'apiKey123', 'apiSecret456');

      const keys = tradeAnalyzer.getApiKeys('user1', 'binance');

      expect(keys).toEqual({
        apiKey: 'apiKey123',
        apiSecret: 'apiSecret456',
        options: {}
      });
    });

    test('should return null for non-existent API keys', () => {
      const keys = tradeAnalyzer.getApiKeys('user1', 'binance');

      expect(keys).toBeNull();
    });
  });

  describe('Exchange Connectors', () => {
    beforeEach(() => {
      // Mock crypto.createHmac
      crypto.createHmac = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('mock_signature')
      });

      // Mock Date.now
      Date.now = jest.fn().mockReturnValue(1640995200000); // 2022-01-01 00:00:00 UTC

      // Mock axios
      axios.get = jest.fn();
      axios.post = jest.fn();
    });

    test('should create Binance connector', () => {
      const connector = tradeAnalyzer.createBinanceConnector('apiKey', 'apiSecret');

      expect(typeof connector.getOpenPositions).toBe('function');
      expect(typeof connector.getAccountInfo).toBe('function');
    });

    test('should create Bybit connector', () => {
      const connector = tradeAnalyzer.createBybitConnector('apiKey', 'apiSecret');

      expect(typeof connector.getOpenPositions).toBe('function');
      expect(typeof connector.getAccountInfo).toBe('function');
    });

    test('should create OKX connector', () => {
      const connector = tradeAnalyzer.createOkxConnector('apiKey', 'apiSecret', { passphrase: 'pass' });

      expect(typeof connector.getOpenPositions).toBe('function');
      expect(typeof connector.getAccountInfo).toBe('function');
    });

    test('should create MEXC connector', () => {
      const connector = tradeAnalyzer.createMexcConnector('apiKey', 'apiSecret');

      expect(typeof connector.getOpenPositions).toBe('function');
      expect(typeof connector.getAccountInfo).toBe('function');
    });

    test('should get exchange connector for valid user and exchange', () => {
      tradeAnalyzer.setApiKeys('user1', 'binance', 'apiKey', 'apiSecret');

      const connector = tradeAnalyzer.getExchangeConnector('user1', 'binance');

      expect(typeof connector).toBe('object');
      expect(typeof connector.getOpenPositions).toBe('function');
    });

    test('should throw error for invalid exchange', () => {
      tradeAnalyzer.setApiKeys('user1', 'invalid', 'apiKey', 'apiSecret');

      expect(() => {
        tradeAnalyzer.getExchangeConnector('user1', 'invalid');
      }).toThrow('Unsupported exchange: invalid');
    });

    test('should throw error for user without API keys', () => {
      expect(() => {
        tradeAnalyzer.getExchangeConnector('user1', 'binance');
      }).toThrow('No API keys found for user user1 and exchange binance');
    });
  });

  describe('Position and Account Data Retrieval', () => {
    beforeEach(() => {
      // Mock successful API responses
      axios.get.mockResolvedValue({
        data: {
          positions: [
            {
              symbol: 'BTCUSDT',
              entryPrice: 50000,
              size: 1,
              direction: 'long',
              leverage: 5
            }
          ],
          account: {
            balance: 10000
          }
        }
      });

      tradeAnalyzer.setApiKeys('user1', 'binance', 'apiKey', 'apiSecret');
    });

    test('should get open positions for user', async () => {
      const positions = await tradeAnalyzer.getOpenPositions('user1');

      expect(positions).toHaveProperty('binance');
      expect(axios.get).toHaveBeenCalled();
    });

    test('should get account info for user', async () => {
      const accountInfo = await tradeAnalyzer.getAccountInfo('user1');

      expect(accountInfo).toHaveProperty('binance');
      expect(axios.get).toHaveBeenCalled();
    });

    test('should handle API errors gracefully', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      const positions = await tradeAnalyzer.getOpenPositions('user1');

      expect(positions.binance).toEqual({ error: 'API Error' });
    });
  });

  describe('Data Extraction', () => {
    test('should extract Binance data correctly', () => {
      const positions = [
        {
          symbol: 'BTCUSDT',
          price: '50000',
          origQty: '1.5',
          side: 'BUY'
        }
      ];

      const account = {
        balances: [
          { asset: 'USDT', free: '1000', locked: '500' },
          { asset: 'BTC', free: '0.1', locked: '0.05' }
        ]
      };

      const { extractedPositions, balance } = tradeAnalyzer.extractExchangeData('binance', positions, account);

      expect(extractedPositions).toHaveLength(1);
      expect(extractedPositions[0]).toEqual({
        symbol: 'BTCUSDT',
        entryPrice: 50000,
        size: 1.5,
        direction: 'buy',
        leverage: 1,
        liquidationPrice: 0,
        unrealizedPnl: 0,
        marginBalance: 0
      });
      expect(balance).toBe(1500); // 1000 + 500
    });

    test('should extract Bybit data correctly', () => {
      const positions = {
        result: [
          {
            symbol: 'BTCUSDT',
            entry_price: '50000',
            size: '1.5',
            side: 'Buy',
            leverage: '5',
            liq_price: '45000',
            unrealised_pnl: '100',
            position_margin: '1500'
          }
        ]
      };

      const account = {
        result: {
          USDT: {
            wallet_balance: '10000'
          }
        }
      };

      const { extractedPositions, balance } = tradeAnalyzer.extractExchangeData('bybit', positions, account);

      expect(extractedPositions).toHaveLength(1);
      expect(extractedPositions[0]).toEqual({
        symbol: 'BTCUSDT',
        entryPrice: 50000,
        size: 1.5,
        direction: 'buy',
        leverage: 5,
        liquidationPrice: 45000,
        unrealizedPnl: 100,
        marginBalance: 1500
      });
      expect(balance).toBe(10000);
    });

    test('should extract OKX data correctly', () => {
      const positions = {
        data: [
          {
            instId: 'BTC-USDT',
            avgPx: '50000',
            pos: '1.5',
            posSide: 'long',
            lever: '5',
            liqPx: '45000',
            upl: '100',
            margin: '1500'
          }
        ]
      };

      const account = {
        data: [{
          totalEq: '10000'
        }]
      };

      const { extractedPositions, balance } = tradeAnalyzer.extractExchangeData('okx', positions, account);

      expect(extractedPositions).toHaveLength(1);
      expect(extractedPositions[0]).toEqual({
        symbol: 'BTC-USDT',
        entryPrice: 50000,
        size: 1.5,
        direction: 'long',
        leverage: 5,
        liquidationPrice: 45000,
        unrealizedPnl: 100,
        marginBalance: 1500
      });
      expect(balance).toBe('10000');
    });
  });

  describe('Position Analysis', () => {
    test('should analyze positions correctly', () => {
      const positions = [
        {
          symbol: 'BTCUSDT',
          entryPrice: 50000,
          size: 1,
          direction: 'long',
          leverage: 10,
          liquidationPrice: 45000,
          unrealizedPnl: 100,
          marginBalance: 5000
        }
      ];

      const balance = 10000;

      const result = tradeAnalyzer.analyzePositions(positions, balance);

      expect(result.positions).toHaveLength(1);
      expect(result.totalPositionValue).toBe(50000);
      expect(result.riskLevel).toBe('high'); // High leverage
      expect(result.recommendations).toHaveLength(2); // Leverage warning + position size
    });

    test('should analyze individual position', () => {
      const position = {
        symbol: 'BTCUSDT',
        entryPrice: 50000,
        size: 1,
        direction: 'long',
        leverage: 15, // Above max leverage
        liquidationPrice: 45000,
        unrealizedPnl: 100,
        marginBalance: 5000
      };

      const balance = 10000;

      const analysis = tradeAnalyzer.analyzePosition(position, balance);

      expect(analysis.riskLevel).toBe('high');
      expect(analysis.recommendation).toContain('Leverage');
    });
  });

  describe('Risk Assessment', () => {
    test('should calculate overall risk assessment', () => {
      const exchanges = {
        binance: {
          positions: [
            {
              symbol: 'BTCUSDT',
              entryPrice: 50000,
              size: 1,
              leverage: 5
            }
          ],
          balance: 10000
        }
      };

      const totalPositionValue = 50000;
      const totalBalance = 10000;

      const riskAssessment = tradeAnalyzer.calculateOverallRisk(exchanges, totalPositionValue, totalBalance);

      expect(riskAssessment).toHaveProperty('totalRisk');
      expect(riskAssessment).toHaveProperty('maxDrawdown');
      expect(riskAssessment).toHaveProperty('riskScore');
      expect(riskAssessment.totalRisk).toBe(5); // 50000 / 10000
    });

    test('should generate overall recommendation', () => {
      const analysis = {
        riskAssessment: {
          riskScore: 85 // High risk
        }
      };

      const recommendation = tradeAnalyzer.generateOverallRecommendation(analysis);

      expect(recommendation).toContain('CRITICAL RISK LEVEL');
    });
  });

  describe('Trade Analysis', () => {
    beforeEach(() => {
      // Mock successful API responses
      axios.get.mockResolvedValue({
        data: {
          positions: [
            {
              symbol: 'BTCUSDT',
              entryPrice: 50000,
              size: 1,
              direction: 'long',
              leverage: 5
            }
          ],
          account: {
            balance: 10000
          }
        }
      });

      tradeAnalyzer.setApiKeys('user1', 'binance', 'apiKey', 'apiSecret');
    });

    test('should analyze open trades successfully', async () => {
      const analysis = await tradeAnalyzer.analyzeOpenTrades('user1');

      expect(analysis).toHaveProperty('userId', 'user1');
      expect(analysis).toHaveProperty('timestamp');
      expect(analysis).toHaveProperty('exchanges');
      expect(analysis).toHaveProperty('overallRecommendation');
      expect(analysis).toHaveProperty('riskAssessment');
    });

    test('should save analysis to history', async () => {
      await tradeAnalyzer.analyzeOpenTrades('user1');

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('Analysis History', () => {
    test('should get analysis history for user', () => {
      tradeAnalyzer.analysisHistory = [
        { userId: 'user1', timestamp: 1000, overallRecommendation: 'Test 1' },
        { userId: 'user2', timestamp: 2000, overallRecommendation: 'Test 2' },
        { userId: 'user1', timestamp: 3000, overallRecommendation: 'Test 3' }
      ];

      const history = tradeAnalyzer.getAnalysisHistory('user1');

      expect(history).toHaveLength(2);
      expect(history[0].overallRecommendation).toBe('Test 3'); // Most recent first
      expect(history[1].overallRecommendation).toBe('Test 1');
    });

    test('should limit analysis history', () => {
      tradeAnalyzer.analysisHistory = [
        { userId: 'user1', timestamp: 1000 },
        { userId: 'user1', timestamp: 2000 },
        { userId: 'user1', timestamp: 3000 },
        { userId: 'user1', timestamp: 4000 }
      ];

      const history = tradeAnalyzer.getAnalysisHistory('user1', 2);

      expect(history).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing user ID in getOpenPositions', async () => {
      await expect(tradeAnalyzer.getOpenPositions()).rejects.toThrow();
    });

    test('should handle missing user ID in getAccountInfo', async () => {
      await expect(tradeAnalyzer.getAccountInfo()).rejects.toThrow();
    });

    test('should handle missing user ID in analyzeOpenTrades', async () => {
      await expect(tradeAnalyzer.analyzeOpenTrades()).rejects.toThrow();
    });

    test('should handle missing required parameters in setApiKeys', () => {
      expect(() => tradeAnalyzer.setApiKeys('user1')).toThrow();
      expect(() => tradeAnalyzer.setApiKeys('user1', 'binance')).toThrow();
      expect(() => tradeAnalyzer.setApiKeys('user1', 'binance', 'apiKey')).toThrow();
    });
  });
});
