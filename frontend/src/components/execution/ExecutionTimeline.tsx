/**
 * ExecutionTimeline - Affiche l'historique des exécutions en stack
 */

import React from 'react';
import type { ExecutionStep } from '../../core/types/sor';
import type { Venue } from '../../core/types/market';

interface ExecutionTimelineProps {
  executionSteps: ExecutionStep[];
  currentStepIndex: number;
  venues: Venue[];
  isExecuting: boolean;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  executionSteps,
  currentStepIndex,
  venues,
  isExecuting
}) => {
  if (executionSteps.length === 0) {
    return null;
  }

  // Créer un map des venues par ID pour accès rapide
  const venueMap = new Map(venues.map(v => [v.id, v]));

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-700 p-4 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
          <span>⚡ Execution Timeline</span>
          {isExecuting && (
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full animate-pulse">
              In Progress
            </span>
          )}
        </h3>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {executionSteps.map((step, index) => {
            const venue = venueMap.get(step.venueId);
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <div
                key={step.orderId}
                className={`
                  flex-shrink-0 w-48 p-3 rounded-lg border-2 transition-all duration-300
                  ${isCurrent ? 'border-blue-500 bg-blue-500/20 scale-105' : ''}
                  ${isCompleted && !isCurrent ? 'border-green-500/50 bg-green-500/10' : ''}
                  ${!isCompleted ? 'border-slate-600 bg-slate-800/50 opacity-50' : ''}
                `}
              >
                {/* Header avec venue */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: venue?.color || '#666' }}
                  />
                  <span className="text-xs font-bold text-slate-200">
                    {venue?.name || step.venueId}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">
                    #{step.stepNumber + 1}
                  </span>
                </div>

                {/* Quantité */}
                <div className="mb-1">
                  <span className="text-lg font-bold text-slate-100">
                    {step.quantity?.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">shares</span>
                </div>

                {/* Prix */}
                <div className="text-xs text-slate-400">
                  @ ${step.price?.toFixed(2)}
                </div>

                {/* Status indicator */}
                {isCurrent && (
                  <div className="mt-2 text-xs text-blue-400 font-semibold">
                    ⚡ Executing...
                  </div>
                )}
                {isCompleted && !isCurrent && (
                  <div className="mt-2 text-xs text-green-400 font-semibold">
                    ✓ Filled
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Résumé */}
        {currentStepIndex >= 0 && (
          <div className="mt-3 text-xs text-slate-400 flex gap-4">
            <span>
              Progress: {currentStepIndex + 1}/{executionSteps.length} venues
            </span>
            <span>
              Total Executed:{' '}
              {executionSteps
                .slice(0, currentStepIndex + 1)
                .reduce((sum, s) => sum + (s.quantity || 0), 0)
                .toLocaleString()}{' '}
              shares
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
