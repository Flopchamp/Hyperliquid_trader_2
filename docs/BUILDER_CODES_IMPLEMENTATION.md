# Hyperliquid Builder Codes Implementation

## 🏗️ Overview
This implementation adds Hyperliquid Builder Codes support to the trading application, enabling the app to earn revenue from trades executed through it.

## 💰 Revenue Model
- **Perpetual Trades**: Up to 0.1% fee (10 basis points)
- **Spot Trades**: Up to 1% fee (100 basis points)
- **Fee Structure**: Charged in tenths of basis points (10 = 1 basis point = 0.01%)
- **Default Fee**: 0.5 basis points (0.005%) on all trades

## 🔧 Technical Implementation

### 1. Builder Service (`src/services/builderService.ts`)
- **Singleton Pattern**: Centralized builder configuration management
- **API Integration**: Direct calls to Hyperliquid's builder endpoints
- **Fee Management**: Configurable fee rates with validation
- **Data Fetching**: Builder referral stats and fee collection data

### 2. Builder Settings Component (`src/components/Builder/BuilderSettings.tsx`)
- **Configuration UI**: Setup builder address and fee rates
- **Real-time Data**: Display total fees collected and current settings
- **User-friendly**: Clear setup flow and status indicators
- **Integrated**: Added to the main trading controls panel

### 3. Order Integration (`src/services/hyperliquid.ts`)
- **Automatic Addition**: Builder parameters added to all orders
- **Market Orders**: Builder fees applied to market executions
- **Limit Orders**: Builder fees applied to limit executions
- **Transparent**: No impact on existing order logic

## 🎯 Key Features

### Builder Configuration
```typescript
// Set builder address
builderService.setBuilderAddress('0x...');

// Set fee rate (0.5 basis points)
builderService.setDefaultFeeRate(5);

// Create order parameters
const builderParams = builderService.createBuilderParams();
// Returns: { b: "0x...", f: 5 }
```

### Fee Validation
- **Perp Trades**: Maximum 100 tenths of basis points (0.1%)
- **Spot Trades**: Maximum 1000 tenths of basis points (1%)
- **Input Validation**: Prevents invalid fee rates

### Revenue Tracking
- **Total Fees**: Displays cumulative builder fees collected
- **Real-time Updates**: Refresh button for latest data
- **Trade Data**: Access to historical trade data via URLs

## 📊 API Endpoints Used

### 1. Max Builder Fee Query
```json
{
  "type": "maxBuilderFee",
  "user": "0x...",
  "builder": "0x..."
}
```

### 2. Referral Info Query
```json
{
  "type": "referral",
  "user": "0x..."
}
```

### 3. Builder Trade Data
```
https://stats-data.hyperliquid.xyz/Mainnet/builder_fills/{builder_address}/{YYYYMMDD}.csv.lz4
```

## 🎨 UI Integration

### Trading Controls Panel
- **Seamless Integration**: Added to existing trading controls
- **Collapsible Settings**: Compact design that doesn't interfere with trading
- **Visual Indicators**: Clear status and configuration feedback
- **Setup Flow**: Guided setup for new users

### Configuration Interface
- **Builder Address**: Ethereum address input with validation
- **Fee Rate**: Numeric input with real-time percentage display
- **Save/Cancel**: Standard form controls
- **Error Handling**: Clear error messages and validation

## 💡 Benefits for Users

### For App Operators
- **Revenue Stream**: Earn fees on all trades executed through the app
- **Passive Income**: Automatic fee collection without user impact
- **Transparent**: Clear fee display and tracking
- **Configurable**: Adjustable fee rates based on market conditions

### For Traders
- **No Impact**: Fees are transparent and don't affect trading experience
- **Better Service**: Revenue helps maintain and improve the app
- **Optional**: Users can see and understand the fee structure
- **Trustworthy**: Open implementation with clear fee disclosure

## 🔄 Usage Flow

1. **Setup**: Configure builder address in settings
2. **Automatic**: All orders include builder parameters
3. **Execution**: Hyperliquid processes fees during trade settlement
4. **Collection**: Fees accumulate in builder's referral balance
5. **Claiming**: Use standard referral reward claim process

## 🛠️ Configuration Requirements

### Prerequisites
- **Builder Address**: Must have at least 100 USDC in perps account value
- **User Approval**: Users must approve max builder fee via `ApproveBuilderFee`
- **Wallet**: Main wallet required for approval (not API wallet)

### Settings
- **Builder Address**: Ethereum address (case-sensitive)
- **Fee Rate**: 0-100 for perps, 0-1000 for spot (tenths of basis points)
- **Market Type**: Automatic detection for appropriate fee limits

## 📈 Implementation Status

✅ **Completed**
- Builder service with full API integration
- Builder settings UI component
- Order integration with automatic fee addition
- Fee validation and display formatting
- Revenue tracking and data fetching

🔄 **Next Steps**
- User approval flow for builder fees
- Advanced analytics and reporting
- Fee optimization based on market conditions
- Integration with additional order types

This implementation provides a complete builder codes integration that enables the trading app to generate revenue while maintaining a transparent and user-friendly experience.
