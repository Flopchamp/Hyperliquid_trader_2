import { useEffect, useState, useCallback } from 'react';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

interface WebSocketMessage {
  channel: string;
  data: {
    [symbol: string]: string;
  };
}

class HyperliquidPriceFeed {
  private ws: WebSocket | null = null;
  private subscribers = new Map<string, Set<(data: PriceData) => void>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  private connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      this.ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
      
      this.ws.onopen = () => {
        console.log('🟢 Hyperliquid WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Subscribe to all mids (price data)
        this.subscribeToAllMids();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔴 Hyperliquid WebSocket disconnected');
        this.isConnecting = false;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ Hyperliquid WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private subscribeToAllMids(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const subscription = {
        method: 'subscribe',
        subscription: {
          type: 'allMids'
        }
      };
      
      this.ws.send(JSON.stringify(subscription));
      console.log('📊 Subscribed to Hyperliquid price feeds');
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    if (message.channel === 'allMids' && message.data) {
      // Process price updates
      Object.entries(message.data).forEach(([symbol, priceStr]) => {
        const price = parseFloat(priceStr);
        if (!isNaN(price)) {
          const priceData: PriceData = {
            symbol: symbol,
            price: price,
            change24h: 0, // Would need additional data for this
            volume24h: 0, // Would need additional data for this
            high24h: price * 1.05, // Mock data
            low24h: price * 0.95, // Mock data
            timestamp: Date.now()
          };

          // Notify all subscribers for this symbol
          const symbolSubscribers = this.subscribers.get(symbol);
          if (symbolSubscribers) {
            symbolSubscribers.forEach(callback => {
              try {
                callback(priceData);
              } catch (error) {
                console.error('Error in price callback:', error);
              }
            });
          }

          // Also notify 'ALL' subscribers
          const allSubscribers = this.subscribers.get('ALL');
          if (allSubscribers) {
            allSubscribers.forEach(callback => {
              try {
                callback(priceData);
              } catch (error) {
                console.error('Error in price callback:', error);
              }
            });
          }
        }
      });
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  public subscribe(symbol: string, callback: (data: PriceData) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    
    this.subscribers.get(symbol)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const symbolSubscribers = this.subscribers.get(symbol);
      if (symbolSubscribers) {
        symbolSubscribers.delete(callback);
        if (symbolSubscribers.size === 0) {
          this.subscribers.delete(symbol);
        }
      }
    };
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
  }

  public getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return 'connected';
    return 'disconnected';
  }
}

// Global instance
let priceFeedInstance: HyperliquidPriceFeed | null = null;

export const getHyperliquidPriceFeed = (): HyperliquidPriceFeed => {
  if (!priceFeedInstance) {
    priceFeedInstance = new HyperliquidPriceFeed();
  }
  return priceFeedInstance;
};

// React hook for using price feeds
export const useHyperliquidPrice = (symbol: string) => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const updateConnectionStatus = useCallback(() => {
    const feed = getHyperliquidPriceFeed();
    setIsConnected(feed.getConnectionStatus() === 'connected');
  }, []);

  useEffect(() => {
    const feed = getHyperliquidPriceFeed();
    
    // Subscribe to price updates
    const unsubscribe = feed.subscribe(symbol, (data) => {
      setPriceData(data);
    });

    // Check connection status
    updateConnectionStatus();
    const statusInterval = setInterval(updateConnectionStatus, 1000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, [symbol, updateConnectionStatus]);

  return { priceData, isConnected };
};

// Hook for multiple symbols
export const useHyperliquidPrices = (symbols: string[]) => {
  const [pricesData, setPricesData] = useState<Map<string, PriceData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  const updateConnectionStatus = useCallback(() => {
    const feed = getHyperliquidPriceFeed();
    setIsConnected(feed.getConnectionStatus() === 'connected');
  }, []);

  useEffect(() => {
    const feed = getHyperliquidPriceFeed();
    const unsubscribeFunctions: (() => void)[] = [];

    // Subscribe to each symbol
    symbols.forEach(symbol => {
      const unsubscribe = feed.subscribe(symbol, (data) => {
        setPricesData(prev => new Map(prev.set(data.symbol, data)));
      });
      unsubscribeFunctions.push(unsubscribe);
    });

    // Check connection status
    updateConnectionStatus();
    const statusInterval = setInterval(updateConnectionStatus, 1000);

    return () => {
      unsubscribeFunctions.forEach(fn => fn());
      clearInterval(statusInterval);
    };
  }, [symbols, updateConnectionStatus]);

  return { pricesData, isConnected };
};

export type { PriceData };
