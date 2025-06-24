// Verify Key Correspondence Test
console.log('🔍 Testing Key Correspondence');

const testKeyCorrespondence = async () => {
  console.log('=== Key Correspondence Verification ===');
  
  const providedPrivateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const providedPublicKey = '0x742d35Cc6634C0532925a3b8D0A4E4C7041e2B3e';
  
  console.log('📝 Testing with provided keys:');
  console.log('Private Key:', providedPrivateKey);
  console.log('Public Key:', providedPublicKey);
  
  // Check if service is available
  if (!window.hyperliquidService) {
    console.log('❌ Hyperliquid service not available');
    return;
  }
  
  try {
    console.log('🔧 Attempting connection with provided keys...');
    
    // Try to connect with the private key
    const connected = await window.hyperliquidService.connect(providedPrivateKey);
    
    if (connected) {
      console.log('✅ Connection successful with private key');
      
      // Get the actual wallet address derived from the private key
      const derivedAddress = window.hyperliquidService.getWalletAddress();
      console.log('📍 Derived address from private key:', derivedAddress);
      console.log('📍 Provided public key:', providedPublicKey);
      
      // Check if they match
      const addressesMatch = derivedAddress && derivedAddress.toLowerCase() === providedPublicKey.toLowerCase();
      
      if (addressesMatch) {
        console.log('✅ SUCCESS: Keys correspond to each other!');
        console.log('🎯 The private key correctly derives the provided public key');
        
        // Test account info
        try {
          console.log('🔍 Testing account info retrieval...');
          const accountInfo = await window.hyperliquidService.getAccountInfo();
          
          if (accountInfo && accountInfo.marginSummary) {
            const balance = accountInfo.marginSummary.accountValue || '0';
            console.log('💰 Account balance:', `$${parseFloat(balance).toFixed(2)}`);
            
            if (parseFloat(balance) > 0) {
              console.log('✅ Account has funds - trading should work!');
            } else {
              console.log('⚠️ Account has no funds - orders will fail');
            }
          } else {
            console.log('📊 Account structure:', accountInfo);
          }
          
        } catch (accountError) {
          console.log('❌ Error getting account info:', accountError.message);
          console.log('💡 This might indicate the account is not funded or not on the correct network');
        }
        
      } else {
        console.log('❌ ERROR: Keys do NOT correspond!');
        console.log('💡 The private key does not derive the provided public key');
        console.log('🔧 Expected public key for this private key:', derivedAddress);
      }
      
      // Disconnect after test
      window.hyperliquidService.disconnect();
      console.log('🔌 Disconnected after test');
      
    } else {
      console.log('❌ Connection failed with private key');
      console.log('💡 This could mean:');
      console.log('   • Invalid private key format');
      console.log('   • Network connectivity issues');
      console.log('   • Service configuration problems');
    }
    
  } catch (error) {
    console.log('❌ Error during key test:', error.message);
    console.log('💡 Error details:', error);
  }
  
  // Security analysis
  console.log('\n🔒 Security Analysis:');
  
  // Check if this looks like a test key
  const isTestPattern = providedPrivateKey.includes('0123456789abcdef');
  console.log(`Test Pattern Detected: ${isTestPattern ? '⚠️ YES' : '✅ NO'}`);
  
  if (isTestPattern) {
    console.log('⚠️ WARNING: This appears to be a test/example key');
    console.log('💡 Test keys should not hold real funds');
  }
  
  console.log('\n📋 Recommendations:');
  if (isTestPattern) {
    console.log('1. ✅ Safe to use for testing the interface');
    console.log('2. ⚠️ Do not deposit real funds to this address');
    console.log('3. 🔧 Use for development and testing only');
  } else {
    console.log('1. 🔒 Never share real private keys publicly');
    console.log('2. 💰 Only use with funded accounts for real trading');
    console.log('3. 🛡️ Store private keys securely');
  }
  
  return {
    keysCorrespond: false, // Will be updated based on actual test
    connectionSuccessful: false,
    isTestPattern: isTestPattern
  };
};

// Auto-run test
setTimeout(testKeyCorrespondence, 2000);
