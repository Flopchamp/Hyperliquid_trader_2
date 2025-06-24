// Setup script for real Hyperliquid wallet credentials
console.log('🔧 Setting up real Hyperliquid wallet credentials...');

// Function to setup wallet with provided credentials
function setupHyperliquidWallet(privateKey, publicKey) {
    console.log('📝 Setting up wallet with provided credentials...');
    
    try {
        // Clear any existing wallet
        hyperliquidService.wallet = null;
        
        // Create wallet object with proper format
        const wallet = {
            privateKey: privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
            publicKey: publicKey.startsWith('0x') ? publicKey : `0x${publicKey}`,
            address: publicKey.startsWith('0x') ? publicKey : `0x${publicKey}` // Use public key as address
        };
        
        // Set the wallet
        hyperliquidService.wallet = wallet;
        
        console.log('✅ Wallet setup complete!');
        console.log('📊 Wallet address:', wallet.address);
        
        return wallet;
    } catch (error) {
        console.error('❌ Error setting up wallet:', error);
        throw error;
    }
}

// Function to test wallet connection and get account info
async function testWalletConnection() {
    console.log('🧪 Testing wallet connection...');
    
    try {
        // Test getting account info
        const accountInfo = await hyperliquidService.getAccountInfo();
        console.log('✅ Account info retrieved:', accountInfo);
        
        // Test getting balance
        const balance = await hyperliquidService.getAccountBalance();
        console.log('💰 Account balance:', balance);
        
        // Test getting trading info
        const tradingInfo = await hyperliquidService.getTradingInfo('ETH');
        console.log('📊 ETH trading info:', tradingInfo);
        
        return true;
    } catch (error) {
        console.error('❌ Wallet connection test failed:', error);
        return false;
    }
}

// Enhanced order placement with real wallet
async function placeOrderWithRealWallet(symbol, side, size, price) {
    console.log('🎯 Placing order with real wallet...');
    
    if (!hyperliquidService.wallet) {
        throw new Error('❌ No wallet configured. Use setupHyperliquidWallet() first.');
    }
    
    try {
        const timestamp = Date.now();
        
        // Get current market data to validate price
        const marketData = await hyperliquidService.getMarketData(symbol);
        console.log('📊 Current market price:', marketData?.price);
        
        // Get trading info for size validation
        const tradingInfo = await hyperliquidService.getTradingInfo(symbol);
        console.log('📋 Trading info:', tradingInfo);
        
        // Create order with proper format
        const order = {
            coin: symbol,
            is_buy: side === 'buy',
            sz: size,
            limit_px: price,
            order_type: { limit: { tif: 'Gtc' } },
            reduce_only: false
        };

        const action = {
            type: 'order',
            orders: [order]
        };

        console.log('📤 Placing order:', action);

        const signature = await hyperliquidService.createSignature(action);
        console.log('✅ Signature created');

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
            console.log('✅ Parsed JSON response:', result);
        } catch (jsonError) {
            console.log('⚠️ Non-JSON response:', responseText);
            result = { status: 'error', response: responseText, isTextResponse: true };
        }

        if (response.ok && result.status === 'ok') {
            console.log('🎉 ORDER PLACED SUCCESSFULLY!');
            console.log('📋 Order result:', result);
            return result;
        } else {
            const errorMessage = result.isTextResponse ? result.response : JSON.stringify(result);
            console.log('❌ Order failed:', errorMessage);
            throw new Error(`Order failed: ${errorMessage}`);
        }
    } catch (error) {
        console.error('🚨 Error placing order:', error);
        throw error;
    }
}

// Instructions for the user
console.log(`
📋 Instructions:

1. Call setupHyperliquidWallet() with your credentials:
   setupHyperliquidWallet('your-private-key', 'your-public-key')

2. Test the connection:
   testWalletConnection()

3. Place a real order:
   placeOrderWithRealWallet('ETH', 'buy', 0.001, 2000)

Example:
setupHyperliquidWallet('0x1234...', '0x5678...')
`);

// Make functions globally available
window.setupHyperliquidWallet = setupHyperliquidWallet;
window.testWalletConnection = testWalletConnection;
window.placeOrderWithRealWallet = placeOrderWithRealWallet;

console.log('✅ Setup script ready! Please provide your Hyperliquid credentials.');
