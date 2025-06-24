import React, { createContext, useReducer, type ReactNode } from 'react';
import type { TradingState, Account, Order, Position, MarketData } from '../types/trading';
import { hyperliquidService } from '../services/hyperliquid';

// Initial state
const initialState: TradingState = {  accounts: [
    {
      id: 1,
      title: "Account",
      status: "INACTIVE",
      pair: "ETH-USD",
      leverage: "25x Leverage",
      balance: "$0.00",
      pnl: "$0.00",
      isConnected: false,
    },
  ],
  activeAccount: 1,
  positions: {},
  orders: {},
  marketData: {},
  isTrading: false,
  connectionStatus: {},
};

// Action types
type TradingAction =
  | { type: 'SET_ACCOUNT_CONNECTION'; payload: { accountId: number; isConnected: boolean; address?: string } }
  | { type: 'UPDATE_ACCOUNT'; payload: { accountId: number; updates: Partial<Account> } }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'REMOVE_ACCOUNT'; payload: number }
  | { type: 'SET_ACTIVE_ACCOUNT'; payload: number }
  | { type: 'ADD_ORDER'; payload: { accountId: number; order: Order } }
  | { type: 'UPDATE_ORDER'; payload: { accountId: number; orderId: string; updates: Partial<Order> } }
  | { type: 'REMOVE_ORDER'; payload: { accountId: number; orderId: string } }
  | { type: 'SET_POSITIONS'; payload: { accountId: number; positions: Position[] } }
  | { type: 'UPDATE_MARKET_DATA'; payload: { symbol: string; data: MarketData } }
  | { type: 'SET_TRADING_STATUS'; payload: boolean }
  | { type: 'SET_CONNECTION_STATUS'; payload: { accountId: number; status: 'connected' | 'disconnected' | 'error' } };

// Reducer
function tradingReducer(state: TradingState, action: TradingAction): TradingState {
  switch (action.type) {
    case 'SET_ACCOUNT_CONNECTION':
      return {
        ...state,
        accounts: state.accounts.map(acc =>
          acc.id === action.payload.accountId
            ? { ...acc, isConnected: action.payload.isConnected }
            : acc
        ),
        connectionStatus: {
          ...state.connectionStatus,
          [action.payload.accountId]: action.payload.isConnected ? 'connected' : 'disconnected'
        }
      };

    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map(acc =>
          acc.id === action.payload.accountId
            ? { ...acc, ...action.payload.updates }
            : acc
        )
      };

    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, action.payload]
      };    case 'REMOVE_ACCOUNT': {
      const { [action.payload]: _, ...restPositions } = state.positions;
      const { [action.payload]: __, ...restOrders } = state.orders;
      return {
        ...state,
        accounts: state.accounts.filter(acc => acc.id !== action.payload),
        positions: restPositions,
        orders: restOrders
      };
    }

    case 'SET_ACTIVE_ACCOUNT':
      return {
        ...state,
        activeAccount: action.payload
      };

    case 'ADD_ORDER':
      return {
        ...state,
        orders: {
          ...state.orders,
          [action.payload.accountId]: [
            ...(state.orders[action.payload.accountId] || []),
            action.payload.order
          ]
        }
      };

    case 'UPDATE_ORDER':
      return {
        ...state,
        orders: {
          ...state.orders,
          [action.payload.accountId]: (state.orders[action.payload.accountId] || []).map(order =>
            order.id === action.payload.orderId
              ? { ...order, ...action.payload.updates }
              : order
          )
        }
      };

    case 'REMOVE_ORDER':
      return {
        ...state,
        orders: {
          ...state.orders,
          [action.payload.accountId]: (state.orders[action.payload.accountId] || []).filter(
            order => order.id !== action.payload.orderId
          )
        }
      };

    case 'SET_POSITIONS':
      return {
        ...state,
        positions: {
          ...state.positions,
          [action.payload.accountId]: action.payload.positions
        }
      };

    case 'UPDATE_MARKET_DATA':
      return {
        ...state,
        marketData: {
          ...state.marketData,
          [action.payload.symbol]: action.payload.data
        }
      };

    case 'SET_TRADING_STATUS':
      return {
        ...state,
        isTrading: action.payload
      };

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: {
          ...state.connectionStatus,
          [action.payload.accountId]: action.payload.status
        }
      };

    default:
      return state;
  }
}

