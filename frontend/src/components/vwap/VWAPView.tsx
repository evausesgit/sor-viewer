/**
 * VWAPView - Vue principale pour l'exécution VWAP
 *
 * Intègre tous les composants VWAP :
 * - VWAPOrderPanel : configuration de l'ordre
 * - VWAPTimeline : visualisation temporelle
 * - VWAPMetricsDisplay : métriques en temps réel
 *
 * Gère l'état et la simulation de l'exécution VWAP
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { VWAPStrategy, VWAPExecution, VWAPMetrics, ExecutedSlice } from '../../core/types/vwap';
import { SliceStatus } from '../../core/types/vwap';
import { VWAPOrderPanel } from './VWAPOrderPanel';
import { VWAPTimeline } from './VWAPTimeline';
import { VWAPMetricsDisplay } from './VWAPMetrics';
import { calculateSliceImpact, estimateAverageExecutionPrice } from '../../core/vwap/market-impact';

export const VWAPView: React.FC = () => {
  const [execution, setExecution] = useState<VWAPExecution | null>(null);
  const [currentSliceIndex, setCurrentSliceIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);

  // Calculer les métriques en temps réel
  const calculateMetrics = useCallback((exec: VWAPExecution): VWAPMetrics => {
    const executedSlices = exec.executedSlices;

    if (executedSlices.length === 0) {
      return {
        vwapTarget: exec.strategy.estimatedVWAP,
        vwapAchieved: exec.strategy.estimatedVWAP,
        slippage: 0,
        slippageBps: 0,
        totalQuantityFilled: 0,
        percentComplete: 0,
        timeElapsed: 0,
        avgParticipationRate: 0,
        totalCost: 0,
        totalImpactCost: 0
      };
    }

    // Calculer le VWAP réalisé
    const totalQuantity = executedSlices.reduce((sum, s) => sum + s.executedQuantity, 0);
    const totalCost = executedSlices.reduce((sum, s) => sum + s.averagePrice * s.executedQuantity, 0);
    const vwapAchieved = totalCost / totalQuantity;

    // Calculer l'impact total
    const totalImpactCost = executedSlices.reduce((sum, s) => sum + s.impact.totalImpact * s.executedQuantity, 0);

    // Calculer le slippage
    const vwapTarget = exec.strategy.estimatedVWAP;
    const slippage = vwapAchieved - vwapTarget;
    const slippageBps = (slippage / vwapTarget) * 10000;

    // Calculer la progression
    const totalTarget = exec.strategy.config.totalQuantity;
    const percentComplete = (totalQuantity / totalTarget) * 100;

    // Temps écoulé (en minutes)
    const timeElapsed = Math.round((Date.now() - exec.startTimestamp) / 60000);

    // Taux de participation moyen
    const avgParticipationRate =
      executedSlices.reduce((sum, s) => sum + s.participationRate, 0) / executedSlices.length;

    return {
      vwapTarget,
      vwapAchieved,
      slippage,
      slippageBps: Math.abs(slippageBps),
      totalQuantityFilled: totalQuantity,
      percentComplete,
      timeElapsed,
      avgParticipationRate,
      totalCost,
      totalImpactCost
    };
  }, []);

  // Gérer le calcul de la stratégie
  const handleStrategyCalculated = useCallback((strategy: VWAPStrategy) => {
    const newExecution: VWAPExecution = {
      id: `vwap-${Date.now()}`,
      strategy,
      executedSlices: [],
      currentSliceIndex: -1,
      metrics: {
        vwapTarget: strategy.estimatedVWAP,
        vwapAchieved: strategy.estimatedVWAP,
        slippage: 0,
        slippageBps: 0,
        totalQuantityFilled: 0,
        percentComplete: 0,
        timeElapsed: 0,
        avgParticipationRate: 0,
        totalCost: 0,
        totalImpactCost: 0
      },
      startTimestamp: Date.now(),
      status: 'configuring'
    };

    setExecution(newExecution);
    setCurrentSliceIndex(-1);
    setIsExecuting(false);
  }, []);

  // Simuler l'exécution d'une tranche
  const executeSlice = useCallback((exec: VWAPExecution, sliceIndex: number): ExecutedSlice => {
    const slice = exec.strategy.slices[sliceIndex];
    const basePrice = exec.strategy.estimatedVWAP;

    // Simuler un volume de marché (pour le calcul d'impact)
    const marketVolume = slice.targetQuantity / (slice.participationRate / 100);

    // Calculer l'impact de marché
    const impact = calculateSliceImpact(
      slice.targetQuantity,
      marketVolume,
      basePrice
    );

    // Calculer le prix moyen d'exécution
    const averagePrice = estimateAverageExecutionPrice(basePrice, impact, 'buy');

    // Créer la tranche exécutée
    const executedSlice: ExecutedSlice = {
      ...slice,
      status: SliceStatus.FILLED,
      executedQuantity: slice.targetQuantity,
      averagePrice,
      impact,
      timestamp: Date.now(),
      routingDecisions: [] // Sera rempli dans une version future avec SOR
    };

    return executedSlice;
  }, []);

  // Démarrer l'exécution
  const handleStartExecution = useCallback(() => {
    if (!execution || execution.status === 'running') return;

    setIsExecuting(true);
    setCurrentSliceIndex(0);

    setExecution({
      ...execution,
      status: 'running',
      startTimestamp: Date.now()
    });
  }, [execution]);

  // Animation de l'exécution (avancer d'une tranche toutes les 2 secondes)
  useEffect(() => {
    if (!isExecuting || !execution || currentSliceIndex >= execution.strategy.slices.length) {
      // Arrêter l'exécution si on a terminé
      if (execution && currentSliceIndex >= execution.strategy.slices.length && isExecuting) {
        setIsExecuting(false);
        setExecution({
          ...execution,
          status: 'completed',
          endTimestamp: Date.now()
        });
      }
      return;
    }

    const timer = setTimeout(() => {
      // Exécuter la tranche courante
      const executedSlice = executeSlice(execution, currentSliceIndex);

      // Mettre à jour l'exécution
      const updatedExecution: VWAPExecution = {
        ...execution,
        executedSlices: [...execution.executedSlices, executedSlice],
        currentSliceIndex: currentSliceIndex
      };

      // Recalculer les métriques
      updatedExecution.metrics = calculateMetrics(updatedExecution);

      setExecution(updatedExecution);

      // Passer à la tranche suivante
      setCurrentSliceIndex(currentSliceIndex + 1);
    }, 2000); // 2 secondes par tranche

    return () => clearTimeout(timer);
  }, [isExecuting, execution, currentSliceIndex, executeSlice, calculateMetrics]);

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            VWAP Order Execution
          </h1>
          <p className="text-slate-400">
            Volume-Weighted Average Price execution strategy with market impact modeling
          </p>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Order Configuration */}
          <div className="w-96 flex-shrink-0">
            <VWAPOrderPanel
              onStrategyCalculated={handleStrategyCalculated}
              onStartExecution={handleStartExecution}
              isExecuting={isExecuting}
              currentStrategy={execution?.strategy}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            {/* Metrics Dashboard */}
            {execution && (
              <VWAPMetricsDisplay
                metrics={execution.metrics}
                isExecuting={isExecuting}
              />
            )}

            {/* Timeline Visualization */}
            {execution && (
              <VWAPTimeline
                volumeProfile={execution.strategy.slices.length > 0
                  ? {
                      symbol: 'AAPL',
                      date: new Date().toISOString().split('T')[0],
                      timeSlots: execution.strategy.slices.map(s => ({
                        startTime: s.startTime,
                        endTime: s.endTime,
                        volumePercentage: s.volumePercentage,
                        averageVolume: s.targetQuantity / (s.participationRate / 100)
                      })),
                      totalDailyVolume: execution.strategy.config.totalQuantity / 0.1 // Approximation
                    }
                  : {
                      symbol: 'AAPL',
                      date: new Date().toISOString().split('T')[0],
                      timeSlots: [],
                      totalDailyVolume: 0
                    }
                }
                slices={execution.strategy.slices}
                currentSliceIndex={currentSliceIndex}
                isExecuting={isExecuting}
              />
            )}

            {/* Empty State */}
            {!execution && (
              <div className="bg-slate-900 rounded-lg border border-slate-700 p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-slate-300 mb-2">
                  Configure Your VWAP Order
                </h3>
                <p className="text-slate-500">
                  Set your order parameters and click "Calculate Strategy" to begin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
