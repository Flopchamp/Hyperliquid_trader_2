// Hyperliquid Service Test Script
// Run this in the browser console at http://localhost:5175/test.html

console.log('🚀 Starting Hyperliquid Service Tests...');

// Test 1: Service Availability
if (window.hyperliquidService) {
    console.log('✅ Test 1 PASSED: Hyperliquid service is available');
    const service = window.hyperliquidService;
    
    // Test 2: Basic Methods Exist
    const requiredMethods = [
        'connect', 'disconnect', 'getMarketData', 'getTradingInfo',
        'getAccountInfo', 'getAccountBalance', 'getPositions', 'getOpenOrders',
        'placeMarketOrder', 'placeLimitOrder', 'cancelOrder', 'cancelAllOrders',
        'setLeverage', 'isWalletConnected', 'getWalletAddress', 'debugTest'
    ];
    
    let methodsExist = true;
    requiredMethods.forEach(method => {
        if (typeof service[method] !== 'function') {
            console.log(`❌ Test 2 FAILED: Method ${method} is missing or not a function`);
            methodsExist = false;
        }
    });
    
    if (methodsExist) {
        console.log('✅ Test 2 PASSED: All required methods exist');
        
        // Test 3: Connection Status
        console.log(`🔗 Connection Status: ${service.isWalletConnected() ? 'Connected' : 'Not Connected'}`);
        console.log(`📍 Wallet Address: ${service.getWalletAddress() || 'None'}`);
        
        // Test 4: Market Data (No auth needed)
        console.log('🔄 Test 4: Testing Market Data (no auth required)...');
        service.getMarketData('ETH')
            .then(data => {
                console.log('✅ Test 4 PASSED: Market data retrieved');
                console.log('📊 ETH Market Data:', data);
                
                // Test 5: Trading Info (No auth needed)
                console.log('🔄 Test 5: Testing Trading Info (no auth required)...');
                return service.getTradingInfo('ETH');
            })
            .then(info => {
                console.log('✅ Test 5 PASSED: Trading info retrieved');
                console.log('ℹ️ ETH Trading Info:', info);
                
                console.log('✅ Basic tests completed successfully!');
                console.log('🔑 To test authenticated features, use the Connect Wallet button in the UI');
            })
            .catch(error => {
                console.log('❌ Test 4-5 FAILED:', error.message);
            });
    }
} else {
    console.log('❌ Test 1 FAILED: Hyperliquid service not found');
    console.log('Make sure you are on the correct page: http://localhost:5175/test.html');
}

// Instructions for manual testing
console.log(`
📋 MANUAL TESTING CHECKLIST:
1. ✅ Service availability (automated)
2. ✅ Method existence (automated)  
3. ✅ Market data (automated)
4. ✅ Trading info (automated)
5. ⏳ Wallet connection (click "Connect Wallet" button)
6. ⏳ Account info (after connection)
7. ⏳ Balance retrieval (after connection)
8. ⏳ Positions (after connection)
9. ⏳ Open orders (after connection)
10. ⚠️ Order placement (USE TESTNET ONLY!)

🚨 IMPORTANT: Only test with small amounts on testnet!
`);
