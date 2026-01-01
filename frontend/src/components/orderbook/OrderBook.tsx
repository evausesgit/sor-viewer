/**
 * OrderBook component - displays bid/ask levels for a venue
 */

import React from 'react';
import type { OrderBook as OrderBookType } from '../../core/types/market';
import type { VenueExecutionDetail } from '../../core/sor/execution-simulator';

interface OrderBookProps {
  orderBook: OrderBookType;
  venueColor: string;
  executionDetail?: VenueExecutionDetail;
}

export const OrderBook: React.FC<OrderBookProps> = ({ orderBook, venueColor: _venueColor, executionDetail }) => {
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

  // Préparer les données : prendre les 10 meilleurs de chaque côté
  const bidLevels = orderBook.bids.slice(0, 10);
  const askLevels = orderBook.asks.slice(0, 10).reverse(); // Inverser pour avoir meilleur ask en haut

  const maxRows = Math.max(bidLevels.length, askLevels.length);

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-4 text-xs px-2 py-1.5 bg-slate-900 border-b border-slate-700 gap-2">
        <span className="text-bid font-semibold text-right">Qty BID</span>
        <span className="text-bid font-semibold text-center">BID</span>
        <span className="text-ask font-semibold text-center">ASK</span>
        <span className="text-ask font-semibold text-left">Qty ASK</span>
      </div>

      <div className="flex-1 overflow-y-auto order-book-scroll">
        {/* Spread en première ligne */}
        <div className="flex justify-center items-center py-2 bg-slate-700/30 border-b border-slate-700">
          <div className="text-xs">
            <span className="text-slate-500">Spread: </span>
            <span className="text-slate-300 font-mono font-semibold">
              ${orderBook.spread.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Lignes avec BID et ASK côte à côte */}
        {Array.from({ length: maxRows }, (_, i) => {
          const bidLevel = bidLevels[i];
          const askLevel = askLevels[i];

          const bidExecution = bidLevel ? executionByPrice.get(bidLevel.price) : undefined;
          const askExecution = askLevel ? executionByPrice.get(askLevel.price) : undefined;

          return (
            <div key={`row-${i}`} className="grid grid-cols-4 text-xs py-0.5 px-2 hover:bg-slate-700/30 transition-colors gap-2">
              {/* Quantité BID avec barre */}
              <div className={`relative text-right ${bidExecution ? 'bg-blue-500/20 border-r-2 border-blue-500' : ''}`}>
                {bidLevel && (
                  <>
                    {/* Barre de couleur pour BID */}
                    <div
                      className="absolute inset-y-0 right-0 bg-bid/10"
                      style={{ width: `${(bidLevel.quantity / maxBidQty) * 100}%` }}
                    />
                    {/* Texte */}
                    <div className="relative z-10 flex items-center justify-end gap-1">
                      {bidExecution && (
                        <span className="font-mono text-blue-400 font-bold text-[10px]">
                          -{bidExecution.quantityTaken.toLocaleString()}
                        </span>
                      )}
                      <span className={`font-mono ${bidExecution ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
                        {bidLevel.quantity.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Prix BID */}
              <div className="text-center">
                {bidLevel && (
                  <span className={`font-mono text-bid ${bidExecution ? 'font-bold' : ''}`}>
                    ${bidLevel.price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Prix ASK */}
              <div className="text-center">
                {askLevel && (
                  <span className={`font-mono text-ask ${askExecution ? 'font-bold' : ''}`}>
                    ${askLevel.price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Quantité ASK avec barre */}
              <div className={`relative text-left ${askExecution ? 'bg-blue-500/20 border-l-2 border-blue-500' : ''}`}>
                {askLevel && (
                  <>
                    {/* Barre de couleur pour ASK */}
                    <div
                      className="absolute inset-y-0 left-0 bg-ask/10"
                      style={{ width: `${(askLevel.quantity / maxAskQty) * 100}%` }}
                    />
                    {/* Texte */}
                    <div className="relative z-10 flex items-center gap-1">
                      {askExecution && (
                        <span className="font-mono text-blue-400 font-bold text-[10px]">
                          -{askExecution.quantityTaken.toLocaleString()}
                        </span>
                      )}
                      <span className={`font-mono ${askExecution ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
                        {askLevel.quantity.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
