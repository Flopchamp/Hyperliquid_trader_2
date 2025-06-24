import { useState, useEffect } from "react";
import TP from "./TP/TP";

interface TakeProfitLevel {
  size: number | undefined;
  profit: number | undefined;
  enabled: boolean;
}

const Profits = () => {
  const [profitNum] = useState<number>(7);
  const [takeProfitLevels, setTakeProfitLevels] = useState<TakeProfitLevel[]>(
    Array(profitNum).fill(null).map(() => ({ size: undefined, profit: undefined, enabled: false }))
  );
  const [clickedProfits, setClickedProfits] = useState<boolean>(false);

  const items = Array.from({ length: profitNum }, (_, i) => i);

  // Enable/disable all TP levels when TP Step is toggled
  useEffect(() => {
    if (clickedProfits) {
      setTakeProfitLevels(prev => prev.map(level => ({ ...level, enabled: true })));
    } else {
      setTakeProfitLevels(prev => prev.map(level => ({ ...level, enabled: false })));
    }
  }, [clickedProfits]);

  const handleSizeChange = (index: number, value: string) => {
    setTakeProfitLevels(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], size: value === "" ? undefined : Number(value) };
      return updated;
    });
  };

  const handleProfitChange = (index: number, value: string) => {
    setTakeProfitLevels(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], profit: value === "" ? undefined : Number(value) };
      return updated;
    });
  };

  const handleReset = (index: number) => {
    setTakeProfitLevels(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], size: undefined, profit: undefined };
      return updated;
    });
  };

  const toggleRowEnabled = (index: number) => {
    setTakeProfitLevels(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], enabled: !updated[index].enabled };
      return updated;
    });
  };

  // Calculate total size and average profit
  const enabledLevels = takeProfitLevels.filter(level => level.enabled && level.size && level.profit);
  const totalSize = enabledLevels.reduce((sum, level) => sum + (level.size || 0), 0);
  const averageProfit = enabledLevels.length > 0 
    ? enabledLevels.reduce((sum, level) => sum + (level.profit || 0), 0) / enabledLevels.length 
    : 0;

  return (
    <>
      <TP clickedProfits={clickedProfits} setClickedProfits={setClickedProfits} />
      
      {/* Summary Stats */}
      {enabledLevels.length > 0 && (
        <div className="bg-gray-800 p-3 rounded-md mb-3 text-sm">
          <div className="flex justify-between text-white">
            <span>Active TP Levels: {enabledLevels.length}</span>
            <span>Total Size: {totalSize.toFixed(2)}</span>
            <span>Avg Profit: {averageProfit.toFixed(1)}%</span>
          </div>
        </div>
      )}
      
      <article className="flex flex-col gap-3 -mt-5">
        {items.map((item) => {
          const level = takeProfitLevels[item];
          const isEnabled = clickedProfits || level.enabled;
          return (
            <div key={item} className="line">
              <div className="inputLeft">
                <label className="relative cursor-pointer flex">
                  <input
                    type="checkbox"
                    checked={level.enabled}
                    onChange={() => toggleRowEnabled(item)}
                    className="cursor-pointer peer appearance-none h-[22px] w-[22px] shrink-0 rounded-xs border-2 border-[#787b7f] bg-transparent checked:bg-blue-500 checked:border-blue-500"
                  />
                  <svg
                    className="absolute left-1 top-1 h-4 w-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </label>
                <input
                  type="number"
                  value={level.size ?? ""}
                  disabled={!isEnabled}
                  readOnly={!isEnabled}
                  onChange={(e) => handleSizeChange(item, e.target.value)}
                  className={`placeholder:text-[rgba(255,255,255,0.60)] w-full text-white outline-none ${isEnabled ? "" : "bg-gray-800"}`}
                  placeholder="Enter size"
                />
              </div>
              <div className="inputRight">
                <input
                  type="number"
                  value={level.profit ?? ""}
                  disabled={!isEnabled}
                  readOnly={!isEnabled}
                  onChange={(e) => handleProfitChange(item, e.target.value)}
                  className={`flex-grow placeholder:text-[rgba(255,255,255,0.60)] w-full text-white outline-none ${isEnabled ? "" : "bg-gray-800"}`}
                  placeholder="Enter profit %"
                />
                <button
                  onClick={() => handleReset(item)}
                  disabled={!isEnabled}
                  className={`py-[5px] px-2.5 text-sm rounded-[4px] transition-colors ${
                    isEnabled 
                      ? "bg-[rgba(240,185,11,0.30)] text-[#FFC200] hover:bg-[rgba(240,185,11,0.50)]" 
                      : "bg-gray-700 text-gray-500"
                  }`}
                >
                  Reset
                </button>
              </div>
            </div>
          );
        })}
      </article>
    </>
  );
};

export default Profits;
