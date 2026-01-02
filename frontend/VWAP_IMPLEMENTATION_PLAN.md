# VWAP Order Execution Visualizer - Implementation Plan

## 🎯 Objectif
Ajouter une visualisation complète d'exécution d'ordres VWAP avec market impact et profils de volume basés sur l'historique.

## 📋 Vue d'ensemble

### Concept
- Exécuter un gros ordre (ex: 100,000 shares) sur plusieurs tranches temporelles
- Suivre un profil de volume historique (courbe en U intraday)
- Calculer et visualiser le market impact
- Minimiser l'écart par rapport au VWAP du marché

---

## 🏗️ Architecture

### 1. Core Logic (`src/core/vwap/`)

#### A. `volume-profile.ts`
**Responsabilité** : Générer des profils de volume historiques réalistes

```typescript
interface VolumeProfile {
  timeSlots: TimeSlot[];
  totalDailyVolume: number;
}

interface TimeSlot {
  startTime: string;      // "09:30"
  endTime: string;        // "09:45"
  volumePercentage: number; // % du volume total
  averageVolume: number;   // Volume moyen en shares
}

// Profil typique en U
// Ouverture (9:30-10:00): ~15%
// Milieu de journée (11:00-14:00): ~5-7%
// Fermeture (15:30-16:00): ~18%
```

**Fonctions** :
- `generateIntradayProfile(sliceDuration: number)` : Courbe en U classique
- `getVolumeAtTime(time: string)` : Volume pour un créneau donné

---

#### B. `vwap-strategy.ts`
**Responsabilité** : Calculer la stratégie de découpage en tranches

```typescript
interface VWAPStrategy {
  totalQuantity: number;
  timeHorizon: number;        // minutes
  sliceDuration: number;      // minutes (5, 15, 30)
  slices: VWAPSlice[];
  aggressiveness: 'passive' | 'neutral' | 'aggressive';
}

interface VWAPSlice {
  sliceNumber: number;
  startTime: string;
  endTime: string;
  targetQuantity: number;     // Quantité à exécuter
  volumePercentage: number;   // % du volume marché
  participationRate: number;  // % du volume qu'on représente
  status: 'pending' | 'executing' | 'filled' | 'partial';
}
```

**Algorithme** :
```
Pour chaque tranche temporelle:
  1. Obtenir volume_marché du profil historique
  2. target_quantity = total_quantity × (volume_marché / volume_total_journée)
  3. Ajuster selon aggressiveness:
     - passive: exécuter moins que le volume (5-10%)
     - neutral: suivre exactement le volume
     - aggressive: exécuter plus (15-20%)
```

**Fonctions** :
- `calculateVWAPSlices(order, volumeProfile, config)` → VWAPStrategy
- `optimizeSlicing(slices)` : Lissage pour éviter les pics

---

#### C. `market-impact.ts`
**Responsabilité** : Modéliser l'impact sur le prix

```typescript
interface MarketImpact {
  temporaryImpact: number;    // Impact qui disparaît
  permanentImpact: number;    // Impact qui reste
  totalImpact: number;
}

interface ImpactModel {
  k_temporary: number;        // Coefficient impact temporaire
  k_permanent: number;        // Coefficient impact permanent
  alpha: number;              // Exposant (typiquement 0.5)
}
```

**Modèle classique** :
```
Impact temporaire = k_temp × (quantity / avg_volume)^0.5
Impact permanent = k_perm × (quantity / avg_daily_volume)^0.5
Price après impact = base_price × (1 + total_impact)
```

**Fonctions** :
- `calculateSliceImpact(sliceQty, marketVolume, model)` → MarketImpact
- `calculateCumulativeImpact(previousSlices)` → number
- `createDefaultModel()` → ImpactModel

---

#### D. `vwap-simulator.ts`
**Responsabilité** : Simuler l'exécution complète

