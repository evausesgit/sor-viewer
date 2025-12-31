/**
 * Simulation de l'exécution d'un ordre contre un order book
 * Calcule exactement quels niveaux de prix sont touchés et combien de liquidité est prise
 */

import type { OrderBook, Order } from '../types/market';
import { OrderSide } from '../types/market';

export interface PriceLevelExecution {
  price: number;
  quantityTaken: number;
  quantityRemaining: number; // Quantité restante après exécution
  percentageTaken: number; // % de liquidité prise à ce niveau
}

export interface VenueExecutionDetail {
  venueId: string;
  side: 'bid' | 'ask'; // Côté du book utilisé (inverse de l'ordre)
  totalQuantity: number;
  levels: PriceLevelExecution[];
  avgPrice: number;
}

/**
 * Simule l'exécution d'une quantité contre un order book
 * Retourne les détails de quels niveaux de prix sont touchés
 */
export function simulateExecution(
  orderBook: OrderBook,
  order: Order,
  quantityToFill: number
): VenueExecutionDetail {
  // Déterminer le côté du book à utiliser
  const bookSide: 'bid' | 'ask' = order.side === OrderSide.BID ? 'ask' : 'bid';
  const levels = bookSide === 'bid' ? orderBook.bids : orderBook.asks;

  const executedLevels: PriceLevelExecution[] = [];
  let remainingQuantity = quantityToFill;
  let totalCost = 0;

  // Parcourir les niveaux de prix jusqu'à remplir la quantité
  for (const level of levels) {
    if (remainingQuantity <= 0) break;

    const quantityAtThisLevel = Math.min(remainingQuantity, level.quantity);
    const percentageTaken = (quantityAtThisLevel / level.quantity) * 100;

    executedLevels.push({
      price: level.price,
      quantityTaken: quantityAtThisLevel,
      quantityRemaining: level.quantity - quantityAtThisLevel,
      percentageTaken
    });

    totalCost += quantityAtThisLevel * level.price;
    remainingQuantity -= quantityAtThisLevel;
  }

  const avgPrice = executedLevels.length > 0 ? totalCost / quantityToFill : 0;

  return {
    venueId: '', // Sera rempli par l'appelant
    side: bookSide,
    totalQuantity: quantityToFill,
    levels: executedLevels,
    avgPrice
  };
}
