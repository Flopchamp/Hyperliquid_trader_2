// Fixed order format based on API error - run this in browser console
console.log('🔧 Fixing JSON request format for Hyperliquid API...');

// Create method with corrected request format
hyperliquidService.placeLimitOrderCorrected = async function(symbol, side, size, price) {
    if (!this.wallet) {
        throw new Error('Not connected to Hyperliquid');
    }

    try {
        const timestamp = Date.now();
        
        // Corrected order format based on Hyperliquid docs
        const order = {
            coin: symbol,
            is_buy: side === 'buy',
            sz: size,  // Try as number instead of string
            limit_px: price,  // Try as number instead of string
            order_type: { limit: { tif: 'Gtc' } },
            reduce_only: false
        };

        const action = {
            type: 'order',
            orders: [order]
        };

        console.log('📤 Sending corrected order request:', {
            action,
            timestamp
        });

        const signature = await this.createSignature(action);

        const response = await fetch('https://api.hyperliquid.xyz/exchange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action,
                signature,
                timestamp
            })
        });

        const responseText = await response.text();
        console.log('📥 API Response:', responseText);
        console.log('📊 Status:', response.status);

        let result;
        try {
            result = JSON.parse(responseText);
        } catch (jsonError) {
            result = {
                status: 'error',
                response: responseText,
                isTextResponse: true
            };
        }

        if (!response.ok) {
            const errorMessage = result.isTextResponse ? result.response : JSON.stringify(result);
            throw new Error(`HTTP ${response.status}: ${errorMessage}`);
        }

        if (result.status === 'ok') {
            console.log('🎉 ORDER PLACED SUCCESSFULLY!');
            return {
                id: result.response?.data?.statuses?.[0]?.resting?.oid?.toString() || `${timestamp}-${Math.random()}`,
                accountId: 1,
                symbol,
                side,
                type: 'limit',
                amount: size,
                price,
                status: 'pending',
                timestamp
            };
        } else {
            const errorMessage = result.isTextResponse ? result.response : JSON.stringify(result);
            throw new Error(`API Error: ${errorMessage}`);
        }
    } catch (error) {
        console.error('🚨 Error:', error);
        throw error;
    }
};

console.log('✅ Corrected method created: placeLimitOrderCorrected');

// Test different format variations
async function testFormatVariations() {
    console.log('\n🧪 Testing different request formats...');
    
    const variations = [
        {
            name: 'Numbers instead of strings',
            order: {
                coin: 'ETH',
                is_buy: true,
                sz: 0.001,
                limit_px: 2000,
                order_type: { limit: { tif: 'Gtc' } },
                reduce_only: false
            }
        },
        {
            name: 'Strings for numbers',
            order: {
                coin: 'ETH',
                is_buy: true,
                sz: '0.001',
                limit_px: '2000',
                order_type: { limit: { tif: 'Gtc' } },
                reduce_only: false
            }
        },
        {
            name: 'Different order_type format',
            order: {
                coin: 'ETH',
                is_buy: true,
                sz: 0.001,
                limit_px: 2000,
                order_type: 'limit',
                reduce_only: false
            }
        }
    ];
    
    for (const variation of variations) {
        console.log(`\n🔄 Testing: ${variation.name}`);
        try {
            const action = {
                type: 'order',
                orders: [variation.order]
            };
            
            const signature = await hyperliquidService.createSignature(action);
            
            const response = await fetch('https://api.hyperliquid.xyz/exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    signature,
                    timestamp: Date.now()
                })
            });
            
            const responseText = await response.text();
            console.log(`📊 ${variation.name} result:`, response.status, responseText);
            
        } catch (error) {
            console.log(`❌ ${variation.name} error:`, error.message);
        }
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Auto-test the corrected format
(async function() {
    console.log('\n🎯 Testing corrected format...');
    
    try {
        const order = await hyperliquidService.placeLimitOrderCorrected('ETH', 'buy', 0.001, 2000);
        console.log('🎉 SUCCESS WITH CORRECTED FORMAT!', order);
    } catch (error) {
        console.log('❌ Still getting error:', error.message);
        
        if (!error.message.includes('deserialize')) {
            console.log('✅ Format issue fixed! New error type indicates progress');
        }
    }
    
    console.log('\n💡 You can also run: testFormatVariations()');
})();
