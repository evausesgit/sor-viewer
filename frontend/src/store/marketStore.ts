/**
 * Global state management with Zustand
 */

import { create } from 'zustand';
import type { OrderBook, Venue, Order } from '../core/types/market';
import type { RoutingPlan, ExecutionStep, SORConfig } from '../core/types/sor';
import { OrderStatus } from '../core/types/market';
import { DEFAULT_VENUES, DEFAULT_SYMBOL, DEFAULT_BASE_PRICE } from '../data/venues';
import { MarketSimulator } from '../core/venues/market-simulator';
import { SOREngine } from '../core/sor';
import { simulateExecution, type VenueExecutionDetail } from '../core/sor/execution-simulator';

interface MarketState {
  // Market data
  symbol: string;
  venues: Venue[];
  orderBooks: Map<string, OrderBook>;
  simulator: MarketSimulator;

  // User order
  currentOrder: Order | null;
  isExecuting: boolean;
  isPaused: boolean;

  // Execution animation state
  routingPlan: RoutingPlan | null;
  currentStepIndex: number;
  executionSteps: ExecutionStep[];
  animationTimerId: number | null;
  executionDetails: Map<string, VenueExecutionDetail>; // Détails par venue

  // Actions
  initializeMarket: () => void;
  updateOrderBooks: () => void;
  setCurrentOrder: (order: Order | null) => void;
  clearExecution: () => void;
  toggleVenue: (venueId: string) => void;
  executeOrder: (order: Order) => void;
  stopExecution: () => void;
  togglePause: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  // Initial state
  symbol: DEFAULT_SYMBOL,
  venues: DEFAULT_VENUES,
  orderBooks: new Map(),
  simulator: new MarketSimulator(DEFAULT_BASE_PRICE, 0.5),
  currentOrder: null,
  isExecuting: false,
  isPaused: false,
  routingPlan: null,
  currentStepIndex: -1,
  executionSteps: [],
  animationTimerId: null,
  executionDetails: new Map(),

  // Initialize market with order books for all venues
  initializeMarket: () => {
    const { venues, simulator, symbol } = get();
    const orderBooks = new Map<string, OrderBook>();

    venues.forEach((venue) => {
      if (venue.active) {
        orderBooks.set(venue.id, simulator.generateOrderBook(venue, symbol));
      }
    });

    set({ orderBooks });
  },

  // Update all order books (simulate market movement)
  updateOrderBooks: () => {
    const { orderBooks, simulator } = get();
    const newOrderBooks = new Map<string, OrderBook>();

    orderBooks.forEach((orderBook, venueId) => {
      newOrderBooks.set(venueId, simulator.updateOrderBook(orderBook));
    });

    set({ orderBooks: newOrderBooks });
  },

  // Set the current order being routed
  setCurrentOrder: (order) => {
    set({ currentOrder: order });
  },

  // Clear execution history
  clearExecution: () => {
    set({
      currentOrder: null,
      isExecuting: false,
    });
  },

  // Toggle venue active/inactive
  toggleVenue: (venueId) => {
    const { venues, orderBooks, simulator, symbol } = get();

    // Trouver la venue et inverser son état
    const venue = venues.find(v => v.id === venueId);
    if (!venue) return;

    const newActiveState = !venue.active;
    const newOrderBooks = new Map(orderBooks);

    // Si on active la venue, générer son orderBook
    if (newActiveState) {
      newOrderBooks.set(venueId, simulator.generateOrderBook(venue, symbol));
    } else {
      // Si on désactive la venue, supprimer son orderBook
      newOrderBooks.delete(venueId);
    }

    set({
      venues: venues.map((v) =>
        v.id === venueId ? { ...v, active: newActiveState } : v
      ),
      orderBooks: newOrderBooks
    });
  },

  // Execute order with animation
  executeOrder: (order: Order) => {
    const { venues, orderBooks, symbol: _symbol } = get();

    try {
      // 1. Générer le routing plan avec la configuration par défaut
      const config: SORConfig = SOREngine.createDefaultConfig();
      const routingPlan = SOREngine.generateRoutingPlan(order, venues, orderBooks, config);

      // 2. Simuler l'exécution réelle pour calculer les détails par niveau de prix
      const executionDetails = new Map<string, VenueExecutionDetail>();

      routingPlan.decisions.forEach(decision => {
        const orderBook = orderBooks.get(decision.venueId);
        if (orderBook) {
          const detail = simulateExecution(orderBook, order, decision.quantity);
          detail.venueId = decision.venueId;
          executionDetails.set(decision.venueId, detail);

          console.log(`📍 Execution detail for ${decision.venueId}:`, detail);
        }
      });

      // 3. Convertir les routing decisions en execution steps pour l'animation
      const executionSteps: ExecutionStep[] = routingPlan.decisions.map((decision, idx) => ({
        stepNumber: idx,
        timestamp: Date.now() + idx * 600, // 600ms par étape
        venueId: decision.venueId,
        action: 'FILL' as const,
        orderId: `${order.id}-child-${idx}`,
        quantity: decision.quantity,
        price: decision.expectedPrice,
        message: `Executing ${decision.quantity.toLocaleString()} shares on ${decision.venueId} @ $${decision.expectedPrice.toFixed(2)}`
      }));

      // 4. Mettre à jour l'ordre avec le statut SUBMITTED
      const updatedOrder: Order = {
        ...order,
        status: OrderStatus.SUBMITTED
      };

      // 5. Initialiser l'état d'exécution et activer la PAUSE
      set({
        currentOrder: updatedOrder,
        routingPlan,
        executionSteps,
        executionDetails,
        currentStepIndex: -1,
        isExecuting: true,
        isPaused: true  // PAUSE automatique pendant l'exécution
      });

      // 6. Démarrer l'animation avec setInterval
      const timerId = window.setInterval(() => {
        const state = get();
        const nextIndex = state.currentStepIndex + 1;

        if (nextIndex >= state.executionSteps.length) {
          // Animation terminée
          get().stopExecution();
          return;
        }

        // Passer à l'étape suivante
        set({ currentStepIndex: nextIndex });
      }, 600); // 600ms par venue

      set({ animationTimerId: timerId });

    } catch (error) {
      console.error('Error executing order:', error);

      // En cas d'erreur, marquer l'ordre comme rejeté
      set({
        currentOrder: order ? { ...order, status: OrderStatus.REJECTED } : null,
        isExecuting: false
      });

      // Propager l'erreur pour que l'UI puisse la gérer
      throw error;
    }
  },

  // Stop execution and clean up
  stopExecution: () => {
    const { animationTimerId, currentOrder } = get();

    // Arrêter le timer
    if (animationTimerId !== null) {
      clearInterval(animationTimerId);
    }

    // Marquer l'ordre comme complété si il existe
    const finalOrder = currentOrder ? {
      ...currentOrder,
      status: OrderStatus.FILLED
    } : null;

    // Nettoyer l'état
    set({
      isExecuting: false,
      animationTimerId: null,
      currentStepIndex: -1,
      currentOrder: finalOrder
    });
  },

  // Toggle pause/play pour les mises à jour des order books
  togglePause: () => {
    const { isPaused } = get();
    console.log(isPaused ? '▶️ PLAY - Order books updates resumed' : '⏸️ PAUSE - Order books updates paused');
    set({ isPaused: !isPaused });
  },
}));
