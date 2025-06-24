// Service exposure script for browser console testing
console.log('🔧 Hyperliquid Service Exposure Script Loading...');

// Wait for service to be available
function waitForService() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50;
    
    function check() {
      attempts++;
      
      if (window.hyperliquidService) {
        console.log('✅ Hyperliquid service found!');
        resolve(window.hyperliquidService);
        return;
      }
      
      if (attempts >= maxAttempts) {
        console.error('❌ Service not found after maximum attempts');
        reject(new Error('Service not available'));
        return;
      }
      
      console.log(`⏳ Waiting for service... (attempt ${attempts}/${maxAttempts})`);
      setTimeout(check, 100);
    }
    
    check();
  });
}

// Make service available
waitForService().then(service => {
  console.log('🚀 Service ready for testing!');
  console.log('💡 Try these commands:');
  console.log('  hyperliquidService.debugTest()');
  console.log('  hyperliquidService.getMarketData("ETH")');
  console.log('  hyperliquidService.isWalletConnected()');
  
  // Also expose some quick test functions
  window.testMarketData = async () => {
    const data = await service.getMarketData('ETH');
    console.log('📊 ETH Market Data:', data);
    return data;
  };
  
  window.testWalletStatus = () => {
    const connected = service.isWalletConnected();
    const address = service.getWalletAddress();
    console.log('🔗 Wallet Status:', { connected, address });
    return { connected, address };
  };
  
  window.testConnection = async (privateKey) => {
    console.log('🔗 Testing connection...');
    const result = await service.connect(privateKey);
    console.log('Connection result:', result);
    return result;
  };
  
  console.log('✨ Quick test functions added:');
  console.log('  testMarketData()');
  console.log('  testWalletStatus()');
  console.log('  testConnection("0x...")');
  
}).catch(error => {
  console.error('Failed to initialize service:', error);
});
