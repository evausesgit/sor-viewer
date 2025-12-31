/**
 * Market simulator - generates realistic order books
 */

import type { OrderBook, PriceLevel, Venue } from '../types/market';

export class MarketSimulator {
  private basePrice: number;
  private volatility: number;

  constructor(basePrice: number = 100, volatility: number = 0.5) {
    this.basePrice = basePrice;
    this.volatility = volatility;
  }

  /**
   * Generate a realistic order book for a venue
   */
  generateOrderBook(venue: Venue, symbol: string): OrderBook {
    // Add some variance to mid price per venue
    const venueVariance = (Math.random() - 0.5) * this.volatility;
    const midPrice = this.basePrice + venueVariance;

    // Spread varies by venue (more liquid venues have tighter spreads)
    const baseSpread = 0.01 + Math.random() * 0.02;
    const spread = baseSpread * (1 + venue.latency / 100);

    const bestBid = midPrice - spread / 2;
    const bestAsk = midPrice + spread / 2;

    // Generate bid levels (descending prices)
    const bids = this.generatePriceLevels(bestBid, 'bid', 15);

    // Generate ask levels (ascending prices)
    const asks = this.generatePriceLevels(bestAsk, 'ask', 15);

    return {
      venueId: venue.id,
      symbol,
      bids,
      asks,
      timestamp: Date.now(),
      spread: bestAsk - bestBid,
      midPrice,
    };
  }

  /**
   * Generate multiple price levels for one side of the book
   */
  private generatePriceLevels(
    startPrice: number,
    side: 'bid' | 'ask',
    levels: number
  ): PriceLevel[] {
    const priceLevels: PriceLevel[] = [];
    const direction = side === 'bid' ? -1 : 1;

    for (let i = 0; i < levels; i++) {
      // Price gets worse as we go deeper in the book
      const tickSize = 0.01;
      const price = startPrice + (direction * i * tickSize * (1 + Math.random()));

      // Quantity decreases with depth but has some randomness
      const baseQuantity = 1000;
      const depthFactor = Math.exp(-i / 5); // Exponential decay
      const randomFactor = 0.5 + Math.random();
      const quantity = Math.round(baseQuantity * depthFactor * randomFactor / 100) * 100;

      // Number of orders at this level
      const orderCount = Math.max(1, Math.round(quantity / 200 * Math.random()));

      priceLevels.push({
        price: Math.round(price * 100) / 100, // Round to 2 decimals
        quantity,
        orderCount,
      });
    }

    return priceLevels;
  }

  /**
   * Update order book with realistic market movement
   */
  updateOrderBook(orderBook: OrderBook): OrderBook {
    // Simulate small price movement
    const priceChange = (Math.random() - 0.5) * this.volatility * 0.1;
    this.basePrice += priceChange;

    // Regenerate levels with new base price
    const spread = orderBook.spread;
    const newMidPrice = this.basePrice;
    const bestBid = newMidPrice - spread / 2;
    const bestAsk = newMidPrice + spread / 2;

    return {
      ...orderBook,
      bids: this.generatePriceLevels(bestBid, 'bid', 15),
      asks: this.generatePriceLevels(bestAsk, 'ask', 15),
      timestamp: Date.now(),
      midPrice: newMidPrice,
    };
  }

  /**
   * Get total liquidity available in order book
   */
  static getTotalLiquidity(orderBook: OrderBook, side: 'bid' | 'ask'): number {
    const levels = side === 'bid' ? orderBook.bids : orderBook.asks;
    return levels.reduce((sum, level) => sum + level.quantity, 0);
  }

  /**
   * Get liquidity up to a certain price
   */
  static getLiquidityUpToPrice(
    orderBook: OrderBook,
    side: 'bid' | 'ask',
    targetPrice: number
  ): number {
    const levels = side === 'bid' ? orderBook.bids : orderBook.asks;
    let liquidity = 0;

    for (const level of levels) {
      if (side === 'bid' && level.price >= targetPrice) {
        liquidity += level.quantity;
      } else if (side === 'ask' && level.price <= targetPrice) {
        liquidity += level.quantity;
      } else {
        break;
      }
    }

    return liquidity;
  }

  /**
   * Calculate VWAP for a given quantity
   */
  static calculateVWAP(
    orderBook: OrderBook,
    side: 'bid' | 'ask',
    quantity: number
  ): number {
    const levels = side === 'bid' ? orderBook.bids : orderBook.asks;
    let remaining = quantity;
    let totalValue = 0;
    let totalQty = 0;

    for (const level of levels) {
      const takeQty = Math.min(remaining, level.quantity);
      totalValue += takeQty * level.price;
      totalQty += takeQty;
      remaining -= takeQty;

      if (remaining <= 0) break;
    }

    return totalQty > 0 ? totalValue / totalQty : 0;
  }
}
