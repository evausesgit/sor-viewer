/**
 * Venue configurations for simulation
 */

import type { Venue } from '../core/types/market';

export const DEFAULT_VENUES: Venue[] = [
  {
    id: 'NYSE',
    name: 'NYSE',
    displayName: 'New York Stock Exchange',
    makerFee: -0.0020,  // -20 bps (rebate)
    takerFee: 0.0030,   // 30 bps
    latency: 1,         // Very low latency
    active: true,
    color: '#3b82f6',   // Blue
  },
  {
    id: 'NASDAQ',
    name: 'NASDAQ',
    displayName: 'NASDAQ',
    makerFee: -0.0022,  // -22 bps (rebate)
    takerFee: 0.0030,   // 30 bps
    latency: 1,
    active: true,
    color: '#8b5cf6',   // Purple
  },
  {
    id: 'BATS',
    name: 'BATS',
    displayName: 'BATS Global Markets',
    makerFee: -0.0025,  // -25 bps (rebate)
    takerFee: 0.0030,   // 30 bps
    latency: 2,
    active: true,
    color: '#10b981',   // Green
  },
  {
    id: 'ARCA',
    name: 'ARCA',
    displayName: 'NYSE Arca',
    makerFee: -0.0018,  // -18 bps (rebate)
    takerFee: 0.0030,   // 30 bps
    latency: 2,
    active: true,
    color: '#f59e0b',   // Amber
  },
  {
    id: 'IEX',
    name: 'IEX',
    displayName: 'Investors Exchange',
    makerFee: 0.0000,   // No fee
    takerFee: 0.0009,   // 9 bps (lower than others)
    latency: 3,         // Slightly higher due to speed bump
    active: true,
    color: '#06b6d4',   // Cyan
  },
  {
    id: 'EDGX',
    name: 'EDGX',
    displayName: 'EDGX',
    makerFee: -0.0019,  // -19 bps (rebate)
    takerFee: 0.0030,   // 30 bps
    latency: 2,
    active: true,
    color: '#ec4899',   // Pink
  },
];

export const DEFAULT_SYMBOL = 'AAPL';
export const DEFAULT_BASE_PRICE = 150.0;
