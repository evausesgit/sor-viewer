# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Order Router Visualizer - An educational platform for understanding how Smart Order Routers (SOR) optimize order execution across multiple trading venues. This simulates financial market order books, liquidity fragmentation, and intelligent routing strategies.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview

# TypeScript type checking (no emitting)
npx tsc --noEmit
```

## Architecture

### State Management (Zustand)

Global state is managed in `src/store/marketStore.ts` using Zustand. The store contains:
- **Market data**: `orderBooks` (Map<venueId, OrderBook>), `venues`, `symbol`
- **Simulator**: `MarketSimulator` instance that generates/updates order books
- **User order**: `currentOrder`, `isExecuting` (for future order routing)

Key actions:
- `initializeMarket()` - Generates initial order books for all active venues
- `updateOrderBooks()` - Simulates market movement (called every 2s)
- `toggleVenue(venueId)` - Enable/disable specific venues
- `setCurrentOrder()` / `clearExecution()` - For future order routing implementation

### Core Types System

All market data types are defined in `src/core/types/market.ts`:

**Critical enums**:
- `OrderSide` - BID (buy) / ASK (sell)
- `OrderType` - MARKET, LIMIT, ICEBERG, HIDDEN, POST_ONLY
- `OrderStatus` - PENDING, SUBMITTED, PARTIAL, FILLED, CANCELLED, REJECTED

**Key interfaces**:
- `OrderBook` - Venue's order book with bids/asks arrays, spread, midPrice
- `PriceLevel` - Single level in book (price, quantity, orderCount)
- `Order` - Individual order with side, type, quantity, status, venueId, parentOrderId
- `Venue` - Trading venue config (fees, latency, active status, color)
- `Execution` - Fill record (price, quantity, fees, liquidity type)
- `MarketSnapshot` - Cross-venue snapshot with NBBO calculation

### Market Simulation

`src/core/venues/market-simulator.ts` (MarketSimulator class):
- Generates realistic order books with exponential depth decay
- Simulates per-venue price variance and spread based on latency
- Updates order books with realistic price movement
- Provides static utilities: `getTotalLiquidity()`, `getLiquidityUpToPrice()`, `calculateVWAP()`

Venue configuration in `src/data/venues.ts`:
- 6 default venues (NYSE, NASDAQ, BATS, ARCA, IEX, EDGX)
- Each has: makerFee (can be negative = rebate), takerFee, latency, color

### UI Components

**Tab system** (`src/App.tsx`):
- "Venue Grid" - Shows individual order books in 3-column grid
- "Aggregated Order Book" - Consolidated view across all venues

**OrderControlPanel** (`src/components/control/OrderControlPanel.tsx`):
- BUY/SELL toggle
- Quantity input with quick-select buttons (1000, 5000, 10000, 25000)
- Market/Limit order type selection
- Limit price input (conditional rendering)
- Route Order button (handler placeholder for future SOR implementation)
- Refresh button

**VenuePanel** (`src/components/venue/VenuePanel.tsx`):
- Displays single venue with colored header, stats (fees, latency), active toggle
- Wraps OrderBook component

**AggregatedOrderBook** (`src/components/aggregated/AggregatedOrderBook.tsx`):
- Aggregates all order books by price level
- Shows quantity-per-venue in grid format (venues × price levels)
- Calculates total BID/ASK columns
- Highlights best bid/ask prices

## TypeScript Configuration

**Important**: This project uses `verbatimModuleSyntax: true` in `tsconfig.app.json`.

**Rule**: Type-only imports (interfaces, types, enums used only as types) MUST use `import type`:
```typescript
// ✅ Correct
import type { OrderBook, Venue, Order } from '../core/types/market';

// ❌ Wrong - will fail compilation
import { OrderBook, Venue, Order } from '../core/types/market';
```

This applies to all interfaces and types from `src/core/types/market.ts`.

## Tailwind Custom Classes

Custom color utilities in `src/index.css`:
- `.text-bid` / `.bg-bid` - Green for buy side (#10b981)
- `.text-ask` / `.bg-ask` - Red/pink for sell side (#ef4444)

## Future Implementation Areas

The following are planned but not yet implemented:

1. **SOR Logic** (`src/core/sor/`) - Order routing algorithms (VWAP, TWAP, Best Price)
2. **Matching Engine** (`src/core/matching/`) - Simulate order execution against venues
3. **Execution Animation** - Visual flow showing how orders split across venues
4. **Performance Metrics** (`src/core/metrics/`) - Slippage, implementation shortfall
5. **Advanced Order Types** - Iceberg, Hidden, Post-only handling

When implementing order routing, connect to `marketStore.setCurrentOrder()` and use `MarketSimulator.calculateVWAP()` utility for price impact calculations.

## Educational Context

This is a learning tool for financial market concepts:
- Order book depth and liquidity
- NBBO (National Best Bid and Offer)
- Maker/taker fees and rebates
- Smart order routing strategies
- Market fragmentation and best execution
