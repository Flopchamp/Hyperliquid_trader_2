import React from 'react';
import { useTrading } from '../../hooks/useTrading';
import './MarketData.css';

export function MarketData() {
  const { state } = useTrading();
  
  const ethData = state.marketData['ETH'];
  
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="market-data">
      <div className="market-data-header">
        <h3>📊 Live Market Data</h3>
      </div>
      
      <div className="market-data-content">
        {ethData ? (
          <div className="price-card">
            <div className="symbol">
              <span className="symbol-name">ETH</span>
              <span className="symbol-pair">/USDT</span>
            </div>
            
            <div className="price-info">
              <div className="current-price">
                {formatPrice(ethData.price)}
              </div>
              
              <div className="price-details">
                <div className="detail-item">
                  <span className="label">24h Change:</span>
                  <span className={`value ${ethData.change24h >= 0 ? 'positive' : 'negative'}`}>
                    {ethData.change24h >= 0 ? '+' : ''}{ethData.change24h.toFixed(2)}%
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="label">Last Update:</span>
                  <span className="value">{formatTime(ethData.timestamp)}</span>
                </div>
              </div>
            </div>
            
            <div className="status-indicator">
              <div className="live-indicator">
                <span className="live-dot"></span>
                <span>LIVE</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>Loading market data...</span>
          </div>
        )}
      </div>
    </div>
  );
}
