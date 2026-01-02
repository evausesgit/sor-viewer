/**
 * Main App component
 */

import { useEffect, useState, useMemo } from 'react';
import { useMarketStore } from './store/marketStore';
import { VenuePanel } from './components/venue/VenuePanel';
import { AggregatedOrderBook } from './components/aggregated/AggregatedOrderBook';
import { OrderControlPanel } from './components/control/OrderControlPanel';
import { ExecutionTimeline } from './components/execution/ExecutionTimeline';
import { VWAPView } from './components/vwap/VWAPView';
import type { OrderSide, OrderType, Order } from './core/types/market';
import { OrderStatus } from './core/types/market';

type MainTabType = 'sor' | 'vwap';
type SORSubTabType = 'venues' | 'aggregated';

function App() {
  const {
    venues,
    orderBooks,
    symbol,
    initializeMarket,
    updateOrderBooks,
    toggleVenue,
    executeOrder,
    routingPlan,
    executionSteps,
    currentStepIndex,
    isExecuting,
    executionDetails,
    isPaused,
    togglePause
  } = useMarketStore();
  const [mainTab, setMainTab] = useState<MainTabType>('sor');
  const [sorSubTab, setSorSubTab] = useState<SORSubTabType>('aggregated');

  // Initialize market on mount
  useEffect(() => {
    initializeMarket();
  }, [initializeMarket]);

  // Update order books every 2 seconds - PAUSE si isPaused = true
  useEffect(() => {
    if (isPaused) {
      console.log('⏸️ Order books updates paused');
      return; // Ne pas démarrer l'intervalle si en pause
    }

    console.log('▶️ Order books updates running');
    const interval = setInterval(() => {
      updateOrderBooks();
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused, updateOrderBooks]);

  // Calculer les executionDetails progressifs (seulement jusqu'à currentStepIndex)
  const progressiveExecutionDetails = useMemo(() => {
    // Afficher les exécutions tant que currentStepIndex >= 0 (même après la fin de l'animation)
    if (executionSteps.length === 0 || currentStepIndex < 0) {
      return new Map();
    }

    // Reconstruire executionDetails en ne prenant que les steps jusqu'à currentStepIndex
    const progressive = new Map<string, any>();

    executionSteps.slice(0, currentStepIndex + 1).forEach(step => {
      if (!progressive.has(step.venueId)) {
        progressive.set(step.venueId, {
          venueId: step.venueId,
          side: executionDetails?.get(step.venueId)?.side || 'ask',
          totalQuantity: 0,
          levels: [],
          avgPrice: 0
        });
      }

      const detail = progressive.get(step.venueId);
      detail.totalQuantity += step.quantity || 0;
      detail.levels.push({
        price: step.price || 0,
        quantityTaken: step.quantity || 0,
        quantityRemaining: 0,
        percentageTaken: 100
      });
    });

    return progressive;
  }, [executionSteps, currentStepIndex, executionDetails]);

  // Calculer l'état d'exécution pour chaque venue (optimisé avec useMemo)
  const venueExecutionStates = useMemo(() => {
    const states = new Map<string, { isExecuting: boolean; executedQuantity: number; isCurrentStep: boolean }>();

    if (!isExecuting || executionSteps.length === 0) {
      return states;
    }

    // Grouper les steps par venue
    const stepsByVenue = new Map<string, number[]>();
    executionSteps.forEach((step, idx) => {
      if (!stepsByVenue.has(step.venueId)) {
        stepsByVenue.set(step.venueId, []);
      }
      stepsByVenue.get(step.venueId)!.push(idx);
    });

    // Pour chaque venue, calculer l'état
    stepsByVenue.forEach((stepIndices, venueId) => {
      const executedQuantity = stepIndices
        .filter(idx => idx <= currentStepIndex)
        .reduce((sum, idx) => sum + (executionSteps[idx].quantity || 0), 0);

      const currentStep = currentStepIndex >= 0 ? executionSteps[currentStepIndex] : null;
      const isCurrentStep = currentStep?.venueId === venueId;

      states.set(venueId, {
        isExecuting: true,
        executedQuantity,
        isCurrentStep
      });
    });

    return states;
  }, [isExecuting, executionSteps, currentStepIndex]);

  // Log execution progress (pour debugging)
  useEffect(() => {
    if (currentStepIndex >= 0 && executionSteps.length > 0) {
      const step = executionSteps[currentStepIndex];
      console.log(`📊 Step ${step.stepNumber + 1}/${executionSteps.length}:`, step.message);
      console.log('🎯 Venue execution state:', venueExecutionStates.get(step.venueId));
    }

    if (currentStepIndex === executionSteps.length - 1 && executionSteps.length > 0) {
      console.log('🎉 Execution complete!');
      console.log('Routing Plan:', routingPlan);
    }
  }, [currentStepIndex, executionSteps, routingPlan, venueExecutionStates]);

  const handleRefresh = () => {
    initializeMarket();
  };

  const handleRouteOrder = (side: OrderSide, type: OrderType, quantity: number, price?: number) => {
    // Créer l'ordre
    const order: Order = {
      id: `order-${Date.now()}`,
      symbol,
      side,
      type,
      price,
      quantity,
      filledQuantity: 0,
      status: OrderStatus.PENDING,
      timestamp: Date.now()
    };

    console.log('🚀 Routing order:', order);

    try {
      // Exécuter l'ordre avec animation
      executeOrder(order);
      console.log('✅ Order submitted successfully');
    } catch (error) {
      console.error('❌ Error routing order:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          Smart Order Router Visualizer
        </h1>
        <p className="text-slate-400">
          Educational platform for understanding order routing and best execution
        </p>
      </div>

      {/* Main Tabs */}
      <div className="mb-6 border-b border-slate-700">
        <div className="flex gap-2">
          <button
            onClick={() => setMainTab('sor')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              mainTab === 'sor'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            SOR Execution
          </button>
          <button
            onClick={() => setMainTab('vwap')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              mainTab === 'vwap'
                ? 'text-blue-400 border-blue-400'
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            VWAP Execution
          </button>
        </div>
      </div>

      {/* Content based on main tab */}
      {mainTab === 'vwap' ? (
        <VWAPView />
      ) : (
        <>
          {/* Order Control Panel - only for SOR */}
          <div className="mb-6">
            <OrderControlPanel
              symbol={symbol}
              onRefresh={handleRefresh}
              onRouteOrder={handleRouteOrder}
              isPaused={isPaused}
              onTogglePause={togglePause}
            />
          </div>

          {/* SOR Sub-tabs */}
          <div className="mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setSorSubTab('venues')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  sorSubTab === 'venues'
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                Venue Grid
              </button>
              <button
                onClick={() => setSorSubTab('aggregated')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  sorSubTab === 'aggregated'
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                Aggregated Order Book
              </button>
            </div>
          </div>

          {/* SOR Content */}
          <div className="flex gap-6">
            <div className="flex-1">
              {sorSubTab === 'venues' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {venues.map((venue) => {
                      const executionState = venueExecutionStates.get(venue.id);
                      const venueExecutionDetail = progressiveExecutionDetails.get(venue.id);

                      return (
                        <div key={venue.id}>
                          <VenuePanel
                            venue={venue}
                            orderBook={orderBooks.get(venue.id) || null}
                            onToggle={toggleVenue}
                            executionState={executionState}
                            executionDetail={venueExecutionDetail}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 text-center text-xs text-slate-500">
                    Order books update every 2 seconds to simulate market movement
                  </div>
                </>
              ) : (
                <AggregatedOrderBook venues={venues} orderBooks={orderBooks} executionDetails={progressiveExecutionDetails} />
              )}
            </div>

            {/* Execution Timeline */}
            {executionSteps.length > 0 && (
              <div className="w-80 flex-shrink-0">
                <ExecutionTimeline
                  executionSteps={executionSteps}
                  currentStepIndex={currentStepIndex}
                  venues={venues}
                  isExecuting={isExecuting}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
