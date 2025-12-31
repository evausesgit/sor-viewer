/**
 * Smart Order Router types
 */

import type { Order, Execution } from './market';

// SOR routing strategy
export const RoutingStrategy = {
  BEST_PRICE: 'BEST_PRICE',
  PRO_RATA: 'PRO_RATA',
  VWAP: 'VWAP',
  TWAP: 'TWAP',
  MINIMIZE_IMPACT: 'MINIMIZE_IMPACT',
  MINIMIZE_COST: 'MINIMIZE_COST',
} as const;
export type RoutingStrategy = typeof RoutingStrategy[keyof typeof RoutingStrategy];

// Configuration for SOR execution
export interface SORConfig {
  strategy: RoutingStrategy;
  maxVenues: number;                         // Maximum venues to use
  minQuantityPerVenue: number;               // Minimum order size per venue
  considerFees: boolean;                     // Factor in fees when routing
  considerLatency: boolean;                  // Factor in latency
  allowPartialFills: boolean;
  timeLimit?: number;                        // Max time for execution (ms)
}

// Child order created by SOR
export interface ChildOrder extends Order {
  parentOrderId: string;
  venueId: string;
  routingReason: string;                     // Why this venue was chosen
  expectedPrice: number;                     // Expected execution price
  expectedFees: number;                      // Expected fees
}

// Routing decision for a single venue
export interface RoutingDecision {
  venueId: string;
  quantity: number;
  expectedPrice: number;
  expectedFees: number;
  rationale: string;                         // Explanation of decision
  priority: number;                          // Execution priority (lower = first)
}

// Complete routing plan
export interface RoutingPlan {
  parentOrderId: string;
  strategy: RoutingStrategy;
  decisions: RoutingDecision[];
  totalQuantity: number;
  estimatedAvgPrice: number;
  estimatedTotalCost: number;
  estimatedSlippage: number;
  timestamp: number;
}

// Execution result for parent order
export interface ExecutionResult {
  parentOrderId: string;
  childOrders: ChildOrder[];
  executions: Execution[];
  totalQuantity: number;
  averagePrice: number;
  totalCost: number;
  totalFees: number;
  slippage: number;                          // Difference from expected price
  executionTime: number;                     // Time taken in ms
  venuesUsed: string[];
  success: boolean;
  errorMessage?: string;
}

// Real-time execution step (for animation)
export interface ExecutionStep {
  stepNumber: number;
  timestamp: number;
  venueId: string;
  action: 'SUBMIT' | 'ACK' | 'FILL' | 'PARTIAL_FILL' | 'REJECT';
  orderId: string;
  quantity?: number;
  price?: number;
  message: string;
}

// Performance metrics
export interface PerformanceMetrics {
  executionId: string;
  vwap: number;                              // Volume Weighted Average Price
  arrival_price: number;                     // Price when order submitted
  implementation_shortfall: number;           // Cost vs ideal execution
  total_cost_basis_points: number;           // Total cost in bps
  venue_breakdown: {
    venueId: string;
    quantity: number;
    avgPrice: number;
    fees: number;
  }[];
  best_execution_achieved: boolean;
  timestamp: number;
}