// Context
export const TradingContext = createContext<{
  state: TradingState;
  dispatch: React.Dispatch<TradingAction>;
  connectAccount: (accountId: number, privateKey: string) => Promise<boolean>;
  disconnectAccount: (accountId: number) => void;
  placeMarketOrder: (accountId: number, symbol: string, side: 'buy' | 'sell', size: number) => Promise<void>;
  placeLimitOrder: (accountId: number, symbol: string, side: 'buy' | 'sell', size: number, price: number) => Promise<void>;
  cancelOrder: (accountId: number, orderId: string) => Promise<void>;
  cancelAllOrders: (accountId: number) => Promise<void>;
  closeAllPositions: (accountId: number) => Promise<void>;
  refreshAccountData: (accountId: number) => Promise<void>;
  debugService: () => typeof hyperliquidService;
  debugTest: () => Promise<void>;
  placeMultiAccountOrder: (masterAccountId: number, symbol: string, side: 'buy' | 'sell', size: number, orderType?: 'market' | 'limit', price?: number) => Promise<{ success: number; failed: number; results: Array<{accountId: number; success: boolean; error?: string}> }>;
  closeAllPositionsMultiAccount: () => Promise<{ success: number; failed: number }>;
  cancelAllOrdersMultiAccount: () => Promise<{ success: number; failed: number }>;
  getMultiAccountSummary: () => { totalAccounts: number; masterAccounts: number; subscriberAccounts: number; totalBalance: number; totalPnL: number; accounts: Array<{id: number; title: string; role: string; balance: string; pnl: string; pair: string}> };
} | null>(null);

// Provider component
interface TradingProviderProps {
  children: ReactNode;
}

