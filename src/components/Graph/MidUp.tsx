import { useState, useEffect } from "react";
import { useHyperliquidPrice } from "../../hooks/useHyperliquidPriceFeed";
import { hyperliquidSymbolService } from "../../services/hyperliquidSymbols";

interface MidUpProps {
  selectedSymbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

const MidUp = ({ selectedSymbol = 'BTC', onSymbolChange }: MidUpProps) => {
  const [symbols, setSymbols] = useState([
    'BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'LINK', 'UNI', 'AAVE'
  ]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);
  
  // Load official Hyperliquid symbols
  useEffect(() => {
    const loadOfficialSymbols = async () => {
      setIsLoadingSymbols(true);
      try {
        const popularSymbols = await hyperliquidSymbolService.getPopularSymbols();
        setSymbols(popularSymbols);
        console.log('✅ Loaded official Hyperliquid symbols:', popularSymbols);
      } catch (error) {
        console.warn('Failed to load official symbols, using defaults:', error);
      } finally {
        setIsLoadingSymbols(false);
      }
    };

    loadOfficialSymbols();
  }, []);
  
  // Use real Hyperliquid price data
  const { priceData, isConnected } = useHyperliquidPrice(selectedSymbol);
  
  // Fallback to mock data if no real data
  const currentPrice = priceData?.price || 43251.47;
  const priceChange = priceData?.change24h || 2.34;
  const high24h = priceData?.high24h || currentPrice * 1.05;
  const low24h = priceData?.low24h || currentPrice * 0.95;
  const volume24h = priceData?.volume24h || 1200000000;

  const handleSymbolSelect = (symbol: string) => {
    if (onSymbolChange) {
      onSymbolChange(symbol);
    }
    setIsDropdownOpen(false);
  };

  return (
      <nav className="roboto flex justify-between items-center gap-2.5 p-5 bg-[#1E2329] border border-[#292E35]">
          <div className="flex items-center gap-4">
            {/* Symbol Selector */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded border border-gray-600 transition-colors"
              >
                <span className="text-white font-medium">{selectedSymbol}-USD</span>
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-[#2a2a2a] border border-gray-600 rounded shadow-lg z-50 min-w-[120px]">
                  {isLoadingSymbols ? (
                    <div className="px-3 py-2 text-gray-400 text-center">
                      <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full mx-auto"></div>
                      <span className="text-xs mt-1 block">Loading symbols...</span>
                    </div>
                  ) : (
                    symbols.map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => handleSymbolSelect(symbol)}
                        className={`w-full text-left px-3 py-2 hover:bg-[#3a3a3a] transition-colors ${
                          symbol === selectedSymbol ? 'bg-[#F0B90B] text-black' : 'text-white'
                        }`}
                      >
                        {symbol}-USD
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Price Display */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h1>
              <span className={`text-sm font-medium px-2 py-1 rounded ${
                priceChange >= 0 
                  ? 'text-green-400 bg-green-400/10' 
                  : 'text-red-400 bg-red-400/10'
              }`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Market Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-400">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs">{isConnected ? 'Live Data' : 'Offline'}</span>
            </div>
            
            <div>
              <span className="text-gray-500">24h High: </span>
              <span className="text-white">${high24h.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">24h Low: </span>
              <span className="text-white">${low24h.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">Volume: </span>
              <span className="text-white">{(volume24h / 1000000000).toFixed(1)}B</span>
            </div>
          </div>
      </nav>
  )
}

export default MidUp