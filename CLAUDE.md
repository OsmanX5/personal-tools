# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npm start        # Start production server
```

There are no automated tests. Lint is the only code-quality check available.

## Architecture

Next.js 16 (App Router, TypeScript) personal dashboard. Single-user, password-gated via iron-session. MongoDB via Mongoose for persistence. Deployed to Render.

**Required environment variables:** `MONGODB_URI`, `APP_PASSWORD`, `SESSION_SECRET` (min 32 chars).

### Tool structure

Every tool follows the same layered structure:

| Layer | Location | Role |
|---|---|---|
| Page | `src/app/<slug>/page.tsx` | Server component, renders the client component |
| API | `src/app/api/<slug>/route.ts` | REST handlers — always call `dbConnect()` first |
| Client | `src/components/<slug>/<slug>-client.tsx` | `"use client"` orchestrator — owns all state and fetch calls |
| Sub-components | `src/components/<slug>/*.tsx` | UI panels, dialogs, charts |
| Types | `src/lib/<slug>-types.ts` | TypeScript types, enums, constant arrays |
| Model | `src/models/<model>.ts` | Mongoose schema + model |

**Tools registry:** `src/lib/tools-registry.ts` drives both the sidebar and the home dashboard. Adding an entry here automatically adds nav. Each entry has `name`, `slug`, `description`, `icon` (Lucide), `status` (`"active"` | `"coming-soon"`), and `group` (sidebar section label).

**Active tools:**
- Finance group: `networth`, `budget`, `planning`, `subscriptions`
- Career group: `jobs`
- Health group: `weight`, `habits`
- Learning group: `courses`

### Cross-tool integration

`subscriptions` → `budget`: When a subscription's status is `"Active"`, `src/lib/subscriptions-budget-sync.ts` upserts a recurring expense into the `Expense` collection with `category: "Subscriptions"`. The `budgetExpenseId` field on the subscription tracks the linked expense. This sync runs inside the subscriptions API on create/update/delete.

`budget` → recurring logic: `src/lib/recurring-utils.ts` contains `getOccurrencesInMonth()`, which computes expense occurrence dates for a given month based on `recurringFrequency` (`Weekly`, `Monthly`, `Every 6 Months`, `Yearly`). The Budget tool uses this to inflate recurring expenses into per-month totals.

### Auth

`POST /api/auth` checks `APP_PASSWORD` env var and sets an iron-session cookie. `DELETE /api/auth` destroys the session. All tool API routes should check session validity; the pattern is to call `getIronSession()` and return 401 if `!session.isLoggedIn`.

### App shell

`src/components/layout/app-shell.tsx` renders `<Sidebar>` + `<Header>` around `<main>`. It skips the shell on `/login`. The sidebar groups tools by their `group` field from the registry.

## UI conventions

**Component library:** `src/components/ui/` contains custom-wrapped primitives built on `@base-ui/react` + Tailwind CSS v4 + CVA. The key components are `Button`, `Card`, `Dialog`, `Input`, `Select`, `Badge`, `Chart`, `ToggleGroup`, `ScrollArea`, `Toaster`.

**Chart:** `src/components/ui/chart.tsx` wraps Recharts. Pass `data`, `xKey`, `dataKey`. Supports `variant: "area" | "line"`. Accepts extra Recharts children (e.g. `ReferenceLine`) as `children`.

**Toasts:** Import `toast` from `sonner` and call `toast.success(...)` / `toast.error(...)` directly. The `<Toaster />` is mounted once in `src/app/layout.tsx`.

**Theme:** `next-themes` with Roboto / Roboto Mono fonts. Dark mode supported throughout.

## Animation

Use Framer Motion for all animation work. Key rules from `docs/animation-guidelines.md`:
- Keep transitions 180–320ms, movement 6–18px.
- Use `AnimatePresence` for conditional panels and view replacement.
- Use layout animation for sortable/filterable lists.
- Always include reduced-motion support (`useReducedMotion` or `motion.div` `initial={false}` guard).
- Charts should not reanimate on every state update — animate the container on view switches only.

## Adding a new tool

1. Add entry to `src/lib/tools-registry.ts` (sidebar and home auto-update).
2. Create `src/app/<slug>/page.tsx`.
3. Copy `src/models/_example.ts` → `src/models/<model>.ts` and adjust.
4. Create `src/app/api/<slug>/route.ts` (and `[id]/route.ts` if needed).
5. Set `status: "active"` in the registry when the UI is ready.

## Documentation

`docs/` contains per-tool technical documentation generated following `docs/DOCUMENTATION_GUIDE.md`. When adding a new tool, generate its doc using that guide with `docs/networth.md` as the reference format.
