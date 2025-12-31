/**
 * Order Control Panel - Interface for submitting orders
 */

import React, { useState } from 'react';
import { RefreshCw, Play, Pause } from 'lucide-react';
import { OrderSide, OrderType } from '../../core/types/market';

interface OrderControlPanelProps {
  symbol: string;
  onRefresh: () => void;
  onRouteOrder?: (side: OrderSide, type: OrderType, quantity: number, price?: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

const QUICK_QUANTITIES = [1000, 5000, 10000, 25000];

export const OrderControlPanel: React.FC<OrderControlPanelProps> = ({
  symbol,
  onRefresh,
  onRouteOrder,
  isPaused,
  onTogglePause,
}) => {
  const [side, setSide] = useState<OrderSide>(OrderSide.BID);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.MARKET);
  const [quantity, setQuantity] = useState<number>(5000);
  const [limitPrice, setLimitPrice] = useState<string>('');

  const handleRouteOrder = () => {
    if (quantity <= 0) return;

    const price = orderType === OrderType.LIMIT ? parseFloat(limitPrice) : undefined;
    onRouteOrder?.(side, orderType, quantity, price);
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
      <div className="flex items-center justify-between gap-6">
        {/* Left section: BUY/SELL */}
        <div className="flex gap-2">
          <button
            onClick={() => setSide(OrderSide.BID)}
            className={`px-6 py-2 rounded font-semibold transition-colors ${
              side === OrderSide.BID
                ? 'bg-bid text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            BUY
          </button>
          <button
            onClick={() => setSide(OrderSide.ASK)}
            className={`px-6 py-2 rounded font-semibold transition-colors ${
              side === OrderSide.ASK
                ? 'bg-ask text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            SELL
          </button>
        </div>

        {/* Middle section: Quantity input and quick buttons */}
        <div className="flex items-center gap-4 flex-1">
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            className="bg-slate-800 text-slate-100 px-4 py-2 rounded border border-slate-700 focus:outline-none focus:border-blue-500 w-32 text-center font-mono"
            placeholder="Quantity"
          />

          {/* Quick quantity buttons */}
          <div className="flex gap-2">
            {QUICK_QUANTITIES.map((qty) => (
              <button
                key={qty}
                onClick={() => setQuantity(qty)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  quantity === qty
                    ? 'bg-slate-700 text-slate-100'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {qty.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Order type: Market / Limit */}
        <div className="flex gap-2">
          <button
            onClick={() => setOrderType(OrderType.MARKET)}
            className={`px-6 py-2 rounded font-semibold transition-colors ${
              orderType === OrderType.MARKET
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Market
          </button>
          <button
            onClick={() => setOrderType(OrderType.LIMIT)}
            className={`px-6 py-2 rounded font-semibold transition-colors ${
              orderType === OrderType.LIMIT
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Limit
          </button>
        </div>

        {/* Limit price input (shown only for limit orders) */}
        {orderType === OrderType.LIMIT && (
          <input
            type="number"
            step="0.01"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            className="bg-slate-800 text-slate-100 px-4 py-2 rounded border border-slate-700 focus:outline-none focus:border-blue-500 w-32 text-center font-mono"
            placeholder="Price"
          />
        )}

        {/* Route Order button */}
        <button
          onClick={handleRouteOrder}
          disabled={quantity <= 0}
          className="px-8 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded transition-colors"
        >
          Route Order
        </button>

        {/* PLAY/PAUSE button */}
        <button
          onClick={onTogglePause}
          className={`p-2 rounded transition-colors ${
            isPaused
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          title={isPaused ? 'Resume order book updates' : 'Pause order book updates'}
        >
          {isPaused ? <Play size={20} /> : <Pause size={20} />}
        </button>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          title="Refresh market data"
        >
          <RefreshCw size={20} />
        </button>

        {/* Symbol display */}
        <div className="text-right">
          <div className="text-xs text-slate-500">Symbol</div>
          <div className="text-2xl font-bold text-slate-100">{symbol}</div>
        </div>
      </div>
    </div>
  );
};
