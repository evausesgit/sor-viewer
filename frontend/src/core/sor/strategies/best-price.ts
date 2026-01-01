import type { Order, Venue, OrderBook } from '../../types/market';
import type { RoutingDecision } from '../../types/sor';
import { OrderSide } from '../../types/market';

/**
 * Execute la stratégie "Best Price First" pour router un ordre.
 *
 * Cette stratégie simple :
 * 1. Agrège tous les niveaux de prix de toutes les venues
 * 2. Trie tous les niveaux par meilleur prix
 * 3. Consomme la liquidité niveau par niveau jusqu'à remplir l'ordre
 * 4. Retourne une décision par niveau de prix (pas agrégé par venue)
 *
 * @param order - L'ordre parent à router
 * @param venues - Liste des venues disponibles
 * @param orderBooks - Map des order books par venue ID
 * @returns Liste de décisions de routing (une par niveau de prix) triées par priorité d'exécution
 */
export function executeBestPriceStrategy(
  order: Order,
  venues: Venue[],
  orderBooks: Map<string, OrderBook>
): RoutingDecision[] {
  // 1. Déterminer le côté du book à utiliser
  // Si on achète (BID), on prend la liquidité des vendeurs (ask)
  // Si on vend (ASK), on prend la liquidité des acheteurs (bid)
  const bookSide: 'bid' | 'ask' = order.side === OrderSide.BID ? 'ask' : 'bid';

  // 2. Agréger tous les niveaux de prix de toutes les venues
  interface PriceLevel {
    venueId: string;
    venue: Venue;
    price: number;
    quantity: number;
  }

  const allPriceLevels: PriceLevel[] = [];

  venues.forEach(venue => {
    // Filtrer les venues actives qui ont un order book
    if (!venue.active) return;
    if (!orderBooks.has(venue.id)) return;

    const orderBook = orderBooks.get(venue.id)!;
    const levels = bookSide === 'bid' ? orderBook.bids : orderBook.asks;

    // Extraire chaque niveau de prix
    levels.forEach(level => {
      allPriceLevels.push({
        venueId: venue.id,
        venue: venue,
        price: level.price,
        quantity: level.quantity
      });
    });
  });

  if (allPriceLevels.length === 0) {
    return [];
  }

  // 3. Trier tous les niveaux par prix
  // Pour un ordre BUY (BID) : on veut le prix le plus bas (ascending)
  // Pour un ordre SELL (ASK) : on veut le prix le plus haut (descending)
  allPriceLevels.sort((a, b) => {
    if (order.side === OrderSide.BID) {
      return a.price - b.price; // Plus bas d'abord
    } else {
      return b.price - a.price; // Plus haut d'abord
    }
  });

  // 4. Consommer la liquidité niveau par niveau et créer une décision par niveau
  let remainingQuantity = order.quantity;
  const decisions: RoutingDecision[] = [];
  let priority = 0;

  for (const level of allPriceLevels) {
    if (remainingQuantity <= 0) break;

    // Quantité à prendre sur ce niveau
    const quantityToTake = Math.min(remainingQuantity, level.quantity);

    // Créer une décision pour ce niveau de prix
    decisions.push({
      venueId: level.venueId,
      quantity: quantityToTake,
      expectedPrice: level.price,
      expectedFees: 0, // Pas de frais
      rationale: `${quantityToTake.toLocaleString()} @ $${level.price.toFixed(2)} on ${level.venueId}`,
      priority: priority++
    });

    remainingQuantity -= quantityToTake;
  }

  return decisions;
}
