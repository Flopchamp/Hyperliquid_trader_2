import React, { useEffect, useRef, useState, useCallback } from 'react';
import './TradingView.css';
import type { TradingViewWidget, TradingViewChart, TradingViewProps } from './types';
import { hyperliquidSymbolService } from '../../services/hyperliquidSymbols';

const TradingView: React.FC<TradingViewProps> = ({
  symbol = 'BTCUSD',
  interval = '15',
  theme = 'dark',
  height = 500,
  onChartClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<TradingViewWidget | null>(null);
  const chartRef = useRef<TradingViewChart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  // Store current widget config to prevent unnecessary re-initialization
  const currentConfigRef = useRef({ symbol, interval, theme, height });
  const isInitializedRef = useRef(false);
  // Stable symbol mapping function using official Hyperliquid symbols
  const getSymbolForTradingView = useCallback((sym: string): string => {
    // Use the official Hyperliquid symbol service
    return hyperliquidSymbolService.getTradeViewSymbol(sym);
  }, []);

  // Stable cleanup function
  const cleanupWidget = useCallback(() => {
    if (widgetRef.current) {
      try {
        // Clean up event listeners
        const chart = chartRef.current;
        if (chart) {
          const clickHandler = (chart as unknown as Record<string, unknown>)._clickHandler;
          if (clickHandler) {
            window.removeEventListener('message', clickHandler as EventListener);
          }
        }

        // Remove widget
        if (typeof widgetRef.current.remove === 'function') {
          widgetRef.current.remove();
        }
      } catch (error) {
        console.warn('Cleanup error:', error);
        // Force clear container
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      }
      widgetRef.current = null;
      chartRef.current = null;
    }
    isInitializedRef.current = false;
  }, []);

  // Create widget configuration
  const createWidgetConfig = useCallback((config: { symbol: string; interval: string; theme: string; height: number }) => {
    const tradingViewSymbol = getSymbolForTradingView(config.symbol);
    const containerId = containerRef.current?.id || 'tradingview_container';
    
    return {
      container_id: containerId,
      width: '100%',
      height: config.height,
      symbol: tradingViewSymbol,
      interval: config.interval,
      timezone: 'Etc/UTC',
      theme: config.theme,
      style: '1',
      locale: 'en',
      toolbar_bg: config.theme === 'dark' ? '#1a1a1a' : '#ffffff',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      studies: ['Volume@tv-basicstudies'],
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
      no_referral_id: true,
      overrides: {
        'paneProperties.background': config.theme === 'dark' ? '#0a0e13' : '#ffffff',
        'paneProperties.backgroundType': 'solid',
        'paneProperties.gridProperties.color': config.theme === 'dark' ? '#1a1a1a' : '#e0e3e7',
        'paneProperties.vertGridProperties.color': config.theme === 'dark' ? '#1a1a1a' : '#e0e3e7',
        'paneProperties.horzGridProperties.color': config.theme === 'dark' ? '#1a1a1a' : '#e0e3e7',
        'mainSeriesProperties.candleStyle.upColor': '#00ff4c',
        'mainSeriesProperties.candleStyle.downColor': '#ff4757',
        'mainSeriesProperties.candleStyle.borderUpColor': '#00ff4c',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ff4757',
        'mainSeriesProperties.candleStyle.wickUpColor': '#00ff4c',
        'mainSeriesProperties.candleStyle.wickDownColor': '#ff4757',
        'volumePaneSize': 'medium',
        'volume.volume.color.0': '#ff4757',
        'volume.volume.color.1': '#00ff4c',
        'scalesProperties.backgroundColor': config.theme === 'dark' ? '#0a0e13' : '#ffffff',
        'scalesProperties.textColor': config.theme === 'dark' ? '#ffffff' : '#131722',
        'paneProperties.topMargin': 10,
        'paneProperties.bottomMargin': 10,
        'paneProperties.crossHairProperties.color': '#758696',
        'paneProperties.crossHairProperties.width': 1,
        'paneProperties.crossHairProperties.style': 2,
      },
      studies_overrides: {
        'volume.volume.color.0': '#ff4757',
        'volume.volume.color.1': '#00ff4c',
        'volume.volume ma.color': '#758696',
        'volume.volume ma.linewidth': 2,
      },
      loading_screen: {
        backgroundColor: config.theme === 'dark' ? '#0a0e13' : '#ffffff',
        foregroundColor: config.theme === 'dark' ? '#ffffff' : '#131722'
      }
    };
  }, [getSymbolForTradingView]);

  // Initialize widget - STABLE, no prop dependencies
  const initializeWidget = useCallback(() => {
    if (!containerRef.current || !window.TradingView || isInitializedRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      cleanupWidget();

      const config = currentConfigRef.current;
      const widgetConfig = createWidgetConfig(config);

      widgetRef.current = new window.TradingView.widget(widgetConfig);

      if (typeof widgetRef.current.onChartReady === 'function') {
        widgetRef.current.onChartReady(() => {
          setIsLoading(false);
          setError(null);
          isInitializedRef.current = true;
          
          if (widgetRef.current && typeof widgetRef.current.chart === 'function') {
            try {
              const chart = widgetRef.current.chart();
              chartRef.current = chart;
              
              // Setup click handler if provided
              if (onChartClick && chart && typeof chart.onDataLoaded === 'function') {
                chart.onDataLoaded().subscribe(null, () => {
                  setTimeout(() => {
                    const handleChartClick = (event: MessageEvent) => {
                      if (event.data && event.data.type === 'chart_click') {
                        const { price, time } = event.data;
                        onChartClick(price, time);
                      }
                    };
                    
                    window.addEventListener('message', handleChartClick);
                    (chart as unknown as Record<string, unknown>)._clickHandler = handleChartClick;
                  }, 1000);
                });
              }
            } catch (chartError) {
              console.warn('Chart access error:', chartError);
            }
          }
        });
      } else {
        setIsLoading(false);
        isInitializedRef.current = true;
      }

    } catch (err) {
      console.error('Widget initialization error:', err);
      setError('Failed to load chart');
      setIsLoading(false);
    }
  }, [cleanupWidget, createWidgetConfig, onChartClick]);

  // Load TradingView script - runs once
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      setError('Failed to load TradingView library');
      setIsLoading(false);
    };

    if (!document.querySelector('script[src="https://s3.tradingview.com/tv.js"]')) {
      document.head.appendChild(script);
    } else if (window.TradingView) {
      setScriptLoaded(true);
    }

    return cleanupWidget;
  }, [cleanupWidget]);

  // Initialize when script is loaded
  useEffect(() => {
    if (scriptLoaded && !isInitializedRef.current) {
      setTimeout(() => initializeWidget(), 100);
    }
  }, [scriptLoaded, initializeWidget]);

  // Handle prop changes - update config and decide what to do
  useEffect(() => {
    const newConfig = { symbol, interval, theme, height };
    const oldConfig = currentConfigRef.current;
    
    // Only update if there are actual changes
    if (JSON.stringify(newConfig) !== JSON.stringify(oldConfig)) {
      currentConfigRef.current = newConfig;
      
      if (isInitializedRef.current) {
        // For symbol changes, try to use setSymbol if possible
        if (newConfig.symbol !== oldConfig.symbol && chartRef.current) {
          const tradingViewSymbol = getSymbolForTradingView(newConfig.symbol);
          try {
            if (typeof chartRef.current.setSymbol === 'function') {
              chartRef.current.setSymbol(tradingViewSymbol);
              return; // Don't reinitialize for symbol changes
            }
          } catch (e) {
            console.warn('setSymbol failed:', e);
          }
        }
        
        // For theme, interval, or height changes, reinitialize
        if (newConfig.theme !== oldConfig.theme || 
            newConfig.interval !== oldConfig.interval || 
            newConfig.height !== oldConfig.height) {
          isInitializedRef.current = false;
          setTimeout(() => initializeWidget(), 100);
        }
      }
    }
  }, [symbol, interval, theme, height, getSymbolForTradingView, initializeWidget]);

  const uniqueId = `tradingview_${Math.random().toString(36).substr(2, 9)}`;

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-[#0a0e13] border border-gray-800 rounded-lg"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <div className="text-red-400 text-lg mb-2">⚠️ Chart Error</div>
          <div className="text-gray-400 text-sm">{error}</div>
          <button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
              isInitializedRef.current = false;
              initializeWidget();
            }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#0a0e13] rounded-lg overflow-hidden border border-gray-800">
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-[#0a0e13] z-10"
          style={{ height: `${height}px` }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F0B90B] mx-auto mb-3"></div>
            <div className="text-gray-400 text-sm">Loading Chart...</div>
          </div>
        </div>
      )}
      
      <div
        id={uniqueId}
        ref={containerRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />
      
      <div className="absolute top-2 right-2 flex gap-2 z-20">
        <div className="bg-black/50 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
          {symbol.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default TradingView;
