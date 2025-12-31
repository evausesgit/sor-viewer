import type { Order, Venue, OrderBook } from '../../types/market';
import type { RoutingDecision } from '../../types/sor';
import { OrderSide } from '../../types/market';
import { MarketSimulator } from '../../venues/market-simulator';

/**
 * Execute la stratégie "Best Price First" pour router un ordre.
 *
 * Cette stratégie simple :
 * 1. Calcule le prix effectif (VWAP + frais) pour chaque venue
 * 2. Trie les venues par meilleur prix
 * 3. Alloue la quantité de manière greedy (prendre tout d'une venue avant la suivante)
 *
 * @param order - L'ordre parent à router
 * @param venues - Liste des venues disponibles
 * @param orderBooks - Map des order books par venue ID
 * @returns Liste de décisions de routing triées par priorité d'exécution
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

  // 2. Construire un tableau de scoring pour chaque venue
  interface VenueScore {
    venue: Venue;
    orderBook: OrderBook;
    vwap: number;
    fees: number;
    effectivePrice: number;
    availableLiquidity: number;
  }

  const venueScores: VenueScore[] = venues
    .filter(venue => {
      // Filtrer les venues actives qui ont un order book
      if (!venue.active) return false;
      if (!orderBooks.has(venue.id)) return false;

      const orderBook = orderBooks.get(venue.id)!;
      const liquidity = MarketSimulator.getTotalLiquidity(orderBook, bookSide);

      // Exclure les venues sans liquidité
      return liquidity > 0;
    })
    .map(venue => {
      const orderBook = orderBooks.get(venue.id)!;

      // Calculer la liquidité disponible
      const availableLiquidity = MarketSimulator.getTotalLiquidity(orderBook, bookSide);

      // Calculer le VWAP pour la quantité demandée (ou la liquidité disponible si insuffisante)
      const quantityToCalculate = Math.min(order.quantity, availableLiquidity);
      const vwap = MarketSimulator.calculateVWAP(orderBook, bookSide, quantityToCalculate);

      // Calculer les frais (on assume taker fees pour la simplicité)
      const fees = vwap * quantityToCalculate * venue.takerFee;

      // Prix effectif = VWAP + frais par unité
      const effectivePrice = vwap + (fees / quantityToCalculate);

      return {
        venue,
        orderBook,
        vwap,
        fees,
        effectivePrice,
        availableLiquidity
      };
    });

  // 3. Trier par prix effectif
  // Pour un ordre BUY (BID) : on veut le prix le plus bas (ascending)
  // Pour un ordre SELL (ASK) : on veut le prix le plus haut (descending)
  venueScores.sort((a, b) => {
    if (order.side === OrderSide.BID) {
      return a.effectivePrice - b.effectivePrice; // Plus bas d'abord
    } else {
      return b.effectivePrice - a.effectivePrice; // Plus haut d'abord
    }
  });

  // 4. Allouer la quantité de manière greedy
  let remainingQuantity = order.quantity;
  const decisions: RoutingDecision[] = [];

  venueScores.forEach((score, index) => {
    if (remainingQuantity <= 0) return;

    // Allouer autant que possible sur cette venue
    const allocatedQuantity = Math.min(remainingQuantity, score.availableLiquidity);
    remainingQuantity -= allocatedQuantity;

    // Recalculer VWAP et frais pour la quantité réellement allouée
    const actualVwap = MarketSimulator.calculateVWAP(
      score.orderBook,
      bookSide,
      allocatedQuantity
    );
    const actualFees = actualVwap * allocatedQuantity * score.venue.takerFee;

    decisions.push({
      venueId: score.venue.id,
      quantity: allocatedQuantity,
      expectedPrice: actualVwap,
      expectedFees: actualFees,
      rationale: `Best price: $${score.effectivePrice.toFixed(2)}/share (VWAP: $${actualVwap.toFixed(2)} + fees: $${actualFees.toFixed(2)})`,
      priority: index // L'ordre dans le tri détermine la priorité d'exécution
    });
  });

  return decisions;
}
