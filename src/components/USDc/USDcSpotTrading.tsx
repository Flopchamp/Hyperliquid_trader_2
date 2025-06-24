import React, { useState, useEffect } from 'react';
import { USDcService, type SpotAsset, type SpotMarket, type SpotOrderResult } from '../../services/usdcService';
import { hyperliquidService } from '../../services/hyperliquid';

interface USDcSpotTradingProps {
  onOrderPlaced?: (result: SpotOrderResult) => void;
}

const USDcSpotTrading: React.FC<USDcSpotTradingProps> = ({ onOrderPlaced }) => {
  const [spotAssets, setSpotAssets] = useState<SpotAsset[]>([]);
  const [spotMarkets, setSpotMarkets] = useState<SpotMarket[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('PURR');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit');
  const [loading, setLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usdcService] = useState(() => new USDcService(hyperliquidService));
  useEffect(() => {
    loadSpotAssets();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSpotAssets = async () => {
    try {
      setAssetsLoading(true);
      const { assets, markets } = await usdcService.fetchSpotAssets();
      setSpotAssets(assets);
      setSpotMarkets(markets);
      
      // Find USDC markets
      const usdcMarkets = markets.filter(market => 
        market.name.includes('USDC') || market.isCanonical
      );
      
      console.log(`📊 Loaded ${assets.length} spot assets, ${usdcMarkets.length} USDc markets`);
    } catch (err) {
      setError('Failed to load spot assets');
      console.error('Error loading spot assets:', err);
    } finally {
      setAssetsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!hyperliquidService.isWalletConnected()) {
      setError('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      setError('Please enter a valid price for limit orders');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderPrice = orderType === 'limit' ? parseFloat(price) : undefined;
      const result = await usdcService.placeSpotOrder(
        selectedAsset,
        side,
        parseFloat(amount),
        orderPrice
      );

      if (result.success) {
        console.log('✅ Spot order placed successfully:', result);
        
        // Reset form
        setAmount('');
        setPrice('');
        
        if (onOrderPlaced) {
          onOrderPlaced(result);
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
      console.error('Error placing spot order:', err);
    } finally {
      setLoading(false);
    }
  };
  const calculateEstimatedCost = () => {
    if (!amount || !price) return 0;
    return usdcService.calculateTradingCost(parseFloat(amount), parseFloat(price || '0'));
  };

  const getAvailableAssets = () => {
    // Filter assets that have USDc pairs
    return spotAssets.filter(asset => 
      asset.name !== 'USDC' && 
      spotMarkets.some(market => 
        market.name.includes(asset.name) && market.name.includes('USDC')
      )
    );
  };

  if (!hyperliquidService.isWalletConnected()) {
    return (
      <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#373A45]">
        <div className="text-center text-[rgba(255,255,255,0.50)]">
          🔗 Connect wallet to access USDc spot trading
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#373A45]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">USDc Spot Trading</h3>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">$</span>
          </div>
          <span className="text-[rgba(255,255,255,0.70)] text-sm">USDC Pairs</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded p-3 mb-4">
          <div className="text-red-400 text-sm">⚠️ {error}</div>
        </div>
      )}

      {assetsLoading ? (
        <div className="space-y-3">
          <div className="animate-pulse">
            <div className="h-10 bg-[#373A45] rounded mb-3"></div>
            <div className="h-10 bg-[#373A45] rounded mb-3"></div>
            <div className="h-10 bg-[#373A45] rounded"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Asset Selection */}
          <div>
            <label className="text-[rgba(255,255,255,0.70)] text-sm mb-2 block">Trading Pair</label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#373A45] rounded p-3 text-white"
            >
              {getAvailableAssets().map(asset => (
                <option key={asset.name} value={asset.name}>
                  {asset.name}/USDC
                </option>
              ))}
            </select>
          </div>

          {/* Side Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setSide('buy')}
              className={`flex-1 py-2 px-4 rounded ${
                side === 'buy' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-[#373A45] text-[rgba(255,255,255,0.70)]'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`flex-1 py-2 px-4 rounded ${
                side === 'sell' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-[#373A45] text-[rgba(255,255,255,0.70)]'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order Type */}
          <div className="flex gap-2">
            <button
              onClick={() => setOrderType('market')}
              className={`flex-1 py-2 px-4 rounded text-sm ${
                orderType === 'market' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[#373A45] text-[rgba(255,255,255,0.70)]'
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType('limit')}
              className={`flex-1 py-2 px-4 rounded text-sm ${
                orderType === 'limit' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-[#373A45] text-[rgba(255,255,255,0.70)]'
              }`}
            >
              Limit
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-[rgba(255,255,255,0.70)] text-sm mb-2 block">
              Amount ({selectedAsset})
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full bg-[#1a1a1a] border border-[#373A45] rounded p-3 text-white placeholder-[rgba(255,255,255,0.50)]"
            />
          </div>

          {/* Price Input (for limit orders) */}
          {orderType === 'limit' && (
            <div>
              <label className="text-[rgba(255,255,255,0.70)] text-sm mb-2 block">
                Price (USDc)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                className="w-full bg-[#1a1a1a] border border-[#373A45] rounded p-3 text-white placeholder-[rgba(255,255,255,0.50)]"
              />
            </div>
          )}

          {/* Order Summary */}
          {amount && (orderType === 'market' || price) && (
            <div className="bg-[#1a1a1a] p-3 rounded border border-[#373A45]">
              <div className="text-[rgba(255,255,255,0.70)] text-sm mb-2">Order Summary</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[rgba(255,255,255,0.70)]">Side:</span>
                  <span className={side === 'buy' ? 'text-green-400' : 'text-red-400'}>
                    {side.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[rgba(255,255,255,0.70)]">Amount:</span>
                  <span className="text-white">{amount} {selectedAsset}</span>
                </div>
                {orderType === 'limit' && (
                  <div className="flex justify-between">
                    <span className="text-[rgba(255,255,255,0.70)]">Price:</span>
                    <span className="text-white">{price} USDc</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[rgba(255,255,255,0.70)]">Est. Fee:</span>
                  <span className="text-orange-400">
                    {usdcService.formatUSDc(calculateEstimatedCost())}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={loading || !amount || (orderType === 'limit' && !price)}
            className={`w-full py-3 px-4 rounded font-medium transition-colors ${
              loading || !amount || (orderType === 'limit' && !price)
                ? 'bg-[#373A45] text-[rgba(255,255,255,0.50)] cursor-not-allowed'
                : side === 'buy'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Placing Order...
              </div>
            ) : (
              `${side === 'buy' ? 'Buy' : 'Sell'} ${selectedAsset}`
            )}
          </button>

          {/* Notice */}
          <div className="text-[rgba(255,255,255,0.50)] text-xs text-center">
            🚧 Spot trading implementation is under development
          </div>
        </div>
      )}
    </div>
  );
};

export default USDcSpotTrading;
