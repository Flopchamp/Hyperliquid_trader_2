// Debug the actual API request and response with new format
console.log('=== Debugging New Format API Request ===');

const debugApiRequest = async () => {
  const service = window.hyperliquidService;
  if (!service || !service.wallet) {
    console.log('Service or wallet not available');
    return;
  }

  console.log('Wallet address:', service.wallet.address);

  // Create a test order in the new format
  const nonce = Date.now();
  const assetId = 0;
  
  const order = {
    a: assetId, // asset
    b: true, // is_buy (true for buy)
    p: "1000000", // very high price for market buy
    s: "0.001", // size
    r: false, // reduce_only
    t: { limit: { tif: 'Ioc' } }, // order type
    c: null // client order id
  };

  const action = {
    type: 'order',
    orders: [order]
  };

  console.log('Action to sign:', JSON.stringify(action, null, 2));

  try {
    // Test signature creation
    const signature = await service.createSignature(action);
    console.log('Signature created:', signature);

    // Prepare full request body
    const requestBody = {
      action,
      nonce,
      signature
    };

    console.log('Full request body:', JSON.stringify(requestBody, null, 2));

    // Make the actual API call
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    let responseText;
    try {
      responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      // Try to parse as JSON
      const responseJson = JSON.parse(responseText);
      console.log('Parsed response:', responseJson);
      
    } catch (parseError) {
      console.log('Failed to parse response as JSON:', parseError);
      console.log('Response text was:', responseText);
    }

  } catch (error) {
    console.error('Error during API test:', error);
  }
};

// Wait for service and run debug
const waitAndDebug = () => {
  if (window.hyperliquidService && window.hyperliquidService.wallet) {
    debugApiRequest();
  } else {
    console.log('Waiting for service...');
    setTimeout(waitAndDebug, 1000);
  }
};

waitAndDebug();
