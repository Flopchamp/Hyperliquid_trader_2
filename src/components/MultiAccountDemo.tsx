import React from 'react';
import { useTrading } from '../hooks/useTrading';

const MultiAccountDemo: React.FC = () => {
  const { state, getMultiAccountSummary, placeMultiAccountOrder } = useTrading();
  const multiAccountSummary = getMultiAccountSummary();

  const testMultiAccountOrder = async () => {
    const masterAccount = state.accounts.find(acc => acc.isMaster && acc.isConnected);
    
    if (!masterAccount) {
      alert('No master account found. Please set up accounts first.');
      return;
    }

    try {
      console.log('Testing multi-account order execution...');
      const result = await placeMultiAccountOrder(
        masterAccount.id,
        'ETH',
        'buy',
        0.001,
        'market'
      );
      
      console.log('Multi-account order result:', result);
      alert(`Multi-account order completed!\nSuccess: ${result.success}\nFailed: ${result.failed}`);
    } catch (error) {
      console.error('Multi-account order failed:', error);
      alert('Multi-account order failed: ' + (error as Error).message);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Multi-Account Trading Demo</h2>
      
      {/* Account Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-900/30 p-4 rounded">
          <h3 className="text-blue-400 font-semibold mb-2">Account Summary</h3>
          <div className="text-white text-sm space-y-1">
            <div>Total Accounts: <span className="text-blue-400">{multiAccountSummary.totalAccounts}</span></div>
            <div>Master Accounts: <span className="text-green-400">{multiAccountSummary.masterAccounts}</span></div>
            <div>Subscriber Accounts: <span className="text-purple-400">{multiAccountSummary.subscriberAccounts}</span></div>
            <div>Total Balance: <span className="text-yellow-400">${multiAccountSummary.totalBalance.toFixed(2)}</span></div>
            <div>Total PnL: <span className={multiAccountSummary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
              ${multiAccountSummary.totalPnL.toFixed(2)}
            </span></div>
          </div>
        </div>
        
        <div className="bg-gray-900/50 p-4 rounded">
          <h3 className="text-white font-semibold mb-2">Connected Accounts</h3>
          <div className="space-y-2">
            {multiAccountSummary.accounts.map(account => (
              <div key={account.id} className="text-sm">
                <div className="flex justify-between">
                  <span className="text-white">{account.title}</span>
                  <span className={
                    account.role === 'Master' ? 'text-green-400' :
                    account.role === 'Subscriber' ? 'text-purple-400' : 'text-gray-400'
                  }>
                    {account.role}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{account.pair}</span>
                  <span>{account.balance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="flex gap-4">
        <button
          onClick={testMultiAccountOrder}
          disabled={multiAccountSummary.masterAccounts === 0}
          className={`px-4 py-2 rounded font-semibold ${
            multiAccountSummary.masterAccounts === 0
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          Test Multi-Account Order
        </button>
        
        <div className="flex-1 text-right">
          {multiAccountSummary.masterAccounts === 0 && (
            <p className="text-red-400 text-sm mt-2">
              ⚠️ No master account configured. Set up accounts in Account Management.
            </p>
          )}
          {multiAccountSummary.totalAccounts < 2 && (
            <p className="text-yellow-400 text-sm mt-2">
              💡 Add more accounts to test multi-account functionality.
            </p>
          )}
        </div>
      </div>

      {/* Implementation Status */}
      <div className="mt-6 p-4 bg-green-900/20 rounded border border-green-600">
        <h3 className="text-green-400 font-semibold mb-2">✅ Multi-Account Implementation Complete</h3>
        <ul className="text-sm text-green-300 space-y-1">
          <li>✓ Multi-account order execution across master and subscriber accounts</li>
          <li>✓ Account role management (Master/Subscriber)</li>
          <li>✓ Portfolio aggregation and summary</li>
          <li>✓ Simultaneous position closing and order cancellation</li>
          <li>✓ Real-time multi-account status monitoring</li>
          <li>✓ Enhanced UI with multi-account mode toggle</li>
        </ul>
      </div>
    </div>
  );
};

export default MultiAccountDemo;