```typescript
interface VWAPExecution {
  strategy: VWAPStrategy;
  executedSlices: ExecutedSlice[];
  currentSliceIndex: number;
  metrics: VWAPMetrics;
}

interface ExecutedSlice extends VWAPSlice {
  executedQuantity: number;
  averagePrice: number;
  impact: MarketImpact;
  timestamp: number;
  venues: VenueExecution[];   // Détail par venue
}

interface VWAPMetrics {
  vwapTarget: number;         // VWAP théorique du marché
  vwapAchieved: number;       // VWAP réalisé
  slippage: number;           // Différence (bps)
  totalQuantityFilled: number;
  percentComplete: number;
  timeElapsed: number;        // minutes
  avgParticipationRate: number;
}
```

**Fonctions** :
- `simulateVWAPExecution(strategy, orderBooks, basePrice)` → VWAPExecution
- `executeNextSlice(execution, currentMarketState)` → ExecutedSlice
- `calculateVWAPMetrics(executedSlices)` → VWAPMetrics

---

## 🎨 Components UI (`src/components/vwap/`)

### 1. `VWAPOrderPanel.tsx`
**Configuration de l'ordre VWAP**

```
┌─────────────────────────────────────────┐
│  VWAP Order Configuration               │
├─────────────────────────────────────────┤
│  Total Quantity:  [100,000] shares      │
│  Time Horizon:    [●] 30min  ○ 1h       │
│                   ○ 2h  ○ Until Close   │
│  Slice Duration:  [●] 5min  ○ 15min     │
│                   ○ 30min               │
│  Aggressiveness:  ─────●─────           │
│                   Passive ↔ Aggressive  │
│                                         │
│  [Preview Strategy] [Execute VWAP]     │
└─────────────────────────────────────────┘
```

**Features** :
- Validation temps (ne pas dépasser 16:00)
- Preview de la stratégie avant exécution
- Sliders interactifs

---

### 2. `VWAPTimeline.tsx`
**Timeline horizontale avec barres de volume**

```
Volume
  │
  │  ████                                    █████
  │  ████           ██        ██             █████
  │  ████     ███   ██        ██      ███    █████
  │  ████     ███   ██        ██      ███    █████
  │  ▓▓▓▓     ▓▓▓   ▓▓        ▓▓      ▓▓▓    ▓▓▓▓▓
  └──────────────────────────────────────────────────► Time
     9:30    10:00  11:00    12:00   14:00   15:30

  ████ Market Volume (historique)
  ▓▓▓▓ Your Execution (planifié/exécuté)
```

**Features** :
- Animation progressive pendant l'exécution
- Hover pour voir détails de chaque tranche
- Indicateur de progression

---

### 3. `VWAPPriceChart.tsx`
**Graphique prix avec market impact**

```
Price ($)
  │
101│        ╱╲    Impact temporaire
  │       ╱  ╲___╱╲
  │      ╱        ╲___  Impact permanent
100│─────────────────────────  Base price
  │  ●   ●    ●     ●      Exécutions réelles
  │
  └────────────────────────────────────► Time
```

**Features** :
- Ligne baseline (prix sans impact)
- Courbe de prédiction avec impact
- Points d'exécution réels
- Zone d'incertitude (impact min/max)

---

### 4. `VWAPMetrics.tsx`
**Dashboard de métriques en temps réel**

```
┌─────────────────────────────────────────┐
│  📊 VWAP Execution Metrics              │
├─────────────────────────────────────────┤
│  VWAP Target:      $100.25             │
│  VWAP Achieved:    $100.31 (+6 bps) ⚠️ │
│  Progress:         ████████░░ 45%      │
│                    45,000 / 100,000     │
│  Time Elapsed:     1h 15min / 2h       │
│  Participation:    12.5%               │
│  Slippage:         +$600 total         │
└─────────────────────────────────────────┘
```

**Features** :
- Mise à jour en temps réel
- Alertes si dérive du VWAP
- Comparaison vs benchmark

---

### 5. `VWAPSliceTable.tsx`
**Table détaillée des tranches**

