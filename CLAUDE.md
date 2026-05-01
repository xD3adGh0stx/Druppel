# Druppel App — Claude Context

## Project Overview
Druppel is a dutch subscription management app. Users can track, manage, and get insights into their recurring subscriptions. So everything even the code needs to be dutch

## Tech Stack
- **React 19** + **TypeScript** (strict)
- **Vite 8** + **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **React Router v7** for navigation
- **sql.js** for local SQLite database (no backend/cloud)
- **Electron** for desktop (Windows/macOS/Linux)
- **Capacitor** + Android for mobile
- **lucide-react** for icons
- **date-fns** for date formatting/calculations
- **papaparse** for CSV import

## Project Structure
```
src/
├── App.tsx                        # Root component, router setup
├── main.tsx                       # Entry point
├── components/
│   ├── index.ts                   # Barrel: re-exports all components
│   ├── layout/
│   │   ├── Sidebar.tsx            # Desktop + mobile navigation
│   │   └── index.ts
│   ├── subscriptions/
│   │   ├── SubscriptionCard.tsx   # Card used in list/dashboard views
│   │   ├── SubscriptionForm.tsx   # Add/edit form (modal)
│   │   └── index.ts
│   └── ui/
│       ├── DruppelLogo.tsx        # App logo SVG
│       ├── WelcomeModal.tsx       # First-launch theme picker
│       └── index.ts
├── context/
│   ├── ProfileContext.tsx         # User profile state
│   ├── ThemeContext.tsx           # Light/dark theme
│   └── index.ts                   # Barrel: re-exports providers + hooks
├── lib/
│   ├── database.ts                # sql.js database operations
│   ├── calculations.ts            # Subscription cost calculations
│   ├── importers.ts               # CSV/MT940/PDF import logic
│   └── notifications.ts          # Capacitor local notifications
├── pages/
│   ├── Dashboard.tsx
│   ├── Subscriptions.tsx
│   ├── SubscriptionDetail.tsx
│   ├── FinancePage.tsx
│   ├── ImportPage.tsx
│   ├── AccountPage.tsx
│   └── index.ts                   # Barrel: re-exports all pages
└── types/
    ├── subscription.ts            # Subscription, BillingCycle, CATEGORIES, COLORS
    ├── finance.ts                 # Transaction, BankAccount, Pot, ImportResult
    └── index.ts                   # Barrel: re-exports all types (safe to import from '../types')
```

## Build Commands
```bash
npm run dev              # Vite dev server (alleen voor development/testing)
npm run build            # TypeScript + Vite production build
npm run lint             # ESLint
npm run electron:dev     # Electron + Vite dev (desktop)
npm run electron:build   # Full Electron build
```

## Key Conventions
- Data is stored **locally** via sql.js (SQLite in-memory + persistence) — no cloud/backend
- Tailwind v4 syntax: use `@import "tailwindcss"` in CSS, not `@tailwind base/components/utilities`
- Icons: always use `lucide-react`, never add other icon libraries
- Dates: always use `date-fns` for formatting and calculations
- Keep components under 300 lines; extract logic to `lib/` files
- Theme support: always test both light and dark mode for UI changes

## Platform Targets
- **Desktop** via Electron (primaire release target)
- **Android** via Capacitor
- Geen web deployment — Vite dev server is alleen voor lokale development
