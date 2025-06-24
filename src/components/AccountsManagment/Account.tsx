import { useEffect, useRef, useState } from "react";
import AnimateHeight from "react-animate-height";
import { motion } from "framer-motion";
import { useTrading } from "../../hooks/useTrading";
import { hyperliquidService } from "../../services/hyperliquid";
import { hyperliquidSymbolService } from "../../services/hyperliquidSymbols";

export interface AccountInfo {
    title: string;
    num: number;
    status: string;
    pair: string;
    leverage: string;
    balance: string;
    pnl: string;
}

interface AccountProps {
    acc: AccountInfo;
    id: number;
    handleRemoveCard: (event: number) => void;
}

const Account = ({ acc, id, handleRemoveCard }: AccountProps) => {
    const [clicked, setClicked] = useState<boolean>(false);
    const [publicKey, setPublicKey] = useState<string>('');
    const [privateKey, setPrivateKey] = useState<string>('');
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isMaster, setIsMaster] = useState<boolean>(false);
    const [isSubscriber, setIsSubscriber] = useState<boolean>(false);
    const [masterPair, setMasterPair] = useState<string>('ETH-USD');
    const [subscriberPair, setSubscriberPair] = useState<string>('ETH-USD');
    const [availableSymbols, setAvailableSymbols] = useState<string[]>([
        'ETH-USD', 'BTC-USD', 'SOL-USD', 'ATOM-USD', 'AVAX-USD'
    ]);
    const cardRef = useRef<HTMLDivElement | null>(null);
    
    const { state, connectAccount, disconnectAccount, dispatch } = useTrading();
    const account = state.accounts.find(a => a.id === id);
    const connectionStatus = state.connectionStatus[id];

    const handleOpenCard = () => {
        setClicked(true);
    };

    const handleConnect = async () => {
        // Validate private key format
        if (!privateKey.trim()) {
            alert('Please enter a private key');
            return;
        }
        
        if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
            alert('Private key must be 64 characters long and start with 0x');
            return;
        }
        
        // Validate public key format if provided
        if (publicKey.trim() && (!publicKey.startsWith('0x') || publicKey.length !== 42)) {
            alert('Public key / wallet address must be 40 characters long and start with 0x (or leave empty)');
            return;
        }

        setIsConnecting(true);
        try {
            const success = await connectAccount(id, privateKey);
            if (success) {
                // Get the actual wallet address for display
                const walletAddress = hyperliquidService.getWalletAddress();
                console.log('Connected with wallet address:', walletAddress);
                
                alert('Successfully connected to Hyperliquid!');
                setClicked(false); // Close the expanded view
            } else {
                alert('Failed to connect. Please check your private key.');
            }
        } catch (error) {
            alert('Connection failed: ' + (error as Error).message);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        disconnectAccount(id);
        setPrivateKey('');
        setPublicKey('');
    };

    const handleMasterToggle = (checked: boolean) => {
        setIsMaster(checked);
        dispatch({ 
            type: 'UPDATE_ACCOUNT', 
            payload: { 
                accountId: id, 
                updates: { 
                    isMaster: checked,
                    pair: checked ? masterPair : acc.pair
                } 
            }
        });
    };

    const handleSubscriberToggle = (checked: boolean) => {
        setIsSubscriber(checked);
        dispatch({ 
            type: 'UPDATE_ACCOUNT', 
            payload: { 
                accountId: id, 
                updates: { 
                    isSubscriber: checked
                } 
            }
        });
    };

    const handleMasterPairChange = (newPair: string) => {
        setMasterPair(newPair);
        if (isMaster) {
            dispatch({ 
                type: 'UPDATE_ACCOUNT', 
                payload: { 
                    accountId: id, 
                    updates: { 
                        pair: newPair
                    } 
                }
            });
        }
    };

    const handleSubscriberPairChange = (newPair: string) => {
        setSubscriberPair(newPair);
        // Additional logic for subscriber pair changes can be added here
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
                setClicked(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Refresh account data periodically when connected
    useEffect(() => {
        if (account?.isConnected) {
            const interval = setInterval(async () => {
                try {
                    const accountInfo = await hyperliquidService.getAccountInfo();

                    // Update account display with real data
                    if (accountInfo && accountInfo.marginSummary) {
                        const balance = parseFloat(accountInfo.marginSummary.accountValue || '0');
                        const pnl = parseFloat(accountInfo.marginSummary.totalNtlPos || '0');
                        
                        // Update via context
                        dispatch({ 
                            type: 'UPDATE_ACCOUNT', 
                            payload: { 
                                accountId: id, 
                                updates: {
                                    balance: `$${balance.toFixed(2)}`,
                                    pnl: `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`
                                }
                            }
                        });
                    }
                } catch (error) {
                    console.error('Failed to refresh account data:', error);
                }
            }, 10000); // Refresh every 10 seconds

            return () => clearInterval(interval);
        }
    }, [account?.isConnected, id, dispatch]);

    // Initialize state from account data
    useEffect(() => {
        if (account) {
            setIsMaster(account.isMaster || false);
            setIsSubscriber(account.isSubscriber || false);
            setMasterPair(account.pair || 'ETH-USD');
        }
    }, [account]);

    // Load official Hyperliquid symbols
    useEffect(() => {
        const loadSymbols = async () => {
            try {
                const symbols = await hyperliquidSymbolService.getPopularSymbols();
                const symbolPairs = symbols.map(symbol => `${symbol}-USD`);
                setAvailableSymbols(symbolPairs);
            } catch (error) {
                console.warn('Failed to load symbols for account management:', error);
            }
        };

        loadSymbols();
    }, []);

    return (
        <motion.article
            ref={cardRef}
            onClick={handleOpenCard}
            className={`flex flex-col w-[490px] max-w-full bg-[#23272E] p-5 transition-all duration-300 relative rounded-xl ${clicked ? "border border-[#F0B90B]" : ""}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            
            >
                <svg xmlns="http://www.w3.org/2000/svg" onClick={(e) => { e.stopPropagation(); handleRemoveCard(id); setClicked(false); }} className="cursor-pointer absolute top-2 right-2" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M15.4863 13.3875L12.0475 9.94813L15.485 6.50938L13.7181 4.74063L10.2788 8.17938L6.84001 4.74063L5.07251 6.50938L8.51001 9.94813L5.07251 13.3869L6.84126 15.1544L10.2788 11.7156L13.7163 15.1544L15.4863 13.3875Z" fill="#6B7280" />
                </svg>
            <div className="mgTop flex justify-between items-center space-y-6">
                <h1 className="title">{acc.title} {acc.num}</h1>
                <div className="flex gap-3 items-center justify-end">
                    <label className="relative cursor-pointer flex">
                        <input
                            type="checkbox"
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
                    <div
                        className={`button ${(account?.isConnected && account?.status === "ACTIVE")
                                ? "text-[#00FF4B]"
                                : "text-[#FF3838] !bg-[rgba(255,0,0,0.10)]"
                            }`}
                    >
                        {account?.isConnected ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                </div>
            </div>

            <div className="flex justify-between space-y-6 text-[rgba(255,255,255,0.70)] text-sm">
                <div className="flex items-center gap-2">
                    <p>{acc.pair}</p>
                    {isMaster && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">MASTER</span>}
                    {isSubscriber && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">SUBSCRIBER</span>}
                </div>
                <p>{acc.leverage}</p>
            </div>

            <div className="flex justify-between">
                <p className="text-[rgba(255,255,255,0.70)] text-sm">
                    Balance:{" "}
                    <span className="text-white font-bold text-sm">{acc.balance}</span>
                </p>
                <p className="text-[rgba(255,255,255,0.70)] text-sm">
                    PnL:{" "}
                    <span className="text-white font-bold text-sm">{acc.pnl}</span>
                </p>
            </div>
            <AnimateHeight duration={400} height={clicked ? "auto" : 0}>
                <div className="mt-4 flex flex-col gap-4">
                    <p className="text-[rgba(255,255,255,0.70)] text-sm mt-2">API Keys</p>
                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            value={publicKey}
                            onChange={(e) => setPublicKey(e.target.value)}
                            className="bg-[#0F1419] text-white py-2 px-4 placeholder:text-[rgba(255,255,255,0.40)] text-sm rounded-[4px]"
                            placeholder="Public key / Wallet address"
                            disabled={account?.isConnected}
                        />
                        <input
                            type="password"
                            value={privateKey}
                            onChange={(e) => setPrivateKey(e.target.value)}
                            className="bg-[#0F1419] text-white py-2 px-4 placeholder:text-[rgba(255,255,255,0.40)] text-sm rounded-[4px]"
                            placeholder="Private key (required for connection)"
                            disabled={account?.isConnected}
                        />
                        <div className="flex justify-between gap-2">
        
                        </div>
                        <div className="flex justify-end gap-2">
                            {account?.isConnected ? (
                                <button 
                                    onClick={handleDisconnect}
                                    className="bg-[rgba(255,56,56,0.80)] text-white cursor-pointer text-xs font-bold py-[5px] px-2.5 rounded-[4px] w-20 h-[26px]"
                                >
                                    Disconnect
                                </button>
                            ) : (
                                <button 
                                    onClick={handleConnect}
                                    disabled={isConnecting}
                                    className={`text-white cursor-pointer text-xs font-bold py-[5px] px-2.5 rounded-[4px] w-20 h-[26px] ${
                                        isConnecting 
                                            ? 'bg-gray-500 cursor-not-allowed' 
                                            : 'bg-[rgba(0,255,76,0.80)]'
                                    }`}
                                >
                                    {isConnecting ? 'Connecting...' : 'Connect'}
                                </button>
                            )}
                        </div>
                        {connectionStatus === 'error' && (
                            <p className="text-red-500 text-xs">Connection failed. Please check your private key.</p>
                        )}
                        {account?.isConnected && (
                            <p className="text-green-500 text-xs">✓ Connected to Hyperliquid</p>
                        )}
                    </div>

                    <div className="mt-1.5">
                        <div className="text-xs text-[rgba(255,255,255,0.60)] mb-3">
                            <p>📊 <strong>Master Account:</strong> Controls trading signals and executes orders</p>
                            <p>📡 <strong>Subscriber Account:</strong> Follows master signals automatically</p>
                            <p>⚠️ Only one master account should be active at a time</p>
                        </div>
                        <div className="flex gap-[19px] justify-between">
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-3 items-center">
                                    <label className="relative cursor-pointer flex">
                                        <input
                                            type="checkbox"
                                            checked={isMaster}
                                            onChange={(e) => handleMasterToggle(e.target.checked)}
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
                                    <p className="text-sm font-bold text-white">
                                        MASTER PAIR
                                        {isMaster && <span className="ml-2 text-xs text-green-400">●</span>}
                                    </p>
                                </div>
                                <select 
                                    className="select"
                                    value={masterPair}
                                    onChange={(e) => handleMasterPairChange(e.target.value)}
                                    disabled={!isMaster}
                                >
                                    {availableSymbols.map((symbol) => (
                                        <option key={symbol} value={symbol}>
                                            {symbol}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-3 items-center">
                                    <label className="relative cursor-pointer flex">
                                        <input
                                            type="checkbox"
                                            checked={isSubscriber}
                                            onChange={(e) => handleSubscriberToggle(e.target.checked)}
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
                                    <p className="text-sm font-bold text-white">
                                        SUBSCRIBER PAIR
                                        {isSubscriber && <span className="ml-2 text-xs text-blue-400">●</span>}
                                    </p>
                                </div>
                                <select 
                                    className="select"
                                    value={subscriberPair}
                                    onChange={(e) => handleSubscriberPairChange(e.target.value)}
                                    disabled={!isSubscriber}
                                >
                                    {availableSymbols.map((symbol) => (
                                        <option key={symbol} value={symbol}>
                                            {symbol}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </AnimateHeight>
        </motion.article>
    );
};

export default Account;
