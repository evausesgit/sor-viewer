/**
 * Aggregated Order Book component - displays consolidated order book across all venues
 */

import { useMemo, Fragment } from 'react';
import type { Venue, OrderBook } from '../../core/types/market';

interface AggregatedOrderBookProps {
  venues: Venue[];
  orderBooks: Map<string, OrderBook>;
}

interface AggregatedLevel {
  price: number;
  bidQuantities: Map<string, number>; // venueId -> quantity
  askQuantities: Map<string, number>; // venueId -> quantity
  totalBid: number;
  totalAsk: number;
}

export const AggregatedOrderBook: React.FC<AggregatedOrderBookProps> = ({
  venues,
  orderBooks,
}) => {
  // Aggregate order books from all venues
  const aggregatedLevels = useMemo(() => {
    const priceMap = new Map<number, AggregatedLevel>();

    console.log('📊 Aggregating order books:', {
      totalVenues: venues.length,
      activeVenues: venues.filter(v => v.active).length,
      orderBooksCount: orderBooks.size,
      orderBookKeys: Array.from(orderBooks.keys())
    });

    // Collect all prices from all venues
    orderBooks.forEach((orderBook, venueId) => {
      const venue = venues.find((v) => v.id === venueId);
      if (!venue?.active) {
        console.log(`⏭️ Skipping ${venueId} (active=${venue?.active})`);
        return;
      }

      console.log(`📖 Processing ${venueId}:`, {
        bids: orderBook.bids.length,
        asks: orderBook.asks.length,
        bestBid: orderBook.bids[0]?.price,
        bestAsk: orderBook.asks[0]?.price
      });

      // Process bids
      orderBook.bids.forEach((level) => {
        const price = level.price;
        if (!priceMap.has(price)) {
          priceMap.set(price, {
            price,
            bidQuantities: new Map(),
            askQuantities: new Map(),
            totalBid: 0,
            totalAsk: 0,
          });
        }
        const aggregated = priceMap.get(price)!;
        aggregated.bidQuantities.set(venueId, level.quantity);
        aggregated.totalBid += level.quantity;
      });

      // Process asks
      orderBook.asks.forEach((level) => {
        const price = level.price;
        if (!priceMap.has(price)) {
          priceMap.set(price, {
            price,
            bidQuantities: new Map(),
            askQuantities: new Map(),
            totalBid: 0,
            totalAsk: 0,
          });
        }
        const aggregated = priceMap.get(price)!;
        aggregated.askQuantities.set(venueId, level.quantity);
        aggregated.totalAsk += level.quantity;
      });
    });

    // Sort by price (descending)
    const result = Array.from(priceMap.values()).sort((a, b) => b.price - a.price);

    console.log('✅ Aggregation complete:', {
      totalPriceLevels: result.length,
      sample: result.slice(0, 3).map(level => ({
        price: level.price,
        totalBid: level.totalBid,
        totalAsk: level.totalAsk,
        bidVenues: Array.from(level.bidQuantities.entries()),
        askVenues: Array.from(level.askQuantities.entries())
      }))
    });

    return result;
  }, [venues, orderBooks]);

  const activeVenues = venues.filter((v) => v.active);

  // Find spread (best bid and best ask)
  const bestBid = aggregatedLevels.find((level) => level.totalBid > 0)?.price || 0;
  const bestAsk = aggregatedLevels.find((level) => level.totalAsk > 0)?.price || 0;

  // Séparer les niveaux BID et ASK
  // aggregatedLevels est trié prix décroissant (plus hauts prix en premier)
  const allBids = aggregatedLevels.filter(level => level.totalBid > 0);
  const allAsks = aggregatedLevels.filter(level => level.totalAsk > 0);

  // Meilleurs BID = prix les plus hauts (déjà au début car trié décroissant)
  const bidLevels = allBids.slice(0, 10);

  // Meilleurs ASK = prix les plus bas (à la fin car trié décroissant)
  // On inverse, prend 10, et re-inverse pour avoir ordre croissant
  const askLevels = allAsks.slice(-10).reverse();

  // Order book classique : ASK en haut (croissant), BID en bas (décroissant)
  const displayLevels = [...askLevels, ...bidLevels];

  return (
    <div className="bg-slate-900 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-slate-100 mb-4">
        Order Book Grid by Venue
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400">
              {/* Bid venue columns */}
              {activeVenues.map((venue) => (
                <th
                  key={`bid-${venue.id}`}
                  className="px-2 py-2 text-center"
                  style={{ color: venue.color }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: venue.color }} />
                    <div className="text-[10px]">{venue.name}</div>
                    <div className="text-[9px] text-slate-500">{venue.displayName.split(' ')[0]}</div>
                  </div>
                </th>
              ))}

              {/* Total Bid */}
              <th className="px-3 py-2 text-center border-l border-slate-700">
                <div className="text-bid font-bold">Total</div>
                <div className="text-bid font-bold">BID</div>
              </th>

              {/* Bid Price */}
              <th className="px-3 py-2 text-center">
                <div className="text-bid font-bold">BID</div>
              </th>

              {/* Ask Price */}
              <th className="px-3 py-2 text-center">
                <div className="text-ask font-bold">ASK</div>
              </th>

              {/* Total Ask */}
              <th className="px-3 py-2 text-center border-r border-slate-700">
                <div className="text-ask font-bold">Total</div>
                <div className="text-ask font-bold">ASK</div>
              </th>

              {/* Ask venue columns */}
              {activeVenues.map((venue) => (
                <th
                  key={`ask-${venue.id}`}
                  className="px-2 py-2 text-center"
                  style={{ color: venue.color }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: venue.color }} />
                    <div className="text-[10px]">{venue.name}</div>
                    <div className="text-[9px] text-slate-500">{venue.displayName.split(' ')[0]}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayLevels.map((level, index) => {
              const isBestBid = level.price === bestBid && level.totalBid > 0;
              const isBestAsk = level.price === bestAsk && level.totalAsk > 0;

              // Insérer une ligne de spread après le dernier ASK
              const showSpreadAfter = index === askLevels.length - 1;

              return (
                <Fragment key={level.price}>
                <tr
                  className={`border-t border-slate-800 hover:bg-slate-800/50 ${
                    isBestBid || isBestAsk ? 'bg-slate-800/30' : ''
                  }`}
                >
                  {/* Bid quantities per venue */}
                  {activeVenues.map((venue) => (
                    <td
                      key={`bid-${venue.id}-${level.price}`}
                      className="px-2 py-1.5 text-center text-slate-300"
                    >
                      {level.bidQuantities.get(venue.id)?.toLocaleString() || '-'}
                    </td>
                  ))}

                  {/* Total Bid */}
                  <td className="px-3 py-1.5 text-center font-semibold text-bid border-l border-slate-700">
                    {level.totalBid > 0 ? level.totalBid.toLocaleString() : ''}
                  </td>

                  {/* Bid Price */}
                  <td className="px-3 py-1.5 text-center font-mono font-semibold text-bid">
                    {level.totalBid > 0 ? `$${level.price.toFixed(2)}` : ''}
                  </td>

                  {/* Ask Price */}
                  <td className="px-3 py-1.5 text-center font-mono font-semibold text-ask">
                    {level.totalAsk > 0 ? `$${level.price.toFixed(2)}` : ''}
                  </td>

                  {/* Total Ask */}
                  <td className="px-3 py-1.5 text-center font-semibold text-ask border-r border-slate-700">
                    {level.totalAsk > 0 ? level.totalAsk.toLocaleString() : ''}
                  </td>

                  {/* Ask quantities per venue */}
                  {activeVenues.map((venue) => (
                    <td
                      key={`ask-${venue.id}-${level.price}`}
                      className="px-2 py-1.5 text-center text-slate-300"
                    >
                      {level.askQuantities.get(venue.id)?.toLocaleString() || '-'}
                    </td>
                  ))}
                </tr>

                {/* Ligne de spread entre ASK et BID */}
                {showSpreadAfter && (
                  <tr className="bg-slate-700/30">
                    <td colSpan={activeVenues.length * 2 + 4} className="px-3 py-2 text-center text-xs text-slate-400 font-semibold">
                      ═══ SPREAD: ${(bestAsk - bestBid).toFixed(2)} ═══
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stats */}
      <div className="mt-4 flex gap-6 text-xs text-slate-400">
        <div>
          <span className="text-slate-500">Best Bid: </span>
          <span className="text-bid font-mono">${bestBid.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-slate-500">Best Ask: </span>
          <span className="text-ask font-mono">${bestAsk.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-slate-500">Spread: </span>
          <span className="text-slate-300 font-mono">${(bestAsk - bestBid).toFixed(2)}</span>
        </div>
        <div>
          <span className="text-slate-500">Active Venues: </span>
          <span className="text-slate-300">{activeVenues.length}</span>
        </div>
      </div>
    </div>
  );
};
