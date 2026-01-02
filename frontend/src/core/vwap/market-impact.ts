/**
 * Market Impact Model - Calcule l'impact d'une exécution sur le prix
 *
 * Utilise un modèle square-root simplifié inspiré du modèle Barra/Almgren-Chriss:
 * - Impact temporaire: disparaît après l'exécution
 * - Impact permanent: reste après (information leakage)
 */

import type { MarketImpact, ImpactModel } from '../types/vwap';

/**
 * Calcule l'impact sur le prix pour une tranche d'exécution
 *
 * @param sliceQuantity - Quantité à exécuter dans cette tranche
 * @param marketVolume - Volume moyen du marché pour cette période
 * @param basePrice - Prix de base avant impact
 * @param model - Modèle d'impact (optionnel, utilise le modèle par défaut)
 * @returns MarketImpact avec impact temporaire, permanent et total
 */
export function calculateSliceImpact(
  sliceQuantity: number,
  marketVolume: number,
  basePrice: number,
  model?: ImpactModel
): MarketImpact {
  const impactModel = model || createDefaultImpactModel();

  // Ratio de notre quantité par rapport au volume du marché
  const volumeRatio = sliceQuantity / marketVolume;

  // Impact temporaire (modèle square-root)
  // I_temp = k_temp × (quantity / avg_volume)^alpha
  const temporaryImpactFactor = impactModel.k_temporary * Math.pow(volumeRatio, impactModel.alpha);
  const temporaryImpact = basePrice * temporaryImpactFactor;

  // Impact permanent (plus petit, linéaire)
  // I_perm = k_perm × (quantity / avg_volume)^beta
  const permanentImpactFactor = impactModel.k_permanent * Math.pow(volumeRatio, impactModel.beta);
  const permanentImpact = basePrice * permanentImpactFactor;

  // Impact total
  const totalImpact = temporaryImpact + permanentImpact;

  // Convertir en basis points (bps)
  const impactBps = (totalImpact / basePrice) * 10000;

  return {
    temporaryImpact,
    permanentImpact,
    totalImpact,
    impactBps
  };
}

/**
 * Calcule l'impact cumulatif de plusieurs tranches exécutées
 *
 * L'impact permanent s'accumule au fil des exécutions
 *
 * @param previousImpacts - Tableau des impacts précédents
 * @returns Impact permanent cumulé
 */
export function calculateCumulativeImpact(previousImpacts: MarketImpact[]): number {
  return previousImpacts.reduce(
    (sum, impact) => sum + impact.permanentImpact,
    0
  );
}

/**
 * Calcule le prix effectif après impact
 *
 * @param basePrice - Prix de base
 * @param impact - Impact calculé
 * @param side - 'buy' ou 'sell'
 * @returns Prix effectif après impact
 */
export function calculateEffectivePrice(
  basePrice: number,
  impact: MarketImpact,
  side: 'buy' | 'sell'
): number {
  // Pour un achat, le prix monte (impact positif)
  // Pour une vente, le prix descend (impact négatif)
  const impactDirection = side === 'buy' ? 1 : -1;
  return basePrice + (impact.totalImpact * impactDirection);
}

/**
 * Estime le prix moyen d'exécution d'une tranche avec impact progressif
 *
 * Pendant l'exécution, l'impact augmente graduellement
 *
 * @param basePrice - Prix de départ
 * @param impact - Impact total à la fin
 * @param side - 'buy' ou 'sell'
 * @returns Prix moyen d'exécution
 */
export function estimateAverageExecutionPrice(
  basePrice: number,
  impact: MarketImpact,
  side: 'buy' | 'sell'
): number {
  // L'impact moyen est environ 50% de l'impact final
  // (l'impact augmente progressivement pendant l'exécution)
  const avgImpact = impact.totalImpact * 0.5;
  const impactDirection = side === 'buy' ? 1 : -1;

  return basePrice + (avgImpact * impactDirection);
}

/**
 * Crée un modèle d'impact par défaut
 *
 * Coefficients calibrés pour un marché liquide typique (actions large cap)
 */
export function createDefaultImpactModel(): ImpactModel {
  return {
    k_temporary: 0.01,    // 1% d'impact temporaire à 100% de participation
    k_permanent: 0.001,   // 0.1% d'impact permanent à 100% de participation
    alpha: 0.5,           // Exposant square-root pour temporaire
    beta: 0.6             // Exposant légèrement plus élevé pour permanent
  };
}

/**
 * Crée un modèle d'impact agressif (marché moins liquide)
 */
export function createAggressiveImpactModel(): ImpactModel {
  return {
    k_temporary: 0.02,
    k_permanent: 0.002,
    alpha: 0.5,
    beta: 0.6
  };
}

/**
 * Crée un modèle d'impact conservateur (marché très liquide)
 */
export function createConservativeImpactModel(): ImpactModel {
  return {
    k_temporary: 0.005,
    k_permanent: 0.0005,
    alpha: 0.5,
    beta: 0.6
  };
}

/**
 * Estime l'impact total d'une stratégie VWAP complète
 *
 * @param totalQuantity - Quantité totale de l'ordre
 * @param avgDailyVolume - Volume quotidien moyen
 * @param basePrice - Prix de base
 * @param model - Modèle d'impact
 * @returns Estimation de l'impact total
 */
export function estimateTotalStrategyImpact(
  totalQuantity: number,
  avgDailyVolume: number,
  basePrice: number,
  model?: ImpactModel
): MarketImpact {
  const impactModel = model || createDefaultImpactModel();

  // Pour une stratégie VWAP, l'impact est réparti sur plusieurs tranches
  // L'impact total est donc inférieur à l'exécution d'un bloc unique

  // Facteur de réduction (~50% pour une bonne stratégie VWAP)
  const vwapReductionFactor = 0.5;

  // Calculer comme si c'était une seule tranche
  const singleBlockImpact = calculateSliceImpact(
    totalQuantity,
    avgDailyVolume,
    basePrice,
    impactModel
  );

  // Appliquer le facteur de réduction
  return {
    temporaryImpact: singleBlockImpact.temporaryImpact * vwapReductionFactor,
    permanentImpact: singleBlockImpact.permanentImpact * vwapReductionFactor,
    totalImpact: singleBlockImpact.totalImpact * vwapReductionFactor,
    impactBps: singleBlockImpact.impactBps * vwapReductionFactor
  };
}
