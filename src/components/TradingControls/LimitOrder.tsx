import * as Slider from "@radix-ui/react-slider"
import { useState } from "react";
import { type Type } from "./Market&Limit/Market";

interface LimitOrderProps {
    limitPrice?: number;
    setLimitPrice?: (price: number) => void;
    positionSize?: number;
    setPositionSize?: (size: number) => void;
    stopLoss?: number;
    setStopLoss?: (stopLoss: number) => void;
}

export const LimitOrder = ({ 
    limitPrice: propLimitPrice, 
    setLimitPrice: propSetLimitPrice,
    positionSize: propPositionSize,
    setPositionSize: propSetPositionSize,
    stopLoss: propStopLoss,
    setStopLoss: propSetStopLoss
}: LimitOrderProps) => {

    // Local state for fallback
    const [localLimitPrice, setLocalLimitPrice] = useState<number>(0);
    const [localStopLoss, setLocalStopLoss] = useState<number[] | undefined>(undefined);
    const [localPositionSize, setLocalPositionSize] = useState<number[] | undefined>(undefined);
    const [type, setType] = useState<Type>("Limit");
    const [triggerPrice, setTriggerPrice] = useState<number>(0);
    const [stopPrice, setStopPrice] = useState<number>(0);

    // Use props if provided, otherwise use local state
    const limitPrice = propLimitPrice ?? localLimitPrice;
    const setLimitPrice = propSetLimitPrice ?? setLocalLimitPrice;
    
    const stopLoss = propStopLoss ?? localStopLoss?.[0];
    const setStopLoss = propSetStopLoss ?? ((val: number) => setLocalStopLoss([val]));
    
    const positionSize = propPositionSize ?? localPositionSize?.[0];
    const setPositionSize = propSetPositionSize ?? ((val: number) => setLocalPositionSize([val]));

  return (
    <>
          <div className="flex flex-col gap-1.5">
              <h1 className="text-white text-xl font-bold">Limit order</h1>
              <input 
                  type="number" 
                  placeholder="Enter price" 
                  value={limitPrice || ""} 
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className={`orderInput`} 
              />
          </div>
          <div className="flex flex-col">
              <p className="text-[rgba(255,255,255,0.70)] text-xs">Position Size: <span className="text-white">{positionSize || 0}</span></p>
              <div className="flex justify-between items-center gap-5">
                  <Slider.Root 
                      value={positionSize ? [positionSize] : [0]} 
                      min={0} 
                      max={1000} 
                      step={1} 
                      onValueChange={([val]) => setPositionSize(val)} 
                      className="relative flex items-center select-none touch-none w-full h-8"
                  >
                      <Slider.Track className="bg-[#E5E5E5] relative grow rounded-full h-2">
                          <Slider.Range className={`absolute h-full rounded-full bg-[#F0B90B]`} />
                      </Slider.Track>
                      <Slider.Thumb className={`block w-4 h-4 rounded-full focus:outline-none`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="outline-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
                              <path d="M8 15.4998C12.1421 15.4998 15.5 12.1419 15.5 7.99986C15.5 3.8577 12.1421 0.499847 8 0.499847C3.85788 0.499847 0.5 3.8577 0.5 7.99986C0.5 12.1419 3.85788 15.4998 8 15.4998Z" fill="#F0B90B" />
                          </svg>
                      </Slider.Thumb>
                  </Slider.Root>
                  <p className="text-sm text-[rgba(255,255,255,0.70)]">or</p>
                  <input
                      type="number"
                      placeholder="Enter size"
                      value={positionSize || ""}
                      onChange={(e) => setPositionSize(parseFloat(e.target.value) || 0)}
                      className={`text-white max-w-[104px] min-w-0 w-full py-2 px-4 rounded-[4px] placeholder:text-[rgba(255,255,255,0.60)] border border-[rgba(255,255,255,0.25)]`}
                  />
              </div>
          </div>

          <div className="border-t border-[#373A45] pt-[19px]">
              <p className="text-[rgba(255,255,255,0.70)] text-xs">Stop Loss: <span className="text-white">{stopLoss ?? ""}%</span></p>
              <div className="flex items-center gap-5">
                  <Slider.Root 
                      value={stopLoss ? [stopLoss] : [0]} 
                      onValueChange={([val]) => setStopLoss(val)} 
                      min={0} 
                      max={100} 
                      step={1}
                      className="relative flex w-full items-center h-5"
                  >
                      <Slider.Track className="bg-[#E5E5E5] relative grow rounded-full h-2">
                          <Slider.Range className="absolute h-full bg-yellow-400 rounded-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-4 h-4 rounded-full focus:outline-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="outline-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
                              <path d="M8 15.4998C12.1421 15.4998 15.5 12.1419 15.5 7.99986C15.5 3.8577 12.1421 0.499847 8 0.499847C3.85788 0.499847 0.5 3.8577 0.5 7.99986C0.5 12.1419 3.85788 15.4998 8 15.4998Z" fill="#F0B90B"/>
                          </svg>
                      </Slider.Thumb>
                  </Slider.Root>
                  <p className="text-sm text-[rgba(255,255,255,0.70)]">or</p>
                  <input
                      type="number"
                      placeholder="Enter %"
                      value={stopLoss ?? ""}
                      onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                      className="text-white max-w-[104px] min-w-0 w-full py-2 px-4 rounded-[4px] placeholder:text-[rgba(255,255,255,0.60)] border border-[rgba(255,255,255,0.25)]"
                  />
              </div>
              <div className={`gap-5 mt-4 ${type === "Market" ? "hidden" : "flex"}`}>
                  <div className="flex flex-col gap-1.5 w-full">
                      <h2 className="text-white font-medium">Trigger Price</h2>
                      <input 
                          type="number" 
                          placeholder="Enter Price" 
                          value={triggerPrice || ""} 
                          onChange={(e) => setTriggerPrice(parseFloat(e.target.value) || 0)}
                          className="inputs" 
                      />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                      <h2 className="text-white font-medium">Stop Price</h2>
                      <input 
                          type="number" 
                          placeholder="Enter Price" 
                          value={stopPrice || ""} 
                          onChange={(e) => setStopPrice(parseFloat(e.target.value) || 0)}
                          className="inputs" 
                      />
                  </div>
              </div>
          </div>
          <div className="flex gap-4 border-b border-[#373A45] pb-4">
              <div onClick={() => setType("Market")} className="flex gap-[4.56px] items-center cursor-pointer">
                  <div className={`w-3 h-3 rounded-full ${type === "Market" ? "bg-[#FFD700]" : "bg-[rgba(255,255,255,0.30)]"}`}></div>
                  <p className="text-[rgba(255,255,255,0.70)]">Market</p>
              </div>
              <div onClick={() => setType("Limit")} className="flex gap-2 items-center cursor-pointer">
                  <div className={`w-3 h-3 rounded-full ${type === "Limit" ? "bg-[#FFD700]" : "bg-[rgba(255,255,255,0.30)]"}`}></div>
                  <p className="text-[rgba(255,255,255,0.90)]">Limit</p>
              </div>
          </div>
    </>
  )
}
