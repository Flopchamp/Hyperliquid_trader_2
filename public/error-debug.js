// Get detailed error response from Hyperliquid
console.log('🔍 Getting detailed error response...');

async function getDetailedError() {
    try {
        // Create a test order request to see the exact error
        const testOrder = {
            coin: "ETH",
            is_buy: true,
            sz: "0.001",
            limit_px: "2185.14",
            order_type: { limit: { tif: "Gtc" } },
            reduce_only: false
        };

        const action = {
            type: "order",
            orders: [testOrder]
        };

        // We'll get the signature the same way the service does
        const message = JSON.stringify(action);
        const messageBytes = new TextEncoder().encode(message);
        
        console.log('📤 Request being sent:', action);
        
        // Try to get the raw response
        const response = await fetch('https://api.hyperliquid.xyz/exchange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action,
                signature: "dummy_signature_for_testing", // This will fail but show us the response
                timestamp: Date.now()
            })
        });

        const responseText = await response.text();
        console.log('📥 Raw response status:', response.status);
        console.log('📥 Raw response text:', responseText);
        
        try {
            const responseJson = JSON.parse(responseText);
            console.log('📥 Parsed response:', responseJson);
        } catch (e) {
            console.log('📥 Response is not JSON');
        }
        
    } catch (error) {
        console.error('Error getting detailed response:', error);
    }
}

// Also test with the actual service to see what it returns
async function testServiceOrder() {
    try {
        console.log('\n🔧 Testing with actual service...');
        const order = await hyperliquidService.placeLimitOrder('ETH', 'buy', 0.001, 2185.14);
        console.log('✅ Order placed:', order);
    } catch (error) {
        console.log('❌ Service error:', error.message);
        
        // Try to get the response from the service
        if (error.response) {
            console.log('📥 Error response:', error.response);
        }
    }
}

// Run both tests
getDetailedError();
testServiceOrder();
