# NetWorth — Technical Documentation

> **Tool slug:** `networth`
> **Status:** Active
> **Description:** Track accounts, transactions, and view your net worth across currencies.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [API Reference](#api-reference)
5. [Frontend Components](#frontend-components)
6. [Features](#features)
7. [Currency & Exchange Rates](#currency--exchange-rates)
8. [File Map](#file-map)

---

## Overview

The NetWorth tool allows users to manage multiple financial accounts, record transactions, and view their total net worth converted to a chosen display currency. The tool supports three currencies (USD, SAR, EUR), four account purposes (Savings, Current, Investment, Other), five account locations, and four liquidity tiers. It provides visual breakdowns and historical trend charts.

The current UI is a fixed-height dashboard layout designed to fit inside the app shell without page-level scrolling in normal use. The left column contains the tool title, value-visibility toggle, filters, and a scrollable account list. The right column is split vertically between a net worth summary panel and a selected-account detail panel.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                     Next.js Page                       │
│              src/app/networth/page.tsx                  │
│            (Server Component → renders client)         │
└──────────────────────┬─────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────┐
│                  NetWorthClient                        │
│         src/components/networth/networth-client.tsx     │
│    (Client Component — manages all state & API calls)  │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │AccountListItem│  │NetWorthSummary│ │TransactionDe-│ │
│  │  (left panel) │  │ (breakdown + │ │tail Panel    │ │
│  │              │  │  trend charts)│ │(right panel) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                        │
│  ┌──────────────────┐  ┌────────────────────────────┐  │
│  │AccountFormDialog  │  │TransactionDialog           │  │
│  │(create/edit acct) │  │(add tx / update value)     │  │
│  └──────────────────┘  └────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │ fetch()
┌──────────────────────▼─────────────────────────────────┐
│                    REST API Layer                       │
│               src/app/api/networth/                     │
│                                                        │
│   GET/POST    /api/networth                            │
│   GET/PUT/DEL /api/networth/[id]                       │
│   POST        /api/networth/[id]/transactions          │
│   GET         /api/networth/exchange-rates             │
└──────────────────────┬─────────────────────────────────┘
                       │ Mongoose
┌──────────────────────▼─────────────────────────────────┐
│                    MongoDB                             │
│            Collection: networthaccounts                │
│           Model: src/models/networth_account.ts        │
└────────────────────────────────────────────────────────┘
```

---

## Data Model

### NetWorthAccount (Mongoose document)

| Field          | Type          | Required | Default    | Description                                                                  |
| -------------- | ------------- | -------- | ---------- | ---------------------------------------------------------------------------- |
| `_id`          | ObjectId      | auto     | —          | MongoDB document ID                                                          |
| `name`         | String        | yes      | —          | Account display name (trimmed)                                               |
| `description`  | String        | no       | —          | Optional description (trimmed)                                               |
| `status`       | Enum          | no       | `"active"` | `"active"` or `"archived"`                                                   |
| `amount`       | Number        | no       | `0`        | Current balance (updated on each transaction)                                |
| `currency`     | Enum          | no       | `"USD"`    | `"USD"` \| `"SAR"` \| `"EUR"`                                                |
| `tags`         | String[]      | no       | `[]`       | Free-form tags                                                               |
| `purpose`      | Enum          | yes      | —          | `"Savings"` \| `"Current"` \| `"Investment"` \| `"Other"`                    |
| `location`     | Enum          | yes      | —          | `"Bank"` \| `"Cash"` \| `"Investment App"` \| `"Online outlet"` \| `"Other"` |
| `liquidity`    | Enum          | yes      | —          | `"Immediate"` \| `"Hours"` \| `"Days"` \| `"Weeks"`                          |
| `transactions` | Transaction[] | no       | `[]`       | Embedded array of transactions                                               |
| `createdAt`    | Date          | auto     | —          | Mongoose timestamp                                                           |
| `updatedAt`    | Date          | auto     | —          | Mongoose timestamp                                                           |

### Transaction (embedded sub-document)

| Field    | Type     | Required | Description                                                   |
| -------- | -------- | -------- | ------------------------------------------------------------- |
| `_id`    | ObjectId | auto     | Auto-generated sub-doc ID                                     |
| `date`   | Date     | auto     | Set via Mongoose `timestamps: { createdAt: "date" }`          |
| `amount` | Number   | yes      | Positive or negative delta applied to account balance         |
| `type`   | Enum     | yes      | `"Income"` \| `"Expense"` \| `"Transfer"` \| `"MarketChange"` |

### Enums (defined in model)

```typescript
enum AccountPurpose {
  Savings,
  Current,
  Investment,
  Other,
}
enum AccountLocation {
  Bank,
  Cash,
  OnlineOutlet,
  InvestmentApp,
  Other,
}
enum AccountLiquidity {
  Immediate,
  Hours,
  Days,
  Weeks,
}
enum CurrencyType {
  USD,
  SAR,
  EUR,
}
enum TransactionType {
  Income,
  Expense,
  Transfer,
  MarketChange,
}
```

---

## API Reference

All endpoints live under `/api/networth/`. The API follows REST conventions and returns JSON. Every handler calls `dbConnect()` before database access.

### `GET /api/networth`

List all accounts sorted by `createdAt` descending.

- **Response:** `200` — `NetWorthAccount[]`

### `POST /api/networth`

Create a new account.

- **Body:** `NetWorthAccountFormData` (name, description, status, amount, currency, tags, purpose, location, liquidity)
- **Response:** `201` — created `NetWorthAccount`

### `GET /api/networth/[id]`

Fetch a single account by ID.

- **Response:** `200` — `NetWorthAccount`
- **Error:** `404` — `{ error: "Account not found" }`

### `PUT /api/networth/[id]`

Update an account's metadata (name, description, status, currency, purpose, location, liquidity, tags). Runs Mongoose validators.

- **Body:** Partial `NetWorthAccountFormData`
- **Response:** `200` — updated `NetWorthAccount`
- **Error:** `404` — `{ error: "Account not found" }`

### `DELETE /api/networth/[id]`

Delete an account and all its transactions permanently.

- **Response:** `200` — `{ ok: true }`
- **Error:** `404` — `{ error: "Account not found" }`

### `POST /api/networth/[id]/transactions`

Add a transaction and update the account balance. Supports two modes:

#### Mode 1: Direct transaction

| Body Field | Type   | Required | Description               |
| ---------- | ------ | -------- | ------------------------- |
| `amount`   | Number | yes      | Delta to apply to balance |
| `type`     | String | yes      | Transaction type enum     |

**Effect:** Pushes `{ amount, type }` to `transactions[]` and adds `amount` to `account.amount`.

#### Mode 2: Update value (set new balance)

| Body Field   | Type   | Required | Description                                   |
| ------------ | ------ | -------- | --------------------------------------------- |
| `newAmount`  | Number | yes      | Desired new balance                           |
| `updateKind` | String | no       | `"MarketChange"` (default) or `"Transaction"` |

**Effect:** Calculates `diff = newAmount - currentAmount`, pushes a transaction with the diff, and sets `account.amount = newAmount`. The transaction type is `"MarketChange"` if `updateKind === "MarketChange"`, otherwise derived from the sign of the diff (`"Income"` / `"Expense"`).

- **Response:** `201` — updated `NetWorthAccount`
- **Errors:**
  - `404` — Account not found
  - `400` — Missing `amount` and `type` (direct mode)

### `GET /api/networth/exchange-rates`

Fetch live exchange rates from [open.er-api.com](https://open.er-api.com), cached in-memory for 1 hour.

- **Response:** `200` — `{ USD: number, SAR: number, EUR: number }`
- **Fallback on error:** `{ USD: 1, SAR: 3.75, EUR: 0.92 }` (status `502` if no cached data)

---

## Frontend Components

### Page: `src/app/networth/page.tsx`

Server component that renders `<NetWorthClient />`.

### `NetWorthClient` — Main orchestrator

**File:** `src/components/networth/networth-client.tsx`

Central client component that:

- Fetches accounts (`GET /api/networth`) and exchange rates on mount
- Manages all UI state (selected account, dialog open states, display currency, filters)
- Provides CRUD callbacks that call API endpoints and update local state
- Computes `total` net worth by converting all accounts to `displayCurrency`
- Sorts accounts by value (descending, normalized to USD)
- Filters accounts by `purposeFilter` (All / Savings / Current / Investment / Other)

**Layout (fixed-height dashboard):**

| Left Panel (w-80)                              | Right Panel (flex-1, stacked)                                    |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| NetWorth title + hide/show values toggle       | **NetWorthSummary** — top section, roughly 40% of right column   |
| Total accounts + converted total summary       | **TransactionDetailPanel** — bottom section, roughly 60%         |
| Currency toggle (USD/SAR/EUR)                  | Both right-side panels are constrained to available shell height |
| Purpose filter buttons                         |                                                                  |
| Account list (scrollable inside the left pane) |                                                                  |
| "+ Add Account" button pinned below the list   |                                                                  |

### `AccountListItem`

**File:** `src/components/networth/account-card.tsx`

Compact card for each account in the sidebar list. Features:

- Color-coded left border by purpose (green=Savings, blue=Current, purple=Investment, gray=Other)
- Highlighted background when selected
- Shows account name, converted balance, and original currency if different
- Click to select, double-click to edit
- Inline button to update value (opens TransactionDialog in update-value mode)
- "+" button to add a transaction

### `AccountFormDialog`

**File:** `src/components/networth/account-form-dialog.tsx`

Modal dialog for creating or editing an account. Fields:

- **Account Name** (required text input)
- **Description** (optional textarea)
- **Balance + Currency** (number input + currency select)
- **Purpose** (segmented toggle: Savings / Current / Investment / Other)
- **Location** (segmented toggle: Bank / Cash / Investment App / Online outlet / Other)
- **Liquidity** (segmented toggle: Immediate / Hours / Days / Weeks)
- **Status** (segmented toggle: Active / Archived)
- **Tags** (comma-separated text input, split into array on submit)

### `TransactionDialog`

**File:** `src/components/networth/transaction-dialog.tsx`

Modal dialog with two modes:

1. **Transaction mode:** Select type (Income/Expense/Transfer/MarketChange), enter amount. Shows preview of current balance → new balance.
2. **Update-value mode:** Choose between Market Change (enter new total value, difference recorded as MarketChange) or Transaction (enter delta amount, recorded as Income/Expense based on sign).

### `NetWorthSummary`

**File:** `src/components/networth/net-worth-summary.tsx`

Dashboard panel with two views toggled by the user:

1. **Breakdown view:** Horizontal stacked bar showing net worth distribution, grouped by:
   - Account (default)
   - Currency
   - Liquidity
   - Purpose
2. **Trend view:** Area chart showing historical total net worth with two period options:
   - **12 months** — monthly data points computed by replaying transactions backward from current balance
   - **30 days** — daily data points using the same replay logic

The summary panel sits at the top of the right column and exposes its view toggle (`Breakdown` / `Trend`) above the card. When in breakdown mode, it also exposes grouping controls (`Account`, `Currency`, `Liquidity`, `Purpose`). When in trend mode, it exposes the period toggle (`12m`, `30d`).

### `TransactionDetailPanel`

**File:** `src/components/networth/transaction-detail-panel.tsx`

Right-panel detail view for the selected account:

- Account name, description, and action buttons (Add Transaction, Update Value, Edit, Delete)
- A top summary row that places the balance summary and metadata badges beside the chart to use horizontal space more efficiently
- Current balance (converted + original if different)
- Account badges for purpose, location, and currency
- Balance trend area chart with two period options:
  - **12 months** — monthly reconstructed balance history
  - **30 days** — daily reconstructed balance history
- Panel-level scrolling so the entire selected-account view can scroll if needed inside its allocated area
- Recent transaction list showing the latest 5 entries (newest first) with type icons:
  - Income: green up-right arrow
  - Expense: red down-right arrow
  - Transfer: blue refresh icon
  - MarketChange: purple trending-up icon

---

## Features

| Feature                 | Description                                                       |
| ----------------------- | ----------------------------------------------------------------- |
| Multi-currency accounts | Each account holds its own currency (USD, SAR, EUR)               |
| Live exchange rates     | Fetched from open.er-api.com, cached 1 hour, with static fallback |
| Display currency toggle | View total and all balances converted to any supported currency   |
| Hide/show values toggle | Mask or reveal monetary values from the title area                |
| Purpose-based filtering | Filter account list by Savings / Current / Investment / Other     |
| Transaction history     | Each account stores an embedded array of timestamped transactions |
| Two transaction modes   | Direct transaction (delta) or update-value (set new balance)      |
| Market change tracking  | Distinguish market value changes from actual income/expense       |
| Historical trend charts | Reconstruct past balances by replaying transactions backward      |
| Net worth breakdown     | Visualize composition by account, currency, liquidity, or purpose |
| Fixed-height dashboard  | Uses the available shell height without normal page-level scroll  |
| Recent transactions     | Shows the latest 5 transactions in the account detail panel       |
| Account metadata        | Purpose, location, liquidity tier, status (active/archived), tags |
| Color-coded accounts    | Visual distinction by purpose in the sidebar                      |

---

## Currency & Exchange Rates

Conversion is performed client-side using the formula:

```
convertedAmount = (originalAmount / rates[fromCurrency]) * rates[toCurrency]
```

All rates are relative to USD (rates.USD = 1). The exchange-rate endpoint fetches from `https://open.er-api.com/v6/latest/USD` and caches in server memory for 1 hour. If the external API is unreachable, hardcoded fallback rates are returned: `{ USD: 1, SAR: 3.75, EUR: 0.92 }`.

---

## File Map

```
src/
├── app/
│   ├── networth/
│   │   └── page.tsx                          # Page route (server component)
│   └── api/
│       └── networth/
│           ├── route.ts                       # GET (list) / POST (create)
│           ├── [id]/
│           │   ├── route.ts                   # GET / PUT / DELETE by ID
│           │   └── transactions/
│           │       └── route.ts               # POST add transaction / update value
│           └── exchange-rates/
│               └── route.ts                   # GET exchange rates (cached)
├── components/
│   └── networth/
│       ├── networth-client.tsx                # Main client orchestrator
│       ├── account-card.tsx                   # AccountListItem sidebar card
│       ├── account-form-dialog.tsx            # Create/edit account dialog
│       ├── transaction-dialog.tsx             # Add transaction / update value dialog
│       ├── transaction-detail-panel.tsx        # Selected account detail + tx list
│       └── net-worth-summary.tsx              # Breakdown + trend charts
├── lib/
│   └── networth-types.ts                      # TypeScript types, enums, constants
└── models/
    └── networth_account.ts                    # Mongoose model & schema
```