export function TradingProvider({ children }: TradingProviderProps) {
  const [state, dispatch] = useReducer(tradingReducer, initialState);

  // Connect account with private key
  const connectAccount = async (accountId: number, privateKey: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: { accountId, status: 'disconnected' } });
      
      const connected = await hyperliquidService.connect(privateKey);
      
      if (connected) {
        dispatch({ type: 'SET_ACCOUNT_CONNECTION', payload: { accountId, isConnected: true } });
        dispatch({ type: 'UPDATE_ACCOUNT', payload: { 
          accountId, 
          updates: { 
            status: 'ACTIVE',
            privateKey,
            isConnected: true
          } 
        }});
        
        // Refresh account data
        await refreshAccountData(accountId);
        
        return true;
      } else {
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: { accountId, status: 'error' } });
        return false;
      }
    } catch (error) {
      console.error('Failed to connect account:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: { accountId, status: 'error' } });
      return false;
    }
  };

  // Disconnect account
  const disconnectAccount = (accountId: number): void => {
    hyperliquidService.disconnect();
    dispatch({ type: 'SET_ACCOUNT_CONNECTION', payload: { accountId, isConnected: false } });
    dispatch({ type: 'UPDATE_ACCOUNT', payload: { 
      accountId, 
      updates: { 
        status: 'INACTIVE',
        isConnected: false
      } 
    }});
  };

  // Place market order
  const placeMarketOrder = async (accountId: number, symbol: string, side: 'buy' | 'sell', size: number): Promise<void> => {
    try {
      dispatch({ type: 'SET_TRADING_STATUS', payload: true });
      
      const order = await hyperliquidService.placeMarketOrder(symbol, side, size);
      dispatch({ type: 'ADD_ORDER', payload: { accountId, order } });
      
      // Refresh account data after order
      setTimeout(() => refreshAccountData(accountId), 1000);
    } catch (error) {
      console.error('Failed to place market order:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_TRADING_STATUS', payload: false });
    }
  };

  // Place limit order
  const placeLimitOrder = async (accountId: number, symbol: string, side: 'buy' | 'sell', size: number, price: number): Promise<void> => {
    try {
      dispatch({ type: 'SET_TRADING_STATUS', payload: true });
      
      const order = await hyperliquidService.placeLimitOrder(symbol, side, size, price);
      dispatch({ type: 'ADD_ORDER', payload: { accountId, order } });
      
      // Refresh account data after order
      setTimeout(() => refreshAccountData(accountId), 1000);
    } catch (error) {
      console.error('Failed to place limit order:', error);
      throw error;
    } finally {
      dispatch({ type: 'SET_TRADING_STATUS', payload: false });
    }
  };

  // Cancel order
  const cancelOrder = async (accountId: number, orderId: string): Promise<void> => {
    try {
      const success = await hyperliquidService.cancelOrder(orderId);
      if (success) {
        dispatch({ type: 'REMOVE_ORDER', payload: { accountId, orderId } });
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      throw error;
    }
  };

  // Cancel all orders
  const cancelAllOrders = async (accountId: number): Promise<void> => {
    try {
      const success = await hyperliquidService.cancelAllOrders();
      if (success) {
        // Clear all orders for this account
        const accountOrders = state.orders[accountId] || [];
        accountOrders.forEach(order => {
          dispatch({ type: 'REMOVE_ORDER', payload: { accountId, orderId: order.id } });
        });
      }
    } catch (error) {
      console.error('Failed to cancel all orders:', error);
      throw error;
    }
  };

  // Close all positions
  const closeAllPositions = async (accountId: number): Promise<void> => {
    try {
      const success = await hyperliquidService.closeAllPositions();
      if (success) {
        // Refresh account data
        await refreshAccountData(accountId);
      }
    } catch (error) {
      console.error('Failed to close all positions:', error);
      throw error;
    }
  };

  // Refresh account data
  const refreshAccountData = async (accountId: number): Promise<void> => {
    try {
      const [accountInfo, positions, orders] = await Promise.all([
        hyperliquidService.getAccountInfo(),
        hyperliquidService.getPositions(),
        hyperliquidService.getOpenOrders()
      ]);

      // Update account balance and PnL
      if (accountInfo) {
        dispatch({ type: 'UPDATE_ACCOUNT', payload: {
          accountId,
          updates: {
            balance: `$${parseFloat(accountInfo.marginSummary.accountValue).toFixed(2)}`,
            pnl: `$${parseFloat(accountInfo.marginSummary.totalNtlPos).toFixed(2)}`
          }
        }});
      }

      // Update positions
      dispatch({ type: 'SET_POSITIONS', payload: { accountId, positions } });

      // Update orders
      state.orders[accountId] = orders;
    } catch (error) {
      console.error('Failed to refresh account data:', error);
    }
  };

  // Real-time market data updates
  const startMarketDataUpdates = (): NodeJS.Timeout => {
    // Subscribe to WebSocket price updates
    hyperliquidService.subscribeToMarketData('ETH');
    
    // Set up periodic market data updates
    const updateInterval = setInterval(async () => {
      try {
        const ethData = await hyperliquidService.getMarketData('ETH');
        if (ethData) {
          dispatch({ type: 'UPDATE_MARKET_DATA', payload: { symbol: 'ETH', data: ethData } });
        }
      } catch (error) {
        console.error('Market data update error:', error);
      }
    }, 5000); // Update every 5 seconds

    return updateInterval;
  };

  // Set up real-time price event listeners
  React.useEffect(() => {
    // Listen for price updates from WebSocket
    const handlePriceUpdate = (data: { symbol: string; price: number; timestamp: number }) => {
      dispatch({ 
        type: 'UPDATE_MARKET_DATA', 
        payload: { 
          symbol: data.symbol, 
          data: {
            symbol: data.symbol,
            price: data.price,
            change24h: 0, // Would need historical data for this
            volume24h: 0,
            high24h: 0,
            low24h: 0,
            timestamp: data.timestamp
          }
        } 
      });
    };

    // Set up event listeners
    hyperliquidService.on('priceUpdate', handlePriceUpdate);
    
    // Start market data updates
    const marketInterval = startMarketDataUpdates();

    // Cleanup
    return () => {
      hyperliquidService.off('priceUpdate', handlePriceUpdate);
      clearInterval(marketInterval);
    };
  }, []);

  // Enhanced connect account with real-time updates
  const connectAccountEnhanced = async (accountId: number, privateKey: string): Promise<boolean> => {
    const success = await connectAccount(accountId, privateKey);
    
    if (success) {
      // Set up account-specific real-time updates
      const handleOrderFill = (data: any) => {
        console.log('Order filled:', data);
        refreshAccountData(accountId);
      };

      const handlePositionUpdate = (data: any) => {
        console.log('Position updated:', data);
        refreshAccountData(accountId);
      };

      // Listen for account updates
      hyperliquidService.on('orderFilled', handleOrderFill);
      hyperliquidService.on('positionsUpdate', handlePositionUpdate);
    }
    
    return success;
  };

  // Switch active Hyperliquid connection to specific account
  const switchToAccount = async (accountId: number): Promise<boolean> => {
    try {
      const account = state.accounts.find(acc => acc.id === accountId);
      if (!account || !account.privateKey || !account.isConnected) {
        console.error('Account not found or not properly configured:', accountId);
        return false;
      }

      // Check if this account is already the active one in Hyperliquid service
      const currentAddress = hyperliquidService.getWalletAddress();
      if (currentAddress) {
        // If we're already connected to this account, no need to switch
        // Note: This is a simplified check - in a production app you'd want to derive
        // the address from the private key to compare properly
        return true;
      }

      // Connect to the specific account
      const connected = await hyperliquidService.connect(account.privateKey);
      return connected;
    } catch (error) {
      console.error('Failed to switch to account:', accountId, error);
      return false;
    }
  };

  // Multi-account trading functions
  const placeMultiAccountOrder = async (
    masterAccountId: number,
    symbol: string,
    side: 'buy' | 'sell',
    size: number,
    orderType: 'market' | 'limit' = 'market',
    price?: number
  ): Promise<{ success: number; failed: number; results: Array<{accountId: number; success: boolean; error?: string}> }> => {
    const results: Array<{accountId: number; success: boolean; error?: string}> = [];
    let successCount = 0;
    let failedCount = 0;

    // Get master account and all connected subscriber accounts
    const masterAccount = state.accounts.find(acc => acc.id === masterAccountId && acc.isMaster && acc.isConnected);
    const subscriberAccounts = state.accounts.filter(acc => acc.isSubscriber && acc.isConnected && acc.id !== masterAccountId);
    
    if (!masterAccount) {
      throw new Error('Master account not found or not connected');
    }

    const allAccounts = [masterAccount, ...subscriberAccounts];
    console.log(`Executing multi-account ${orderType} order across ${allAccounts.length} accounts`);

    // Execute orders simultaneously across all accounts
    const orderPromises = allAccounts.map(async (account) => {
      try {
        // Switch to this account's connection for the order
        // In a real implementation, you'd need separate service instances per account
        // For now, we'll use the current service but log the account context
        console.log(`Placing ${orderType} order for account ${account.id} (${account.title})`);
        
        if (orderType === 'market') {
          await placeMarketOrder(account.id, symbol, side, size);
        } else if (orderType === 'limit' && price) {
          await placeLimitOrder(account.id, symbol, side, size, price);
        } else {
          throw new Error('Invalid order parameters');
        }
        
        results.push({ accountId: account.id, success: true });
        successCount++;
        
        console.log(`✅ Order placed successfully for account ${account.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ accountId: account.id, success: false, error: errorMessage });
        failedCount++;
        
        console.error(`❌ Order failed for account ${account.id}:`, errorMessage);
      }
    });

    // Wait for all orders to complete
    await Promise.allSettled(orderPromises);

    console.log(`Multi-account order completed: ${successCount} success, ${failedCount} failed`);
    return { success: successCount, failed: failedCount, results };
  };

  // Close all positions across multiple accounts
  const closeAllPositionsMultiAccount = async (): Promise<{ success: number; failed: number }> => {
    const connectedAccounts = state.accounts.filter(acc => acc.isConnected);
    let successCount = 0;
    let failedCount = 0;

    console.log(`Closing all positions across ${connectedAccounts.length} accounts`);

    const closePromises = connectedAccounts.map(async (account) => {
      try {
        await closeAllPositions(account.id);
        successCount++;
        console.log(`✅ Positions closed for account ${account.id}`);
      } catch (error) {
        failedCount++;
        console.error(`❌ Failed to close positions for account ${account.id}:`, error);
      }
    });

    await Promise.allSettled(closePromises);
    return { success: successCount, failed: failedCount };
  };

  // Cancel all orders across multiple accounts
  const cancelAllOrdersMultiAccount = async (): Promise<{ success: number; failed: number }> => {
    const connectedAccounts = state.accounts.filter(acc => acc.isConnected);
    let successCount = 0;
    let failedCount = 0;

    console.log(`Cancelling all orders across ${connectedAccounts.length} accounts`);

    const cancelPromises = connectedAccounts.map(async (account) => {
      try {
        await cancelAllOrders(account.id);
        successCount++;
        console.log(`✅ Orders cancelled for account ${account.id}`);
      } catch (error) {
        failedCount++;
        console.error(`❌ Failed to cancel orders for account ${account.id}:`, error);
      }
    });

    await Promise.allSettled(cancelPromises);
    return { success: successCount, failed: failedCount };
  };

  // Get multi-account portfolio summary
  const getMultiAccountSummary = () => {
    const connectedAccounts = state.accounts.filter(acc => acc.isConnected);
    const masterAccounts = connectedAccounts.filter(acc => acc.isMaster);
    const subscriberAccounts = connectedAccounts.filter(acc => acc.isSubscriber);
    
    const totalBalance = connectedAccounts.reduce((sum, acc) => {
      const balance = parseFloat(acc.balance.replace(/[$,]/g, '')) || 0;
      return sum + balance;
    }, 0);

    const totalPnL = connectedAccounts.reduce((sum, acc) => {
      const pnl = parseFloat(acc.pnl.replace(/[$,+]/g, '')) || 0;
      return sum + pnl;
    }, 0);

    return {
      totalAccounts: connectedAccounts.length,
      masterAccounts: masterAccounts.length,
      subscriberAccounts: subscriberAccounts.length,
      totalBalance,
      totalPnL,
      accounts: connectedAccounts.map(acc => ({
        id: acc.id,
        title: acc.title,
        role: acc.isMaster ? 'Master' : acc.isSubscriber ? 'Subscriber' : 'Independent',
        balance: acc.balance,
        pnl: acc.pnl,
        pair: acc.pair
      }))
    };
  };

  const value = {
    state,
    dispatch,
    connectAccount,
    disconnectAccount,
    placeMarketOrder,
    placeLimitOrder,
    cancelOrder,
    cancelAllOrders,
    closeAllPositions,
    refreshAccountData,
    debugService: () => hyperliquidService,
    debugTest: () => hyperliquidService.debugTest(),
    placeMultiAccountOrder,
    closeAllPositionsMultiAccount,
    cancelAllOrdersMultiAccount,
    getMultiAccountSummary
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
}
