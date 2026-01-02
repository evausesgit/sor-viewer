/**
 * VWAPMetrics - Dashboard de métriques VWAP en temps réel
 *
 * Affiche :
 * - VWAP target vs achieved
 * - Slippage ($ et bps)
 * - Progression (% et quantité)
 * - Temps écoulé
 * - Taux de participation moyen
 * - Coûts (total et impact)
 */

import React from 'react';
import type { VWAPMetrics } from '../../core/types/vwap';

interface VWAPMetricsProps {
  metrics: VWAPMetrics;
  isExecuting: boolean;
}

export const VWAPMetricsDisplay: React.FC<VWAPMetricsProps> = ({
  metrics,
  isExecuting
}) => {
  // Déterminer la couleur du slippage (vert si bon, rouge si mauvais)
  const getSlippageColor = (slippageBps: number) => {
    if (slippageBps < 5) return 'text-green-400';
    if (slippageBps < 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Formater les grands nombres
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  // Formater le prix
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  // Formater les basis points
  const formatBps = (bps: number) => {
    return bps.toFixed(2);
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
      <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
        <span>📈 VWAP Metrics</span>
        {isExecuting && (
          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full animate-pulse">
            Live
          </span>
        )}
      </h3>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* VWAP Target */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">VWAP Target</div>
          <div className="text-2xl font-bold text-slate-200 font-mono">
            ${formatPrice(metrics.vwapTarget)}
          </div>
        </div>

        {/* VWAP Achieved */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">VWAP Achieved</div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            ${formatPrice(metrics.vwapAchieved)}
          </div>
        </div>

        {/* Slippage */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">Slippage</div>
          <div className={`text-2xl font-bold font-mono ${getSlippageColor(metrics.slippageBps)}`}>
            {formatBps(metrics.slippageBps)} bps
          </div>
          <div className="text-xs text-slate-500 mt-1">
            ${formatPrice(Math.abs(metrics.slippage))}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-400 mb-2">
          <span>Execution Progress</span>
          <span className="font-mono">{formatNumber(metrics.percentComplete)}%</span>
        </div>
        <div className="h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
            style={{ width: `${metrics.percentComplete}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{formatNumber(metrics.totalQuantityFilled)} shares filled</span>
          <span>{metrics.timeElapsed} min elapsed</span>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Participation Rate */}
        <div className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Avg Participation</div>
          <div className="text-lg font-bold text-slate-300 font-mono">
            {formatBps(metrics.avgParticipationRate)}%
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Total Cost</div>
          <div className="text-lg font-bold text-slate-300 font-mono">
            ${formatNumber(metrics.totalCost)}
          </div>
        </div>

        {/* Impact Cost */}
        <div className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Market Impact</div>
          <div className="text-lg font-bold text-orange-400 font-mono">
            ${formatNumber(metrics.totalImpactCost)}
          </div>
        </div>

        {/* Impact as % of Total */}
        <div className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Impact / Total</div>
          <div className="text-lg font-bold text-slate-300 font-mono">
            {((metrics.totalImpactCost / metrics.totalCost) * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Performance vs VWAP:</span>
          <span className={`font-bold ${
            metrics.vwapAchieved <= metrics.vwapTarget
              ? 'text-green-400'
              : 'text-red-400'
          }`}>
            {metrics.vwapAchieved <= metrics.vwapTarget ? '✓ Beating VWAP' : '✗ Below VWAP'}
          </span>
        </div>
        {metrics.slippageBps < 5 && (
          <div className="text-xs text-green-400 mt-1">
            🎯 Excellent execution quality
          </div>
        )}
        {metrics.slippageBps >= 10 && (
          <div className="text-xs text-yellow-400 mt-1">
            ⚠️ High slippage detected
          </div>
        )}
      </div>
    </div>
  );
};
