/**
 * VWAPTimeline - Timeline horizontale avec barres de volume
 *
 * Affiche pour chaque tranche :
 * - Volume historique du marché (barres grises)
 * - Quantité planifiée (barres bleues)
 * - Quantité exécutée (barres vertes) pour comparaison
 */

import React from 'react';
import type { VWAPSlice, VolumeProfile, ExecutedSlice } from '../../core/types/vwap';

interface VWAPTimelineProps {
  volumeProfile: VolumeProfile;
  slices: VWAPSlice[];
  executedSlices: ExecutedSlice[];
  currentSliceIndex: number;
  isExecuting: boolean;
}

export const VWAPTimeline: React.FC<VWAPTimelineProps> = ({
  volumeProfile,
  slices,
  executedSlices,
  currentSliceIndex,
  isExecuting
}) => {
  // Trouver le volume maximum pour normaliser les barres
  const maxVolume = Math.max(...volumeProfile.timeSlots.map(slot => slot.averageVolume));
  const maxSliceQty = Math.max(
    ...slices.map(slice => slice.targetQuantity),
    ...executedSlices.map(slice => slice.executedQuantity)
  );

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
      <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
        <span>📊 Execution Timeline</span>
        {isExecuting && (
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full animate-pulse">
            Running
          </span>
        )}
      </h3>

      {/* Timeline */}
      <div className="space-y-3">
        {/* Légende */}
        <div className="flex gap-4 text-xs text-slate-400 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-slate-600 rounded"></div>
            <span>Market Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-blue-500 rounded"></div>
            <span>Planned Execution</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-green-500 rounded"></div>
            <span>Executed</span>
          </div>
        </div>

        {/* Barres */}
        <div className="space-y-4">
          {slices.map((slice, index) => {
            const volumeSlot = volumeProfile.timeSlots.find(
              slot => slot.startTime === slice.startTime
            );
            const executedSlice = executedSlices.find(
              es => es.sliceNumber === slice.sliceNumber
            );

            const isCompleted = index < currentSliceIndex;
            const isCurrent = index === currentSliceIndex;
            const isPending = index > currentSliceIndex;

            // Largeurs normalisées (en %)
            const volumeWidth = volumeSlot
              ? (volumeSlot.averageVolume / maxVolume) * 100
              : 0;
            const plannedWidth = (slice.targetQuantity / maxSliceQty) * 100;
            const executedWidth = executedSlice
              ? (executedSlice.executedQuantity / maxSliceQty) * 100
              : 0;

            return (
              <div key={index} className={`rounded-lg p-3 ${
                isCurrent ? 'bg-slate-800 ring-1 ring-blue-500' :
                isCompleted ? 'bg-slate-800/50' : 'bg-slate-800/30'
              }`}>
                {/* Header: Time + Status */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-mono ${
                    isCurrent ? 'text-blue-400 font-bold' :
                    isCompleted ? 'text-green-400' : 'text-slate-400'
                  }`}>
                    {slice.startTime} - {slice.endTime}
                  </span>
                  <div className="flex items-center gap-2">
                    {isCompleted && <span className="text-green-400 text-sm">✓ Filled</span>}
                    {isCurrent && <span className="text-blue-400 text-sm animate-pulse">⚡ Executing</span>}
                    {isPending && <span className="text-slate-500 text-sm">○ Pending</span>}
                  </div>
                </div>

                {/* 3 barres horizontales empilées */}
                <div className="space-y-1.5">
                  {/* Market Volume */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-16">Market</span>
                    <div className="flex-1 h-4 bg-slate-900 rounded overflow-hidden">
                      <div
                        className="h-full bg-slate-600 rounded transition-all duration-300"
                        style={{ width: `${volumeWidth}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-500 w-20 text-right">
                      {volumeSlot?.averageVolume.toLocaleString() || '-'}
                    </span>
                  </div>

                  {/* Planned Execution */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-400 w-16">Planned</span>
                    <div className="flex-1 h-4 bg-slate-900 rounded overflow-hidden">
                      <div
                        className={`h-full rounded transition-all duration-300 ${
                          isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-blue-500'
                        }`}
                        style={{ width: `${plannedWidth}%`, opacity: isCompleted ? 0.5 : 1 }}
                      />
                    </div>
                    <span className="text-xs font-mono text-blue-400 w-20 text-right">
                      {slice.targetQuantity.toLocaleString()}
                    </span>
                  </div>

                  {/* Executed - se remplit progressivement */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-400 w-16">Executed</span>
                    <div className="flex-1 h-4 bg-slate-900 rounded overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded transition-all duration-700 ease-out"
                        style={{ width: `${executedWidth}%` }}
                      />
                    </div>
                    <span className={`text-xs font-mono w-20 text-right ${
                      executedSlice ? 'text-green-400 font-bold' : 'text-slate-600'
                    }`}>
                      {executedSlice ? executedSlice.executedQuantity.toLocaleString() : '-'}
                    </span>
                  </div>
                </div>

                {/* Participation rate */}
                <div className="mt-2 text-xs text-slate-500">
                  Participation: {slice.participationRate.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress summary */}
        <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
          <div className="flex justify-between">
            <span>Total Daily Volume:</span>
            <span className="font-mono text-slate-300">
              {volumeProfile.totalDailyVolume.toLocaleString()} shares
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Total Execution:</span>
            <span className="font-mono text-slate-300">
              {slices.reduce((sum, s) => sum + s.targetQuantity, 0).toLocaleString()} shares
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
