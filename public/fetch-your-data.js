// Real data fetch test with your actual keys
console.log('🚀 Starting real data fetch with your Hyperliquid account...');

// Your actual keys
const PRIVATE_KEY = '0x671df21eaff14e1bc928c3f9d9fa8fcc6fb33e7b70659b59c1cf6ff6c09a9a30';
const PUBLIC_KEY = '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB';
const EXPECTED_BALANCE = 17.50;

async function fetchYourRealData() {
    console.log('📋 Real Account Data Fetch Test');
    console.log('================================');
    
    try {
        // Check if service is available
        if (!window.hyperliquidService) {
            console.error('❌ Hyperliquid service not found!');
            console.log('💡 Please run this script in the browser console on the main app page.');
            return false;
        }

        console.log('🔑 Connecting with your private key...');
        
        // Connect with your actual private key
        const connected = await window.hyperliquidService.connect(PRIVATE_KEY);
        
        if (!connected) {
            console.error('❌ Failed to connect to Hyperliquid with your keys');
            return false;
        }

        // Get wallet info
        const walletAddress = window.hyperliquidService.getWalletAddress();
        console.log('✅ Successfully connected!');
        console.log('📍 Connected Wallet:', walletAddress);
        console.log('🔍 Your Public Key:', PUBLIC_KEY);
        
        // Verify address correspondence
        const addressMatch = walletAddress?.toLowerCase() === PUBLIC_KEY.toLowerCase();
        console.log('🎯 Address Match:', addressMatch ? '✅ Perfect!' : '⚠️ Different (but OK)');
        
        console.log('\n💰 Fetching your real account balance...');
        
        // Fetch account information
        const accountInfo = await window.hyperliquidService.getAccountInfo();
        console.log('📊 Raw Account Data:', accountInfo);
        
        if (accountInfo && accountInfo.marginSummary) {
            const margin = accountInfo.marginSummary;
            const balance = parseFloat(margin.accountValue || '0');
            const pnl = parseFloat(margin.totalNtlPos || '0');
            const rawUsd = parseFloat(margin.totalRawUsd || '0');
            
            console.log('\n💵 YOUR REAL BALANCE DATA:');
            console.log(`💰 Account Value: $${balance.toFixed(2)}`);
            console.log(`📈 Total NTL Position: $${pnl.toFixed(2)}`);
            console.log(`💼 Total Raw USD: $${rawUsd.toFixed(2)}`);
            
            // Check if balance matches what you expected
            const balanceMatch = Math.abs(balance - EXPECTED_BALANCE) < 0.01;
            console.log(`🎯 Balance Check: Expected $${EXPECTED_BALANCE}, Got $${balance.toFixed(2)} ${balanceMatch ? '✅' : '⚠️'}`);
            
            if (balanceMatch) {
                console.log('🎉 PERFECT! Your account balance matches the expected $17.50!');
            }
        }
        
        console.log('\n📊 Fetching your positions...');
        
        // Fetch positions
        const positions = await window.hyperliquidService.getPositions();
        console.log(`📈 Positions Found: ${positions.length}`);
        
        if (positions.length > 0) {
            console.log('📋 Your Current Positions:');
            positions.forEach((pos, i) => {
                console.log(`  ${i + 1}. ${pos.symbol}: ${pos.side} ${pos.size} (Entry: $${pos.entryPrice}, PnL: $${pos.pnl})`);
            });
        } else {
            console.log('📭 No open positions');
        }
        
        console.log('\n📋 Fetching your open orders...');
        
        // Fetch orders
        const orders = await window.hyperliquidService.getOpenOrders();
        console.log(`🔖 Orders Found: ${orders.length}`);
        
        if (orders.length > 0) {
            console.log('📝 Your Open Orders:');
            orders.forEach((order, i) => {
                console.log(`  ${i + 1}. ${order.symbol}: ${order.side} ${order.amount} @ $${order.price || 'Market'} (${order.status})`);
            });
        } else {
            console.log('📭 No open orders');
        }
        
        console.log('\n📈 Fetching current market data...');
        
        // Fetch market data for ETH
        const marketData = await window.hyperliquidService.getMarketData('ETH');
        console.log('💱 ETH Market Data:', marketData);
        
        if (marketData && marketData.price) {
            console.log(`💰 Current ETH Price: $${marketData.price.toFixed(2)}`);
        }
        
        console.log('\n🎊 REAL DATA FETCH COMPLETED SUCCESSFULLY!');
        console.log('==========================================');
        console.log('📋 SUMMARY OF YOUR REAL ACCOUNT:');
        console.log(`💰 Balance: $${parseFloat(accountInfo.marginSummary.accountValue).toFixed(2)}`);
        console.log(`📊 Positions: ${positions.length}`);
        console.log(`📋 Orders: ${orders.length}`);
        console.log(`🔗 Connected: ${window.hyperliquidService.isConnected ? 'Yes' : 'No'}`);
        console.log('==========================================');
        
        // Return data for use in UI
        return {
            connected: true,
            walletAddress,
            balance: parseFloat(accountInfo.marginSummary.accountValue),
            pnl: parseFloat(accountInfo.marginSummary.totalNtlPos),
            positions: positions.length,
            orders: orders.length,
            accountInfo,
            positionsData: positions,
            ordersData: orders,
            marketData
        };
        
    } catch (error) {
        console.error('❌ Error fetching real data:', error);
        console.log('💡 Error details:', error.message);
        return false;
    }
}

// Make function available globally
window.fetchYourRealData = fetchYourRealData;

// Auto-run if service is available
if (window.hyperliquidService) {
    console.log('🎯 Service detected, running real data fetch...');
    fetchYourRealData();
} else {
    console.log('⏳ Service not found. To run this test:');
    console.log('1. Open the main app at http://localhost:5176/');
    console.log('2. Open browser console (F12)');
    console.log('3. Paste this script or run: fetchYourRealData()');
}
