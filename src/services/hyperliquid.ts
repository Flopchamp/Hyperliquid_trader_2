import { ethers } from 'ethers';
import type { Order, Position, MarketData } from '../types/trading';
// import { builderService } from './builderService';

// Hyperliquid API interfaces
interface HLAccountInfo {
  assetPositions: Array<{
    position: {
      coin: string;
      entryPx: string;
      leverage: {
        type: string;
        value: number;
      };
      liquidationPx: string;
      marginUsed: string;
      maxLeverage: number;
      positionValue: string;
      returnOnEquity: string;
      szi: string;
      unrealizedPnl: string;
    };
  }>;
  marginSummary: {
    accountValue: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  crossMaintenanceMarginUsed: string;
  crossMarginUsed: string;
  withdrawable: string;
}

interface HLOrder {
  coin: string;
  side: 'A' | 'B'; // A = Ask (sell), B = Bid (buy)
  sz: string;
  px: string;
  oid: number;
  timestamp: number;
  origSz: string;
}

interface WebSocketMessage {
  channel: string;
  data: any;
}

// Hyperliquid API endpoints
const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz';
const HYPERLIQUID_WS_URL = 'wss://api.hyperliquid.xyz/ws';

// Testnet endpoints (for safe testing)
const HYPERLIQUID_TESTNET_API_URL = 'https://api.hyperliquid-testnet.xyz';
const HYPERLIQUID_TESTNET_WS_URL = 'wss://api.hyperliquid-testnet.xyz/ws';

export class HyperliquidService {
  private wallet: ethers.Wallet | null = null;
  private websocket: WebSocket | null = null;
  private isConnected = false;
  private subscriptions = new Set<string>();
  private eventCallbacks = new Map<string, ((data: any) => void)[]>();
  
  // Asset mapping cache
  private assetMapping: Map<string, number> = new Map();
  
  constructor() {
    // Initialize service
  }

  // Event emitter functionality
  private emit(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Add event listener
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)?.push(callback);
  }

  // Remove event listener
  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Connect with private key
  async connect(privateKey: string): Promise<boolean> {
    try {
      this.wallet = new ethers.Wallet(privateKey);
      
      this.isConnected = true;
      await this.initializeWebSocket();
      await this.subscribeToUserData();
      
      // Emit connection event
      this.emit('connected', { address: this.wallet.address });
      
      return true;
    } catch (error) {
      console.error('Failed to connect to Hyperliquid:', error);
      this.isConnected = false;
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.emit('error', { error: message });
      return false;
    }
  }

