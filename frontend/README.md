# Smart Order Router Visualizer

Plateforme éducative interactive pour comprendre le fonctionnement des Smart Order Routers (SOR) et l'exécution optimale des ordres sur les marchés financiers.

## Vue d'ensemble

Ce projet visualise comment un Smart Order Router analyse la liquidité disponible sur différentes venues de marché (NYSE, NASDAQ, BATS, etc.) et optimise l'exécution des ordres pour obtenir le meilleur prix possible.

## Fonctionnalités actuelles

- **Visualisation multi-venues** : Affichage en temps réel des carnets d'ordres de 6 venues différentes
- **Simulation de marché** : Génération et mise à jour automatique de carnets d'ordres réalistes
- **Mécanismes avancés** :
  - Frais maker/taker variables par venue
  - Latence réseau simulée
  - Différents niveaux de liquidité
  - Spread bid/ask dynamique

## Architecture

```
src/
├── components/
│   ├── orderbook/     # Composant de visualisation du carnet d'ordres
│   ├── venue/         # Panel d'affichage de chaque venue
│   ├── execution/     # Animation d'exécution (à venir)
│   └── control/       # Panel de contrôle utilisateur (à venir)
├── core/
│   ├── types/         # Définitions TypeScript
│   ├── sor/           # Logique du Smart Order Router (à venir)
│   ├── matching/      # Moteur de matching (à venir)
│   ├── venues/        # Simulateur de marché
│   └── metrics/       # Métriques de performance (à venir)
├── store/             # État global (Zustand)
├── data/              # Configuration des venues
└── utils/             # Utilitaires
```

## Technologies utilisées

- **React 18** + **TypeScript** - Framework UI avec typage fort
- **Vite** - Build tool rapide
- **Tailwind CSS** - Styling utilitaire
- **Zustand** - Gestion d'état légère
- **Lucide React** - Icônes

## Installation et lancement

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build de production
npm run build
```

Le site sera accessible sur `http://localhost:5173`

## Prochaines étapes

- [ ] Ajouter un panel de soumission d'ordres interactif
- [ ] Implémenter les différentes stratégies de routing (VWAP, TWAP, Best Price, etc.)
- [ ] Créer l'animation d'exécution montrant le routing en temps réel
- [ ] Ajouter les métriques de performance (slippage, implementation shortfall)
- [ ] Implémenter les types d'ordres avancés (Iceberg, Hidden, Post-only)
- [ ] Ajouter des scénarios pédagogiques prédéfinis

## Concepts éducatifs couverts

- Carnets d'ordres et profondeur de marché
- NBBO (National Best Bid and Offer)
- Liquidité et slippage
- Frais maker/taker et rebates
- Stratégies d'exécution optimale
- Impact sur le marché
