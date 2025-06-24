// Hyperliquid Symbol Management
// This service fetches and manages the official Hyperliquid trading symbols

interface HyperliquidAsset {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated: boolean;
}

interface HyperliquidMeta {
  universe: HyperliquidAsset[];
}

class HyperliquidSymbolService {
  private symbols: HyperliquidAsset[] = [];
  private symbolsLoaded = false;
  private symbolMapping = new Map<string, number>();

  // Default symbols (fallback if API fails)
  private defaultSymbols = [
    'BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'LINK', 'UNI', 'AAVE', 
    'ADA', 'DOT', 'ATOM', 'NEAR', 'FTM', 'ALGO', 'XRP', 'LTC',
    'BCH', 'ETC', 'DOGE', 'SHIB', 'APE', 'CRV', 'COMP', 'MKR',
    'SNX', 'YFI', 'SUSHI', '1INCH', 'ENJ', 'BAT', 'ZRX', 'GRT'
  ];

  // Fetch official symbols from Hyperliquid API
  async fetchOfficialSymbols(): Promise<HyperliquidAsset[]> {
    try {
      const response = await fetch('https://api.hyperliquid.xyz/info', {
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

      const meta: HyperliquidMeta = await response.json();
      
      if (meta.universe && Array.isArray(meta.universe)) {
        this.symbols = meta.universe;
        this.symbolsLoaded = true;
        
        // Build symbol mapping
        this.symbolMapping.clear();
        meta.universe.forEach((asset, index) => {
          this.symbolMapping.set(asset.name, index);
        });
        
        console.log(`✅ Loaded ${this.symbols.length} official Hyperliquid symbols`);
        return this.symbols;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.warn('Failed to fetch official symbols, using defaults:', error);      this.symbols = this.defaultSymbols.map((name) => ({
        name,
        szDecimals: 4,
        maxLeverage: 20,
        onlyIsolated: false
      }));
      this.symbolsLoaded = true;
      return this.symbols;
    }
  }

  // Get all available symbols
  async getSymbols(): Promise<string[]> {
    if (!this.symbolsLoaded) {
      await this.fetchOfficialSymbols();
    }
    return this.symbols.map(asset => asset.name);
  }

  // Get symbol details
  async getSymbolDetails(symbol: string): Promise<HyperliquidAsset | null> {
    if (!this.symbolsLoaded) {
      await this.fetchOfficialSymbols();
    }
    return this.symbols.find(asset => asset.name === symbol) || null;
  }

  // Get symbol ID for trading
  getSymbolId(symbol: string): number {
    return this.symbolMapping.get(symbol) ?? 0;
  }

  // Check if symbol is supported
  async isSymbolSupported(symbol: string): Promise<boolean> {
    const symbols = await this.getSymbols();
    return symbols.includes(symbol);
  }

  // Get popular trading pairs (first 20)
  async getPopularSymbols(): Promise<string[]> {
    const allSymbols = await this.getSymbols();
    // Return first 20 symbols (usually the most popular)
    return allSymbols.slice(0, 20);
  }

  // Convert Hyperliquid symbol to TradingView format
  getTradeViewSymbol(hyperliquidSymbol: string): string {
    const symbolMap: { [key: string]: string } = {
      'BTC': 'BINANCE:BTCUSDT',
      'ETH': 'BINANCE:ETHUSDT',
      'SOL': 'BINANCE:SOLUSDT',
      'AVAX': 'BINANCE:AVAXUSDT',
      'MATIC': 'BINANCE:MATICUSDT',
      'LINK': 'BINANCE:LINKUSDT',
      'UNI': 'BINANCE:UNIUSDT',
      'AAVE': 'BINANCE:AAVEUSDT',
      'ADA': 'BINANCE:ADAUSDT',
      'DOT': 'BINANCE:DOTUSDT',
      'ATOM': 'BINANCE:ATOMUSDT',
      'NEAR': 'BINANCE:NEARUSDT',
      'FTM': 'BINANCE:FTMUSDT',
      'ALGO': 'BINANCE:ALGOUSDT',
      'XRP': 'BINANCE:XRPUSDT',
      'LTC': 'BINANCE:LTCUSDT',
      'BCH': 'BINANCE:BCHUSDT',
      'ETC': 'BINANCE:ETCUSDT',
      'DOGE': 'BINANCE:DOGEUSDT',
      'SHIB': 'BINANCE:SHIBUSDT',
      'APE': 'BINANCE:APEUSDT',
      'CRV': 'BINANCE:CRVUSDT',
      'COMP': 'BINANCE:COMPUSDT',
      'MKR': 'BINANCE:MKRUSDT',
      'SNX': 'BINANCE:SNXUSDT',
      'YFI': 'BINANCE:YFIUSDT',
      'SUSHI': 'BINANCE:SUSHIUSDT',
      '1INCH': 'BINANCE:1INCHUSDT',
      'ENJ': 'BINANCE:ENJUSDT',
      'BAT': 'BINANCE:BATUSDT',
      'ZRX': 'BINANCE:ZRXUSDT',
      'GRT': 'BINANCE:GRTUSDT'
    };
    
    return symbolMap[hyperliquidSymbol] || `BINANCE:${hyperliquidSymbol}USDT`;
  }

  // Get maximum leverage for symbol
  async getMaxLeverage(symbol: string): Promise<number> {
    const details = await this.getSymbolDetails(symbol);
    return details?.maxLeverage || 20;
  }
}

// Export singleton instance
export const hyperliquidSymbolService = new HyperliquidSymbolService();

// Export types
export type { HyperliquidAsset };
