import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  size: string;
  entryPrice: string;
  markPrice: string;
  unrealizedPnl: string;
  leverage: string;
  margin: string;
  liquidationPrice: string;
}

interface OrderFill {
  symbol: string;
  side: 'LONG' | 'SHORT';
  price: string;
  quantity: string;
  timestamp: number;
}

export function useEdgeXWebSocket(walletAddress: string | undefined, enabled: boolean) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !walletAddress) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const connect = () => {
      // EdgeX WebSocket URL (placeholder - will be updated with actual endpoint)
      const wsUrl = `wss://ws.edgex.exchange/v1/stream?wallet=${walletAddress}`;
      
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[EdgeX WS] Connected');
          setIsConnected(true);
          
          // Subscribe to position updates
          ws.send(JSON.stringify({
            type: 'subscribe',
            channels: ['positions', 'orders'],
            wallet: walletAddress,
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'position_update') {
              setPositions(data.positions);
            } else if (data.type === 'order_fill') {
              const fill: OrderFill = data.fill;
              toast.success(
                `Order Filled: ${fill.side} ${fill.quantity} ${fill.symbol} @ $${fill.price}`,
                { duration: 5000 }
              );
            } else if (data.type === 'position_closed') {
              toast.info(`Position closed: ${data.symbol}`);
            }
          } catch (error) {
            console.error('[EdgeX WS] Parse error:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('[EdgeX WS] Error:', error);
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('[EdgeX WS] Disconnected');
          setIsConnected(false);
          wsRef.current = null;

          // Reconnect after 5 seconds
          if (enabled) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('[EdgeX WS] Reconnecting...');
              connect();
            }, 5000);
          }
        };
      } catch (error) {
        console.error('[EdgeX WS] Connection error:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [walletAddress, enabled]);

  return { positions, isConnected };
}
