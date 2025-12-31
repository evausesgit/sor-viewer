/**
 * Core market data types for Smart Order Router simulation
 */

// Side of the order (buy/sell)
export const enum OrderSide {
  BID = 'BID',  // Buy order
  ASK = 'ASK',  // Sell order
}

// Type of order
export const enum OrderType {
  MARKET = 'MARKET',      // Execute immediately at best available price
  LIMIT = 'LIMIT',        // Execute at specified price or better
  ICEBERG = 'ICEBERG',    // Large order with only portion visible
  HIDDEN = 'HIDDEN',      // Not displayed in order book
  POST_ONLY = 'POST_ONLY', // Only add liquidity, cancel if would take
}

// Order status
export const enum OrderStatus {
  PENDING = 'PENDING',       // Not yet submitted
  SUBMITTED = 'SUBMITTED',   // Sent to venue
  PARTIAL = 'PARTIAL',       // Partially filled
  FILLED = 'FILLED',         // Completely filled
  CANCELLED = 'CANCELLED',   // Cancelled by user or system
  REJECTED = 'REJECTED',     // Rejected by venue
}

// Level in the order book (price level)
export interface PriceLevel {
  price: number;           // Price at this level
  quantity: number;        // Total quantity available
  orderCount: number;      // Number of orders at this level
}

// Individual order
export interface Order {
  id: string;
  symbol: string;          // Ticker symbol (e.g., 'AAPL')
  side: OrderSide;
  type: OrderType;
  price?: number;          // Limit price (undefined for market orders)
  quantity: number;        // Total quantity
  filledQuantity: number;  // Amount already filled
  status: OrderStatus;
  timestamp: number;       // Creation timestamp
  venueId?: string;        // Venue where order is placed
  parentOrderId?: string;  // For child orders split by SOR
  displayQuantity?: number; // For iceberg orders
}

// Order book for a single venue
export interface OrderBook {
  venueId: string;
  symbol: string;
  bids: PriceLevel[];      // Buy orders (highest to lowest)
  asks: PriceLevel[];      // Sell orders (lowest to highest)
  timestamp: number;
  spread: number;          // Best ask - best bid
  midPrice: number;        // (Best ask + best bid) / 2
}

// Execution/fill of an order
export interface Execution {
  id: string;
  orderId: string;
  venueId: string;
  price: number;
  quantity: number;
  timestamp: number;
  fees: number;
  liquidity: 'MAKER' | 'TAKER'; // Did we add or take liquidity?
}

// Trading venue configuration
export interface Venue {
  id: string;
  name: string;
  displayName: string;
  makerFee: number;        // Fee for adding liquidity (can be negative = rebate)
  takerFee: number;        // Fee for taking liquidity
  latency: number;         // Simulated network latency in ms
  active: boolean;
  color: string;           // For UI display
}

// Market data snapshot across all venues
export interface MarketSnapshot {
  symbol: string;
  timestamp: number;
  venues: {
    [venueId: string]: OrderBook;
  };
  nbbo: {                  // National Best Bid and Offer
    bid: number;
    ask: number;
    bidVenue: string;
    askVenue: string;
  };
}