  // Initialize WebSocket connection for real-time data
  private async initializeWebSocket(): Promise<void> {
    try {
      this.websocket = new WebSocket(HYPERLIQUID_WS_URL);
      
      this.websocket.onopen = () => {
        console.log('Hyperliquid WebSocket connected');
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('Hyperliquid WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

      this.websocket.onerror = (error) => {
        console.error('Hyperliquid WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  // Handle incoming WebSocket messages
  private handleWebSocketMessage(data: any): void {
    switch (data.channel) {
      case 'allMids':
        this.handlePriceUpdate(data.data);
        break;
      case 'user':
        this.handleUserUpdate(data.data);
        break;
      default:
        console.log('Unhandled WebSocket message:', data);
    }
  }
  // Handle price updates
  private handlePriceUpdate(data: any): void {
    // Process price updates and update market data
    console.log('Price update:', data);
    
    // Emit price updates for UI consumption
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([symbol, price]) => {
        this.emit('priceUpdate', { 
          symbol, 
          price: typeof price === 'string' ? parseFloat(price) : price,
          timestamp: Date.now()
        });
      });
    }
  }

  // Handle user account updates
  private handleUserUpdate(data: any): void {
    // Process user updates (orders, positions, etc.)
    console.log('User update:', data);
    
    if (data) {
      // Handle fills (completed orders)
      if (data.fills && Array.isArray(data.fills)) {
        data.fills.forEach((fill: any) => {
          this.emit('orderFilled', {
            orderId: fill.oid?.toString(),
            symbol: fill.coin,
            side: fill.side === 'B' ? 'buy' : 'sell',
            size: parseFloat(fill.sz),
            price: parseFloat(fill.px),
            timestamp: fill.time || Date.now()
          });
        });
      }
      
      // Handle order updates
      if (data.orders && Array.isArray(data.orders)) {
        data.orders.forEach((order: any) => {
          this.emit('orderUpdate', {
            orderId: order.oid?.toString(),
            status: order.status,
            timestamp: Date.now()
          });
        });
      }
      
      // Handle position updates
      if (data.assetPositions) {
        this.emit('positionsUpdate', data.assetPositions);
      }
    }
  }

  // Subscribe to market data for a symbol
  async subscribeToMarketData(symbol: string): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const subscription = {
      method: 'subscribe',
      subscription: {
        type: 'allMids'
      }
    };

    this.websocket.send(JSON.stringify(subscription));
    this.subscriptions.add(symbol);
  }

  // Subscribe to user data
  async subscribeToUserData(): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN || !this.wallet) {
      return;
    }

    const subscription = {
      method: 'subscribe',
      subscription: {
        type: 'user',
        user: this.wallet.address
      }
    };

    this.websocket.send(JSON.stringify(subscription));
  }  // Get account information
  async getAccountInfo(): Promise<HLAccountInfo> {
    if (!this.wallet) {
      throw new Error('Not connected to Hyperliquid');
    }

    try {
      const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: this.wallet.address
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const accountInfo = await response.json();
      return accountInfo;
    } catch (error) {
      console.error('Error fetching account info:', error);
      throw error;
    }
  }  // Create signature for authenticated requests
  async createSignature(action: object): Promise<{r: string, s: string, v: number}> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }
    
    // Hyperliquid uses a specific signing format
    const message = JSON.stringify(action);
    const messageBytes = ethers.toUtf8Bytes(message);
    const messageHash = ethers.keccak256(messageBytes);
    
    const signature = await this.wallet.signMessage(ethers.getBytes(messageHash));
    
    // Parse the signature into r, s, v components
    const sig = ethers.Signature.from(signature);
    
