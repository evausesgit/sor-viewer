/**
 * OrderBook component - displays bid/ask levels for a venue
 */

import React from 'react';
import type { OrderBook as OrderBookType, PriceLevel } from '../../core/types/market';
import type { VenueExecutionDetail } from '../../core/sor/execution-simulator';

interface OrderBookProps {
  orderBook: OrderBookType;
  venueColor: string;
  executionDetail?: VenueExecutionDetail;
}

const PriceLevelRow: React.FC<{
  level: PriceLevel;
  side: 'bid' | 'ask';
  maxQuantity: number;
  venueColor: string;
  executedQuantity?: number;
  percentageTaken?: number;
}> = ({ level, side, maxQuantity, venueColor: _venueColor, executedQuantity, percentageTaken: _percentageTaken }) => {
  const percentage = (level.quantity / maxQuantity) * 100;
  const bgColor = side === 'bid' ? 'bg-bid/10' : 'bg-ask/10';
  const isExecuted = executedQuantity && executedQuantity > 0;

  return (
    <div className={`relative flex justify-between text-xs py-0.5 px-2 hover:bg-slate-700/30 transition-all duration-300 ${
      isExecuted ? 'bg-blue-500/20 border-l-2 border-blue-500' : ''
    }`}>
      {/* Background bar showing quantity */}
      <div
        className={`absolute inset-y-0 ${side === 'bid' ? 'right-0' : 'left-0'} ${bgColor}`}
        style={{ width: `${percentage}%` }}
      />

      {/* Execution overlay */}
      {isExecuted && (
        <div
          className="absolute inset-y-0 right-0 bg-blue-600/30"
          style={{ width: `${(executedQuantity / level.quantity) * 100}%` }}
        />
      )}

      {/* Price */}
      <span className={`relative z-10 font-mono ${side === 'bid' ? 'text-bid' : 'text-ask'} ${
        isExecuted ? 'font-bold' : ''
      }`}>
        {level.price.toFixed(2)}
      </span>

      {/* Quantity - montrer restant si exécuté */}
      <div className="relative z-10 flex items-center gap-1">
        {isExecuted && (
          <span className="font-mono text-blue-400 font-bold text-[10px]">
            -{executedQuantity.toLocaleString()}
          </span>
        )}
        <span className={`font-mono ${isExecuted ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
          {level.quantity.toLocaleString()}
        </span>
      </div>

      {/* Order count */}
      <span className="relative z-10 font-mono text-slate-500 text-[10px]">
        ({level.orderCount})
      </span>
    </div>
  );
};

export const OrderBook: React.FC<OrderBookProps> = ({ orderBook, venueColor, executionDetail }) => {
  const maxBidQty = Math.max(...orderBook.bids.map((l) => l.quantity), 1);
  const maxAskQty = Math.max(...orderBook.asks.map((l) => l.quantity), 1);

  // Créer un map des exécutions par prix pour lookup rapide
  const executionByPrice = new Map<number, { quantityTaken: number; percentageTaken: number }>();
  if (executionDetail) {
    executionDetail.levels.forEach(level => {
      executionByPrice.set(level.price, {
        quantityTaken: level.quantityTaken,
        percentageTaken: level.percentageTaken
      });
    });
  }

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex justify-between text-xs px-2 py-1.5 bg-slate-900 border-b border-slate-700">
        <span className="text-slate-400 font-semibold">Price</span>
        <span className="text-slate-400 font-semibold">Quantity</span>
        <span className="text-slate-400 font-semibold text-[10px]">Orders</span>
      </div>

      <div className="flex-1 overflow-y-auto order-book-scroll">
        {/* Ask levels (top half, reversed to show best ask closest to spread) */}
        <div className="flex flex-col-reverse">
          {orderBook.asks.slice(0, 10).map((level, idx) => {
            const execution = executionByPrice.get(level.price);
            return (
              <PriceLevelRow
                key={`ask-${idx}`}
                level={level}
                side="ask"
                maxQuantity={maxAskQty}
                venueColor={venueColor}
                executedQuantity={execution?.quantityTaken}
                percentageTaken={execution?.percentageTaken}
              />
            );
          })}
        </div>

        {/* Spread indicator */}
        <div className="flex justify-center items-center py-2 bg-slate-900/50">
          <div className="text-xs">
            <span className="text-slate-500">Spread: </span>
            <span className="text-slate-300 font-mono font-semibold">
              ${orderBook.spread.toFixed(4)}
            </span>
            <span className="text-slate-500 ml-2">Mid: </span>
            <span className="text-slate-300 font-mono">
              ${orderBook.midPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Bid levels (bottom half) */}
        <div>
          {orderBook.bids.slice(0, 10).map((level, idx) => {
            const execution = executionByPrice.get(level.price);
            return (
              <PriceLevelRow
                key={`bid-${idx}`}
                level={level}
                side="bid"
                maxQuantity={maxBidQty}
                venueColor={venueColor}
                executedQuantity={execution?.quantityTaken}
                percentageTaken={execution?.percentageTaken}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
