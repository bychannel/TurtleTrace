# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TurtleTrace (龟迹复盘) is a personal stock portfolio management tool built with React 19 + TypeScript + Vite. It runs entirely in the browser with localStorage for data persistence. All data stays local - no cloud accounts needed.

## Commands

```bash
npm run dev        # Start development server (http://localhost:5173)
npm run build      # Build for production
npm run lint       # Run ESLint
npm run build:stock-db  # Build stock database from scripts
npm run preview    # Preview production build
```

## Architecture

### Data Layer
- **localStorage persistence**: Positions, accounts, and settings are stored in `localStorage` keys: `stock-positions`, `stock-accounts`
- **Services** (`frontend/services/`): Business logic layer that reads/writes localStorage. All UI components should go through services, not access localStorage directly.
  - `accountService.ts`: Multi-account management, last-active account tracking
  - `batchService.ts`: Position batching (for equity incentives with unlock schedules)
  - `stockService.ts`: Stock search and real-time price fetching (Eastmoney API)
  - `tCalculatorService.ts`: "Do-T" (做T) calculator logic
  - `reviewService.ts`, `weeklyReviewService.ts`: Review management

### State Management
- React `useState` + `useEffect` in `App.tsx` - no external state library
- `allPositions` state holds all accounts' positions; UI filters by `currentAccountId`
- `prevPositionsRef` tracks the last saved data to avoid redundant localStorage writes

### Key Types (`frontend/types/`)
- `Position`: stock symbol, quantity, cost, batches, accountId, tags
- `Account`: id, name, isDefault, fee settings
- `ReviewEntry`: daily/weekly review records with AI analysis support

### Components (`frontend/components/dashboard/`)
- Tab-based navigation in `App.tsx` renders different dashboard sections
- UI components in `ui/` are shadcn/ui base components
- Dashboard components are largely self-contained with their own local state

### Multi-Account System
- `currentAccountId` can be `null` (all accounts view) or a specific account ID
- When `null`, positions are filtered in the UI but all are held in `allPositions`
- New positions default to the last active account

## Stock Data

Stock database is built via `npm run build:stock-db` from `scripts/build-stock-db.js` (run from project root). Real-time prices come from the Eastmoney API (行情数据) - no API key required.
