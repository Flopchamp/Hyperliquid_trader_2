import { useState, useEffect } from 'react';
import { useTrading } from '../../hooks/useTrading';
import { hyperliquidService } from '../../services/hyperliquid';

interface ButtonWrapperProps {
  orderType?: 'market' | 'limit';
  symbol?: string;
  size?: number;
  price?: number;
  currentPrice?: number;
}

const ButtonWrapper = ({ 
  orderType = 'market', 
  symbol = 'ETH', 
  size = 0.001, 
  price = 0,
  currentPrice = 0
}: ButtonWrapperProps) => {
  const { 
    state, 
    placeMarketOrder, 
    placeLimitOrder, 
    cancelAllOrders, 
    closeAllPositions,
    placeMultiAccountOrder,
    closeAllPositionsMultiAccount,
    cancelAllOrdersMultiAccount,
    getMultiAccountSummary
  } = useTrading();
  const [isExecuting, setIsExecuting] = useState(false);
  const [marketPrice, setMarketPrice] = useState(currentPrice);
  const [multiAccountMode, setMultiAccountMode] = useState(false);
  
  // Update market price from context
  useEffect(() => {
    const symbolData = state.marketData[symbol];
    if (symbolData?.price) {
      setMarketPrice(symbolData.price);
    }
  }, [state.marketData, symbol]);
  
  // Get the currently active/connected account
  const activeAccount = state.accounts.find(acc => acc.isConnected);
  
  // Check if Hyperliquid service is actually connected
  const isHyperliquidConnected = hyperliquidService.isWalletConnected();
  
  // Determine if we can trade (account connected AND hyperliquid service connected)
  const canTrade = activeAccount && isHyperliquidConnected;
  
  // Get multi-account summary
  const multiAccountSummary = getMultiAccountSummary();
  const masterAccount = state.accounts.find(acc => acc.isMaster && acc.isConnected);
  const hasMultipleAccounts = multiAccountSummary.totalAccounts > 1;
  
  // Calculate order type based on price relative to market
  const getOrderStrategy = (side: 'buy' | 'sell', targetPrice?: number): {
    type: 'market' | 'limit',
    strategy: 'above' | 'below' | 'market',
    description: string
  } => {
    if (!targetPrice || targetPrice === 0 || !marketPrice) {
      return { type: 'market', strategy: 'market', description: 'Market Order' };
    }
    
    if (side === 'buy') {
      if (targetPrice > marketPrice) {
        return { type: 'limit', strategy: 'above', description: 'Buy Above Market (Breakout)' };
      } else {
        return { type: 'limit', strategy: 'below', description: 'Buy Below Market (Dip)' };
      }
    } else {
      if (targetPrice < marketPrice) {
        return { type: 'limit', strategy: 'below', description: 'Sell Below Market (Breakdown)' };
      } else {
        return { type: 'limit', strategy: 'above', description: 'Sell Above Market (Rally)' };
      }
    }
  };
  
  const handleLong = async () => {
    if (!activeAccount) {
      alert('Please connect an account first');
      return;
    }
    
    if (!isHyperliquidConnected) {
      alert('Account not connected to Hyperliquid. Please reconnect your account.');
      return;
    }
    
    if (size <= 0) {
      alert('Please enter a valid position size');
      return;
    }
    
    const strategy = getOrderStrategy('buy', price);
    console.log(`Executing Long ${strategy.description}:`, { size, price, marketPrice, strategy });
    
    setIsExecuting(true);
    try {
      // Check if we should use multi-account execution
      if (multiAccountMode && masterAccount && multiAccountSummary.totalAccounts > 1) {
        // Multi-account execution
        const result = await placeMultiAccountOrder(
          masterAccount.id, 
          symbol, 
          'buy', 
          size, 
          orderType === 'market' || strategy.type === 'market' ? 'market' : 'limit',
          price > 0 ? price : undefined
        );
        
        alert(`Multi-account Long executed:\n✅ Success: ${result.success} accounts\n❌ Failed: ${result.failed} accounts`);
        
        if (result.failed > 0) {
          console.error('Failed accounts:', result.results.filter(r => !r.success));
        }
      } else {
        // Single account execution
        if (orderType === 'market' || strategy.type === 'market') {
          await placeMarketOrder(activeAccount.id, symbol, 'buy', size);
          alert(`Long market order placed: ${size} ${symbol} at market`);
        } else {
          if (price <= 0) {
            alert('Please enter a valid price for limit order');
            return;
          }
          await placeLimitOrder(activeAccount.id, symbol, 'buy', size, price);
          alert(`${strategy.description}: ${size} ${symbol} at $${price}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide helpful error messages
      if (message.includes('422')) {
        alert('Order rejected: Likely insufficient balance or invalid parameters. Check your account balance and order size.');
      } else if (message.includes('401')) {
        alert('Authentication failed: Please reconnect your wallet.');
      } else {
        alert('Failed to place long order: ' + message);
      }
      
      console.error('Long order error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleShort = async () => {
    if (!activeAccount) {
      alert('Please connect an account first');
      return;
    }
    
    if (!isHyperliquidConnected) {
      alert('Account not connected to Hyperliquid. Please reconnect your account.');
      return;
    }
    
    if (size <= 0) {
      alert('Please enter a valid position size');
      return;
    }
    
    const strategy = getOrderStrategy('sell', price);
    console.log(`Executing Short ${strategy.description}:`, { size, price, marketPrice, strategy });
    
    setIsExecuting(true);
    try {
      // Check if we should use multi-account execution
      if (multiAccountMode && masterAccount && multiAccountSummary.totalAccounts > 1) {
        // Multi-account execution
        const result = await placeMultiAccountOrder(
          masterAccount.id, 
          symbol, 
          'sell', 
          size, 
          orderType === 'market' || strategy.type === 'market' ? 'market' : 'limit',
          price > 0 ? price : undefined
        );
        
        alert(`Multi-account Short executed:\n✅ Success: ${result.success} accounts\n❌ Failed: ${result.failed} accounts`);
        
        if (result.failed > 0) {
          console.error('Failed accounts:', result.results.filter(r => !r.success));
        }
      } else {
        // Single account execution
        if (orderType === 'market' || strategy.type === 'market') {
          await placeMarketOrder(activeAccount.id, symbol, 'sell', size);
          alert(`Short market order placed: ${size} ${symbol} at market`);
        } else {
          if (price <= 0) {
            alert('Please enter a valid price for limit order');
            return;
          }
          await placeLimitOrder(activeAccount.id, symbol, 'sell', size, price);
          alert(`${strategy.description}: ${size} ${symbol} at $${price}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide helpful error messages
      if (message.includes('422')) {
        alert('Order rejected: Likely insufficient balance or invalid parameters. Check your account balance and order size.');
      } else if (message.includes('401')) {
        alert('Authentication failed: Please reconnect your wallet.');
      } else {
        alert('Failed to place short order: ' + message);
      }
      
      console.error('Short order error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCloseAllPositions = async () => {
    if (!activeAccount) {
      alert('Please connect an account first');
      return;
    }
    
    if (!isHyperliquidConnected) {
      alert('Account not connected to Hyperliquid. Please reconnect your account.');
      return;
    }
    
    // Check if multi-account mode and multiple accounts available
    if (multiAccountMode && multiAccountSummary.totalAccounts > 1) {
      if (!confirm(`Are you sure you want to close all positions across ${multiAccountSummary.totalAccounts} accounts?`)) {
        return;
      }
      
      setIsExecuting(true);
      try {
        const result = await closeAllPositionsMultiAccount();
        alert(`Multi-account position closure:\n✅ Success: ${result.success} accounts\n❌ Failed: ${result.failed} accounts`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        alert('Failed to close positions: ' + message);
      } finally {
        setIsExecuting(false);
      }
    } else {
      // Single account execution
      if (!confirm('Are you sure you want to close all positions?')) {
        return;
      }
      
      setIsExecuting(true);
      try {
        await closeAllPositions(activeAccount.id);
        alert('All positions closed successfully!');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        alert('Failed to close positions: ' + message);
      } finally {
        setIsExecuting(false);
      }
    }
  };

  const handleCancelAllOrders = async () => {
    if (!activeAccount) {
      alert('Please connect an account first');
      return;
    }
    
    if (!isHyperliquidConnected) {
      alert('Account not connected to Hyperliquid. Please reconnect your account.');
      return;
    }
    
    // Check if multi-account mode and multiple accounts available
    if (multiAccountMode && multiAccountSummary.totalAccounts > 1) {
      if (!confirm(`Are you sure you want to cancel all orders across ${multiAccountSummary.totalAccounts} accounts?`)) {
        return;
      }
      
      setIsExecuting(true);
      try {
        const result = await cancelAllOrdersMultiAccount();
        alert(`Multi-account order cancellation:\n✅ Success: ${result.success} accounts\n❌ Failed: ${result.failed} accounts`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        alert('Failed to cancel orders: ' + message);
      } finally {
        setIsExecuting(false);
      }
    } else {
      // Single account execution
      if (!confirm('Are you sure you want to cancel all orders?')) {
        return;
      }
      
      setIsExecuting(true);
      try {
        await cancelAllOrders(activeAccount.id);
        alert('All orders cancelled successfully!');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        alert('Failed to cancel orders: ' + message);
      } finally {
        setIsExecuting(false);
      }
    }
  };

  return (
    <article>
        {/* Market Price Display */}
        {marketPrice > 0 && (
          <div className="bg-gray-800 p-2 rounded mb-3 text-center">
            <span className="text-white text-sm">
              {symbol} Market Price: <span className="text-yellow-400 font-bold">${marketPrice.toFixed(4)}</span>
            </span>
          </div>
        )}
        
        {/* Multi-Account Summary */}
        {hasMultipleAccounts && (
          <div className="bg-blue-900/20 p-3 rounded mb-3 text-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-blue-400 font-semibold">Multi-Account Mode</span>
              <label className="relative cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={multiAccountMode}
                  onChange={(e) => setMultiAccountMode(e.target.checked)}
                  className="cursor-pointer peer appearance-none h-4 w-4 shrink-0 rounded border-2 border-blue-500 bg-transparent checked:bg-blue-500 checked:border-blue-500"
                />
                <svg
                  className="absolute left-0.5 top-0.5 h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-white text-xs">Enable</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2 text-white">
              <div>Total Accounts: <span className="text-blue-400">{multiAccountSummary.totalAccounts}</span></div>
              <div>Master: <span className="text-green-400">{multiAccountSummary.masterAccounts}</span></div>
              <div>Subscribers: <span className="text-purple-400">{multiAccountSummary.subscriberAccounts}</span></div>
              <div>Total Balance: <span className="text-yellow-400">${multiAccountSummary.totalBalance.toFixed(2)}</span></div>
            </div>
            {multiAccountMode && masterAccount && (
              <div className="mt-2 p-2 bg-green-900/30 rounded text-green-300 text-xs">
                ✓ Master Account: {masterAccount.title} {masterAccount.id} will execute trades across all subscriber accounts
              </div>
            )}
            {multiAccountMode && !masterAccount && (
              <div className="mt-2 p-2 bg-red-900/30 rounded text-red-300 text-xs">
                ⚠️ No master account configured. Please set one account as master in Account Management.
              </div>
            )}
          </div>
        )}
        
        {/* Strategy Display */}
        {orderType === 'limit' && price > 0 && marketPrice > 0 && (
          <div className="bg-blue-900/30 p-2 rounded mb-3 text-center text-xs">
            <div className="text-white">
              Long: <span className="text-green-400">{getOrderStrategy('buy', price).description}</span>
            </div>
            <div className="text-white">
              Short: <span className="text-red-400">{getOrderStrategy('sell', price).description}</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col items-center justify-center gap-5">
            <div className="flex gap-5 w-full">
                <button 
                  onClick={handleLong}
                  disabled={isExecuting || !canTrade || (multiAccountMode && !masterAccount)}
                  className={`long !w-full transition-all duration-200 ${
                    isExecuting || !canTrade || (multiAccountMode && !masterAccount)
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-green-600 hover:scale-105'
                  }`}
                >
                  {isExecuting ? 'EXECUTING...' 
                    : !canTrade ? 'CONNECT TO HYPERLIQUID'
                    : multiAccountMode && hasMultipleAccounts ? 'LONG (MULTI)' : 'LONG'}
                </button>
                <button 
                  onClick={handleShort}
                  disabled={isExecuting || !canTrade || (multiAccountMode && !masterAccount)}
                  className={`short !w-full transition-all duration-200 ${
                    isExecuting || !canTrade || (multiAccountMode && !masterAccount)
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-red-600 hover:scale-105'
                  }`}
                >
                  {isExecuting ? 'EXECUTING...' 
                    : !canTrade ? 'CONNECT TO HYPERLIQUID'
                    : multiAccountMode && hasMultipleAccounts ? 'SHORT (MULTI)' : 'SHORT'}
                </button>
            </div>
            
            <div className="flex flex-col w-full items-center justify-center gap-3">
                <button 
                  onClick={handleCloseAllPositions}
                  disabled={isExecuting || !canTrade}
                  className={`positions transition-all duration-200 ${
                    isExecuting || !canTrade 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-orange-600'
                  }`}
                >
                  {isExecuting ? 'Executing...' 
                    : !canTrade ? 'Connect to Hyperliquid'
                    : multiAccountMode && hasMultipleAccounts ? 'Close All Positions (Multi)' : 'Close All Positions'}
                </button>
                <button 
                  onClick={handleCancelAllOrders}
                  disabled={isExecuting || !canTrade}
                  className={`orders transition-all duration-200 ${
                    isExecuting || !canTrade 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-600'
                  }`}
                >
                  {isExecuting ? 'Executing...' 
                    : !canTrade ? 'Connect to Hyperliquid'
                    : multiAccountMode && hasMultipleAccounts ? 'Cancel All Orders (Multi)' : 'Cancel All Orders'}
                </button>
            </div>
        </div>
    </article>
  )
}

export default ButtonWrapper