import React from 'react';
import { useHyperliquidPrice } from '../../hooks/useHyperliquidPriceFeed';
import { useTrading } from '../../hooks/useTrading';

interface TradingStatusProps {
  selectedSymbol: string;
}

const TradingStatus: React.FC<TradingStatusProps> = ({ selectedSymbol }) => {
  const { priceData, isConnected } = useHyperliquidPrice(selectedSymbol);
  const { state } = useTrading();
  
  const activeAccount = state.accounts.find(acc => acc.id === state.activeAccount);
  const hasConnectedAccount = activeAccount?.isConnected || false;
  
  // Count orders and positions for current symbol
  const symbolOrders = state.orders[state.activeAccount]?.filter(order => 
    order.symbol === selectedSymbol
  ).length || 0;
  
  const symbolPositions = state.positions[state.activeAccount]?.filter(position => 
    position.symbol === selectedSymbol
  ).length || 0;

  return (
    <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4 mb-4">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span>🎯</span>
        Trading Status - {selectedSymbol}
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {/* Price Feed Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-gray-300">
            {isConnected ? 'Live Feed' : 'Offline'}
          </span>
        </div>
        
        {/* Current Price */}
        <div className="text-gray-300">
          <span className="text-gray-500">Price: </span>
          <span className="text-white font-mono">
            ${priceData?.price.toFixed(2) || '---'}
          </span>
        </div>
        
        {/* Account Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasConnectedAccount ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-gray-300">
            {hasConnectedAccount ? 'Account OK' : 'No Account'}
          </span>
        </div>
        
        {/* Orders & Positions */}
        <div className="text-gray-300">
          <span className="text-gray-500">Orders: </span>
          <span className="text-yellow-400">{symbolOrders}</span>
          <span className="text-gray-500 mx-1">|</span>
          <span className="text-gray-500">Pos: </span>
          <span className="text-blue-400">{symbolPositions}</span>
        </div>
      </div>
      
      {/* Feature Status */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-400">
            <span>✅</span> Click-to-Trade
          </span>
          <span className="flex items-center gap-1 text-green-400">
            <span>✅</span> Live Prices
          </span>
          <span className="flex items-center gap-1 text-green-400">
            <span>✅</span> Order Visualization
          </span>
          <span className="flex items-center gap-1 text-green-400">
            <span>✅</span> Multi-Symbol
          </span>
          <span className="flex items-center gap-1 text-yellow-400">
            <span>🔄</span> WebSocket Feed
          </span>
        </div>
      </div>
    </div>
  );
};

export default TradingStatus;
