/**
 * Core market data types for Smart Order Router simulation
 */

// Side of the order (buy/sell)
export const OrderSide = {
  BID: 'BID',
  ASK: 'ASK',
} as const;
export type OrderSide = typeof OrderSide[keyof typeof OrderSide];

// Type of order
export const OrderType = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
  ICEBERG: 'ICEBERG',
  HIDDEN: 'HIDDEN',
  POST_ONLY: 'POST_ONLY',
} as const;
export type OrderType = typeof OrderType[keyof typeof OrderType];

// Order status
export const OrderStatus = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  PARTIAL: 'PARTIAL',
  FILLED: 'FILLED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

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
