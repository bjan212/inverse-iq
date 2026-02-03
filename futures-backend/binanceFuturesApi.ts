import axios from 'axios';
import crypto from 'crypto';

const BINANCE_FUTURES_BASE = 'https://fapi.binance.com';

export interface BinanceOrder {
  symbol: string; // e.g., "BTCUSDT"
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'TAKE_PROFIT_MARKET';
  quantity?: string;
  price?: string;
  stopPrice?: string;
  reduceOnly?: boolean;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface BinancePosition {
  symbol: string;
  positionAmt: string;
  entryPrice: string;
  markPrice: string;
  unRealizedProfit: string;
  liquidationPrice: string;
  leverage: string;
  marginType: string;
  isolatedMargin: string;
  positionSide: 'BOTH' | 'LONG' | 'SHORT';
}

/**
 * Binance Futures API Client
 * Handles authentication and order placement via HMAC-SHA256 signatures
 */
export class BinanceFuturesClient {
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Generate HMAC-SHA256 signature for authenticated requests
   */
  private generateSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * Make authenticated request to Binance Futures API
   */
  private async makeRequest(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    const timestamp = Date.now();
    const queryString = new URLSearchParams({
      ...params,
      timestamp: timestamp.toString(),
    }).toString();

    const signature = this.generateSignature(queryString);
    const url = `${BINANCE_FUTURES_BASE}${endpoint}?${queryString}&signature=${signature}`;

    const response = await axios({
      method,
      url,
      headers: {
        'X-MBX-APIKEY': this.apiKey,
      },
    });

    return response.data;
  }

  /**
   * Test API connectivity and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/fapi/v2/account');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<any> {
    return await this.makeRequest('GET', '/fapi/v2/balance');
  }

  /**
   * Set leverage for a symbol
   */
  async setLeverage(symbol: string, leverage: number): Promise<any> {
    return await this.makeRequest('POST', '/fapi/v1/leverage', {
      symbol,
      leverage,
    });
  }

  /**
   * Place a new order
   */
  async placeOrder(order: BinanceOrder): Promise<any> {
    const params: Record<string, any> = {
      symbol: order.symbol,
      side: order.side,
      type: order.type,
    };

    if (order.quantity) params.quantity = order.quantity;
    if (order.price) params.price = order.price;
    if (order.stopPrice) params.stopPrice = order.stopPrice;
    if (order.reduceOnly !== undefined) params.reduceOnly = order.reduceOnly;
    if (order.timeInForce) params.timeInForce = order.timeInForce;

    return await this.makeRequest('POST', '/fapi/v1/order', params);
  }

  /**
   * Get current positions
   */
  async getPositions(): Promise<BinancePosition[]> {
    const positions = await this.makeRequest('GET', '/fapi/v2/positionRisk');
    // Filter out positions with zero amount
    return positions.filter((p: BinancePosition) => parseFloat(p.positionAmt) !== 0);
  }

  /**
   * Close a position (market order)
   */
  async closePosition(symbol: string, positionAmt: string): Promise<any> {
    const side = parseFloat(positionAmt) > 0 ? 'SELL' : 'BUY';
    const quantity = Math.abs(parseFloat(positionAmt)).toString();

    return await this.placeOrder({
      symbol,
      side,
      type: 'MARKET',
      quantity,
      reduceOnly: true,
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(symbol: string, orderId: number): Promise<any> {
    return await this.makeRequest('DELETE', '/fapi/v1/order', {
      symbol,
      orderId,
    });
  }

  /**
   * Get open orders
   */
  async getOpenOrders(symbol?: string): Promise<any> {
    const params = symbol ? { symbol } : {};
    return await this.makeRequest('GET', '/fapi/v1/openOrders', params);
  }
}

/**
 * Helper function to convert trading signal to Binance order
 */
export function signalToBinanceOrder(
  signal: any,
  quantity: string
): { main: BinanceOrder; stopLoss: BinanceOrder; takeProfit: BinanceOrder } {
  const isLong = signal.direction === 'LONG';
  const symbol = signal.pair.replace('/', '') + 'USDT'; // BTC/USDT -> BTCUSDT

  return {
    main: {
      symbol,
      side: isLong ? 'BUY' : 'SELL',
      type: 'MARKET',
      quantity,
    },
    stopLoss: {
      symbol,
      side: isLong ? 'SELL' : 'BUY',
      type: 'STOP_MARKET',
      stopPrice: signal.stopLoss.toString(),
      quantity,
      reduceOnly: true,
    },
    takeProfit: {
      symbol,
      side: isLong ? 'SELL' : 'BUY',
      type: 'TAKE_PROFIT_MARKET',
      stopPrice: signal.takeProfit.toString(),
      quantity,
      reduceOnly: true,
    },
  };
}
