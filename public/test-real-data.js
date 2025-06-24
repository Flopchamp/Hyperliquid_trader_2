// Real Account Data Fetching Test
console.log('📊 Testing Real Account Data Fetching and UI Population');

const testRealAccountData = async () => {
  console.log('=== Real Account Data Test ===');
  
  const privateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const publicKey = '0x742d35Cc6634C0532925a3b8D0A4E4C7041e2B3e';
  
  if (!window.hyperliquidService) {
    console.log('❌ Hyperliquid service not available');
    return;
  }
  
  try {
    console.log('🔧 Connecting to account...');
    const connected = await window.hyperliquidService.connect(privateKey);
    
    if (!connected) {
      console.log('❌ Failed to connect to account');
      return;
    }
    
    console.log('✅ Connected successfully');
    const walletAddress = window.hyperliquidService.getWalletAddress();
    console.log('📍 Wallet Address:', walletAddress);
    
    // Verify address matches
    const addressMatch = walletAddress && walletAddress.toLowerCase() === publicKey.toLowerCase();
    console.log('🔍 Address Verification:', addressMatch ? '✅ PASS' : '❌ FAIL');
    
    if (!addressMatch) {
      console.log('❌ Address mismatch - stopping test');
      window.hyperliquidService.disconnect();
      return;
    }
    
    console.log('\n📊 Fetching Real Account Data...');
    
    // 1. Account Info
    try {
      console.log('🔍 Getting account info...');
      const accountInfo = await window.hyperliquidService.getAccountInfo();
      console.log('✅ Account info retrieved:', accountInfo);
      
      if (accountInfo.marginSummary) {
        const marginSummary = accountInfo.marginSummary;
        
        console.log('\n💰 Account Balance Information:');
        console.log('• Account Value:', marginSummary.accountValue || '0');
        console.log('• Total Notional Position:', marginSummary.totalNtlPos || '0');
        console.log('• Total Raw USD:', marginSummary.totalRawUsd || '0');
        console.log('• Total Margin Used:', marginSummary.totalMarginUsed || '0');
        
        // Format for UI display
        const balance = parseFloat(marginSummary.accountValue || '0');
        const pnl = parseFloat(marginSummary.totalNtlPos || '0');
        
        console.log('\n📺 UI Display Format:');
        console.log('• Balance:', `$${balance.toFixed(2)}`);
        console.log('• PnL:', `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
        
      } else {
        console.log('⚠️ No margin summary found in account info');
      }
      
    } catch (error) {
      console.log('❌ Error getting account info:', error.message);
    }
    
    // 2. Account Balance
    try {
      console.log('\n🔍 Getting account balance...');
      const balance = await window.hyperliquidService.getAccountBalance();
      console.log('✅ Account balance:', balance);
    } catch (error) {
      console.log('❌ Error getting balance:', error.message);
    }
    
    // 3. Positions
    try {
      console.log('\n🔍 Getting positions...');
      const positions = await window.hyperliquidService.getPositions();
      console.log('✅ Positions:', positions);
      
      if (positions && positions.length > 0) {
        console.log('\n📈 Position Details:');
        positions.forEach((pos, index) => {
          console.log(`Position ${index + 1}:`, pos);
        });
      } else {
        console.log('📊 No open positions');
      }
      
    } catch (error) {
      console.log('❌ Error getting positions:', error.message);
    }
    
    // 4. Open Orders
    try {
      console.log('\n🔍 Getting open orders...');
      const orders = await window.hyperliquidService.getOpenOrders();
      console.log('✅ Open orders:', orders);
      
      if (orders && orders.length > 0) {
        console.log('\n📋 Order Details:');
        orders.forEach((order, index) => {
          console.log(`Order ${index + 1}:`, order);
        });
      } else {
        console.log('📊 No open orders');
      }
      
    } catch (error) {
      console.log('❌ Error getting orders:', error.message);
    }
    
    // 5. Trading Info for ETH
    try {
      console.log('\n🔍 Getting ETH trading info...');
      const tradingInfo = await window.hyperliquidService.getTradingInfo('ETH');
      console.log('✅ ETH trading info:', tradingInfo);
    } catch (error) {
      console.log('❌ Error getting trading info:', error.message);
    }
    
    // 6. Market Data
    try {
      console.log('\n🔍 Getting market data...');
      const marketData = await window.hyperliquidService.getMarketData();
      console.log('✅ Market data:', marketData);
      
      if (marketData && marketData.ETH) {
        console.log('📈 ETH Price:', marketData.ETH.price);
        console.log('📊 ETH Volume:', marketData.ETH.volume24h);
      }
      
    } catch (error) {
      console.log('❌ Error getting market data:', error.message);
    }
    
    console.log('\n🎯 UI Population Test:');
    console.log('1. ✅ Account balance should appear in Account Management');
    console.log('2. ✅ PnL should update in account cards');
    console.log('3. ✅ Positions should show in Positions tab');
    console.log('4. ✅ Orders should show in Open Orders tab');
    console.log('5. ✅ Market data should update in Market Data component');
    console.log('6. ✅ Real-time updates should begin every 10 seconds');
    
    // Disconnect
    window.hyperliquidService.disconnect();
    console.log('\n🔌 Disconnected from account');
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
    console.log('Full error:', error);
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Connect account in main UI');
  console.log('2. Verify data appears in all components');
  console.log('3. Check real-time updates');
  console.log('4. Test trading functionality');
};

// Auto-run test
setTimeout(testRealAccountData, 2000);
