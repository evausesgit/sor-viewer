/**
 * VWAPOrderPanel - Configuration panel for VWAP orders
 *
 * Permet de configurer :
 * - Quantité totale
 * - Horizon temporel (minutes)
 * - Durée des tranches (5, 15, 30 min)
 * - Niveau d'agressivité (passive, neutral, aggressive)
 * - Heure de début
 */

import React, { useState } from 'react';
import type { VWAPConfig, VWAPStrategy } from '../../core/types/vwap';
import { calculateVWAPStrategy } from '../../core/vwap/vwap-strategy';

interface VWAPOrderPanelProps {
  onStrategyCalculated: (strategy: VWAPStrategy) => void;
  onStartExecution: () => void;
  isExecuting: boolean;
  currentStrategy?: VWAPStrategy;
}

export const VWAPOrderPanel: React.FC<VWAPOrderPanelProps> = ({
  onStrategyCalculated,
  onStartExecution,
  isExecuting,
  currentStrategy
}) => {
  const [config, setConfig] = useState<VWAPConfig>({
    totalQuantity: 100_000,
    timeHorizon: 120,
    sliceDuration: 15,
    aggressiveness: 'neutral',
    startTime: '09:30'
  });

  const [showPreview, setShowPreview] = useState(false);

  // Quick select quantities
  const quickQuantities = [50_000, 100_000, 250_000, 500_000];

  // Time horizon options (minutes)
  const timeHorizons = [
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' }
  ];

  // Slice duration options
  const sliceDurations = [
    { value: 5, label: '5 min' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' }
  ];

  const handleCalculateStrategy = () => {
    try {
      const strategy = calculateVWAPStrategy(config);
      onStrategyCalculated(strategy);
      setShowPreview(true);
    } catch (error) {
      console.error('Error calculating VWAP strategy:', error);
      alert('Error calculating strategy. Please check your configuration.');
    }
  };

  const handleStartExecution = () => {
    if (!currentStrategy) {
      alert('Please calculate the strategy first');
      return;
    }
    onStartExecution();
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
      <h3 className="text-lg font-bold text-slate-200 mb-4">
        🎯 VWAP Order Configuration
      </h3>

      {/* Total Quantity */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2">
          Total Quantity (shares)
        </label>
        <input
          type="number"
          value={config.totalQuantity}
          onChange={(e) =>
            setConfig({ ...config, totalQuantity: parseInt(e.target.value) || 0 })
          }
          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-200 font-mono"
          disabled={isExecuting}
        />
        <div className="flex gap-2 mt-2">
          {quickQuantities.map((qty) => (
            <button
              key={qty}
              onClick={() => setConfig({ ...config, totalQuantity: qty })}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1 px-2 rounded border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isExecuting}
            >
              {qty.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Time Horizon */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2">
          Time Horizon
        </label>
        <div className="grid grid-cols-4 gap-2">
          {timeHorizons.map((option) => (
            <button
              key={option.value}
              onClick={() => setConfig({ ...config, timeHorizon: option.value })}
              className={`py-2 px-3 rounded text-xs font-medium border transition-colors ${
                config.timeHorizon === option.value
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isExecuting}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slice Duration */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2">
          Slice Duration
        </label>
        <div className="grid grid-cols-3 gap-2">
          {sliceDurations.map((option) => (
            <button
              key={option.value}
              onClick={() => setConfig({ ...config, sliceDuration: option.value })}
              className={`py-2 px-3 rounded text-xs font-medium border transition-colors ${
                config.sliceDuration === option.value
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isExecuting}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aggressiveness */}
      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2">
          Aggressiveness Level
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['passive', 'neutral', 'aggressive'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setConfig({ ...config, aggressiveness: level })}
              className={`py-2 px-3 rounded text-xs font-medium border transition-colors capitalize ${
                config.aggressiveness === level
                  ? level === 'aggressive'
                    ? 'bg-red-600 border-red-500 text-white'
                    : level === 'neutral'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-green-600 border-green-500 text-white'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isExecuting}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {config.aggressiveness === 'passive' && '70% of market volume'}
          {config.aggressiveness === 'neutral' && '100% of market volume'}
          {config.aggressiveness === 'aggressive' && '130% of market volume'}
        </div>
      </div>

      {/* Start Time */}
      <div className="mb-6">
        <label className="block text-sm text-slate-400 mb-2">
          Start Time
        </label>
        <input
          type="time"
          value={config.startTime || '09:30'}
          onChange={(e) =>
            setConfig({ ...config, startTime: e.target.value })
          }
          className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-slate-200 font-mono"
          disabled={isExecuting}
        />
      </div>

      {/* Strategy Preview */}
      {showPreview && currentStrategy && (
        <div className="mb-6 p-4 bg-slate-800 rounded border border-slate-600">
          <div className="text-sm font-medium text-slate-300 mb-2">
            Strategy Preview
          </div>
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Number of slices:</span>
              <span className="text-slate-300 font-mono">
                {currentStrategy.slices.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated VWAP:</span>
              <span className="text-slate-300 font-mono">
                ${currentStrategy.estimatedVWAP.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Slippage:</span>
              <span className="text-slate-300 font-mono">
                {currentStrategy.estimatedSlippage.toFixed(2)} bps
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleCalculateStrategy}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isExecuting}
        >
          📊 Calculate Strategy
        </button>

        <button
          onClick={handleStartExecution}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isExecuting || !currentStrategy}
        >
          {isExecuting ? '⏸ Executing...' : '▶️ Start Execution'}
        </button>
      </div>

      {/* Summary Info */}
      <div className="mt-4 text-xs text-slate-500 text-center">
        {config.totalQuantity.toLocaleString()} shares over{' '}
        {config.timeHorizon} minutes in{' '}
        {Math.ceil(config.timeHorizon / config.sliceDuration)} slices
      </div>
    </div>
  );
};
