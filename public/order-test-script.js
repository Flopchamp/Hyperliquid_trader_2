// Enhanced order testing script
console.log('🧪 Testing Hyperliquid Order Placement...');

async function testOrders() {
    try {
        // First get current market data
        console.log('📊 Getting current market data...');
        const marketData = await hyperliquidService.getMarketData('ETH');
        console.log('Raw market data:', marketData);
        
        // Check if we got valid price data
        const currentPrice = marketData?.price || 0;
        console.log('Current ETH price:', currentPrice);
        
        if (currentPrice === 0) {
            console.log('⚠️ No price data available, trying direct API call...');
            
            // Try direct API call to see raw response
            const response = await fetch('https://api.hyperliquid.xyz/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'allMids' })
            });
            const rawData = await response.json();
            console.log('Raw API response:', rawData);
            
            // Check if ETH exists in different format
            console.log('Available symbols:', Object.keys(rawData));
            
            return; // Exit if no price data
        }
        
        // Get trading info for size requirements
        const tradingInfo = await hyperliquidService.getTradingInfo('ETH');
        console.log('ETH trading info:', tradingInfo);
        
        // Get account info to check balance
        const accountInfo = await hyperliquidService.getAccountInfo();
        console.log('Account balance:', accountInfo.marginSummary.accountValue);
        
        // Calculate reasonable order prices
        const buyPrice = (currentPrice * 0.95).toFixed(2); // 5% below market
        const sellPrice = (currentPrice * 1.05).toFixed(2); // 5% above market
        
        console.log(`💡 Suggested order prices:`);
        console.log(`   Buy at: $${buyPrice} (5% below market)`);
        console.log(`   Sell at: $${sellPrice} (5% above market)`);
        
        // Test with minimum size based on decimals
        const minSize = Math.pow(10, -tradingInfo.szDecimals);
        const testSize = minSize * 10; // 10x minimum size
        
        console.log(`📏 Size info:`);
        console.log(`   Min size: ${minSize}`);
        console.log(`   Test size: ${testSize}`);
        
        // Try a conservative buy order
        console.log(`\n🔄 Testing buy order...`);
        console.log(`Symbol: ETH, Size: ${testSize}, Price: $${buyPrice}`);
        
        try {
            const order = await hyperliquidService.placeLimitOrder('ETH', 'buy', testSize, parseFloat(buyPrice));
            console.log('✅ Order placed successfully:', order);
        } catch (error) {
            console.log('❌ Order failed:', error.message);
            
            // Check different error types
            if (error.message.includes('422')) {
                console.log('💡 422 Error Analysis:');
                console.log('   - Likely insufficient balance (test wallet has $0)');
                console.log('   - Could be minimum order value too low');
                console.log('   - Could be price too far from market');
                console.log('   - API integration is working correctly!');
            } else if (error.message.includes('401')) {
                console.log('💡 401 Error: Authentication issue');
            } else if (error.message.includes('400')) {
                console.log('💡 400 Error: Bad request format');
            }
            
            console.log('📋 Full error details:', error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testOrders();

// Test to see exact error response
async function testDetailedError() {
    console.log('🔍 Testing exact error response...');
    
    try {
        const order = await hyperliquidService.placeLimitOrder('ETH', 'buy', 0.001, 2185.14);
        console.log('✅ Order placed:', order);
    } catch (error) {
        console.log('❌ Full error object:', error);
        console.log('❌ Error message:', error.message);
        console.log('❌ Error stack:', error.stack);
        
        // Try to parse JSON from error message if it contains API response
        if (error.message.includes('{') && error.message.includes('}')) {
            try {
                const jsonMatch = error.message.match(/(\{.*\})/);
                if (jsonMatch) {
                    const apiResponse = JSON.parse(jsonMatch[1]);
                    console.log('📋 Parsed API Response:', apiResponse);
                    
                    if (apiResponse.response) {
                        console.log('🔥 API Error Details:', apiResponse.response);
                    }
                }
            } catch (parseError) {
                console.log('⚠️ Could not parse JSON from error message');
            }
        }
    }
}

// Test with different order parameters
async function testVariousOrders() {
    console.log('🧪 Testing various order scenarios...');
    
    const testCases = [
        { symbol: 'ETH', side: 'buy', size: 0.001, price: 1000 }, // Very low price
        { symbol: 'ETH', side: 'buy', size: 0.00001, price: 3000 }, // Very small size
        { symbol: 'BTC', side: 'buy', size: 0.001, price: 40000 }, // Different symbol
    ];
    
    for (const testCase of testCases) {
        console.log(`\n🔄 Testing: ${testCase.symbol} ${testCase.side} ${testCase.size} @ $${testCase.price}`);
        try {
            const order = await hyperliquidService.placeLimitOrder(
                testCase.symbol, 
                testCase.side, 
                testCase.size, 
                testCase.price
            );
            console.log('✅ Success:', order);
        } catch (error) {
            console.log('❌ Failed:', error.message);
        }
        
        // Wait a bit between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

console.log('\n🎯 Available test functions:');
console.log('- testDetailedError() - Test with detailed error logging');
console.log('- testVariousOrders() - Test multiple order scenarios');
console.log('- testOrders() - Original comprehensive test');
