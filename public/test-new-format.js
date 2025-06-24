// Test the new order format for Hyperliquid
console.log('=== Testing New Order Format ===');

// Wait for the service to be available
const waitForService = () => {
  return new Promise((resolve) => {
    const checkService = () => {
      if (window.hyperliquidService) {
        resolve(window.hyperliquidService);
      } else {
        setTimeout(checkService, 100);
      }
    };
    checkService();
  });
};

waitForService().then(async (service) => {
  console.log('Service available, testing new order format...');
  
  // Test with a very small order
  try {
    console.log('Attempting to place a small test order...');
    
    const testOrder = await service.placeMarketOrder('ETH', 'buy', 0.001);
    console.log('Order placed successfully!', testOrder);
    
  } catch (error) {
    console.log('Order error details:', error);
    
    // Log the full error response
    if (error.message && error.message.includes('HTTP')) {
      console.log('This is an HTTP error, likely format or validation issue');
    }
    
    if (error.message && error.message.includes('JSON')) {
      console.log('Still a JSON parsing error - need to check format more');
    }
    
    if (error.message && error.message.includes('signature')) {
      console.log('Signature error - need to fix signing format');
    }
  }
  
  // Also test getting account info to confirm connection
  try {
    console.log('Testing account info...');
    const accountInfo = await service.getAccountInfo();
    console.log('Account info:', accountInfo);
  } catch (error) {
    console.log('Account info error:', error);
  }
});

console.log('Test script loaded, waiting for service...');
