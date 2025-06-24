// USDc Service - Enhanced USDc integration for Hyperliquid
// This service handles USDc-specific functionality and spot trading

import type { HyperliquidService } from './hyperliquid';

interface USDcBalance {
  total: number;
  available: number;
  reserved: number;
  equity: number;
}

interface SpotAsset {
  name: string;
  szDecimals: number;
  weiDecimals: number;
  index: number;
  tokenId: string;
  isCanonical: boolean;
}

interface SpotMarket {
  tokens: SpotAsset[];
  name: string;
  index: number;
  isCanonical: boolean;
}

interface SpotOrderResult {
  success: boolean;
  orderId?: string;
  message: string;
}

class USDcService {
  private hyperliquidService: HyperliquidService;
  private spotAssets: SpotAsset[] = [];
  private spotMarkets: SpotMarket[] = [];
  private spotAssetsLoaded = false;

  constructor(hyperliquidService: HyperliquidService) {
    this.hyperliquidService = hyperliquidService;
  }

  // Fetch spot assets and markets
  async fetchSpotAssets(): Promise<{ assets: SpotAsset[], markets: SpotMarket[] }> {
    try {
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'spotMeta'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const spotData = await response.json();
      
      this.spotAssets = spotData.tokens || [];
      this.spotMarkets = spotData.universe || [];
      this.spotAssetsLoaded = true;

      console.log(`✅ Loaded ${this.spotAssets.length} spot assets and ${this.spotMarkets.length} markets`);
      
      return {
        assets: this.spotAssets,
        markets: this.spotMarkets
      };
    } catch (error) {
      console.warn('Failed to fetch spot assets:', error);
      return { assets: [], markets: [] };
    }
  }

  // Get USDc balance (enhanced from regular account balance)
  async getUSDcBalance(): Promise<USDcBalance> {
    try {
      const accountInfo = await this.hyperliquidService.getAccountInfo();
      
      if (!accountInfo.marginSummary) {
        return { total: 0, available: 0, reserved: 0, equity: 0 };
      }

      const total = parseFloat(accountInfo.marginSummary.accountValue || '0');
      const equity = parseFloat(accountInfo.marginSummary.totalRawUsd || '0');
      const marginUsed = parseFloat(accountInfo.crossMarginUsed || '0');
      const available = total - marginUsed;

      return {
        total,
        available: Math.max(available, 0),
        reserved: marginUsed,
        equity
      };
    } catch (error) {
      console.error('Error fetching USDc balance:', error);
      return { total: 0, available: 0, reserved: 0, equity: 0 };
    }
  }

  // Get spot markets with USDc pairs
  async getUSDcSpotMarkets(): Promise<SpotMarket[]> {
    if (!this.spotAssetsLoaded) {
      await this.fetchSpotAssets();
    }

    // Filter for markets that include USDC
    return this.spotMarkets.filter(market => 
      market.name.includes('USDC') || market.isCanonical
    );
  }

  // Get all available spot assets
  async getSpotAssets(): Promise<SpotAsset[]> {
    if (!this.spotAssetsLoaded) {
      await this.fetchSpotAssets();
    }
    return this.spotAssets;
  }

  // Check if an asset is available for spot trading
  async isSpotAssetAvailable(symbol: string): Promise<boolean> {
    if (!this.spotAssetsLoaded) {
      await this.fetchSpotAssets();
    }
    return this.spotAssets.some(asset => asset.name === symbol);
  }

  // Get USDc asset details
  getUSDcAsset(): SpotAsset | null {
    return this.spotAssets.find(asset => 
      asset.name === 'USDC' && asset.isCanonical
    ) || null;
  }
  // Place spot order with USDc
  async placeSpotOrder(
    baseAsset: string,
    side: 'buy' | 'sell',
    amount: number,
    price?: number
  ): Promise<SpotOrderResult> {
    // This would integrate with Hyperliquid's spot trading API
    // For now, we'll prepare the structure
    
    const usdcAsset = this.getUSDcAsset();
    if (!usdcAsset) {
      return {
        success: false,
        message: 'USDC asset not available for spot trading'
      };
    }

    const targetAsset = this.spotAssets.find(asset => asset.name === baseAsset);
    if (!targetAsset) {
      return {
        success: false,
        message: `${baseAsset} not available for spot trading`
      };
    }

    // Find the market for this pair
    const market = this.spotMarkets.find(market => 
      market.name === `${baseAsset}/USDC` || 
      market.tokens.some(token => token.name === baseAsset)
    );

    if (!market) {
      return {
        success: false,
        message: `No USDC market found for ${baseAsset}`
      };
    }

    console.log(`🔄 Placing spot order: ${side} ${amount} ${baseAsset} on market ${market.name}`);
    
    // Use price if provided for limit orders
    if (price) {
      console.log(`📊 Limit order at price: $${price}`);
    }
    
    // This would call the actual Hyperliquid spot trading API
    // Implementation would depend on their spot trading endpoints
    return {
      success: false,
      message: 'Spot trading implementation pending - API endpoint confirmation needed'
    };
  }

  // Format USDc amount for display
  formatUSDc(amount: number, decimals: number = 2): string {
    return `$${amount.toFixed(decimals)} USDc`;
  }

  // Get USDc price (always 1.00 but useful for consistency)
  getUSDcPrice(): number {
    return 1.00;
  }

  // Check if connected wallet can trade with USDc
  async canTradeUSDc(): Promise<boolean> {
    return this.hyperliquidService.isWalletConnected();
  }

  // Get USDc trading fees
  getUSDcTradingFees(): { maker: number; taker: number } {
    // Hyperliquid's standard fees
    return {
      maker: 0.0002, // 0.02%
      taker: 0.0005  // 0.05%
    };
  }

  // Estimate USDc trading cost
  calculateTradingCost(amount: number, price: number, isMaker: boolean = false): number {
    const fees = this.getUSDcTradingFees();
    const feeRate = isMaker ? fees.maker : fees.taker;
    const notionalValue = amount * price;
    return notionalValue * feeRate;
  }
}

// Export for use in the main application
export { USDcService };
export type { USDcBalance, SpotAsset, SpotMarket, SpotOrderResult };
