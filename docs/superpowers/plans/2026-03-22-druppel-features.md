# Druppel Feature Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 9 feature areas: improved action form, planning page, pot transaction detail, delete reversal, swipe nav, dashboard stats, future transactions, subscription detail layout fix, and GUI polish.

**Architecture:** All changes are in the existing React/Vite/Capacitor app using sql.js for persistence. No new dependencies needed — all features build on existing DB schema and utility functions.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, sql.js, react-router-dom v7, Capacitor

---

## File Map

| File | Change |
|------|--------|
| `src/pages/FinancePage.tsx` | ActionForm: account first, balance display, max button, negative warning, remaining balance, isExpected toggle; AccountDetail: use deleteTransactionWithGroup; PotDetail: new inline pot transaction view |
| `src/pages/Dashboard.tsx` | Add monthly income/expense stats, current date display |
| `src/pages/PlanningPage.tsx` | NEW — calendar agenda view of subscription payments |
| `src/pages/SubscriptionDetail.tsx` | Remove wrong empty-state message, fix layout width |
| `src/components/Sidebar.tsx` | Add Planning nav item, add swipe navigation wrapper |
| `src/App.tsx` | Add /planning route, add swipe handler to main content |

---

### Task 1: Fix ActionForm — account first + balance display + max + warning + isExpected

**Files:** `src/pages/FinancePage.tsx`

- [ ] In `ActionForm`, reorder form: account picker FIRST, then type, then amount
- [ ] Show live account balance next to account selector: `Saldo: €X,XX`
- [ ] Add "Max" button next to amount field that sets amount = account balance
- [ ] After amount is entered, show "Resterend saldo: €X,XX" below amount field
- [ ] If remaining balance would go negative, show amber warning: "Let op: je staat in de min"
- [ ] Add "Verwacht" toggle (isExpected) at bottom of form — shows transaction as future/expected
- [ ] Pass `isExpected` to `addManualTransaction`
- [ ] Expected transactions styled differently in transaction list (italic + clock icon)

### Task 2: Fix AccountDetail delete — use deleteTransactionWithGroup

**Files:** `src/pages/FinancePage.tsx`

- [ ] Replace `deleteTransaction(id)` with `deleteTransactionWithGroup(id)` in `AccountDetail.handleDelete`
- [ ] Import `deleteTransactionWithGroup` from database
- [ ] This ensures pot_allocation and transfer reversals work correctly

### Task 3: Add clickable pot detail view with transactions

**Files:** `src/pages/FinancePage.tsx`

- [ ] Make pot cards clickable (like account cards already are)
- [ ] Create `PotDetail` inline component (similar to `AccountDetail`)
- [ ] Show pot transactions from `getTransactionsForPot(potId)`
- [ ] Delete uses `deleteTransactionWithGroup` so reversal works
- [ ] Add back button to return to finance overview

### Task 4: Dashboard — add monthly stats + current date

**Files:** `src/pages/Dashboard.tsx`

- [ ] Import `getMonthlyStats` from database
- [ ] Call `getMonthlyStats(year, month)` on mount
- [ ] Add current date display in header: "zondag 22 maart 2026"
- [ ] Add two new stat cards: Inkomsten deze maand + Uitgaven deze maand
- [ ] Style income green, expenses red

### Task 5: New Planning page

**Files:** `src/pages/PlanningPage.tsx` (new), `src/App.tsx`, `src/components/Sidebar.tsx`

- [ ] Create `PlanningPage.tsx` — agenda calendar view
- [ ] Group subscription payments by month, then show each payment as a row with date + name + amount
- [ ] Highlight today, show days until each payment
- [ ] Cover next 3 months of payments
- [ ] Add route `/planning` in App.tsx
- [ ] Add "Planning" nav item in Sidebar (Calendar icon)

### Task 6: Subscription detail — fix layout + remove stale message

**Files:** `src/pages/SubscriptionDetail.tsx`

- [ ] Change `max-w-2xl` to `max-w-lg` to fix too-wide layout on larger screens
- [ ] Confirm there is no "Importeer bankafschrift" message (already gone in current code) — if found, remove it
- [ ] Move delete button: make it a small danger icon in the header top-right instead of full-width bottom button

### Task 7: Swipe navigation between pages

**Files:** `src/App.tsx`

- [ ] Add touch swipe handler to `<main>` element
- [ ] Track touch start X position on `touchstart`
- [ ] On `touchend`, if delta > 80px, navigate prev/next page
- [ ] Page order: `/` → `/subscriptions` → `/finance` → `/planning` → `/account`
- [ ] Use `useNavigate` and `useLocation` to determine current page and navigate

### Task 8: GUI polish — less generic, more modern

**Files:** `src/pages/Dashboard.tsx`, `src/pages/FinancePage.tsx`, `src/components/Sidebar.tsx`

- [ ] Dashboard: replace stat grid cards with a cleaner summary strip
- [ ] Add a gradient accent to the dashboard header
- [ ] Finance: improve pot card visual (larger color dot, cleaner progress bar)
- [ ] Sidebar: add subtle active indicator animation
- [ ] General: ensure consistent border-radius and spacing

### Task 9: Build + sync + APK

- [ ] Run `npm run build`
- [ ] Run `npx cap sync android`
- [ ] Build APK: `cd android && JAVA_HOME=... ./gradlew assembleDebug`
- [ ] Copy to `bubbel.apk`
- [ ] Commit all changes
