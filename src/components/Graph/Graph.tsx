import { useState } from "react";
import TradingView from "../TradingView/TradingView";
import MidUp from "./MidUp";
import { useTrading } from "../../hooks/useTrading";

interface Prop {
  sidebar: boolean;
  selectedSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

const Graph = ({ sidebar, selectedSymbol: propSelectedSymbol, onSymbolChange }: Prop) => {
  const [localSelectedSymbol, setLocalSelectedSymbol] = useState<string>('BTC');
  
  // Use prop symbol if provided, otherwise use local state
  const selectedSymbol = propSelectedSymbol || localSelectedSymbol;
  const { state } = useTrading();
  const { accounts, activeAccount } = state;

  const handleChartClick = async (price: number, timestamp: number) => {
    console.log('Chart clicked at price:', price, 'timestamp:', timestamp);
    
    // Get active account
    const account = accounts.find(acc => acc.id === activeAccount);
    if (!account || !account.isConnected) {
      alert('Please connect an account first');
      return;
    }

    // Show click-to-trade dialog
    const confirmed = window.confirm(
      `Place order at $${price.toFixed(2)}?\n\n` +
      `Symbol: ${selectedSymbol}\n` +
      `Price: $${price.toFixed(2)}\n` +
      `Account: ${account.title}\n\n` +
      `Click OK to open trading controls with this price.`
    );

    if (confirmed) {
      // Here you could emit an event to pre-fill trading controls
      console.log(`Setting trading price to $${price.toFixed(2)} for ${selectedSymbol}`);
      
      // You could dispatch an action to set the price in trading context
      // dispatch({ type: 'SET_TRADING_PRICE', payload: { symbol: selectedSymbol, price } });
      
      // Or scroll to trading controls
      const tradingControls = document.querySelector('[data-trading-controls]');
      if (tradingControls) {
        tradingControls.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleSymbolChange = (symbol: string) => {
    if (onSymbolChange) {
      onSymbolChange(symbol);
    } else {
      setLocalSelectedSymbol(symbol);
    }
  };

  // Calculate height based on sidebar state
  const chartHeight = sidebar ? 400 : 500;

  // Get current orders and positions for the selected symbol
  const currentOrders = state.orders[activeAccount]?.filter(order => 
    order.symbol === selectedSymbol
  ) || [];
  
  const currentPositions = state.positions[activeAccount]?.filter(position => 
    position.symbol === selectedSymbol
  ) || [];

  // Map to chart format
  const chartOrders = currentOrders.map(order => ({
    id: order.id,
    symbol: order.symbol,
    side: order.side,
    price: order.price || 0,
    size: order.amount,
    type: order.type
  }));

  const chartPositions = currentPositions.map(position => ({
    symbol: position.symbol,
    side: position.side,
    entryPrice: position.entryPrice,
    size: position.size,
    pnl: position.pnl
  }));

  return (
    <>
      <MidUp 
        selectedSymbol={selectedSymbol}
        onSymbolChange={handleSymbolChange}
      />
      <article className="p-3">
        <div className="bg-[#0a0e13] rounded-lg border border-gray-800 overflow-hidden">
          <TradingView 
            symbol={selectedSymbol}
            interval="15"
            theme="dark"
            height={chartHeight}
            onChartClick={handleChartClick}
            openOrders={chartOrders}
            positions={chartPositions}
            showOrderLines={true}
          />
        </div>
      </article>
    </>
  )
}

export default Graph