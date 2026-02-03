import axios from 'axios';

const EDGEX_API_BASE = 'https://api.edgex.exchange';

export interface EdgeXOrder {
  symbol: string; // e.g., "BTC-USD-PERP"
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' | 'TAKE_PROFIT_MARKET' | 'TAKE_PROFIT_LIMIT';
  quantity: string; // Amount in base currency
  price?: string; // Required for LIMIT orders
  stopPrice?: string; // Required for STOP orders
  leverage?: number; // 1-100x
  reduceOnly?: boolean; // Close position only
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface EdgeXPosition {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: string;
  entryPrice: string;
  markPrice: string;
  liquidationPrice: string;
  unrealizedPnl: string;
  leverage: number;
  margin: string;
}

/**
 * EdgeX API Client
 * Handles authentication and order placement via L2 signatures
 */
export class EdgeXClient {
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Generate L2 signature for authenticated requests
   * This uses StarkNet's signature scheme
   */
  private async generateSignature(
    timestamp: number,
    method: string,
    path: string,
    body?: any
  ): Promise<string> {
    // TODO: Implement StarkNet signature generation
    // This will use the user's connected StarkNet wallet
    // to sign the request parameters
    const message = `${timestamp}${method}${path}${body ? JSON.stringify(body) : ''}`;
    
    // Placeholder - will be replaced with actual StarkNet signing
    return `signature_placeholder_${message}`;
  }

  /**
   * Place a new order on EdgeX
   */
  async placeOrder(order: EdgeXOrder, walletAddress: string): Promise<any> {
    const timestamp = Date.now();
    const path = '/v1/orders';
    const signature = await this.generateSignature(timestamp, 'POST', path, order);

    const response = await axios.post(
      `${EDGEX_API_BASE}${path}`,
      {
        ...order,
        timestamp,
        address: walletAddress,
      },
      {
        headers: {
          'X-API-KEY': this.apiKey,
          'X-SIGNATURE': signature,
          'X-TIMESTAMP': timestamp.toString(),
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  /**
   * Get current positions
   */
  async getPositions(walletAddress: string): Promise<EdgeXPosition[]> {
    const timestamp = Date.now();
    const path = `/v1/positions?address=${walletAddress}`;
    const signature = await this.generateSignature(timestamp, 'GET', path);

    const response = await axios.get(`${EDGEX_API_BASE}${path}`, {
      headers: {
        'X-API-KEY': this.apiKey,
        'X-SIGNATURE': signature,
        'X-TIMESTAMP': timestamp.toString(),
      },
    });

    return response.data;
  }

  /**
   * Close a position
   */
  async closePosition(symbol: string, walletAddress: string): Promise<any> {
    const timestamp = Date.now();
    const path = '/v1/positions/close';
    const body = { symbol, address: walletAddress };
    const signature = await this.generateSignature(timestamp, 'POST', path, body);

    const response = await axios.post(
      `${EDGEX_API_BASE}${path}`,
      body,
      {
        headers: {
          'X-API-KEY': this.apiKey,
          'X-SIGNATURE': signature,
          'X-TIMESTAMP': timestamp.toString(),
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  /**
   * Set leverage for a symbol
   */
  async setLeverage(symbol: string, leverage: number, walletAddress: string): Promise<any> {
    const timestamp = Date.now();
    const path = '/v1/leverage';
    const body = { symbol, leverage, address: walletAddress };
    const signature = await this.generateSignature(timestamp, 'POST', path, body);

    const response = await axios.post(
      `${EDGEX_API_BASE}${path}`,
      body,
      {
        headers: {
          'X-API-KEY': this.apiKey,
          'X-SIGNATURE': signature,
          'X-TIMESTAMP': timestamp.toString(),
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string, walletAddress: string): Promise<any> {
    const timestamp = Date.now();
    const path = `/v1/orders/${orderId}`;
    const body = { address: walletAddress };
    const signature = await this.generateSignature(timestamp, 'DELETE', path, body);

    const response = await axios.delete(`${EDGEX_API_BASE}${path}`, {
      headers: {
        'X-API-KEY': this.apiKey,
        'X-SIGNATURE': signature,
        'X-TIMESTAMP': timestamp.toString(),
      },
      data: body,
    });

    return response.data;
  }

  /**
   * Get account balance
   */
  async getBalance(walletAddress: string): Promise<any> {
    const timestamp = Date.now();
    const path = `/v1/account/balance?address=${walletAddress}`;
    const signature = await this.generateSignature(timestamp, 'GET', path);

    const response = await axios.get(`${EDGEX_API_BASE}${path}`, {
      headers: {
        'X-API-KEY': this.apiKey,
        'X-SIGNATURE': signature,
        'X-TIMESTAMP': timestamp.toString(),
      },
    });

    return response.data;
  }
}

/**
 * Helper function to convert trading signal to EdgeX order
 */
export function signalToEdgeXOrder(signal: any, leverage: number): EdgeXOrder {
  const isLong = signal.direction === 'LONG';
  
  return {
    symbol: signal.pair.replace('/', '-') + '-PERP', // BTC/USDT -> BTC-USDT-PERP
    side: isLong ? 'BUY' : 'SELL',
    type: 'LIMIT',
    quantity: '0', // Will be calculated based on user's balance and leverage
    price: signal.entry.toString(),
    leverage,
    timeInForce: 'GTC',
  };
}
