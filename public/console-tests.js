/*
🧪 HYPERLIQUID SERVICE CONSOLE TESTS
Copy and paste these commands in the browser console at: http://localhost:5175/

📋 TESTING CHECKLIST:
1. Basic service availability
2. Market data (no auth needed) 
3. Trading info (no auth needed)
4. WebSocket connection
5. Account connection (requires wallet)
6. Trading operations (requires wallet + caution)
*/

// ============================================
// 🔧 BASIC SERVICE TESTS (Safe - No Auth)
// ============================================

console.log('🚀 Starting Hyperliquid Service Tests...');

// Test 1: Service Availability
if (window.hyperliquidService) {
    console.log('✅ Test 1 PASSED: Service is available');
    const service = window.hyperliquidService;
    
    // Test 2: Check connection status
    console.log(`🔗 Connection Status: ${service.isWalletConnected() ? 'Connected' : 'Not Connected'}`);
    console.log(`📍 Wallet Address: ${service.getWalletAddress() || 'None'}`);
    
    console.log('✅ Basic checks passed. Ready for further testing.');
} else {
    console.log('❌ Test 1 FAILED: Service not found');
    console.log('Make sure you are on: http://localhost:5175/');
}

// ============================================
// 📊 MARKET DATA TESTS (Safe - No Auth)
// ============================================

/*
Run these tests one by one:

// Test Market Data
window.hyperliquidService.getMarketData('ETH').then(data => {
    console.log('📊 ETH Market Data:', data);
}).catch(err => console.error('❌ Market data error:', err));

// Test Trading Info  
window.hyperliquidService.getTradingInfo('ETH').then(info => {
    console.log('ℹ️ ETH Trading Info:', info);
}).catch(err => console.error('❌ Trading info error:', err));

// Test Debug Function
window.hyperliquidService.debugTest();

*/

// ============================================
// 🔐 WALLET CONNECTION TESTS (Requires Private Key)
// ============================================

/*
⚠️ CAUTION: Only use with test wallets/keys!

To test wallet connection (replace with your test private key):

const testPrivateKey = 'YOUR_TEST_PRIVATE_KEY_HERE';
window.hyperliquidService.connect(testPrivateKey).then(success => {
    if (success) {
        console.log('✅ Wallet connected successfully!');
        
        // Test account info
        return window.hyperliquidService.getAccountInfo();
    } else {
        console.log('❌ Wallet connection failed');
    }
}).then(accountInfo => {
    if (accountInfo) {
        console.log('👤 Account Info:', accountInfo);
        
        // Test balance
        return window.hyperliquidService.getAccountBalance();
    }
}).then(balance => {
    if (balance) {
        console.log('💰 Balance:', balance);
        
        // Test positions
        return window.hyperliquidService.getPositions();
    }
}).then(positions => {
    if (positions) {
        console.log('📈 Positions:', positions);
        
        // Test open orders
        return window.hyperliquidService.getOpenOrders();
    }
}).then(orders => {
    if (orders) {
        console.log('📋 Open Orders:', orders);
    }
}).catch(err => {
    console.error('❌ Wallet test error:', err);
});

*/

// ============================================
// 💹 TRADING TESTS (Requires Wallet + EXTREME CAUTION)
// ============================================

/*
🚨 DANGER ZONE - REAL MONEY INVOLVED! 🚨
Only run these with tiny amounts on testnet!

// Place a small limit order (CHANGE VALUES!)
window.hyperliquidService.placeLimitOrder('ETH', 'buy', 0.001, 1000).then(order => {
    console.log('📋 Order placed:', order);
    
    // Cancel the order immediately (replace ORDER_ID)
    return window.hyperliquidService.cancelOrder(order.id);
}).then(cancelled => {
    console.log('❌ Order cancelled:', cancelled);
}).catch(err => {
    console.error('🚨 Trading error:', err);
});

// Emergency: Cancel all orders
window.hyperliquidService.cancelAllOrders().then(success => {
    console.log('🛑 All orders cancelled:', success);
});

*/

console.log(`
📋 COPY-PASTE COMMANDS READY!
1. First run the basic tests above
2. Then copy individual test blocks as needed
3. Be EXTREMELY careful with trading tests!

🔗 Main App: http://localhost:5175/
📊 Test Interface: http://localhost:5175/test.html
`);
