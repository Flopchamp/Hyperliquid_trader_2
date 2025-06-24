// Standalone Hyperliquid Service for HTML pages
// This file provides the hyperliquid service as a standalone script

// Import ethers from CDN
const script = document.createElement('script');
script.src = 'https://cdn.ethers.io/lib/ethers-5.7.umd.min.js';
script.onload = function() {
  console.log('Ethers.js loaded');
  initializeHyperliquidService();
};
document.head.appendChild(script);

function initializeHyperliquidService() {
  // Constants
  const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz';
  const HYPERLIQUID_WS_URL = 'wss://api.hyperliquid.xyz/ws';

  class HyperliquidService {
    constructor() {
      this.wallet = null;
      this.isConnected = false;
      this.websocket = null;
      this.subscriptions = new Map();
      this.eventCallbacks = new Map();
    }

    // Event system
    emit(event, data) {
      const callbacks = this.eventCallbacks.get(event);
      if (callbacks) {
        callbacks.forEach(callback => callback(data));
      }
    }

    on(event, callback) {
      if (!this.eventCallbacks.has(event)) {
        this.eventCallbacks.set(event, []);
      }
      this.eventCallbacks.get(event).push(callback);
    }

    off(event, callback) {
      const callbacks = this.eventCallbacks.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }

    // Connect with private key
    async connect(privateKey) {
      try {
        this.wallet = new ethers.Wallet(privateKey);
        this.isConnected = true;
        
        // Initialize WebSocket
        await this.initializeWebSocket();
        
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

    // Initialize WebSocket connection
    async initializeWebSocket() {
      try {
        this.websocket = new WebSocket(HYPERLIQUID_WS_URL);
        
        this.websocket.onopen = () => {
          console.log('WebSocket connected');
          this.subscribeToAllMids();
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
          console.log('WebSocket disconnected');
          setTimeout(() => this.initializeWebSocket(), 5000);
        };
        
        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    }

    // Subscribe to all mids (market data)
    subscribeToAllMids() {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const subscribeMessage = {
          method: 'subscribe',
          subscription: { type: 'allMids' }
        };
        this.websocket.send(JSON.stringify(subscribeMessage));
      }
    }

    // Handle WebSocket messages
    handleWebSocketMessage(data) {
      if (data.channel === 'allMids' && data.data) {
        this.emit('marketData', data.data);
      }
    }

    // Get market data
    async getMarketData(symbol) {
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
        
        const data = await response.json();
        
        // Find the specific symbol
        const symbolData = Object.entries(data).find(([key]) => key === symbol);
        if (!symbolData) {
          throw new Error(`Symbol ${symbol} not found`);
        }
        
        const [symbolName, price] = symbolData;
        
        return {
          symbol: symbolName,
          markPx: price,
          price: parseFloat(price),
          change24h: 0,
          volume24h: 0,
          high24h: 0,
          low24h: 0,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error('Error fetching market data:', error);
        throw error;
      }
    }

    // Get trading info
    async getTradingInfo(symbol) {
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
        
        const data = await response.json();
        
        // Find the specific symbol in universe
        const symbolInfo = data.universe.find(asset => asset.name === symbol);
        if (!symbolInfo) {
          throw new Error(`Trading info for ${symbol} not found`);
        }
        
        return {
          szDecimals: symbolInfo.szDecimals,
          name: symbolInfo.name,
          maxLeverage: symbolInfo.maxLeverage,
          marginTableId: symbolInfo.marginTableId || 0
        };
      } catch (error) {
        console.error('Error fetching trading info:', error);
        throw error;
      }
    }

    // Get account info
    async getAccountInfo() {
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
            type: 'clearinghouseState',
            user: this.wallet.address
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching account info:', error);
        throw error;
      }
    }

    // Get account balance
    async getAccountBalance() {
      const accountInfo = await this.getAccountInfo();
      return {
        totalAccountValue: accountInfo.marginSummary?.accountValue || '0',
        totalMarginUsed: accountInfo.marginSummary?.totalMarginUsed || '0',
        totalNtlPos: accountInfo.marginSummary?.totalNtlPos || '0',
        totalRawUsd: accountInfo.marginSummary?.totalRawUsd || '0'
      };
    }

    // Get positions
    async getPositions() {
      const accountInfo = await this.getAccountInfo();
      return accountInfo.assetPositions || [];
    }

    // Get open orders
    async getOpenOrders() {
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
        
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching open orders:', error);
        throw error;
      }
    }

    // Check if connected
    isWalletConnected() {
      return this.isConnected && this.wallet !== null;
    }

    // Get wallet address
    getWalletAddress() {
      return this.wallet?.address || null;
    }

    // Disconnect
    disconnect() {
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
      this.wallet = null;
      this.isConnected = false;
      this.subscriptions.clear();
    }

    // Debug test
    async debugTest() {
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
  }

  // Create and expose the service globally
  window.hyperliquidService = new HyperliquidService();
  console.log('✅ Hyperliquid service initialized and available globally');
}
