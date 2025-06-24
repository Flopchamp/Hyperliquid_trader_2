// Quick test of the provided keys in the main app
console.log('🔧 Testing provided keys in main application');

const testProvidedKeysInApp = async () => {
  console.log('=== Testing Provided Keys in Main App ===');
  
  const privateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const publicKey = '0x742d35Cc6634C0532925a3b8D0A4E4C7041e2B3e';
  
  console.log('📝 Keys to test:');
  console.log('Private:', privateKey);
  console.log('Public:', publicKey);
  
  // Check format validation first
  console.log('\n🔍 Format validation:');
  
  const privateKeyValid = privateKey.startsWith('0x') && privateKey.length === 66;
  const publicKeyValid = publicKey.startsWith('0x') && publicKey.length === 42;
  
  console.log('Private key format:', privateKeyValid ? '✅ Valid' : '❌ Invalid');
  console.log('Public key format:', publicKeyValid ? '✅ Valid' : '❌ Invalid');
  
  if (!privateKeyValid || !publicKeyValid) {
    console.log('❌ Format validation failed - cannot proceed');
    return;
  }
  
  // Test connection
  if (window.hyperliquidService) {
    console.log('\n🔧 Testing connection...');
    
    try {
      const connected = await window.hyperliquidService.connect(privateKey);
      
      if (connected) {
        console.log('✅ Connection successful');
        
        const derivedAddress = window.hyperliquidService.getWalletAddress();
        console.log('📍 Derived address:', derivedAddress);
        console.log('📍 Provided public key:', publicKey);
        
        const addressMatch = derivedAddress && derivedAddress.toLowerCase() === publicKey.toLowerCase();
        console.log('🔍 Address match:', addressMatch ? '✅ YES' : '❌ NO');
        
        if (addressMatch) {
          console.log('🎉 SUCCESS: Keys correspond correctly!');
          
          // Test account info
          try {
            const accountInfo = await window.hyperliquidService.getAccountInfo();
            console.log('📊 Account info retrieved');
            
            if (accountInfo.marginSummary) {
              const balance = accountInfo.marginSummary.accountValue || '0';
              console.log('💰 Balance:', `$${parseFloat(balance).toFixed(2)}`);
              
              if (parseFloat(balance) > 0) {
                console.log('✅ Account funded - ready for trading!');
              } else {
                console.log('⚠️ Account empty - no funds for trading');
              }
            }
          } catch (accountError) {
            console.log('❌ Account info error:', accountError.message);
          }
          
          // Test a small order to see what happens
          console.log('\n🧪 Testing order placement...');
          try {
            const orderResult = await window.hyperliquidService.placeMarketOrder('ETH', 'buy', 0.001);
            console.log('🎉 Order placed successfully:', orderResult);
          } catch (orderError) {
            console.log('❌ Order error:', orderError.message);
            
            if (orderError.message.includes('balance') || orderError.message.includes('insufficient')) {
              console.log('💡 Order failed due to insufficient balance (this is expected)');
              console.log('✅ But the order format and API connection are working!');
            }
          }
          
        } else {
          console.log('❌ ERROR: Keys do not correspond!');
          console.log(`💡 The private key derives address: ${derivedAddress}`);
          console.log(`💡 But you provided public key: ${publicKey}`);
        }
        
        window.hyperliquidService.disconnect();
        console.log('🔌 Disconnected');
        
      } else {
        console.log('❌ Connection failed');
      }
      
    } catch (error) {
      console.log('❌ Connection error:', error.message);
    }
    
  } else {
    console.log('❌ Hyperliquid service not available');
  }
  
  console.log('\n📋 Instructions for using in main app:');
  console.log('1. Go to the main app (http://localhost:5174)');
  console.log('2. Click "Add Account" to create an account slot');
  console.log('3. Click on the account card to expand it');
  console.log('4. Enter the private key in the password field');
  console.log('5. Enter the public key in the text field');
  console.log('6. Click "Connect"');
  console.log('7. If keys correspond, account will show ACTIVE status');
  console.log('8. Real-time balance updates will begin');
};

// Auto-run test
setTimeout(testProvidedKeysInApp, 3000);