```
┌─────────────────────────────────────────────────────────────┐
│  Time         Vol %   Target Qty   Avg Price   Status       │
├─────────────────────────────────────────────────────────────┤
│  9:30-9:45    4.2%    4,200       $100.12     ✓ Filled     │
│  9:45-10:00   3.1%    3,100       $100.18     ⚡ Executing  │
│  10:00-10:15  2.5%    2,500       $100.22     ⏳ Pending    │
│  10:15-10:30  2.3%    2,300       $100.25     ⏳ Pending    │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Features** :
- Scroll pour voir toutes les tranches
- Coloration selon statut
- Drill-down pour détail par venue

---

### 6. `VWAPView.tsx`
**Vue principale intégrant tous les composants**

```
┌──────────────────────────────────────────────────────┐
│  [Aggregated] [Venue Grid] [VWAP Execution] ←tabs   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────┐  ┌──────────────────┐  │
│  │  VWAPOrderPanel        │  │  VWAPMetrics     │  │
│  └────────────────────────┘  └──────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  VWAPPriceChart                              │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  VWAPTimeline                                │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  VWAPSliceTable                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🔄 Flow d'exécution

### 1. Configuration
```
User → VWAPOrderPanel → calculateVWAPSlices() → Preview
```

### 2. Exécution
```
Click "Execute VWAP"
  ↓
Pour chaque tranche (animation 1s réelle = 1 tranche):
  1. executeNextSlice()
  2. Calculer impact sur prix
  3. Router sur venues (utiliser SOR existant)
  4. Mettre à jour métriques
  5. Refresh UI
  ↓
Fin: Afficher rapport complet
```

### 3. Intégration avec SOR existant
Pour chaque tranche VWAP:
- Créer un Order avec la quantity de la tranche
- Utiliser `SOREngine.generateRoutingPlan()` existant
- Agréger les résultats dans VWAPExecution

---

## 📊 Types TypeScript

### `src/core/types/vwap.ts`

```typescript
export interface VolumeProfile {
  symbol: string;
  date: string;
  timeSlots: TimeSlot[];
  totalDailyVolume: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  volumePercentage: number;
  averageVolume: number;
}

export interface VWAPConfig {
  totalQuantity: number;
  timeHorizon: number;        // minutes
  sliceDuration: number;      // minutes
  aggressiveness: 'passive' | 'neutral' | 'aggressive';
  startTime?: string;         // Default: now
}

export interface VWAPStrategy {
  config: VWAPConfig;
  slices: VWAPSlice[];
  estimatedVWAP: number;
  estimatedSlippage: number;
}

export interface VWAPSlice {
  sliceNumber: number;
  startTime: string;
  endTime: string;
  targetQuantity: number;
  volumePercentage: number;
  participationRate: number;
  status: SliceStatus;
}

export enum SliceStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  FILLED = 'filled',
  PARTIAL = 'partial',
  CANCELLED = 'cancelled'
}

export interface ExecutedSlice extends VWAPSlice {
  executedQuantity: number;
  averagePrice: number;
  impact: MarketImpact;
  timestamp: number;
  routingDecisions: RoutingDecision[];
}

export interface MarketImpact {
  temporaryImpact: number;
  permanentImpact: number;
  totalImpact: number;
  impactBps: number;
}

export interface ImpactModel {
  k_temporary: number;
  k_permanent: number;
  alpha: number;
  beta: number;
}

export interface VWAPMetrics {
  vwapTarget: number;
  vwapAchieved: number;
  slippage: number;
  slippageBps: number;
  totalQuantityFilled: number;
  percentComplete: number;
  timeElapsed: number;
  avgParticipationRate: number;
  totalCost: number;
  totalImpactCost: number;
}

export interface VWAPExecution {
  id: string;
  strategy: VWAPStrategy;
  executedSlices: ExecutedSlice[];
  currentSliceIndex: number;
  metrics: VWAPMetrics;
  startTimestamp: number;
  endTimestamp?: number;
  status: 'configuring' | 'running' | 'paused' | 'completed' | 'cancelled';
}
```

---

## 🎯 MVP - Phase 1 (Première implémentation)

### Scope minimal viable

