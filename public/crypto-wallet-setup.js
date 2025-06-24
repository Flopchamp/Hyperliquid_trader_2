// Wallet setup using Web Crypto API (no ethers dependency)
console.log('🔧 Creating wallet with Web Crypto API...');

// Helper function to convert hex to bytes
function hexToBytes(hex) {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        bytes[i] = parseInt(hex.substr(2 + i * 2, 2), 16);
    }
    return bytes;
}

// Helper function to convert bytes to hex
function bytesToHex(bytes) {
    return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Create wallet with signing capabilities using Web Crypto API
async function createCryptoWallet(privateKey, address) {
    console.log('📝 Creating wallet with Web Crypto API...');
    
    try {
        // Import the private key for signing
        const privateKeyBytes = hexToBytes(privateKey);
        
        const cryptoKey = await window.crypto.subtle.importKey(
            'raw',
            privateKeyBytes,
            { name: 'ECDSA', namedCurve: 'P-256' },
            false,
            ['sign']
        );
        
        console.log('✅ Crypto key imported successfully');
        
        // Create wallet object with signing capability
        const wallet = {
            privateKey: privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
            publicKey: address,
            address: address,
            
            // Implement signMessage using Web Crypto API
            signMessage: async function(message) {
                console.log('🔏 Signing message with Web Crypto API:', message);
                
                try {
                    // Convert message to bytes
                    const encoder = new TextEncoder();
                    const messageBytes = encoder.encode(message);
                    
                    // Sign the message
                    const signature = await window.crypto.subtle.sign(
                        { name: 'ECDSA', hash: 'SHA-256' },
                        cryptoKey,
                        messageBytes
                    );
                    
                    const signatureHex = bytesToHex(new Uint8Array(signature));
                    console.log('✅ Message signed with Web Crypto API');
                    return signatureHex;
                } catch (error) {
                    console.error('❌ Signing failed:', error);
                    throw error;
                }
            },
            
            getAddress: function() {
                return this.address;
            }
        };
        
        // Set the wallet in the service
        hyperliquidService.wallet = wallet;
        
        console.log('✅ Web Crypto wallet setup complete!');
        console.log('📊 Wallet address:', wallet.address);
        
        return wallet;
    } catch (error) {
        console.error('❌ Error creating crypto wallet:', error);
        throw error;
    }
}

// Simpler approach - just create a basic wallet that implements the interface
async function createBasicWallet(privateKey, address) {
    console.log('📝 Creating basic wallet...');
    
    try {
        // Simple wallet implementation that just implements the required interface
        const wallet = {
            privateKey: privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`,
            publicKey: address,
            address: address,
            
            // Basic signMessage implementation
            signMessage: async function(message) {
                console.log('🔏 Attempting to sign message:', message);
                
                // For now, let's see what the actual signature requirements are
                // We'll implement proper signing based on what createSignature expects
                console.log('⚠️ Using placeholder signature - checking what format is needed');
                
                // Return a placeholder that matches expected format
                return '0x' + '0'.repeat(130); // Placeholder signature
            },
            
            getAddress: function() {
                return this.address;
            }
        };
        
        // Set the wallet in the service
        hyperliquidService.wallet = wallet;
        
        console.log('✅ Basic wallet setup complete!');
        console.log('📊 Wallet address:', wallet.address);
        
        return wallet;
    } catch (error) {
        console.error('❌ Error creating basic wallet:', error);
        throw error;
    }
}

// Test what signature format is expected
async function testSignatureFormat() {
    console.log('🔍 Testing signature format requirements...');
    
    try {
        // Create basic wallet first
        await createBasicWallet(
            '0x671df21eaff14e1bc928c3f9d9fa8fcc6fb33e7b70659b59c1cf6ff6c09a9a30',
            '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB'
        );
        
        // Test what createSignature expects
        const testAction = {
            type: 'order',
            orders: [{
                coin: 'ETH',
                is_buy: true,
                sz: 0.001,
                limit_px: 2000,
                order_type: { limit: { tif: 'Gtc' } },
                reduce_only: false
            }]
        };
        
        console.log('📤 Testing createSignature with test action...');
        
        // This will show us what the signature method is expected to do
        const signature = await hyperliquidService.createSignature(testAction);
        
        console.log('✅ Signature created:', signature);
        console.log('📊 Signature type:', typeof signature);
        console.log('📊 Signature length:', signature?.length);
        
        return signature;
    } catch (error) {
        console.error('🚨 Signature test error:', error);
        console.log('💡 This error will tell us what signature format is needed');
        throw error;
    }
}

// Try to use the service's internal signing if available
async function tryInternalSigning() {
    console.log('🔍 Checking if service has internal signing...');
    
    // Check what methods are available on the service
    console.log('📊 Available methods on hyperliquidService:');
    console.log(Object.getOwnPropertyNames(hyperliquidService));
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(hyperliquidService)));
    
    // Check if there's a way to sign without wallet.signMessage
    if (typeof hyperliquidService.createSignature === 'function') {
        console.log('✅ createSignature method exists');
        
        // Let's see what it does when called without proper wallet
        try {
            const testAction = { type: 'test' };
            await hyperliquidService.createSignature(testAction);
        } catch (error) {
            console.log('📋 createSignature error (this shows us the requirements):', error.message);
        }
    }
}

console.log('✅ Web Crypto wallet setup ready!');
console.log('📋 Available functions:');
console.log('- testSignatureFormat() - Test what signature format is needed');
console.log('- tryInternalSigning() - Check internal signing methods');
console.log('- createBasicWallet(privateKey, address) - Create simple wallet');

// Auto-run the tests
(async function() {
    console.log('\n🔍 Auto-testing signature requirements...');
    await tryInternalSigning();
    await testSignatureFormat();
})();
