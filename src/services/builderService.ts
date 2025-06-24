// Hyperliquid API URL constant
const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz';

export interface BuilderFeeInfo {
  maxFee: number; // in tenths of basis points
  approved: boolean;
  builderAddress: string;
}

export interface BuilderData {
  totalFeesCollected: number;
  recentTrades: number;
  feeRate: number; // current fee rate in basis points
}

export interface BuilderFeeApproval {
  user: string;
  builder: string;
  maxFee: number;
}

export class BuilderService {
  private static instance: BuilderService;
  private builderAddress: string | null = null;
  private defaultFeeRate: number = 5; // 0.5 basis points (0.005%)

  private constructor() {}

  static getInstance(): BuilderService {
    if (!BuilderService.instance) {
      BuilderService.instance = new BuilderService();
    }
    return BuilderService.instance;
  }

  /**
   * Set the builder address for this application
   * This should be set during app initialization
   */
  setBuilderAddress(address: string): void {
    this.builderAddress = address;
  }

  /**
   * Get the current builder address
   */
  getBuilderAddress(): string | null {
    return this.builderAddress;
  }

  /**
   * Set the default fee rate for builder codes
   * @param feeRate - Fee rate in tenths of basis points (10 = 1 basis point = 0.01%)
   */
  setDefaultFeeRate(feeRate: number): void {
    if (feeRate < 0 || feeRate > 100) { // Max 10 basis points (0.1%)
      throw new Error('Fee rate must be between 0 and 100 (0% to 0.1%)');
    }
    this.defaultFeeRate = feeRate;
  }

  /**
   * Get the default fee rate
   */
  getDefaultFeeRate(): number {
    return this.defaultFeeRate;
  }
  /**
   * Query the maximum approved builder fee for a user
   */
  async getMaxBuilderFee(userAddress: string, builderAddress?: string): Promise<number | null> {
    const address = builderAddress || this.builderAddress;
    
    if (!address) {
      throw new Error('Builder address not set');
    }

    try {
      // Use fetch directly since makeInfoRequest doesn't exist yet
      const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'maxBuilderFee',
          user: userAddress,
          builder: address
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data?.maxBuilderFee || null;
    } catch (error) {
      console.error('Failed to get max builder fee:', error);
      return null;
    }
  }

  /**
   * Get builder referral information including total fees collected
   */
  async getBuilderReferralInfo(builderAddress?: string): Promise<BuilderData | null> {
    const address = builderAddress || this.builderAddress;
    
    if (!address) {
      throw new Error('Builder address not set');
    }

    try {
      // Use fetch directly since makeInfoRequest doesn't exist yet  
      const response = await fetch(`${HYPERLIQUID_API_URL}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'referral',
          user: address
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data) return null;

      return {
        totalFeesCollected: data.totalBuilderFees || 0,
        recentTrades: data.recentTrades || 0,
        feeRate: this.defaultFeeRate / 10 // Convert to basis points
      };
    } catch (error) {
      console.error('Failed to get builder referral info:', error);
      return null;
    }
  }

  /**
   * Create builder parameters for order submission
   * @param feeRate - Optional fee rate override in tenths of basis points
   * @returns Builder parameters object for order submission
   */
  createBuilderParams(feeRate?: number): { b: string; f: number } | null {
    if (!this.builderAddress) {
      console.warn('Builder address not set, skipping builder fee');
      return null;
    }

    const fee = feeRate || this.defaultFeeRate;
    
    return {
      b: this.builderAddress,
      f: fee
    };
  }

  /**
   * Check if builder codes are properly configured
   */
  isConfigured(): boolean {
    return this.builderAddress !== null;
  }

  /**
   * Get builder fee display information
   */
  getFeeDisplayInfo(): { 
    feeRate: string; 
    feePercentage: string; 
    builderAddress: string | null 
  } {
    const basisPoints = this.defaultFeeRate / 10;
    const percentage = basisPoints / 100;
    
    return {
      feeRate: `${this.defaultFeeRate} (${basisPoints} bp)`,
      feePercentage: `${(percentage * 100).toFixed(3)}%`,
      builderAddress: this.builderAddress
    };
  }

  /**
   * Validate builder fee rate for different market types
   */
  validateFeeRate(feeRate: number, marketType: 'perp' | 'spot'): boolean {
    if (marketType === 'perp') {
      // Max 0.1% (10 basis points = 100 tenths of basis points)
      return feeRate <= 100;
    } else if (marketType === 'spot') {
      // Max 1% (100 basis points = 1000 tenths of basis points)
      return feeRate <= 1000;
    }
    return false;
  }

  /**
   * Format fee for display
   */
  formatFee(feeInTenthsOfBp: number): string {
    const basisPoints = feeInTenthsOfBp / 10;
    const percentage = basisPoints / 100;
    return `${(percentage * 100).toFixed(3)}%`;
  }
  /**
   * Get builder trade data URL for a specific date
   */
  getBuilderTradeDataUrl(date: Date, builderAddress?: string): string | null {
    const address = builderAddress || this.builderAddress;
    
    if (!address) {
      return null;
    }

    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    return `https://stats-data.hyperliquid.xyz/Mainnet/builder_fills/${address.toLowerCase()}/${dateStr}.csv.lz4`;
  }
}

// Export singleton instance
export const builderService = BuilderService.getInstance();
