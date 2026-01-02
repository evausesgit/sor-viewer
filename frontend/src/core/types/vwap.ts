/**
 * VWAP Order Execution Types
 */

import type { RoutingDecision } from './sor';

export interface VolumeProfile {
  symbol: string;
  date: string;
  timeSlots: TimeSlot[];
  totalDailyVolume: number;
}

export interface TimeSlot {
  startTime: string;      // "09:30"
  endTime: string;        // "09:45"
  volumePercentage: number; // % du volume total
  averageVolume: number;   // Volume moyen en shares
}

export interface VWAPConfig {
  totalQuantity: number;
  timeHorizon: number;        // minutes
  sliceDuration: number;      // minutes (5, 15, 30)
  aggressiveness: 'passive' | 'neutral' | 'aggressive';
  startTime?: string;         // Default: current time
}

export interface VWAPStrategy {
  config: VWAPConfig;
  slices: VWAPSlice[];
  estimatedVWAP: number;
  estimatedSlippage: number;
}

export interface VWAPSlice {
  sliceNumber: number;
  startTime: string;
  endTime: string;
  targetQuantity: number;
  volumePercentage: number;
  participationRate: number;
  status: SliceStatus;
}

export const SliceStatus = {
  PENDING: 'pending',
  EXECUTING: 'executing',
  FILLED: 'filled',
  PARTIAL: 'partial',
  CANCELLED: 'cancelled'
} as const;

export type SliceStatus = typeof SliceStatus[keyof typeof SliceStatus];

export interface ExecutedSlice extends VWAPSlice {
  executedQuantity: number;
  averagePrice: number;
  impact: MarketImpact;
  timestamp: number;
  routingDecisions: RoutingDecision[];
}

export interface MarketImpact {
  temporaryImpact: number;    // Impact temporaire (disparaît)
  permanentImpact: number;    // Impact permanent (reste)
  totalImpact: number;        // Impact total
  impactBps: number;          // Impact en basis points
}

export interface ImpactModel {
  k_temporary: number;        // Coefficient impact temporaire
  k_permanent: number;        // Coefficient impact permanent
  alpha: number;              // Exposant (typiquement 0.5)
  beta: number;               // Exposant permanent
}

export interface VWAPMetrics {
  vwapTarget: number;         // VWAP théorique du marché
  vwapAchieved: number;       // VWAP réalisé
  slippage: number;           // Différence absolue ($)
  slippageBps: number;        // Différence en basis points
  totalQuantityFilled: number;
  percentComplete: number;
  timeElapsed: number;        // minutes
  avgParticipationRate: number;
  totalCost: number;
  totalImpactCost: number;
}

export interface VWAPExecution {
  id: string;
  strategy: VWAPStrategy;
  executedSlices: ExecutedSlice[];
  currentSliceIndex: number;
  metrics: VWAPMetrics;
  startTimestamp: number;
  endTimestamp?: number;
  status: 'configuring' | 'running' | 'paused' | 'completed' | 'cancelled';
}
