// Final comprehensive test of the new order format
console.log('🚀 Testing New Order Format Implementation');

const testNewFormat = async () => {
  console.log('=== New Format Test ===');
  
  // First, setup the real wallet if available
  if (window.hyperliquidService && window.hyperliquidService.wallet) {
    console.log('✅ Service and wallet available');
    console.log('📍 Wallet address:', window.hyperliquidService.wallet.address);
    
    try {
      // Test account info
      console.log('🔍 Testing account info...');
      const accountInfo = await window.hyperliquidService.getAccountInfo();
      console.log('✅ Account info retrieved:', accountInfo);
      
      // Test asset mapping
      console.log('🔍 Testing asset mapping...');
      const service = window.hyperliquidService;
      
      // Access the private method for testing (we made createSignature public)
      const testAction = {
        type: 'order',
        orders: [{
          a: 0, // we'll test with asset 0 first
          b: true,
          p: "1000000",
          s: "0.001",
          r: false,
          t: { limit: { tif: 'Ioc' } },
          c: null
        }]
      };
      
      console.log('🔍 Testing signature creation...');
      const signature = await service.createSignature(testAction);
      console.log('✅ Signature created:', signature);
      console.log('📊 Signature type:', typeof signature);
      console.log('📊 Signature has r,s,v:', signature.r && signature.s && signature.v);
      
      // Now test the actual order placement
      console.log('🔍 Testing order placement...');
      
      try {
        const orderResult = await service.placeMarketOrder('ETH', 'buy', 0.001);
        console.log('🎉 Order placed successfully!', orderResult);
        
      } catch (orderError) {
        console.log('❌ Order placement error:', orderError.message);
        
        // Check what type of error it is
        if (orderError.message.includes('deserialize')) {
          console.log('💡 Still getting deserialization error - format might need more work');
        } else if (orderError.message.includes('signature')) {
          console.log('💡 Signature error - authentication issue');
        } else if (orderError.message.includes('balance')) {
          console.log('✅ Balance error - this means format and auth are working!');
        } else if (orderError.message.includes('asset')) {
          console.log('💡 Asset error - asset mapping might be wrong');
        } else {
          console.log('💡 Different error type:', orderError.message);
        }
      }
      
    } catch (error) {
      console.error('❌ Test error:', error);
    }
    
  } else {
    console.log('❌ Service or wallet not available');
    console.log('Available:', {
      service: !!window.hyperliquidService,
      wallet: !!window.hyperliquidService?.wallet
    });
  }
};

// Wait for service to be ready
const waitForServiceAndTest = () => {
  if (window.hyperliquidService && window.hyperliquidService.wallet) {
    testNewFormat();
  } else {
    console.log('⏳ Waiting for service...');
    setTimeout(waitForServiceAndTest, 1000);
  }
};

console.log('Starting test in 2 seconds...');
setTimeout(waitForServiceAndTest, 2000);