    return {
      r: sig.r,
      s: sig.s,
      v: sig.v
    };
  }// Place a market order
  async placeMarketOrder(
    symbol: string,
    side: 'buy' | 'sell',
    size: number
  ): Promise<Order> {
    if (!this.wallet) {
      throw new Error('Not connected to Hyperliquid');
    }

    try {
      const nonce = Date.now();
      
      // Get asset ID for the symbol (0 for most pairs, but we should map properly)
      const assetId = await this.getAssetId(symbol);      const order = {
        a: assetId, // asset
        b: side === 'buy', // is_buy
        p: "0", // price (0 for market orders, but we'll use a high/low price)
        s: size.toString(), // size
        r: false, // reduce_only
        t: { limit: { tif: 'Ioc' } }, // order type - Immediate or Cancel for market orders
        c: null // client order id
      };

      // Add builder parameters if configured - Temporarily disabled
      // const builderParams = builderService.createBuilderParams();
      // if (builderParams) {
      //   Object.assign(order, builderParams);
      // }

      // For market orders, use extreme prices to ensure execution
      if (side === 'buy') {
        order.p = "1000000"; // Very high price for market buy
      } else {
        order.p = "0.0001"; // Very low price for market sell
      }

      const action = {
        type: 'order',
        orders: [order]
      };

      const signature = await this.createSignature(action);

      const response = await fetch(`${HYPERLIQUID_API_URL}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          nonce,
          signature
        })
      });const result = await response.json();
      
      if (!response.ok) {
        console.error('HTTP Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: result
        });
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
      }
        if (result.status === 'ok') {
        const orderResult: Order = {
          id: result.response?.data?.statuses?.[0]?.resting?.oid?.toString() || `${nonce}-${Math.random()}`,
          accountId: 1,
          symbol,
          side,
          type: 'market',
          amount: size,
          status: 'filled',
          timestamp: nonce
        };
        
        this.emit('orderPlaced', orderResult);
        return orderResult;
      } else {
        console.error('API Error Response:', result);
        throw new Error(`API Error: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error('Error placing market order:', error);
      throw error;
    }
  }  // Place a limit order
  async placeLimitOrder(
    symbol: string,
    side: 'buy' | 'sell',
    size: number,
    price: number
  ): Promise<Order> {
    if (!this.wallet) {
      throw new Error('Not connected to Hyperliquid');
    }

    try {
      const nonce = Date.now();
      
      // Get asset ID for the symbol (0 for most pairs, but we should map properly)
      const assetId = await this.getAssetId(symbol);      const order = {
        a: assetId, // asset
        b: side === 'buy', // is_buy
        p: price.toString(), // limit price
        s: size.toString(), // size
        r: false, // reduce_only
        t: { limit: { tif: 'Gtc' } }, // order type - Good Till Cancel
        c: null // client order id
      };

      // Add builder parameters if configured - Temporarily disabled
      // const builderParams = builderService.createBuilderParams();
      // if (builderParams) {
      //   Object.assign(order, builderParams);
      // }

      const action = {
        type: 'order',
        orders: [order]
      };

      const signature = await this.createSignature(action);

      const response = await fetch(`${HYPERLIQUID_API_URL}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          nonce,
          signature
        })
      });const result = await response.json();
      
      if (!response.ok) {
        console.error('HTTP Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: result
        });
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
      }
        if (result.status === 'ok') {
        const orderResult: Order = {
          id: result.response?.data?.statuses?.[0]?.resting?.oid?.toString() || `${nonce}-${Math.random()}`,
          accountId: 1,
          symbol,
          side,
          type: 'limit',
          amount: size,
          price,
          status: 'pending',
          timestamp: nonce
        };
        
        this.emit('orderPlaced', orderResult);
        return orderResult;
      } else {
        console.error('API Error Response:', result);
        throw new Error(`API Error: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error('Error placing limit order:', error);
      throw error;
    }
  }  // Cancel an order
  async cancelOrder(orderId: string, symbol?: string): Promise<boolean> {
    if (!this.wallet) {
      throw new Error('Not connected to Hyperliquid');
    }

    try {
      // If symbol not provided, get it from open orders
      let coinSymbol = symbol;
      if (!coinSymbol) {
        const openOrders = await this.getOpenOrders();
        const order = openOrders.find(o => o.id === orderId);
        if (!order) {
          throw new Error(`Order ${orderId} not found`);
        }
        coinSymbol = order.symbol;
      }

      const timestamp = Date.now();
      const action = {
        type: 'cancel',
        cancels: [
          {
            coin: coinSymbol,
            oid: parseInt(orderId)
          }        ]
      };

      const signature = await this.createSignature(action);

      const response = await fetch(`${HYPERLIQUID_API_URL}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          signature,
          timestamp
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'ok') {
        this.emit('orderCancelled', { orderId });
        return true;
      } else {
        throw new Error(result.response || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    }
  }

  // Cancel all orders for an account
  async cancelAllOrders(): Promise<boolean> {
    if (!this.wallet) {
      throw new Error('Not connected to Hyperliquid');
    }

    try {
      // First get all open orders
      const openOrders = await this.getOpenOrders();
      
      if (openOrders.length === 0) {
        return true; // No orders to cancel
      }

      const timestamp = Date.now();
      const cancels = openOrders.map(order => ({
        coin: order.symbol,
        oid: parseInt(order.id)
      }));

      const action = {
        type: 'cancel',
        cancels
      };

      const signature = await this.createSignature(action);

      const response = await fetch(`${HYPERLIQUID_API_URL}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          signature,
          timestamp
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'ok') {
        this.emit('allOrdersCancelled', {});
        return true;
      } else {
        throw new Error(result.response || 'Failed to cancel all orders');
      }
    } catch (error) {
      console.error('Error cancelling all orders:', error);
      return false;
    }
  }

  // Close all positions for an account
  async closeAllPositions(): Promise<boolean> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const positions = await this.getPositions();
      
      if (positions.length === 0) {
        return true; // No positions to close
      }

      // Create market orders to close each position
      const closePromises = positions.map(position => {
        const side = position.side === 'long' ? 'sell' : 'buy';
        return this.placeMarketOrder(position.symbol, side, position.size);
      });

      await Promise.all(closePromises);
      
      this.emit('allPositionsClosed', {});
      return true;
    } catch (error) {
      console.error('Error closing all positions:', error);
      return false;
    }
  }
  // Get current positions
  async getPositions(): Promise<Position[]> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const accountInfo = await this.getAccountInfo();
        // Map Hyperliquid positions to our Position interface
      const positions: Position[] = accountInfo.assetPositions.map(assetPos => {
        const szi = parseFloat(assetPos.position.szi);
        const entryPrice = parseFloat(assetPos.position.entryPx);
        const unrealizedPnl = parseFloat(assetPos.position.unrealizedPnl);
        const positionValue = parseFloat(assetPos.position.positionValue);
        
        return {
          symbol: assetPos.position.coin,
          side: szi > 0 ? 'long' : 'short',
          size: Math.abs(szi),
          entryPrice,
          markPrice: entryPrice, // Use entry price as fallback
          pnl: unrealizedPnl,
          percentage: positionValue > 0 ? (unrealizedPnl / positionValue) * 100 : 0,
          leverage: assetPos.position.leverage.value,
          marginType: 'cross' // Hyperliquid uses cross margin by default
        };
      });
      
      return positions;
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }
  // Get open orders
  async getOpenOrders(): Promise<Order[]> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'openOrders',
          user: this.wallet.address
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const hlOrders = await response.json();
      
      // Map Hyperliquid orders to our Order interface
      const orders: Order[] = hlOrders.map((hlOrder: any) => ({
        id: hlOrder.oid.toString(),
        accountId: 1,
        symbol: hlOrder.coin,
        side: hlOrder.side === 'B' ? 'buy' : 'sell',
        type: hlOrder.limitPx ? 'limit' : 'market',
        amount: parseFloat(hlOrder.sz),
        price: hlOrder.limitPx ? parseFloat(hlOrder.limitPx) : undefined,
        status: 'pending',
        timestamp: hlOrder.timestamp || Date.now()
      }));
      
      return orders;
    } catch (error) {
      console.error('Error fetching open orders:', error);
      return [];
    }
  }
  // Get market data for a symbol
  async getMarketData(symbol: string): Promise<MarketData | null> {
    try {
      const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'allMids'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const midsData = await response.json();
      
      // Find the symbol in the mids data
      const symbolData = midsData[symbol];
      
      if (symbolData) {
        return {
          symbol,
          price: parseFloat(symbolData),
          change24h: 0, // Would need 24h data endpoint
          volume24h: 0, // Would need volume data endpoint
          high24h: 0,
          low24h: 0,
          timestamp: Date.now()
        };
      }
      
      return {
        symbol,
        price: 0,
        change24h: 0,
        volume24h: 0,
        high24h: 0,
        low24h: 0,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      return null;
    }
  }
  // Set leverage for a symbol
  async setLeverage(symbol: string, leverage: number): Promise<boolean> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const timestamp = Date.now();
      const action = {
        type: 'updateLeverage',
        asset: symbol,
        isCross: true,
        leverage
      };

      const signature = await this.createSignature(action);

      const response = await fetch(`${HYPERLIQUID_API_URL}/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          signature,
          timestamp
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'ok') {
        this.emit('leverageUpdated', { symbol, leverage });
        return true;
      } else {
        throw new Error(result.response || 'Failed to set leverage');
      }
    } catch (error) {
      console.error(`Error setting leverage for ${symbol}:`, error);
      return false;
    }
  }

  // Get account balance
  async getAccountBalance(): Promise<{ balance: number; equity: number; marginUsed: number }> {
    if (!this.wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const accountInfo = await this.getAccountInfo();
      
      return {
        balance: parseFloat(accountInfo.marginSummary.accountValue),
        equity: parseFloat(accountInfo.marginSummary.totalRawUsd),
        marginUsed: parseFloat(accountInfo.crossMarginUsed)
      };
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return { balance: 0, equity: 0, marginUsed: 0 };
    }
  }

  // Get trading info for a specific symbol
  async getTradingInfo(symbol: string): Promise<any> {
    try {
      const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meta'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const meta = await response.json();
      const symbolInfo = meta.universe.find((item: any) => item.name === symbol);
      
      return symbolInfo || null;
    } catch (error) {
      console.error('Error fetching trading info:', error);
      return null;
    }
  }

  // Debug method to test connection and basic functionality
  async debugTest(): Promise<void> {
    console.log('🔍 Starting Hyperliquid Service Debug Test...');
    
    try {
      // Test market data fetch
      console.log('📊 Testing market data fetch...');
      const marketData = await this.getMarketData('ETH');
      console.log('Market data result:', marketData);
      
      // Test trading info fetch
      console.log('ℹ️ Testing trading info fetch...');
      const tradingInfo = await this.getTradingInfo('ETH');
      console.log('Trading info result:', tradingInfo);
      
      // Test wallet connection status
      console.log('🔗 Wallet connection status:', this.isWalletConnected());
      console.log('🔧 Wallet address:', this.getWalletAddress());
      
      if (this.isWalletConnected()) {
        // Test account info fetch
        console.log('👤 Testing account info fetch...');
        const accountInfo = await this.getAccountInfo();
        console.log('Account info result:', accountInfo);
        
        // Test balance fetch
        console.log('💰 Testing balance fetch...');
        const balance = await this.getAccountBalance();
        console.log('Balance result:', balance);
        
        // Test positions fetch
        console.log('📈 Testing positions fetch...');
        const positions = await this.getPositions();
        console.log('Positions result:', positions);
        
        // Test open orders fetch
        console.log('📋 Testing open orders fetch...');
        const orders = await this.getOpenOrders();
        console.log('Open orders result:', orders);
      }
      
      console.log('✅ Debug test completed!');
    } catch (error) {
      console.error('❌ Debug test failed:', error);
    }
  }

  // Check if connected
  isWalletConnected(): boolean {
    return this.isConnected && this.wallet !== null;
  }

  // Get wallet address
  getWalletAddress(): string | null {
    return this.wallet?.address || null;
  }

  // Disconnect
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.wallet = null;
    this.isConnected = false;
    this.subscriptions.clear();
  }

  // Get asset ID for a symbol
  private async getAssetId(symbol: string): Promise<number> {
    // Check cache first
    if (this.assetMapping.has(symbol)) {
      return this.assetMapping.get(symbol)!;
    }

    try {
      // Fetch meta information to get asset mapping
      const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meta'
        })
      });

      const meta = await response.json();
      
      if (meta.universe) {
        // Cache all asset mappings
        meta.universe.forEach((asset: any, index: number) => {
          this.assetMapping.set(asset.name, index);
        });

        // Return the requested asset ID
        if (this.assetMapping.has(symbol)) {
          return this.assetMapping.get(symbol)!;
        }
      }

      throw new Error(`Asset ${symbol} not found`);
    } catch (error) {
      console.error('Error fetching asset mapping:', error);
      // Fallback to 0 for ETH (common case)
      if (symbol === 'ETH') {
        return 0;
      }
      throw error;
    }
  }
}

// Export singleton instance
export const hyperliquidService = new HyperliquidService();

// Global exposure for debugging
if (typeof window !== 'undefined') {
  (window as any).hyperliquidService = hyperliquidService;
}