1. ✅ **Volume Profile basique**
   - Courbe en U simple (hardcodée)
   - 6-8 tranches sur la journée
   - Fichier: `volume-profile.ts`

2. ✅ **VWAP Strategy Calculator**
   - Configuration simple (quantity, duration)
   - Calcul des tranches proportionnelles au volume
   - Fichier: `vwap-strategy.ts`

3. ✅ **Market Impact basique**
   - Modèle simple sqrt(quantity)
   - Impact temporaire seulement
   - Fichier: `market-impact.ts`

4. ✅ **Timeline UI**
   - Barres de volume historique
   - Barres de quantité planifiée
   - Animation d'exécution
   - Composant: `VWAPTimeline.tsx`

5. ✅ **Metrics Dashboard**
   - VWAP achieved vs target
   - Progress bar
   - Slippage
   - Composant: `VWAPMetrics.tsx`

### Ce qui peut attendre Phase 2

- ❌ Graphique prix détaillé (utiliser version simple)
- ❌ Profils de volume historiques réels
- ❌ Optimisation avancée des tranches
- ❌ Table détaillée des tranches
- ❌ Configuration aggressiveness avancée

---

## 📝 Notes d'implémentation

### Timing de l'animation
- 1 seconde réelle = 1 tranche VWAP
- Utiliser `setInterval` similaire à l'exécution SOR actuelle
- Permettre pause/play

### Intégration store Zustand
Ajouter à `marketStore.ts`:
```typescript
interface MarketState {
  // ... existing

  // VWAP state
  vwapExecution: VWAPExecution | null;
  isVWAPExecuting: boolean;

  // Actions
  startVWAPExecution: (config: VWAPConfig) => void;
  stopVWAPExecution: () => void;
  pauseVWAPExecution: () => void;
}
```

### Réutilisation du code existant
- SOREngine pour router chaque tranche
- VenueExecutionDetail pour le détail
- ExecutionTimeline peut être adapté pour VWAP

---

## 🚀 Plan de développement

### Sprint 1: Core Logic (2-3h)
- [ ] Types `vwap.ts`
- [ ] `volume-profile.ts` basique
- [ ] `vwap-strategy.ts`
- [ ] `market-impact.ts`
- [ ] Tests unitaires

### Sprint 2: Simulation (1-2h)
- [ ] `vwap-simulator.ts`
- [ ] Intégration avec SOREngine
- [ ] Store Zustand updates

### Sprint 3: UI Components (2-3h)
- [ ] `VWAPOrderPanel.tsx`
- [ ] `VWAPTimeline.tsx`
- [ ] `VWAPMetrics.tsx`

### Sprint 4: Integration (1h)
- [ ] `VWAPView.tsx`
- [ ] Routing et navigation
- [ ] Tests d'intégration

### Sprint 5: Polish (1h)
- [ ] Animations
- [ ] Responsive design
- [ ] Documentation

---

## 📚 Ressources et références

### Algorithmes VWAP
- Almgren-Chriss model (market impact)
- Implementation Shortfall
- TWAP vs VWAP comparison

### Volume Profiles
- Courbe en U intraday typique
- Impact des annonces macro
- Patterns saisonniers

### Market Impact Models
- Square-root model (Barra)
- Linear vs non-linear
- Temporary vs permanent impact

---

## ✅ Checklist de complétion

### Phase 1 - MVP
- [ ] Volume profile généré
- [ ] Stratégie VWAP calculée
- [ ] Impact basique modélisé
- [ ] Timeline affichée
- [ ] Metrics en temps réel
- [ ] Animation fonctionnelle

### Phase 2 - Enhancement
- [ ] Graphique prix détaillé
- [ ] Table des tranches
- [ ] Configuration avancée
- [ ] Profils historiques réels
- [ ] Optimisation algorithmes

### Phase 3 - Production
- [ ] Tests complets
- [ ] Documentation utilisateur
- [ ] Performance optimization
- [ ] Deployment Vercel

---

**Dernière mise à jour**: 2026-01-02
**Status**: 📋 Planification → Implémentation en cours
