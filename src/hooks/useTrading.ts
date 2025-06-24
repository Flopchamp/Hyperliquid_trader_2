import { useContext } from 'react';
import { TradingContext } from '../contexts/TradingContext';

export function useTrading() {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}
