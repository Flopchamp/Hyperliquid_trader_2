// Simple copy-paste error test for browser console
(async function() {
    console.log('🎯 Running Enhanced Error Test...');
    
    try {
        // Test order that should fail due to insufficient balance
        console.log('📝 Placing test order: ETH buy 0.001 @ $2000');
        const order = await hyperliquidService.placeLimitOrder('ETH', 'buy', 0.001, 2000);
        console.log('✅ Unexpected success:', order);
    } catch (error) {
        console.log('❌ Expected error caught:');
        console.log('🔍 Enhanced Error Details:');
        
        // Parse the enhanced error response
        if (error.message.includes('HTTP') && error.message.includes('{')) {
            try {
                const match = error.message.match(/HTTP \d+: (.+)/);
                if (match) {
                    const apiResponse = JSON.parse(match[1]);
                    console.log('📊 API Response:');
                    console.log('   Status:', apiResponse.status);
                    console.log('   Error:', apiResponse.response);
                    
                    if (apiResponse.response && apiResponse.response.includes('balance')) {
                        console.log('✅ SUCCESS: Enhanced error handling is working!');
                        console.log('✅ API integration confirmed');
                        console.log('✅ Authentication valid');
                        console.log('✅ Only failing due to $0 test wallet');
                    }
                }
            } catch (parseError) {
                console.log('⚠️ Could not parse response:', error.message);
            }
        } else {
            console.log('⚠️ Old error format:', error.message);
        }
    }
    
    console.log('🎉 Error handling test completed!');
})();
