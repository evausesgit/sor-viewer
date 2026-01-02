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
        <div className="space-y-3">
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

            // Hauteurs normalisées
            const volumeHeight = volumeSlot
              ? (volumeSlot.averageVolume / maxVolume) * 100
              : 0;
            const plannedHeight = (slice.targetQuantity / maxSliceQty) * 100;
            const executedHeight = executedSlice
              ? (executedSlice.executedQuantity / maxSliceQty) * 100
              : 0;

            return (
              <div key={index} className="group">
                {/* Time label */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400 w-24">
                    {slice.startTime} - {slice.endTime}
                  </span>

                  {/* 3 barres côte à côte - hauteur max 40px */}
                  <div className="flex-1 flex gap-1 items-end" style={{ height: '40px' }}>
                    {/* Market Volume */}
                    <div
                      className="flex-1 bg-slate-600 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(volumeHeight * 0.4, 2)}px` }}
                    />

                    {/* Planned Execution */}
                    <div
                      className={`flex-1 rounded-t transition-all duration-300 ${
                        isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-blue-500'
                      }`}
                      style={{ height: `${Math.max(plannedHeight * 0.4, 2)}px`, opacity: isCompleted ? 0.5 : 1 }}
                    />

                    {/* Executed */}
                    <div
                      className="flex-1 bg-green-500 rounded-t transition-all duration-500"
                      style={{ height: executedSlice ? `${Math.max(executedHeight * 0.4, 2)}px` : '0px' }}
                    />
                  </div>

                  {/* Quantités */}
                  <div className="text-xs font-mono w-32 text-right space-y-0.5">
                    <div className="text-slate-500">
                      {volumeSlot?.averageVolume.toLocaleString() || '-'}
                    </div>
                    <div className="text-blue-400">
                      {slice.targetQuantity.toLocaleString()}
                    </div>
                    <div className={`${executedSlice ? 'text-green-400 font-bold' : 'text-slate-600'}`}>
                      {executedSlice ? executedSlice.executedQuantity.toLocaleString() : '-'}
                    </div>
                  </div>

                  {/* Status indicator */}
                  <div className="w-5">
                    {isCompleted && <span className="text-green-400">✓</span>}
                    {isCurrent && <span className="text-blue-400">⚡</span>}
                    {isPending && <span className="text-slate-600">○</span>}
                  </div>
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
