// Detailed error testing script
console.log('🔍 Starting detailed error analysis...');

async function runDetailedErrorTest() {
    console.log('🧪 Testing enhanced error handling...');
    
    try {
        // Test with a simple order that should fail due to $0 balance
        console.log('📝 Placing test order: ETH buy 0.001 @ $2185.14');
        const order = await hyperliquidService.placeLimitOrder('ETH', 'buy', 0.001, 2185.14);
        console.log('✅ Unexpected success:', order);
    } catch (error) {
        console.log('❌ Expected error caught:');
        console.log('   Error object:', error);
        console.log('   Error message:', error.message);
        console.log('   Error name:', error.name);
        
        // Check if we got the enhanced error format
        if (error.message.includes('HTTP') && error.message.includes('{')) {
            console.log('✅ Enhanced error format detected!');
            
            // Try to extract the JSON response
            try {
                const jsonMatch = error.message.match(/HTTP \d+: (\{.*\})/);
                if (jsonMatch) {
                    const apiResponse = JSON.parse(jsonMatch[1]);
                    console.log('📋 Parsed API Error Response:');
                    console.log('   Full response:', apiResponse);
                    
                    if (apiResponse.response) {
                        console.log('   Error details:', apiResponse.response);
                    }
                    if (apiResponse.status) {
                        console.log('   Status:', apiResponse.status);
                    }
                } else {
                    console.log('⚠️ Could not extract JSON from error message');
                }
            } catch (parseError) {
                console.log('⚠️ Error parsing JSON:', parseError.message);
            }
        } else {
            console.log('⚠️ Old error format - enhancement may not be working');
        }
    }
    
    console.log('\n🔄 Testing market order error handling...');
    try {
        const marketOrder = await hyperliquidService.placeMarketOrder('ETH', 'buy', 0.001);
        console.log('✅ Unexpected market order success:', marketOrder);
    } catch (error) {
        console.log('❌ Market order error (expected):');
        console.log('   Message:', error.message);
        
        if (error.message.includes('HTTP') && error.message.includes('{')) {
            console.log('✅ Market order also has enhanced error format!');
        }
    }
}

// Auto-run the test
runDetailedErrorTest();

console.log('\n💡 You can also run: runDetailedErrorTest()');
