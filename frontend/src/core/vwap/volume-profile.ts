/**
 * Volume Profile Generator - Génère des profils de volume historiques réalistes
 *
 * Génère une courbe en U typique du marché intraday :
 * - Volume élevé à l'ouverture (9:30-10:00)
 * - Volume faible en milieu de journée
 * - Volume élevé à la fermeture (15:30-16:00)
 */

import type { VolumeProfile, TimeSlot } from '../types/vwap';

/**
 * Génère un profil de volume intraday avec une courbe en U
 *
 * @param symbol - Symbol de l'action
 * @param sliceDuration - Durée de chaque tranche en minutes (5, 15, 30)
 * @param totalDailyVolume - Volume total estimé de la journée
 * @returns VolumeProfile avec distribution réaliste
 */
export function generateIntradayProfile(
  symbol: string,
  sliceDuration: number = 15,
  totalDailyVolume: number = 10_000_000
): VolumeProfile {
  // Heures de marché: 9:30 - 16:00 (6h30 = 390 minutes)
  const marketOpen = 9 * 60 + 30;  // 9:30 en minutes depuis minuit
  const marketClose = 16 * 60;      // 16:00 en minutes
  const totalMinutes = marketClose - marketOpen; // 390 minutes

  const timeSlots: TimeSlot[] = [];
  let currentTime = marketOpen;

  // Générer les tranches
  while (currentTime < marketClose) {
    const sliceEnd = Math.min(currentTime + sliceDuration, marketClose);
    const sliceMidpoint = (currentTime + sliceEnd) / 2;

    // Calculer le pourcentage de volume pour cette tranche (courbe en U)
    const volumePercentage = calculateVolumePercentage(
      sliceMidpoint,
      marketOpen,
      marketClose,
      totalMinutes,
      sliceDuration
    );

    timeSlots.push({
      startTime: minutesToTimeString(currentTime),
      endTime: minutesToTimeString(sliceEnd),
      volumePercentage,
      averageVolume: Math.round((volumePercentage / 100) * totalDailyVolume)
    });

    currentTime = sliceEnd;
  }

  // Normaliser pour que la somme = 100%
  const totalPercentage = timeSlots.reduce((sum, slot) => sum + slot.volumePercentage, 0);
  timeSlots.forEach(slot => {
    slot.volumePercentage = (slot.volumePercentage / totalPercentage) * 100;
    slot.averageVolume = Math.round((slot.volumePercentage / 100) * totalDailyVolume);
  });

  return {
    symbol,
    date: new Date().toISOString().split('T')[0],
    timeSlots,
    totalDailyVolume
  };
}

/**
 * Calcule le pourcentage de volume pour un moment donné (courbe en U)
 *
 * Modèle basé sur:
 * - Ouverture (9:30-10:00): ~18% du volume
 * - Milieu journée (11:00-14:00): ~5% du volume
 * - Fermeture (15:30-16:00): ~20% du volume
 */
function calculateVolumePercentage(
  sliceMidpoint: number,
  marketOpen: number,
  marketClose: number,
  totalMinutes: number,
  sliceDuration: number
): number {
  // Normaliser le temps entre 0 et 1
  const normalizedTime = (sliceMidpoint - marketOpen) / totalMinutes;

  // Paramètres de la courbe en U
  // f(t) = a * t^2 - b * t + c
  // Minimum au milieu (t = 0.5), maximum aux extrémités

  const a = 4;    // Contrôle la courbure
  const b = 4;    // Centre le minimum
  const c = 2;    // Niveau de base

  // Calculer le facteur de volume (U-shape)
  const volumeFactor = a * Math.pow(normalizedTime, 2) - b * normalizedTime + c;

  // Boost supplémentaire à l'ouverture et à la fermeture
  let openingBoost = 0;
  let closingBoost = 0;

  // Première demi-heure (9:30-10:00)
  if (sliceMidpoint < marketOpen + 30) {
    openingBoost = 1.5 * (1 - (sliceMidpoint - marketOpen) / 30);
  }

  // Dernière demi-heure (15:30-16:00)
  if (sliceMidpoint > marketClose - 30) {
    closingBoost = 2.0 * ((sliceMidpoint - (marketClose - 30)) / 30);
  }

  const totalFactor = volumeFactor + openingBoost + closingBoost;

  // Convertir en pourcentage approximatif par tranche
  const basePercentage = (totalFactor * sliceDuration) / totalMinutes * 100;

  return Math.max(0.5, basePercentage); // Minimum 0.5%
}

/**
 * Convertit des minutes depuis minuit en format HH:MM
 */
function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Obtient le volume pour un créneau horaire donné
 */
export function getVolumeAtTime(
  profile: VolumeProfile,
  time: string
): number {
  const slot = profile.timeSlots.find(
    slot => slot.startTime <= time && time < slot.endTime
  );
  return slot?.averageVolume || 0;
}

/**
 * Crée un profil par défaut pour testing
 */
export function createDefaultProfile(symbol: string = 'AAPL'): VolumeProfile {
  return generateIntradayProfile(symbol, 15, 10_000_000);
}
