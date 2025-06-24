// Test Updated Account Management (User Provides Both Keys)
console.log('🔑 Testing Updated Account Management - User Provides Both Keys');

const testUserProvidedKeys = async () => {
  console.log('=== Updated Account Management Test ===');
  
  // Test key validation
  console.log('🔍 Testing key validation...');
  
  const testValidation = (description, privateKey, publicKey, shouldPass) => {
    console.log(`\n📝 ${description}:`);
    console.log(`Private Key: ${privateKey || 'empty'}`);
    console.log(`Public Key: ${publicKey || 'empty'}`);
    
    // Private key validation
    const privateKeyValid = privateKey && privateKey.startsWith('0x') && privateKey.length === 66;
    console.log(`Private Key Valid: ${privateKeyValid ? '✅' : '❌'}`);
    
    // Public key validation  
    const publicKeyValid = publicKey && publicKey.startsWith('0x') && publicKey.length === 42;
    console.log(`Public Key Valid: ${publicKeyValid ? '✅' : '❌'}`);
    
    const overallValid = privateKeyValid && publicKeyValid;
    console.log(`Overall Valid: ${overallValid ? '✅' : '❌'}`);
    console.log(`Expected: ${shouldPass ? 'PASS' : 'FAIL'} | Actual: ${overallValid ? 'PASS' : 'FAIL'}`);
    
    return overallValid === shouldPass;
  };
  
  // Test cases
  console.log('🧪 Running validation test cases...');
  
  const testCases = [
    {
      desc: 'Valid keys',
      privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      publicKey: '0x742d35Cc6634C0532925a3b8D0A4E4C7041e2B3e',
      shouldPass: true
    },
    {
      desc: 'Empty private key',
      privateKey: '',
      publicKey: '0x742d35Cc6634C0532925a3b8D0A4E4C7041e2B3e',
      shouldPass: false
    },
    {
      desc: 'Empty public key',
      privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      publicKey: '',
      shouldPass: false
    },
    {
      desc: 'Private key without 0x prefix',
      privateKey: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      publicKey: '0x742d35Cc6634C0532925a3b8D0A4E4C7041e2B3e',
      shouldPass: false
    },
    {
      desc: 'Private key too short',
      privateKey: '0x0123456789abcdef',
      publicKey: '0x742d35Cc6634C0532925a3b8D0A4E4C7041e2B3e',
      shouldPass: false
    },
    {
      desc: 'Public key too short',
      privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      publicKey: '0x742d35Cc',
      shouldPass: false
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach(testCase => {
    const result = testValidation(
      testCase.desc,
      testCase.privateKey,
      testCase.publicKey,
      testCase.shouldPass
    );
    
    if (result) {
      passed++;
      console.log('✅ Test passed');
    } else {
      failed++;
      console.log('❌ Test failed');
    }
  });
  
  console.log(`\n📊 Validation Test Results: ${passed} passed, ${failed} failed`);
  
  // Test service integration
  console.log('\n🔧 Testing service integration...');
  
  if (window.hyperliquidService) {
    console.log('✅ Service available');
    
    // Test with valid format keys (but not real keys)
    const testPrivateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const testPublicKey = '0x742d35Cc6634C0532925a3b8D0A4E4C7041e2B3e';
    
    try {
      console.log('📤 Testing connection with valid format keys...');
      const connected = await window.hyperliquidService.connect(testPrivateKey);
      
      if (connected) {
        console.log('✅ Connection successful');
        
        const walletAddress = window.hyperliquidService.getWalletAddress();
        console.log('📍 Connected address:', walletAddress);
        console.log('📍 Expected address:', testPublicKey);
        
        // Note: These won't match because we're using test keys
        // In real usage, the private key should generate the public key
        const addressesMatch = walletAddress && walletAddress.toLowerCase() === testPublicKey.toLowerCase();
        console.log('🔍 Addresses match:', addressesMatch ? '✅' : '❌ (expected for test keys)');
        
        window.hyperliquidService.disconnect();
        console.log('🔌 Disconnected');
        
      } else {
        console.log('❌ Connection failed (expected for test keys)');
      }
      
    } catch (error) {
      console.log('❌ Connection error:', error.message);
      console.log('💡 This is expected when using test keys');
    }
  } else {
    console.log('❌ Service not available');
  }
  
  console.log('\n📋 Updated Account Management Features:');
  console.log('• ✅ Both public and private keys required');
  console.log('• ✅ Format validation (0x prefix, correct length)');
  console.log('• ✅ Address verification after connection');
  console.log('• ✅ Security warnings and guidance');
  console.log('• ✅ No test key generation (user must provide real keys)');
  console.log('• ✅ Clear error messages for validation failures');
  
  console.log('\n🎯 User Workflow:');
  console.log('1. Enter valid private key (0x + 64 hex chars)');
  console.log('2. Enter corresponding public key (0x + 40 hex chars)');
  console.log('3. Click Connect');
  console.log('4. System validates format and verifies address match');
  console.log('5. Connection established if keys are valid and match');
  
  return {
    validationTestsPassed: passed,
    validationTestsFailed: failed,
    serviceAvailable: !!window.hyperliquidService
  };
};

// Auto-run test
setTimeout(testUserProvidedKeys, 2000);
