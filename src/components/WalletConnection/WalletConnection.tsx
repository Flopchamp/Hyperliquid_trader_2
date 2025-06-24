import React, { useState, useEffect } from 'react';
import { hyperliquidService } from '../../services/hyperliquid';
import './WalletConnection.css';

interface WalletConnectionProps {
  onConnectionChange?: (connected: boolean, address?: string) => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ onConnectionChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check initial connection status
    updateConnectionStatus();

    // Listen for connection events
    const handleConnected = (data: { address: string }) => {
      setIsConnected(true);
      setWalletAddress(data.address);
      setError(null);
      onConnectionChange?.(true, data.address);
    };

    const handleError = (data: { error: string }) => {
      setError(data.error);
      setIsConnecting(false);
    };

    hyperliquidService.on('connected', handleConnected);
    hyperliquidService.on('error', handleError);

    return () => {
      hyperliquidService.off('connected', handleConnected);
      hyperliquidService.off('error', handleError);
    };
  }, [onConnectionChange]);

  const updateConnectionStatus = () => {
    const connected = hyperliquidService.isWalletConnected();
    const address = hyperliquidService.getWalletAddress();
    
    setIsConnected(connected);
    setWalletAddress(address);
  };

  const handleConnect = async () => {
    if (!privateKey.trim()) {
      setError('Please enter a private key');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const success = await hyperliquidService.connect(privateKey);
      if (!success) {
        setError('Failed to connect wallet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    hyperliquidService.disconnect();
    setIsConnected(false);
    setWalletAddress(null);
    setPrivateKey('');
    setError(null);
    onConnectionChange?.(false);
  };

  const generateTestKey = () => {
    // Generate a random private key for testing
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const testKey = '0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    setPrivateKey(testKey);
  };

  if (isConnected && walletAddress) {
    return (
      <div className="wallet-connection connected">
        <div className="wallet-status">
          <span className="status-indicator connected">●</span>
          <span className="status-text">Connected</span>
        </div>
        <div className="wallet-address">
          {walletAddress.substring(0, 6)}...{walletAddress.substring(-4)}
        </div>
        <button 
          className="disconnect-btn"
          onClick={handleDisconnect}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connection disconnected">
      <div className="wallet-status">
        <span className="status-indicator disconnected">●</span>
        <span className="status-text">
          {isConnecting ? 'Connecting...' : 'Not Connected'}
        </span>
      </div>
      
      <div className="connection-form">
        <div className="input-group">
          <input
            type="password"
            placeholder="Private Key (testnet only!)"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            disabled={isConnecting}
          />
          <button 
            className="generate-btn"
            onClick={generateTestKey}
            disabled={isConnecting}
            title="Generate test private key"
          >
            🎲
          </button>
        </div>
        
        <button 
          className="connect-btn"
          onClick={handleConnect}
          disabled={isConnecting || !privateKey.trim()}
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="warning">
        ⚠️ Use testnet keys only! Never use mainnet private keys for testing.
      </div>
    </div>
  );
};

export default WalletConnection;
