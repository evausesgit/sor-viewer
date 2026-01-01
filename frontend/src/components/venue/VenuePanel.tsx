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
    <div className="flex flex-col bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
      {/* Venue header */}
      <div
        className={`px-2 py-1.5 flex items-center justify-between relative transition-all duration-300 ${
          executionState?.isCurrentStep ? 'venue-executing' : ''
        }`}
        style={{ borderTopColor: venue.color, borderTopWidth: '2px' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: venue.color }}
          />
          <div>
            <h3 className="text-[11px] font-bold text-slate-100">
              {venue.name}
              {executionState?.isCurrentStep && <span className="ml-1 text-blue-400">⚡</span>}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Execution badge */}
          {executionState && executionState.executedQuantity > 0 && (
            <div className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold animate-fade-in shadow-lg">
              {executionState.executedQuantity.toLocaleString()}
            </div>
          )}

          <button
            onClick={() => onToggle?.(venue.id)}
            className={`p-1 rounded transition-colors ${
              venue.active
                ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
            }`}
            title={venue.active ? 'Active' : 'Inactive'}
          >
            <Activity size={12} />
          </button>
        </div>
      </div>

      {/* Order book */}
      {orderBook && venue.active ? (
        <OrderBook
          orderBook={orderBook}
          venueColor={venue.color}
          executionDetail={executionDetail}
        />
      ) : (
        <div className="p-4 flex items-center justify-center text-slate-500 text-[11px]">
          {venue.active ? 'Loading...' : 'Venue Inactive'}
        </div>
      )}
    </div>
  );
};
