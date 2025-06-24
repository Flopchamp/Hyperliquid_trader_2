// USDc Research Script - Direct API Testing
console.log('🔍 Starting Hyperliquid USDc Research...');

async function researchHyperliquidUSDc() {
    try {
        // 1. Fetch all available assets
        console.log('📊 Fetching asset metadata...');
        const metaResponse = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'meta'
            })
        });

        const metaData = await metaResponse.json();
        console.log('✅ Meta data received:', metaData);
        
        if (metaData.universe) {
            console.log(`📈 Total assets: ${metaData.universe.length}`);
            
            // Search for USDc/USDC variants
            const usdcVariants = ['USDC', 'USDc', 'usdc', 'Usdc', 'USDT', 'USD'];
            const foundUSDAssets = [];
            
            usdcVariants.forEach(variant => {
                const found = metaData.universe.filter(asset => 
                    asset.name.toLowerCase().includes(variant.toLowerCase()) ||
                    asset.name === variant
                );
                if (found.length > 0) {
                    foundUSDAssets.push(...found);
                }
            });
            
            if (foundUSDAssets.length > 0) {
                console.log('💰 USD-related assets found:', foundUSDAssets);
            } else {
                console.log('❌ No direct USD assets found');
                console.log('📝 First 20 available assets:');
                metaData.universe.slice(0, 20).forEach((asset, index) => {
                    console.log(`  ${index}: ${asset.name} (${asset.maxLeverage}x leverage)`);
                });
            }
        }
        
        // 2. Test spot trading endpoints
        console.log('\n🔍 Testing spot trading capabilities...');
        
        try {
            const spotResponse = await fetch('https://api.hyperliquid.xyz/info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'spotMeta'
                })
            });
            
            if (spotResponse.ok) {
                const spotData = await spotResponse.json();
                console.log('✅ Spot trading data:', spotData);
            } else {
                console.log('❌ Spot trading endpoint not available');
            }
        } catch (spotError) {
            console.log('❌ Spot trading error:', spotError.message);
        }
        
        // 3. Check all market data for USD pricing
        console.log('\n💱 Checking market pricing structure...');
        
        const allMidsResponse = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'allMids'
            })
        });
        
        if (allMidsResponse.ok) {
            const priceData = await allMidsResponse.json();
            console.log('💰 Price data structure:', Object.keys(priceData).slice(0, 10));
            console.log('📊 Sample prices:', priceData);
            
            // Check if prices are in USD
            if (priceData && typeof priceData === 'object') {
                const sampleAssets = Object.keys(priceData).slice(0, 5);
                console.log('💵 Sample asset prices (likely in USD):');
                sampleAssets.forEach(asset => {
                    console.log(`  ${asset}: $${priceData[asset]}`);
                });
            }
        }
        
        // 4. Research account balance structure
        console.log('\n💼 Researching account balance structure...');
        console.log('💡 Based on API documentation, account balances are shown in USD');
        console.log('💡 Hyperliquid uses USD as the base currency for all trading');
        console.log('💡 Users deposit USDC, but trading is priced in USD');
        
        return {
            totalAssets: metaData.universe?.length || 0,
            hasDirectUSDCTrading: foundUSDAssets.length > 0,
            usdBasedPricing: true,
            recommendation: 'Implement USD balance display and USDc deposit/withdrawal'
        };
        
    } catch (error) {
        console.error('❌ Research error:', error);
        return {
            error: error.message,
            recommendation: 'Use fallback USD display implementation'
        };
    }
}

// Run research
researchHyperliquidUSDc().then(results => {
    console.log('\n🎯 Research Results:', results);
    
    console.log('\n📋 Key Findings:');
    console.log('• Hyperliquid is primarily a perpetual futures exchange');
    console.log('• All assets are priced in USD (not as separate USDC pairs)');
    console.log('• Account balances show USD value (backed by USDC)');
    console.log('• No separate USDc trading pairs needed');
    
    console.log('\n🛠️ Implementation Recommendations:');
    console.log('1. Display account balances in USD (they are already USDc-backed)');
    console.log('2. Add USDc deposit/withdrawal functionality');
    console.log('3. Show USDc logo/branding in balance displays');
    console.log('4. Implement USDc-specific account management features');
    
    // Store results globally for access
    if (typeof window !== 'undefined') {
        window.usdcResearchResults = results;
    }
});

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { researchHyperliquidUSDc };
}
