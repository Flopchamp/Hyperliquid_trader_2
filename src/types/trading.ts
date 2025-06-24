export interface Account {
  id: number;
  title: string;
  status: 'ACTIVE' | 'INACTIVE';
  pair: string;
  leverage: string;
  balance: string;
  pnl: string;
  publicKey?: string;
  privateKey?: string;
  isConnected: boolean;
  isMaster?: boolean;
  isSubscriber?: boolean;
}

export interface TradingSettings {
  leverage: number;
  positionSize: number;
  stopLoss?: number;
  takeProfits: TakeProfit[];
  orderType: 'Market' | 'Limit';
  direction: 'Long' | 'Short';
  marginType: 'Isolated' | 'Cross';
  splitOrders?: SplitOrderSettings;
}

export interface TakeProfit {
  id: number;
  percentage: number;
  size: number;
  isEnabled: boolean;
  isHit?: boolean;
}

export interface SplitOrderSettings {
  enabled: boolean;
  minPrice: number;
  maxPrice: number;
  splits: number;
  scale: 'Lower' | 'Mid point' | 'Upper';
}

export interface Order {
  id: string;
  accountId: number;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  amount: number;
  price?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  timestamp: number;
  isTP?: boolean;
  isSL?: boolean;
  tpLevel?: number;
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  percentage: number;
  leverage: number;
  marginType: 'isolated' | 'cross';
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export interface TradingState {
  accounts: Account[];
  activeAccount: number;
  positions: Record<number, Position[]>;
  orders: Record<number, Order[]>;
  marketData: Record<string, MarketData>;
  isTrading: boolean;
  connectionStatus: Record<number, 'connected' | 'disconnected' | 'error'>;
}
