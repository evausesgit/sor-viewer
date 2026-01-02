/**
 * VWAPTimeline - Timeline horizontale avec barres de volume
 *
 * Affiche :
 * - Volume historique du marché (barres grises)
 * - Quantité planifiée/exécutée (barres bleues/vertes)
 * - Animation progressive pendant l'exécution
 */

import React from 'react';
import type { VWAPSlice, VolumeProfile } from '../../core/types/vwap';
import { SliceStatus } from '../../core/types/vwap';

interface VWAPTimelineProps {
  volumeProfile: VolumeProfile;
  slices: VWAPSlice[];
  currentSliceIndex: number;
  isExecuting: boolean;
}

export const VWAPTimeline: React.FC<VWAPTimelineProps> = ({
  volumeProfile,
  slices,
  currentSliceIndex,
  isExecuting
}) => {
  // Trouver le volume maximum pour normaliser les barres
  const maxVolume = Math.max(...volumeProfile.timeSlots.map(slot => slot.averageVolume));
  const maxSliceQty = Math.max(...slices.map(slice => slice.targetQuantity));

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
        <div className="space-y-2">
          {slices.map((slice, index) => {
            const volumeSlot = volumeProfile.timeSlots.find(
              slot => slot.startTime === slice.startTime
            );

            const isCompleted = index < currentSliceIndex;
            const isCurrent = index === currentSliceIndex;
            const isPending = index > currentSliceIndex;

            // Hauteur des barres (normalisée)
            const volumeHeight = volumeSlot
              ? (volumeSlot.averageVolume / maxVolume) * 100
              : 0;

            const sliceHeight = (slice.targetQuantity / maxSliceQty) * 100;

            return (
              <div key={index} className="group">
                {/* Time label */}
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono text-slate-400 w-24">
                    {slice.startTime} - {slice.endTime}
                  </span>

                  {/* Barre de volume marché (background) */}
                  <div className="flex-1 relative h-8">
                    {/* Volume du marché */}
                    <div
                      className="absolute bottom-0 left-0 bg-slate-700 rounded transition-all duration-300"
                      style={{
                        width: '100%',
                        height: `${volumeHeight}%`,
                        opacity: 0.5
                      }}
                    />

                    {/* Notre exécution */}
                    <div
                      className={`
                        absolute bottom-0 left-0 rounded transition-all duration-500
                        ${isCompleted ? 'bg-green-500' : ''}
                        ${isCurrent ? 'bg-blue-500 animate-pulse' : ''}
                        ${isPending ? 'bg-blue-500/40' : ''}
                      `}
                      style={{
                        width: '100%',
                        height: `${sliceHeight}%`
                      }}
                    />

                    {/* Tooltip on hover */}
                    <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs whitespace-nowrap">
                      <div>Market Vol: {volumeSlot?.averageVolume.toLocaleString()} shares</div>
                      <div>Target Qty: {slice.targetQuantity.toLocaleString()} shares</div>
                      <div>Participation: {slice.participationRate.toFixed(2)}%</div>
                      <div className="capitalize">Status: {slice.status}</div>
                    </div>
                  </div>

                  {/* Quantité */}
                  <span className={`
                    text-xs font-mono w-20 text-right
                    ${isCompleted ? 'text-green-400 font-bold' : ''}
                    ${isCurrent ? 'text-blue-400 font-bold' : ''}
                    ${isPending ? 'text-slate-500' : ''}
                  `}>
                    {slice.targetQuantity.toLocaleString()}
                  </span>

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
