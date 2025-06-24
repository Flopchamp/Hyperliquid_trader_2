import React, { useState, useEffect } from 'react';
import { USDcService, type USDcBalance } from '../../services/usdcService';
import { hyperliquidService } from '../../services/hyperliquid';

interface USDcBalanceDisplayProps {
  refreshTrigger?: number;
  onBalanceUpdate?: (balance: USDcBalance) => void;
}

const USDcBalanceDisplay: React.FC<USDcBalanceDisplayProps> = ({ 
  refreshTrigger, 
  onBalanceUpdate 
}) => {
  const [balance, setBalance] = useState<USDcBalance>({
    total: 0,
    available: 0,
    reserved: 0,
    equity: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usdcService] = useState(() => new USDcService(hyperliquidService));

  const fetchBalance = async () => {
    if (!hyperliquidService.isWalletConnected()) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newBalance = await usdcService.getUSDcBalance();
      setBalance(newBalance);
      
      if (onBalanceUpdate) {
        onBalanceUpdate(newBalance);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      console.error('Error fetching USDc balance:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchBalance();
  }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatUSDc = (amount: number) => usdcService.formatUSDc(amount);

  if (!hyperliquidService.isWalletConnected()) {
    return (
      <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#373A45]">
        <div className="text-center text-[rgba(255,255,255,0.50)]">
          🔗 Connect wallet to view USDc balance
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#373A45]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">$</span>
          </div>
          <h3 className="text-white font-medium">USDc Balance</h3>
        </div>
        <button 
          onClick={fetchBalance}
          disabled={loading}
          className="text-[rgba(255,255,255,0.70)] hover:text-white transition-colors p-1"
          title="Refresh balance"
        >
          <svg 
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded p-3 mb-4">
          <div className="text-red-400 text-sm">⚠️ {error}</div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="animate-pulse">
            <div className="h-8 bg-[#373A45] rounded mb-2"></div>
            <div className="h-4 bg-[#373A45] rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-[#373A45] rounded w-1/2"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Total Balance */}
          <div className="bg-[#1a1a1a] p-3 rounded border border-[#373A45]">
            <div className="text-[rgba(255,255,255,0.70)] text-sm mb-1">Total Balance</div>
            <div className="text-white text-xl font-bold">{formatUSDc(balance.total)}</div>
          </div>

          {/* Available & Reserved */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1a1a1a] p-3 rounded border border-[#373A45]">
              <div className="text-[rgba(255,255,255,0.70)] text-xs mb-1">Available</div>
              <div className="text-green-400 font-medium">{formatUSDc(balance.available)}</div>
            </div>
            <div className="bg-[#1a1a1a] p-3 rounded border border-[#373A45]">
              <div className="text-[rgba(255,255,255,0.70)] text-xs mb-1">In Positions</div>
              <div className="text-orange-400 font-medium">{formatUSDc(balance.reserved)}</div>
            </div>
          </div>

          {/* Equity */}
          <div className="bg-[#1a1a1a] p-3 rounded border border-[#373A45]">
            <div className="text-[rgba(255,255,255,0.70)] text-xs mb-1">Total Equity</div>
            <div className="text-blue-400 font-medium">{formatUSDc(balance.equity)}</div>
          </div>

          {/* USDc Info */}
          <div className="text-[rgba(255,255,255,0.50)] text-xs text-center pt-2 border-t border-[#373A45]">
            💰 All balances are backed 1:1 by USDC on Hyperliquid
          </div>
        </div>
      )}
    </div>
  );
};

export default USDcBalanceDisplay;
