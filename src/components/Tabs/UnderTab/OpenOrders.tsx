import { useTrading } from "../../../hooks/useTrading";

const OpenOrders = () => {
    const { state, cancelOrder } = useTrading();
    const { orders, activeAccount } = state;
    const accountOrders = orders[activeAccount] || [];

    const handleCancelOrder = async (orderId: string) => {
        try {
            await cancelOrder(activeAccount, orderId);
            alert('Order cancelled successfully');
        } catch (error) {
            alert('Failed to cancel order: ' + (error as Error).message);
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString();
    };

    return (
        <>
            <article className="text-xs inter rounded-[8px] text-[#A0A9B4] mr-[23px]">
                <div className="text-center flex overflow-x-auto no-scrollbar border-b items-center border-[#2A3441] p-[12px_24px_13px_24px] gap-4 bg-[#151C26] justify-between font-medium">
                    <div className="flex items-center">Time</div>
                    <div className="flex items-center">Type</div>
                    <div className="flex items-center">Coin</div>
                    <div className="flex items-center">Direction</div>
                    <div className="flex items-center">Size</div>
                    <div className="flex items-center">Price</div>
                    <div className="flex items-center gap-1">
                        <p>Order<br /> Value</p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M12.5303 12.4004H0.530273V0.400391H12.5303V12.4004Z" />
                            <path d="M6.00039 9.92988C6.29336 10.2229 6.76914 10.2229 7.06211 9.92988L11.5621 5.42988C11.8551 5.13691 11.8551 4.66113 11.5621 4.36816C11.2691 4.0752 10.7934 4.0752 10.5004 4.36816L6.53008 8.33848L2.55977 4.37051C2.2668 4.07754 1.79102 4.07754 1.49805 4.37051C1.20508 4.66348 1.20508 5.13926 1.49805 5.43223L5.99805 9.93223L6.00039 9.92988Z" fill="#A0A9B4" />
                        </svg>
                    </div>
                    <div className="flex items-center">Status</div>
                    <div className="flex items-center">Action</div>
                </div>
                <article className="flex flex-col justify-center items-center h-[588px]">
                    {accountOrders.length === 0 ? (
                        <div className="text-center text-[#A0A9B4]">
                            <p className="text-sm">No open orders</p>
                            <p className="text-xs mt-2">Connect an account to view orders</p>
                        </div>
                    ) : (
                        <div className="w-full">
                            {accountOrders.filter(order => order.status === 'pending').map((order) => (
                                <div key={order.id} className="flex overflow-x-auto no-scrollbar border-b border-[#2A3441] gap-4 p-[12px_24px_13px_24px] justify-between items-center text-white">
                                    <div className="flex items-center text-xs">{formatTimestamp(order.timestamp)}</div>
                                    <div className="flex items-center font-medium">{order.type.toUpperCase()}</div>
                                    <div className="flex items-center font-medium">{order.symbol}</div>
                                    <div className="flex items-center">
                                        <span className={order.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                                            {order.side.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center">{order.amount}</div>
                                    <div className="flex items-center">
                                        {order.type === 'market' ? 'Market' : `$${order.price?.toFixed(2) || '0.00'}`}
                                    </div>
                                    <div className="flex items-center">
                                        ${order.type === 'market' ? 'Market' : ((order.price || 0) * order.amount).toFixed(2)}
                                    </div>
                                    <div className="flex items-center">
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                            order.status === 'filled' ? 'bg-green-500/20 text-green-500' :
                                            order.status === 'cancelled' ? 'bg-gray-500/20 text-gray-500' :
                                            'bg-red-500/20 text-red-500'
                                        }`}>
                                            {order.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleCancelOrder(order.id)}
                                                className="bg-red-500/80 hover:bg-red-500 text-white px-2 py-1 rounded text-xs"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </article>
        </>
    )
}

export default OpenOrders