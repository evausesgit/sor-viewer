/**
 * VenuePanel component - displays venue info and order book
 */

import React from 'react';
import type { Venue, OrderBook as OrderBookType } from '../../core/types/market';
import type { VenueExecutionDetail } from '../../core/sor/execution-simulator';
import { OrderBook } from '../orderbook/OrderBook';
import { Activity } from 'lucide-react';

interface VenuePanelProps {
  venue: Venue;
  orderBook: OrderBookType | null;
  onToggle?: (venueId: string) => void;
  executionState?: {
    isExecuting: boolean;
    executedQuantity: number;
    isCurrentStep: boolean;
  };
  executionDetail?: VenueExecutionDetail;
}

export const VenuePanel: React.FC<VenuePanelProps> = ({ venue, orderBook, onToggle, executionState, executionDetail }) => {
  // Debug: log execution state changes
  React.useEffect(() => {
    if (executionState) {
      console.log(`🎨 VenuePanel ${venue.id}:`, executionState);
    }
  }, [executionState, venue.id]);

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
      {/* Venue header */}
      <div
        className={`px-4 py-3 flex items-center justify-between relative transition-all duration-300 ${
          executionState?.isCurrentStep ? 'venue-executing' : ''
        }`}
        style={{ borderTopColor: venue.color, borderTopWidth: '3px' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: venue.color }}
          />
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              {venue.name}
              {executionState?.isCurrentStep && <span className="ml-2 text-blue-400">⚡ EXECUTING</span>}
            </h3>
            <p className="text-xs text-slate-400">{venue.displayName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Execution badge */}
          {executionState && executionState.executedQuantity > 0 && (
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-fade-in shadow-lg">
              {executionState.executedQuantity.toLocaleString()}
            </div>
          )}

          <button
            onClick={() => onToggle?.(venue.id)}
            className={`p-1.5 rounded transition-colors ${
              venue.active
                ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
            }`}
            title={venue.active ? 'Active' : 'Inactive'}
          >
            <Activity size={16} />
          </button>
        </div>
      </div>

      {/* Venue stats */}
      <div className="px-4 py-2 bg-slate-800/50 border-y border-slate-700 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-slate-500">Maker: </span>
          <span className={venue.makerFee < 0 ? 'text-bid' : 'text-ask'}>
            {(venue.makerFee * 10000).toFixed(1)} bps
          </span>
        </div>
        <div>
          <span className="text-slate-500">Taker: </span>
          <span className="text-ask">{(venue.takerFee * 10000).toFixed(1)} bps</span>
        </div>
        <div>
          <span className="text-slate-500">Latency: </span>
          <span className="text-slate-300">{venue.latency}ms</span>
        </div>
        <div>
          <span className="text-slate-500">Status: </span>
          <span className={venue.active ? 'text-bid' : 'text-slate-500'}>
            {venue.active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Order book */}
      <div className="flex-1 p-3">
        {orderBook && venue.active ? (
          <OrderBook
            orderBook={orderBook}
            venueColor={venue.color}
            executionDetail={executionDetail}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            {venue.active ? 'Loading...' : 'Venue Inactive'}
          </div>
        )}
      </div>
    </div>
  );
};
