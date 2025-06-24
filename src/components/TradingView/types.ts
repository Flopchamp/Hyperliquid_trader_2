// TradingView Widget types
export interface TradingViewWidget {
  onChartReady: (callback: () => void) => void;
  chart: () => TradingViewChart;
  remove: () => void;
}

export interface TradingViewChart {
  setSymbol: (symbol: string) => void;
  onDataLoaded: () => { subscribe: (a: null, callback: () => void) => void };
}

// Global TradingView interface
declare global {
  interface Window {
    TradingView: {
      widget: new (config: Record<string, unknown>) => TradingViewWidget;
    };
  }
}

export interface ChartOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  type: 'limit' | 'market';
}

export interface ChartPosition {
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  size: number;
  pnl: number;
}

export interface TradingViewProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: number;
  onChartClick?: (price: number, timestamp: number) => void;
  openOrders?: ChartOrder[];
  positions?: ChartPosition[];
  showOrderLines?: boolean;
}
