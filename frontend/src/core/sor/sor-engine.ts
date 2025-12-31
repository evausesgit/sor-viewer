import type { Order, Venue, OrderBook } from '../types/market';
import type { RoutingPlan, RoutingDecision, SORConfig } from '../types/sor';
import { RoutingStrategy } from '../types/sor';
import { executeBestPriceStrategy } from './strategies';

/**
 * SOR Engine - Orchestrateur principal pour le Smart Order Router
 *
 * Responsabilités :
 * - Valider les inputs (ordre, venues, orderBooks)
 * - Sélectionner et exécuter la stratégie de routing appropriée
 * - Calculer les métriques globales (prix moyen, coût total, slippage)
 * - Générer un RoutingPlan complet
 */
export class SOREngine {
  /**
   * Génère un plan de routing pour un ordre donné
   *
   * @param order - L'ordre parent à router
   * @param venues - Liste des venues disponibles
   * @param orderBooks - Map des order books par venue ID
   * @param config - Configuration du SOR
   * @returns Un plan de routing complet avec décisions et métriques
   * @throws Error si les inputs sont invalides ou s'il n'y a pas de liquidité
   */
  static generateRoutingPlan(
    order: Order,
    venues: Venue[],
    orderBooks: Map<string, OrderBook>,
    config: SORConfig
  ): RoutingPlan {
    // 1. Validation des inputs
    this.validateInputs(order, venues, orderBooks);

    // 2. Filtrer les venues selon la config
    const eligibleVenues = this.filterVenues(venues, orderBooks, config);

    if (eligibleVenues.length === 0) {
      throw new Error('No eligible venues available for routing');
    }

    // 3. Exécuter la stratégie appropriée
    let decisions: RoutingDecision[];

    switch (config.strategy) {
      case RoutingStrategy.BEST_PRICE:
        decisions = executeBestPriceStrategy(order, eligibleVenues, orderBooks);
        break;

      case RoutingStrategy.PRO_RATA:
      case RoutingStrategy.VWAP:
      case RoutingStrategy.TWAP:
      case RoutingStrategy.MINIMIZE_IMPACT:
      case RoutingStrategy.MINIMIZE_COST:
        throw new Error(`Strategy ${config.strategy} not yet implemented`);

      default:
        throw new Error(`Unknown routing strategy: ${config.strategy}`);
    }

    // 4. Filtrer selon minQuantityPerVenue
    if (config.minQuantityPerVenue > 0) {
      decisions = decisions.filter(d => d.quantity >= config.minQuantityPerVenue);
    }

    // 5. Limiter au maxVenues
    if (config.maxVenues > 0 && decisions.length > config.maxVenues) {
      decisions = decisions.slice(0, config.maxVenues);
    }

    // 6. Vérifier si on a alloué suffisamment de quantité
    const totalAllocated = decisions.reduce((sum, d) => sum + d.quantity, 0);

    if (totalAllocated === 0) {
      throw new Error('Unable to allocate any quantity to venues');
    }

    if (!config.allowPartialFills && totalAllocated < order.quantity) {
      throw new Error(
        `Insufficient liquidity: requested ${order.quantity}, available ${totalAllocated}`
      );
    }

    // 7. Calculer les métriques globales
    const metrics = this.calculateMetrics(decisions, order);

    // 8. Construire le RoutingPlan
    const plan: RoutingPlan = {
      parentOrderId: order.id,
      strategy: config.strategy,
      decisions: decisions.sort((a, b) => a.priority - b.priority), // Trier par priorité
      totalQuantity: totalAllocated,
      estimatedAvgPrice: metrics.avgPrice,
      estimatedTotalCost: metrics.totalCost,
      estimatedSlippage: metrics.slippage,
      timestamp: Date.now()
    };

    return plan;
  }

  /**
   * Valide les inputs de base
   */
  private static validateInputs(
    order: Order,
    venues: Venue[],
    orderBooks: Map<string, OrderBook>
  ): void {
    if (!order || order.quantity <= 0) {
      throw new Error('Invalid order: quantity must be positive');
    }

    if (!venues || venues.length === 0) {
      throw new Error('No venues provided');
    }

    if (!orderBooks || orderBooks.size === 0) {
      throw new Error('No order books provided');
    }
  }

  /**
   * Filtre les venues éligibles selon la configuration
   */
  private static filterVenues(
    venues: Venue[],
    orderBooks: Map<string, OrderBook>,
    config: SORConfig
  ): Venue[] {
    return venues.filter(venue => {
      // Doit être active
      if (!venue.active) return false;

      // Doit avoir un order book
      if (!orderBooks.has(venue.id)) return false;

      return true;
    });
  }

  /**
   * Calcule les métriques globales du routing plan
   */
  private static calculateMetrics(
    decisions: RoutingDecision[],
    order: Order
  ): {
    avgPrice: number;
    totalCost: number;
    slippage: number;
  } {
    if (decisions.length === 0) {
      return { avgPrice: 0, totalCost: 0, slippage: 0 };
    }

    // Calculer le prix moyen pondéré par volume
    const totalQuantity = decisions.reduce((sum, d) => sum + d.quantity, 0);
    const weightedPriceSum = decisions.reduce(
      (sum, d) => sum + d.expectedPrice * d.quantity,
      0
    );
    const avgPrice = weightedPriceSum / totalQuantity;

    // Calculer le coût total (prix + frais)
    const totalFees = decisions.reduce((sum, d) => sum + d.expectedFees, 0);
    const totalCost = weightedPriceSum + totalFees;

    // Calculer le slippage (différence avec le prix limite si spécifié)
    let slippage = 0;
    if (order.price) {
      // Si ordre limite, comparer avec le prix limite
      slippage = Math.abs(avgPrice - order.price);
    } else {
      // Si ordre market, le slippage sera calculé à l'exécution
      // Pour l'instant on le laisse à 0
      slippage = 0;
    }

    return { avgPrice, totalCost, slippage };
  }

  /**
   * Crée une configuration SOR par défaut
   */
  static createDefaultConfig(): SORConfig {
    return {
      strategy: RoutingStrategy.BEST_PRICE,
      maxVenues: 10,
      minQuantityPerVenue: 0,
      considerFees: true,
      considerLatency: false,
      allowPartialFills: true
    };
  }
}
