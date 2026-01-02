/**
 * VWAP Strategy Calculator - Calcule comment découper un ordre en tranches VWAP
 *
 * Principe: Distribuer la quantité proportionnellement au volume historique
 * pour minimiser l'écart par rapport au VWAP du marché
 */

import type { VWAPConfig, VWAPStrategy, VWAPSlice, VolumeProfile } from '../types/vwap';
import { SliceStatus } from '../types/vwap';
import { generateIntradayProfile } from './volume-profile';

/**
 * Calcule une stratégie VWAP complète
 *
 * @param config - Configuration de l'ordre VWAP
 * @param volumeProfile - Profil de volume historique (optionnel)
 * @returns Stratégie VWAP avec toutes les tranches calculées
 */
export function calculateVWAPStrategy(
  config: VWAPConfig,
  volumeProfile?: VolumeProfile
): VWAPStrategy {
  // Générer ou utiliser le profil de volume
  const profile = volumeProfile || generateIntradayProfile(
    'DEFAULT',
    config.sliceDuration,
    10_000_000
  );

  // Calculer le temps de début
  const startTime = config.startTime || getCurrentMarketTime();

  // Filtrer les tranches dans l'horizon temporel
  const relevantSlots = filterRelevantTimeSlots(
    profile,
    startTime,
    config.timeHorizon
  );

  if (relevantSlots.length === 0) {
    throw new Error('No valid time slots found for the given time horizon');
  }

  // Calculer la distribution de la quantité
  const slices = calculateSliceDistribution(
    config,
    relevantSlots,
    startTime
  );

  // Estimer le VWAP et slippage
  const estimatedVWAP = estimateVWAP(slices);
  const estimatedSlippage = estimateSlippage(slices, config);

  return {
    config,
    slices,
    estimatedVWAP,
    estimatedSlippage
  };
}

/**
 * Filtre les créneaux horaires pertinents pour l'horizon temporel
 */
function filterRelevantTimeSlots(
  profile: VolumeProfile,
  startTime: string,
  timeHorizon: number
): VolumeProfile['timeSlots'] {
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = startMinutes + timeHorizon;

  return profile.timeSlots.filter(slot => {
    const slotStart = timeStringToMinutes(slot.startTime);
    const slotEnd = timeStringToMinutes(slot.endTime);

    // Inclure si le slot chevauche notre horizon
    return slotStart < endMinutes && slotEnd > startMinutes;
  });
}

/**
 * Calcule la distribution de la quantité sur les tranches
 */
function calculateSliceDistribution(
  config: VWAPConfig,
  timeSlots: VolumeProfile['timeSlots'],
  startTime: string
): VWAPSlice[] {
  // Calculer le volume total sur l'horizon
  const totalVolume = timeSlots.reduce((sum, slot) => sum + slot.averageVolume, 0);

  // Facteur d'agressivité
  const aggressivenessFactor = getAggressivenessFactor(config.aggressiveness);

  const slices: VWAPSlice[] = timeSlots.map((slot, index) => {
    // Quantité de base proportionnelle au volume
    const baseQuantity = (slot.averageVolume / totalVolume) * config.totalQuantity;

    // Ajuster selon l'agressivité
    const targetQuantity = Math.round(baseQuantity * aggressivenessFactor);

    // Taux de participation (notre quantité / volume du marché)
    const participationRate = (targetQuantity / slot.averageVolume) * 100;

    return {
      sliceNumber: index,
      startTime: slot.startTime,
      endTime: slot.endTime,
      targetQuantity,
      volumePercentage: slot.volumePercentage,
      participationRate,
      status: SliceStatus.PENDING
    };
  });

  // Normaliser pour que la somme = totalQuantity (arrondir correctement)
  normalizeSliceQuantities(slices, config.totalQuantity);

  return slices;
}

/**
 * Normalise les quantités pour que la somme soit exactement égale à la quantité totale
 */
function normalizeSliceQuantities(slices: VWAPSlice[], totalQuantity: number): void {
  const currentTotal = slices.reduce((sum, slice) => sum + slice.targetQuantity, 0);
  const diff = totalQuantity - currentTotal;

  if (diff !== 0) {
    // Distribuer la différence sur les plus grosses tranches
    const sortedIndices = slices
      .map((slice, index) => ({ index, quantity: slice.targetQuantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .map(item => item.index);

    let remaining = diff;
    let i = 0;

    while (remaining !== 0 && i < sortedIndices.length) {
      const index = sortedIndices[i];
      const adjustment = remaining > 0 ? 1 : -1;

      if (slices[index].targetQuantity + adjustment > 0) {
        slices[index].targetQuantity += adjustment;
        remaining -= adjustment;
      }

      i++;
    }
  }

  // Recalculer les participation rates
  slices.forEach(slice => {
    const volumeForSlice = slice.volumePercentage * 10_000_000 / 100; // Approximation
    slice.participationRate = (slice.targetQuantity / volumeForSlice) * 100;
  });
}

/**
 * Retourne le facteur d'agressivité
 */
function getAggressivenessFactor(aggressiveness: VWAPConfig['aggressiveness']): number {
  switch (aggressiveness) {
    case 'passive':
      return 0.7;   // Exécuter 70% du volume proportionnel
    case 'neutral':
      return 1.0;   // Exécuter exactement le volume proportionnel
    case 'aggressive':
      return 1.3;   // Exécuter 130% du volume proportionnel
    default:
      return 1.0;
  }
}

/**
 * Estime le VWAP attendu (simplifié pour MVP)
 */
function estimateVWAP(slices: VWAPSlice[]): number {
  // Pour l'instant, on assume un prix de base
  // Dans une version complète, on utiliserait les prix réels du marché
  return 100.0; // Prix de base
}

/**
 * Estime le slippage attendu en basis points
 */
function estimateSlippage(slices: VWAPSlice[], config: VWAPConfig): number {
  // Estimation basique basée sur le taux de participation moyen
  const avgParticipation = slices.reduce(
    (sum, slice) => sum + slice.participationRate,
    0
  ) / slices.length;

  // Plus on participe, plus on a d'impact
  // Formule simplifiée: slippage (bps) ≈ participation_rate / 2
  const estimatedSlippageBps = avgParticipation / 2;

  // Ajuster selon l'agressivité
  const aggressivenessFactor = getAggressivenessFactor(config.aggressiveness);
  return estimatedSlippageBps * aggressivenessFactor;
}

/**
 * Convertit une heure HH:MM en minutes depuis minuit
 */
function timeStringToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Retourne l'heure actuelle du marché (simulé pour MVP)
 */
function getCurrentMarketTime(): string {
  // Pour MVP, on retourne toujours 9:30 (ouverture)
  // Dans la version complète, on utiliserait l'heure réelle
  return '09:30';
}

/**
 * Crée une configuration par défaut pour testing
 */
export function createDefaultVWAPConfig(): VWAPConfig {
  return {
    totalQuantity: 100_000,
    timeHorizon: 120,          // 2 heures
    sliceDuration: 15,         // 15 minutes
    aggressiveness: 'neutral',
    startTime: '09:30'
  };
}
