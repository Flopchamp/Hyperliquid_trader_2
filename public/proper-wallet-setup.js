// Fixed wallet setup with proper signing functionality
console.log('🔧 Creating wallet with proper signing methods...');

// Import ethers for wallet functionality
async function createProperWallet(privateKey, publicKey) {
    console.log('📝 Creating wallet with signing capabilities...');
    
    try {
        // Create ethers wallet from private key
        const ethersWallet = new ethers.Wallet(privateKey);
        
        console.log('✅ Ethers wallet created');
        console.log('📊 Address from private key:', ethersWallet.address);
        console.log('📊 Provided public key:', publicKey);
        
        // Verify the keys match
        if (ethersWallet.address.toLowerCase() !== publicKey.toLowerCase()) {
            console.log('⚠️ Address mismatch - using address derived from private key');
        }
        
        // Create wallet object with all required methods
        const wallet = {
            privateKey: privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
            publicKey: ethersWallet.address, // Use address derived from private key
            address: ethersWallet.address,
            
            // Add the required signMessage method
            signMessage: async function(message) {
                console.log('🔏 Signing message:', message);
                const signature = await ethersWallet.signMessage(message);
                console.log('✅ Message signed:', signature);
                return signature;
            },
            
            // Add other useful methods
            signTransaction: async function(transaction) {
                return await ethersWallet.signTransaction(transaction);
            },
            
            getAddress: function() {
                return this.address;
            }
        };
        
        // Set the wallet in the service
        hyperliquidService.wallet = wallet;
        
        console.log('✅ Proper wallet setup complete!');
        console.log('📊 Final wallet address:', wallet.address);
        
        return wallet;
    } catch (error) {
        console.error('❌ Error creating proper wallet:', error);
        throw error;
    }
}

// Test the wallet setup and order placement
async function testCompleteFlow(privateKey, publicKey) {
    console.log('🎯 Testing complete flow with proper wallet...');
    
    try {
        // Step 1: Create proper wallet
        const wallet = await createProperWallet(privateKey, publicKey);
        
        // Step 2: Test connection
        console.log('\n🧪 Testing wallet connection...');
        const accountInfo = await hyperliquidService.getAccountInfo();
        console.log('✅ Account info:', accountInfo.marginSummary);
        
        // Step 3: Get market data
        console.log('\n📊 Getting current market data...');
        const marketData = await hyperliquidService.getMarketData('ETH');
        console.log('📈 Current ETH price:', marketData?.price);
        
        // Step 4: Test order placement
        console.log('\n🎯 Testing order placement...');
        
        const timestamp = Date.now();
        const order = {
            coin: 'ETH',
            is_buy: true,
            sz: 0.001,
            limit_px: 2000,
            order_type: { limit: { tif: 'Gtc' } },
            reduce_only: false
        };

        const action = {
            type: 'order',
            orders: [order]
        };

        console.log('📤 Creating signature for order:', action);
        
        const signature = await hyperliquidService.createSignature(action);
        console.log('✅ Signature created successfully:', signature);

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
        console.log('📊 Response Status:', response.status);

        let result;
        try {
            result = JSON.parse(responseText);
            console.log('✅ Parsed JSON response:', result);
        } catch (jsonError) {
            console.log('⚠️ Non-JSON response received');
            result = { status: 'error', response: responseText, isTextResponse: true };
        }

        if (response.ok && result.status === 'ok') {
            console.log('🎉 🎉 ORDER PLACED SUCCESSFULLY! 🎉 🎉');
            console.log('📋 Order details:', result);
            return result;
        } else {
            const errorMessage = result.isTextResponse ? result.response : JSON.stringify(result);
            console.log('❌ Order failed:', errorMessage);
            
            // Analyze the error
            if (errorMessage.includes('deserialize')) {
                console.log('💡 Still a format issue - let\'s try different formats');
            } else if (errorMessage.includes('balance') || errorMessage.includes('insufficient')) {
                console.log('💡 Balance issue - order size might be too small or account needs more funds');
            } else {
                console.log('💡 New error type - progress made!');
            }
            
            throw new Error(`Order failed: ${errorMessage}`);
        }
    } catch (error) {
        console.error('🚨 Complete flow error:', error);
        throw error;
    }
}

// Quick setup function
async function quickSetup() {
    console.log('🚀 Running quick setup with your credentials...');
    
    const privateKey = '0x671df21eaff14e1bc928c3f9d9fa8fcc6fb33e7b70659b59c1cf6ff6c09a9a30';
    const publicKey = '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB';
    
    return await testCompleteFlow(privateKey, publicKey);
}

console.log('✅ Enhanced wallet setup ready!');
console.log('📋 Run: quickSetup() to test everything');

// Make functions globally available
window.createProperWallet = createProperWallet;
window.testCompleteFlow = testCompleteFlow;
window.quickSetup = quickSetup;
