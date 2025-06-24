import React, { useState, useEffect } from 'react';
import { builderService, type BuilderData } from '../../services/builderService';

interface BuilderSettingsProps {
  className?: string;
}

const BuilderSettings: React.FC<BuilderSettingsProps> = ({ className = '' }) => {
  const [builderData, setBuilderData] = useState<BuilderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [builderAddress, setBuilderAddress] = useState(builderService.getBuilderAddress() || '');
  const [feeRate, setFeeRate] = useState(builderService.getDefaultFeeRate());
  const [showSettings, setShowSettings] = useState(false);

  const fetchBuilderData = async () => {
    if (!builderService.isConfigured()) return;
    
    setLoading(true);
    try {
      const data = await builderService.getBuilderReferralInfo();
      setBuilderData(data);
    } catch (error) {
      console.error('Failed to fetch builder data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilderData();
  }, []);

  const handleSaveSettings = () => {
    if (builderAddress.trim()) {
      builderService.setBuilderAddress(builderAddress.trim());
      builderService.setDefaultFeeRate(feeRate);
      fetchBuilderData();
      setShowSettings(false);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuilderAddress(e.target.value);
  };

  const handleFeeRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
    setFeeRate(value);
  };

  const feeDisplayInfo = builderService.getFeeDisplayInfo();

  if (!builderService.isConfigured() && !showSettings) {
    return (
      <div className={`bg-[#1a1a1a] border border-[#2A3441] rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium text-sm">Builder Revenue</h3>
          <button
            onClick={() => setShowSettings(true)}
            className="text-blue-400 hover:text-blue-300 text-xs font-medium"
          >
            Setup
          </button>
        </div>
        <div className="text-center text-[#A0A9B4] text-xs">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-yellow-400 text-lg">💰</span>
          </div>
          <p>Configure builder codes to earn revenue</p>
          <p className="text-[#6B7280] text-xs mt-1">Up to 0.1% on perps, 1% on spot</p>
        </div>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className={`bg-[#1a1a1a] border border-[#2A3441] rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium text-sm">Builder Settings</h3>
          <button
            onClick={() => setShowSettings(false)}
            className="text-[#A0A9B4] hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-[#A0A9B4] text-xs mb-1">Builder Address</label>
            <input
              type="text"
              value={builderAddress}
              onChange={handleAddressChange}
              placeholder="0x..."
              className="w-full bg-[#0a0a0a] border border-[#2A3441] rounded px-3 py-2 text-white text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
            <label className="block text-[#A0A9B4] text-xs mb-1">
              Fee Rate (tenths of basis points)
            </label>
            <input
              type="number"
              value={feeRate}
              onChange={handleFeeRateChange}
              min="0"
              max="100"
              className="w-full bg-[#0a0a0a] border border-[#2A3441] rounded px-3 py-2 text-white text-xs focus:border-blue-500 focus:outline-none"
            />
            <div className="text-[#6B7280] text-xs mt-1">
              {feeRate} = {builderService.formatFee(feeRate)} fee
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleSaveSettings}
              disabled={!builderAddress.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs py-2 px-3 rounded font-medium"
            >
              Save
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 bg-[#2A3441] hover:bg-[#374151] text-[#A0A9B4] text-xs py-2 px-3 rounded font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#1a1a1a] border border-[#2A3441] rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium text-sm">Builder Revenue</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBuilderData}
            disabled={loading}
            className="text-[#A0A9B4] hover:text-white text-xs"
          >
            {loading ? '↻' : '🔄'}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="text-blue-400 hover:text-blue-300 text-xs"
          >
            ⚙️
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-[#A0A9B4] text-xs py-4">
          <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          Loading...
        </div>
      ) : builderData ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[#A0A9B4] mb-1">Total Fees</div>
              <div className="text-green-400 font-medium">
                ${builderData.totalFeesCollected.toFixed(4)}
              </div>
            </div>
            <div>
              <div className="text-[#A0A9B4] mb-1">Fee Rate</div>
              <div className="text-blue-400 font-medium">
                {feeDisplayInfo.feePercentage}
              </div>
            </div>
          </div>
          
          <div className="bg-[#0a0a0a] rounded p-2 border border-[#2A3441]">
            <div className="text-[#A0A9B4] text-xs mb-1">Builder Address</div>
            <div className="text-white text-xs font-mono break-all">
              {feeDisplayInfo.builderAddress}
            </div>
          </div>
          
          <div className="text-[#6B7280] text-xs">
            💡 Revenue is earned on all trades executed through this app
          </div>
        </div>
      ) : (
        <div className="text-center text-[#A0A9B4] text-xs py-4">
          <div className="text-red-400 mb-2">⚠️</div>
          <p>Failed to load builder data</p>
          <button
            onClick={fetchBuilderData}
            className="text-blue-400 hover:text-blue-300 text-xs mt-1"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default BuilderSettings;
