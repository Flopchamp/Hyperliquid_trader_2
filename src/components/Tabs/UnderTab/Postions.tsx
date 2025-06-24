import { useState } from "react";
import { useTrading } from "../../../hooks/useTrading";
import { hyperliquidService } from "../../../services/hyperliquid";
import type { Position } from "../../../types/trading";

interface ExtendedPosition extends Position {
    accountId: number;
    accountTitle: string;
}

const Postions = () => {
    const { state, getMultiAccountSummary, closeAllPositions } = useTrading();
    const { positions, activeAccount, accounts } = state;
    const [showAllAccounts, setShowAllAccounts] = useState(false);
    const [loadingActions, setLoadingActions] = useState<{[key: string]: boolean}>({});
    const [showConfirmDialog, setShowConfirmDialog] = useState<{
        show: boolean;
        type: 'close' | 'closeAll' | 'addTo';
        position?: ExtendedPosition;
        accountId?: number;
    }>({ show: false, type: 'close' });
    
    // Position execution handlers
    const handleClosePosition = async (position: ExtendedPosition, accountId: number) => {
        const actionKey = `close-${accountId}-${position.symbol}`;
        setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
        
        try {
            // Place opposite market order to close position
            const side = position.side === 'long' ? 'sell' : 'buy';
            const success = await hyperliquidService.placeMarketOrder(
                position.symbol,
                side,
                position.size
            );
            
            if (success) {
                console.log(`Successfully closed ${position.side} position for ${position.symbol}`);
            } else {
                console.error('Failed to close position');
            }
        } catch (error) {
            console.error('Error closing position:', error);
        } finally {
            setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
            setShowConfirmDialog({ show: false, type: 'close' });
        }
    };
    
    const handleCloseAllPositions = async (accountId: number) => {
        const actionKey = `closeAll-${accountId}`;
        setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
        
        try {
            await closeAllPositions(accountId);
            console.log(`Closed all positions for account ${accountId}`);
        } catch (error) {
            console.error('Error closing all positions:', error);
        } finally {
            setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
            setShowConfirmDialog({ show: false, type: 'closeAll' });
        }
    };
    
    const handleAddToPosition = async (position: ExtendedPosition, accountId: number, percentage: number = 50) => {
        const actionKey = `addTo-${accountId}-${position.symbol}`;
        setLoadingActions(prev => ({ ...prev, [actionKey]: true }));
        
        try {
            const addSize = (position.size * percentage) / 100;
            const success = await hyperliquidService.placeMarketOrder(
                position.symbol,
                position.side === 'long' ? 'buy' : 'sell',
                addSize
            );
            
            if (success) {
                console.log(`Successfully added to ${position.side} position for ${position.symbol}`);
            } else {
                console.error('Failed to add to position');
            }
        } catch (error) {
            console.error('Error adding to position:', error);
        } finally {
            setLoadingActions(prev => ({ ...prev, [actionKey]: false }));
            setShowConfirmDialog({ show: false, type: 'addTo' });
        }
    };
    
    // Get positions for display
    const accountPositions: ExtendedPosition[] = showAllAccounts 
        ? Object.entries(positions).flatMap(([accountId, pos]) => 
            pos.map(position => {
                const account = accounts.find(acc => acc.id === parseInt(accountId));
                return {
                    ...position,
                    accountId: parseInt(accountId),
                    accountTitle: account?.title || `Account ${accountId}`
                };
            })
          )
        : (positions[activeAccount] || []).map(position => ({
            ...position,
            accountId: activeAccount,
            accountTitle: accounts.find(acc => acc.id === activeAccount)?.title || `Account ${activeAccount}`
          }));
    
    const multiAccountSummary = getMultiAccountSummary();
    const hasMultipleAccounts = multiAccountSummary.totalAccounts > 1;

    return (
        <>
            <article className="text-xs inter rounded-[8px] text-[#A0A9B4] mr-[23px]">
                {/* Multi-Account Toggle and Bulk Actions */}
                <div className="bg-[#151C26] p-3 border-b border-[#2A3441]">
                    <div className="flex justify-between items-center">
                        {/* Multi-Account Toggle */}
                        {hasMultipleAccounts && (
                            <div className="flex items-center">
                                <span className="text-blue-400 font-semibold text-sm mr-4">Position View</span>
                                <label className="relative cursor-pointer flex items-center gap-2">
                                    <span className="text-white text-xs">
                                        {showAllAccounts ? `All Accounts (${multiAccountSummary.totalAccounts})` : 'Active Account Only'}
                                    </span>
                                    <input
                                        type="checkbox"
                                        checked={showAllAccounts}
                                        onChange={(e) => setShowAllAccounts(e.target.checked)}
                                        className="cursor-pointer peer appearance-none h-4 w-4 shrink-0 rounded border-2 border-blue-500 bg-transparent checked:bg-blue-500 checked:border-blue-500"
                                    />
                                    <svg
                                        className="absolute right-0.5 top-0.5 h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
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
                            </div>
                        )}
                        
                        {/* Bulk Action Buttons */}
                        {accountPositions.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowConfirmDialog({
                                        show: true,
                                        type: 'closeAll',
                                        accountId: showAllAccounts ? undefined : activeAccount
                                    })}
                                    disabled={loadingActions[`closeAll-${showAllAccounts ? 'all' : activeAccount}`]}
                                    className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors text-white font-medium"
                                >
                                    {loadingActions[`closeAll-${showAllAccounts ? 'all' : activeAccount}`] 
                                        ? 'Closing All...' 
                                        : `Close All ${showAllAccounts ? 'Positions' : 'Account Positions'}`
                                    }
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex overflow-x-auto no-scrollbar border-b border-[#2A3441] gap-4 bg-[#151C26] p-[12px_24px_13px_24px] justify-between items-center font-medium">
                    {showAllAccounts && <div className="flex items-center">Account</div>}
                    <div className="flex items-center">Coin</div>
                    <div className="pr-8 flex items-center">Size</div>
                    <div className="pr-8 flex items-center">Position Value</div>
                    <div className="flex gap-3 items-center flex-row-reverse">
                        <p>Entry Price</p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M12 12H0V0H12V12Z"/>
                            <path d="M5.47012 9.52949C5.76309 9.82246 6.23887 9.82246 6.53184 9.52949L11.0318 5.02949C11.3248 4.73652 11.3248 4.26074 11.0318 3.96777C10.7389 3.6748 10.2631 3.6748 9.97012 3.96777L5.9998 7.93809L2.02949 3.97012C1.73652 3.67715 1.26074 3.67715 0.967773 3.97012C0.674805 4.26309 0.674805 4.73887 0.967773 5.03184L5.46777 9.53184L5.47012 9.52949Z" fill="#A0A9B4" />
                        </svg>
                    </div>
                    
                    <div className="flex items-center">Mark Price</div>
                    <div className="p-[0px_24.625px]"><p className="border-dashed border-b border-[#A0A9B4]">PNL (ROE%)</p></div>
                    <div className="flex items-center">Leverage</div>
                    <div className="flex items-center">Type</div>
                    <div className="flex items-center min-w-[200px]">Actions</div>
                </div>
                <article className="flex flex-col justify-center items-center h-[588px]">
                    {accountPositions.length === 0 ? (
                        <div className="text-center text-[#A0A9B4]">
                            <p className="text-sm">No positions found</p>
                            <p className="text-xs mt-2">
                                {showAllAccounts ? 'No positions across all accounts' : 'Connect an account to view positions'}
                            </p>
                        </div>
                    ) : (
                        <div className="w-full">
                            {accountPositions.map((position, index) => (
                                <div key={`${position.accountId}-${index}`} className="flex overflow-x-auto no-scrollbar border-b border-[#2A3441] gap-4 p-[12px_24px_13px_24px] justify-between items-center text-white">
                                    {showAllAccounts && (
                                        <div className="flex items-center font-medium min-w-[80px]">
                                            <span className="text-blue-400">{position.accountTitle}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center font-medium">{position.symbol}</div>
                                    <div className="pr-8 flex items-center">
                                        <span className={position.side === 'long' ? 'text-green-500' : 'text-red-500'}>
                                            {position.side === 'long' ? '+' : '-'}{Math.abs(position.size)}
                                        </span>
                                    </div>
                                    <div className="pr-8 flex items-center">${(position.size * position.markPrice).toFixed(2)}</div>
                                    <div className="flex items-center">${position.entryPrice.toFixed(2)}</div>
                                    <div className="flex items-center">${position.markPrice.toFixed(2)}</div>
                                    <div className="p-[0px_24.625px]">
                                        <span className={position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                                            ${position.pnl.toFixed(2)} ({position.percentage.toFixed(2)}%)
                                        </span>
                                    </div>
                                    <div className="flex items-center">{position.leverage}x</div>
                                    <div className="flex items-center">{position.marginType}</div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 min-w-[200px]">
                                        {/* Close Position Button */}
                                        <button
                                            onClick={() => setShowConfirmDialog({
                                                show: true,
                                                type: 'close',
                                                position,
                                                accountId: position.accountId
                                            })}
                                            disabled={loadingActions[`close-${position.accountId}-${position.symbol}`]}
                                            className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
                                        >
                                            {loadingActions[`close-${position.accountId}-${position.symbol}`] ? 'Closing...' : 'Close'}
                                        </button>
                                        
                                        {/* Add to Position Button */}
                                        <button
                                            onClick={() => setShowConfirmDialog({
                                                show: true,
                                                type: 'addTo',
                                                position,
                                                accountId: position.accountId
                                            })}
                                            disabled={loadingActions[`addTo-${position.accountId}-${position.symbol}`]}
                                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded transition-colors"
                                        >
                                            {loadingActions[`addTo-${position.accountId}-${position.symbol}`] ? 'Adding...' : 'Add 50%'}
                                        </button>
                                        
                                        {/* TP/SL Button */}
                                        <button
                                            onClick={() => {
                                                // TODO: Implement TP/SL modal
                                                console.log('TP/SL for', position.symbol);
                                            }}
                                            className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
                                        >
                                            TP/SL
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </article>
            
            {/* Confirmation Dialog */}
            {showConfirmDialog.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1A] border border-[#2A3441] rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            {showConfirmDialog.type === 'close' && 'Close Position'}
                            {showConfirmDialog.type === 'closeAll' && 'Close All Positions'}
                            {showConfirmDialog.type === 'addTo' && 'Add to Position'}
                        </h3>
                        
                        <div className="text-gray-300 mb-6">
                            {showConfirmDialog.type === 'close' && showConfirmDialog.position && (
                                <p>
                                    Are you sure you want to close your <span className="text-blue-400">{showConfirmDialog.position.side}</span> position 
                                    of <span className="text-white">{showConfirmDialog.position.size}</span> {showConfirmDialog.position.symbol}?
                                </p>
                            )}
                            {showConfirmDialog.type === 'closeAll' && (
                                <p>
                                    Are you sure you want to close <span className="text-red-400">ALL</span> positions 
                                    {showAllAccounts ? ' across all accounts' : ' for the active account'}?
                                    This action cannot be undone.
                                </p>
                            )}
                            {showConfirmDialog.type === 'addTo' && showConfirmDialog.position && (
                                <p>
                                    Add 50% to your <span className="text-blue-400">{showConfirmDialog.position.side}</span> position 
                                    of {showConfirmDialog.position.symbol}? This will add approximately{' '}
                                    <span className="text-white">{(showConfirmDialog.position.size * 0.5).toFixed(4)}</span> to your position.
                                </p>
                            )}
                        </div>
                        
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmDialog({ show: false, type: 'close' })}
                                className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 rounded transition-colors text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (showConfirmDialog.type === 'close' && showConfirmDialog.position && showConfirmDialog.accountId) {
                                        handleClosePosition(showConfirmDialog.position, showConfirmDialog.accountId);
                                    } else if (showConfirmDialog.type === 'closeAll') {
                                        if (showAllAccounts) {
                                            // Close all positions across all accounts - implement multi-account close
                                            console.log('Close all positions across all accounts');
                                        } else if (showConfirmDialog.accountId) {
                                            handleCloseAllPositions(showConfirmDialog.accountId);
                                        }
                                    } else if (showConfirmDialog.type === 'addTo' && showConfirmDialog.position && showConfirmDialog.accountId) {
                                        handleAddToPosition(showConfirmDialog.position, showConfirmDialog.accountId);
                                    }
                                }}
                                className={`px-4 py-2 text-sm rounded transition-colors text-white ${
                                    showConfirmDialog.type === 'close' || showConfirmDialog.type === 'closeAll'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {showConfirmDialog.type === 'close' && 'Close Position'}
                                {showConfirmDialog.type === 'closeAll' && 'Close All'}
                                {showConfirmDialog.type === 'addTo' && 'Add to Position'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Postions