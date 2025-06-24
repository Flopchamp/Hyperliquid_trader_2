# Hyperliquid API Integration

## Overview
This application now uses direct HTTP API calls to interact with the Hyperliquid exchange instead of the broken SDK. The implementation provides real trading functionality with proper authentication and order management.

## Service Architecture
- **File**: `src/services/hyperliquid.ts`
- **Main Class**: `HyperliquidService`
- **Singleton Instance**: `hyperliquidService`

## Key Features
✅ **Authentication**: Ethereum wallet-based signing
✅ **Order Management**: Place market/limit orders, cancel orders, cancel all orders
✅ **Position Management**: Get positions, close all positions
✅ **Account Management**: Get account info, balance, margin details
✅ **Market Data**: Real-time price feeds, trading info
✅ **WebSocket Support**: Real-time updates for prices and user data
✅ **Leverage Control**: Set leverage for specific symbols

## API Endpoints Used
- **Info Endpoint**: `https://api.hyperliquid.xyz/info`
  - Account state: `{ type: 'clearinghouseState', user: address }`
  - Open orders: `{ type: 'openOrders', user: address }`
  - Market data: `{ type: 'allMids' }`
  - Trading info: `{ type: 'meta' }`

- **Exchange Endpoint**: `https://api.hyperliquid.xyz/exchange`
  - Place orders: `{ action: { type: 'order', orders: [...] } }`
  - Cancel orders: `{ action: { type: 'cancel', cancels: [...] } }`
  - Set leverage: `{ action: { type: 'updateLeverage', asset, leverage } }`

- **WebSocket**: `wss://api.hyperliquid.xyz/ws`
  - Subscribe to price feeds
  - Subscribe to user updates

## Authentication
Orders and authenticated operations require:
1. Ethereum wallet signature
2. Proper message formatting (JSON stringified action)
3. Keccak256 hash of the message
4. Wallet signature of the hash

## Usage Examples

### Basic Connection
```typescript
const service = hyperliquidService;
await service.connect(privateKey);
```

### Place Orders
```typescript
// Market order
const order = await service.placeMarketOrder('ETH', 'buy', 0.1);

// Limit order
const limitOrder = await service.placeLimitOrder('ETH', 'buy', 0.1, 2000);
```

### Manage Positions
```typescript
const positions = await service.getPositions();
await service.closeAllPositions();
```

### Set Leverage
```typescript
await service.setLeverage('ETH', 10); // 10x leverage
```

### Cancel Orders
```typescript
await service.cancelOrder(orderId);
await service.cancelAllOrders();
```

## Debugging
The service is exposed globally for debugging:
```javascript
// In browser console:
window.hyperliquidService.debugTest(); // Run full test suite
window.hyperliquidService.getMarketData('ETH'); // Test specific methods
```

## Context Integration
The service is integrated with React context in `src/contexts/TradingContext.tsx`:
- Account management
- Order state management
- Position tracking
- Real-time updates

## Error Handling
- All methods have try-catch blocks
- Errors are logged to console
- Failed operations return appropriate fallback values
- Connection status is tracked and emitted via events

## Event System
The service emits events for:
- `connected`: Wallet connection established
- `orderPlaced`: New order created
- `orderCancelled`: Order cancelled
- `allOrdersCancelled`: All orders cancelled
- `allPositionsClosed`: All positions closed
- `leverageUpdated`: Leverage changed
- `error`: Error occurred

## Next Steps
1. **Real-time Updates**: Implement WebSocket message handling for live position/order updates
2. **Order Book**: Add order book data fetching
3. **Advanced Orders**: Implement stop-loss, take-profit, and conditional orders
4. **Risk Management**: Add position sizing and risk controls
5. **Trading Strategies**: Implement copy trading and automated strategies
6. **Chart Integration**: Connect TradingView charts with click-to-trade
7. **Testing**: Add unit tests for all trading functions

## Status
🟢 **Core Trading**: Market/limit orders, cancellation
🟢 **Account Management**: Balance, positions, leverage
🟢 **WebSocket**: Connection established (message handling pending)
🟡 **Real-time Updates**: Basic structure in place, needs implementation
🟡 **Advanced Features**: Copy trading, automated strategies pending
🔴 **Testing**: No automated tests yet

## Important Notes
- **Testnet**: Set `testnet: true` in connect method for testing
- **Rate Limits**: Be mindful of API rate limits
- **Error Handling**: Always check for errors in production
- **Security**: Never expose private keys in client-side code
- **Authentication**: Ensure proper signature validation

## Support
- Hyperliquid API Documentation: https://hyperliquid.gitbook.io/hyperliquid-docs/
- WebSocket documentation for real-time feeds
- Community support for advanced trading strategies
