// Test to check asset mapping and proper format
console.log('=== Asset Mapping and Format Test ===');

const testAssetMapping = async () => {
  console.log('Testing asset mapping...');
  
  try {
    // Get the meta information to see asset mapping
    const metaResponse = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'meta'
      })
    });
    
    const meta = await metaResponse.json();
    console.log('Meta response:', meta);
    
    // Look for ETH in the universe
    if (meta.universe) {
      const ethInfo = meta.universe.find(item => item.name === 'ETH');
      console.log('ETH asset info:', ethInfo);
      
      // Check if there's an asset index or ID
      console.log('All assets:', meta.universe.map((item, index) => ({
        index,
        name: item.name,
        ...item
      })));
    }
    
  } catch (error) {
    console.error('Error fetching meta info:', error);
  }
};

// Test with your real wallet if available
const testWithRealWallet = async () => {
  if (window.hyperliquidService && window.hyperliquidService.wallet) {
    console.log('Testing with real wallet...');
    
    try {
      // Get account info first
      const accountInfo = await window.hyperliquidService.getAccountInfo();
      console.log('Account info:', accountInfo);
      
      // Try to get balance information
      const balance = await window.hyperliquidService.getAccountBalance();
      console.log('Balance:', balance);
      
    } catch (error) {
      console.error('Error with real wallet test:', error);
    }
  } else {
    console.log('No real wallet connected');
  }
};

// Run tests
testAssetMapping();
setTimeout(testWithRealWallet, 2000);
