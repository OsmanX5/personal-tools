# NetWorth — Technical Documentation

> **Tool slug:** `networth`
> **Status:** Active
> **Description:** Track accounts, assets, transactions, and view your net worth across currencies.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Accounts vs Assets](#accounts-vs-assets)
5. [API Reference](#api-reference)
6. [Frontend Components](#frontend-components)
7. [Features](#features)
8. [Currency & Exchange Rates](#currency--exchange-rates)
9. [File Map](#file-map)

---

## Overview

The NetWorth tool allows users to manage multiple financial accounts, record transactions, and view their total net worth converted to a chosen display currency. The tool supports three currencies (USD, SAR, EUR), four account purposes (Savings, Current, Investment, Other), five account locations, and four liquidity tiers. It provides visual breakdowns and historical trend charts.

Alongside accounts, the tool tracks **assets** — non-spendable stores of value such as property, vehicles, or gold. Assets are deliberately kept out of the account net worth figure so the liquid number stays readable on its own; the combined total is always shown next to it, and the summary panel has an explicit scope toggle for folding assets in.

The current UI is a fixed-height dashboard layout designed to fit inside the app shell without page-level scrolling in normal use. The left column contains the tool title, value-visibility toggle, a split totals block, an Accounts/Assets tab, filters, and a scrollable list. The right column is split vertically between a net worth summary panel and a detail panel for the selected account or asset.

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
│  │AssetListItem  │  │ (breakdown + │ │tail Panel    │ │
│  │  (left panel) │  │  trend, with │ │AssetDetail-  │ │
│  │              │  │ scope toggle) │ │Panel (right) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                        │
│  ┌──────────────────┐  ┌────────────────────────────┐  │
│  │AccountFormDialog  │  │TransactionDialog           │  │
│  │AssetFormDialog    │  │AssetValueDialog            │  │
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
│   DELETE      /api/networth/[id]/transactions/[txId]   │
│   GET/POST    /api/networth/assets                     │
│   GET/PUT/DEL /api/networth/assets/[id]                │
│   POST        /api/networth/assets/[id]/value          │
│   DELETE      /api/networth/assets/[id]/value/[entryId]│
│   GET         /api/networth/exchange-rates             │
└──────────────────────┬─────────────────────────────────┘
                       │ Mongoose
┌──────────────────────▼─────────────────────────────────┐
│                    MongoDB                             │
│   Collections: networthaccounts · assets               │
│   Models: src/models/networth_account.ts               │
│           src/models/asset.ts                          │
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
| `startBalance` | Number        | no       | `0`        | Starting balance when the account began                                      |
| `startDate`    | Date          | no       | `Date.now` | Date when the account started (used for historical trend inclusion)          |
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

### Asset (Mongoose document)

Collection: `assets` · Model: `src/models/asset.ts`

| Field             | Type              | Required | Default    | Description                                          |
| ----------------- | ----------------- | -------- | ---------- | ---------------------------------------------------- |
| `_id`             | ObjectId          | auto     | —          | MongoDB document ID                                  |
| `name`            | String            | yes      | —          | Asset display name (trimmed)                         |
| `description`     | String            | no       | —          | Optional description (trimmed)                       |
| `status`          | Enum              | no       | `"owned"`  | `"owned"` or `"sold"`                                |
| `value`           | Number            | no       | `0`        | Current value — always the latest snapshot by date   |
| `currency`        | Enum              | no       | `"USD"`    | `"USD"` \| `"SAR"` \| `"EUR"`                        |
| `category`        | Enum              | yes      | —          | See `AssetCategory` below                            |
| `acquisitionDate` | Date              | no       | `Date.now` | When the asset was acquired                          |
| `acquisitionCost` | Number            | no       | `0`        | What was originally paid — drives the gain figure    |
| `tags`            | String[]          | no       | `[]`       | Free-form tags                                       |
| `valueHistory`    | AssetValueEntry[] | no       | `[]`       | Embedded array of dated value snapshots              |
| `createdAt`       | Date              | auto     | —          | Mongoose timestamp                                   |
| `updatedAt`       | Date              | auto     | —          | Mongoose timestamp                                   |

### AssetValueEntry (embedded sub-document)

| Field   | Type     | Required | Description                                              |
| ------- | -------- | -------- | -------------------------------------------------------- |
| `_id`   | ObjectId | auto     | Auto-generated sub-doc ID                                |
| `date`  | Date     | no       | Date the valuation applies to (defaults to now)          |
| `value` | Number   | yes      | Absolute value at that date — **not** a delta            |
| `note`  | String   | no       | Optional label, e.g. `"Acquisition"`, `"yearly valuation"` |

```typescript
enum AssetCategory {
  Property,
  Vehicle,
  PreciousMetal, // "Precious Metal"
  Equipment,
  Collectible,
  Other,
}
```

---

## Accounts vs Assets

The two concepts are stored and modelled separately because they behave differently:

|                    | Account                                    | Asset                                            |
| ------------------ | ------------------------------------------ | ------------------------------------------------ |
| Records            | Transactions (**deltas**)                  | Value snapshots (**absolute values**)             |
| History rebuilt by | Replaying transactions backward from today | Taking the latest snapshot at or before a date    |
| Metadata           | Purpose, location, liquidity               | Category, acquisition date, acquisition cost      |
| Counts toward      | The headline net worth figure              | The combined total only, unless scope is switched |
| Retired via        | `status: "archived"`                       | `status: "sold"` (contributes 0 to every total)   |

**`value` is derived, not free-floating.** Every write path (`POST value`, `PUT`, `DELETE` entry) calls `syncAssetValue()` from `src/models/asset.ts`, which pins `value` to the snapshot with the latest **date**. Snapshots can be back-dated, so the newest entry in the array is not necessarily the newest in time.

**Reconstruction helpers** live in `src/lib/asset-utils.ts`:

- `assetValueAt(asset, date)` — value at a point in time. Returns `0` for sold assets and for dates before `acquisitionDate`; falls back to the earliest snapshot for dates between acquisition and the first recorded value.
- `assetCurrentValue(asset)` — current value, or `0` if sold.
- `sumAssets(assets, displayCurrency, rates, at?)` — converted total across assets, optionally at a past date.

**History seeding.** `POST /api/networth/assets` seeds `valueHistory` so a new asset already has a trend line: an `"Acquisition"` entry at `acquisitionDate` for `acquisitionCost` (when non-zero), plus an `"Initial value"` entry dated now when the current value differs from what was paid.

---

## API Reference

All endpoints live under `/api/networth/`. The API follows REST conventions and returns JSON. Every handler calls `dbConnect()` before database access.

### `GET /api/networth`

List all accounts sorted by `createdAt` descending.

- **Response:** `200` — `NetWorthAccount[]`

### `POST /api/networth`

Create a new account.

- **Body:** `NetWorthAccountFormData` (name, description, status, amount, startBalance, startDate, currency, tags, purpose, location, liquidity)
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

### `GET /api/networth/assets`

List all assets sorted by `createdAt` descending.

- **Response:** `200` — `Asset[]`

### `POST /api/networth/assets`

Create a new asset. `valueHistory` in the request body is ignored — the server seeds it (see [Accounts vs Assets](#accounts-vs-assets)).

- **Body:** `AssetFormData` (name, description, status, value, currency, category, acquisitionDate, acquisitionCost, tags)
- **Response:** `201` — created `Asset`

### `GET /api/networth/assets/[id]`

Fetch a single asset by ID.

- **Response:** `200` — `Asset`
- **Error:** `404` — `{ error: "Asset not found" }`

### `PUT /api/networth/assets/[id]`

Update an asset's metadata. `valueHistory` is stripped from the body — history is append-only through this route. If `value` differs from the stored value, an `"Edited"` snapshot is appended so the history stays truthful.

- **Body:** Partial `AssetFormData`
- **Response:** `200` — updated `Asset`
- **Error:** `404` — `{ error: "Asset not found" }`

### `DELETE /api/networth/assets/[id]`

Delete an asset and its entire value history permanently.

- **Response:** `200` — `{ ok: true }`
- **Error:** `404` — `{ error: "Asset not found" }`

### `POST /api/networth/assets/[id]/value`

Record a dated value snapshot.

| Body Field | Type   | Required | Description                                  |
| ---------- | ------ | -------- | -------------------------------------------- |
| `value`    | Number | yes      | Absolute new value                           |
| `date`     | String | no       | ISO date the valuation applies to (def. now) |
| `note`     | String | no       | Optional label                               |

**Effect:** Pushes the entry, then re-pins `asset.value` to the latest snapshot by date — so a back-dated snapshot does not clobber a newer one.

- **Response:** `201` — updated `Asset`
- **Errors:**
  - `404` — Asset not found
  - `400` — Missing `value`, or `value` is not a number

### `DELETE /api/networth/assets/[id]/value/[entryId]`

Remove a value snapshot and re-pin `asset.value` to the latest remaining one. If the history is emptied, the current value is left unchanged.

- **Response:** `200` — updated `Asset`
- **Errors:**
  - `404` — Asset not found
  - `404` — `{ error: "Value entry not found" }`

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

- Fetches accounts (`GET /api/networth`), assets (`GET /api/networth/assets`), and exchange rates on mount
- Manages all UI state (selected account/asset, active list tab, dialog open states, display currency, filters)
- Provides CRUD callbacks for both accounts and assets that call API endpoints and update local state
- Computes `accountsTotal`, `assetsTotal`, and `combinedTotal` separately, all converted to `displayCurrency`
- Sorts accounts and assets by value (descending, normalized to USD)
- Filters accounts by `purposeFilter` and assets by `categoryFilter`

`selectedAccount` and `selectedAsset` are separate pieces of state, but at most one is ever set — selecting in one list clears the other. The right-hand detail panel renders whichever is non-null.

**Layout (fixed-height dashboard):**

| Left Panel (w-80)                                       | Right Panel (flex-1, stacked)                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------- |
| NetWorth title + hide/show values toggle                | **NetWorthSummary** — top section, roughly 40% of right column   |
| Split totals block: Accounts / Assets / Total           | **TransactionDetailPanel** or **AssetDetailPanel** — bottom 60%  |
| Currency toggle (USD/SAR/EUR)                           | Both right-side panels are constrained to available shell height |
| `Accounts (n)` / `Assets (n)` tab toggle                |                                                                  |
| Purpose filter (accounts) or category filter (assets)   |                                                                  |
| Account or asset list (scrollable inside the left pane) |                                                                  |
| "+ Add Account" / "+ Add Asset" pinned below the list   |                                                                  |

The split totals block is the primary answer to "what am I worth without the assets" — the accounts figure, the assets figure, and the combined total are three separate lines, always visible regardless of which tab is active.

### `AccountListItem`

**File:** `src/components/networth/account-card.tsx`

Compact card for each account in the sidebar list. Features:

- Color-coded left border by purpose (green=Savings, blue=Current, purple=Investment, gray=Other)
- Highlighted background when selected
- Shows account name, converted balance, and original currency if different
- Shows account start metadata (`Since MMM YYYY`)
- Click to select, double-click to edit
- Inline button to update value (opens TransactionDialog in update-value mode)
- "+" button to add a transaction

### `AssetListItem`

**File:** `src/components/networth/asset-card.tsx`

Compact card for each asset in the sidebar list. Mirrors `AccountListItem` but is visually distinguished by a **dashed** left border, so assets never read as accounts at a glance. Features:

- Color-coded dashed left border by category (amber=Property, cyan=Vehicle, yellow=Precious Metal, slate=Equipment, pink=Collectible, gray=Other)
- Highlighted background when selected; sold assets are dimmed and carry a "Sold" chip
- Shows name, category, `Since MMM YYYY`, converted value, and original currency if different
- Click to select, double-click to edit
- Inline button to record a new value (opens `AssetValueDialog`)
- Pencil button to edit

### `AccountFormDialog`

**File:** `src/components/networth/account-form-dialog.tsx`

Modal dialog for creating or editing an account. Fields:

- **Account Name** (required text input)
- **Description** (optional textarea)
- **Balance + Currency** (number input + currency select)
- **Account Start Date** (date input)
- **Account Start Balance** (number input)
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

### `AssetFormDialog`

**File:** `src/components/networth/asset-form-dialog.tsx`

Modal dialog for creating or editing an asset. Fields:

- **Asset Name** (required text input)
- **Description** (optional textarea)
- **Current Value + Currency** (number input + currency select; on create, typing the value mirrors it into the acquisition cost)
- **Acquisition Date** (date input)
- **Acquisition Cost** (number input)
- **Category** (segmented toggle: Property / Vehicle / Precious Metal / Equipment / Collectible / Other)
- **Status** (segmented toggle: Owned / Sold, with a note that sold assets stop counting)
- **Tags** (comma-separated text input, split into array on submit)

### `AssetValueDialog`

**File:** `src/components/networth/asset-value-dialog.tsx`

Modal dialog for recording a value snapshot. Takes the new value, the date it applies to (defaults to today, and may be back-dated), and an optional note. Shows a live preview of the current value and the resulting change.

### `NetWorthSummary`

**File:** `src/components/networth/net-worth-summary.tsx`

Dashboard panel with two views and a scope toggle.

**Scope toggle (`Accounts` / `+ Assets`)** — the core of the accounts/assets separation. It defaults to `Accounts`, so assets are opted into rather than silently baked in, and it drives the headline figure, the breakdown chart, the trend chart, and the 1D/1W/1M deltas together. Regardless of which scope is active, the card header always lists the **Accounts** and **Assets** subtotals underneath the headline number, so both are readable at once.

The header label follows the scope: `Net Worth · Accounts` or `Total Net Worth`. The trend line is blue for accounts-only and amber once assets are folded in.

1. **Breakdown view:** Pie chart plus legend showing net worth distribution, grouped by:
   - Account (default)
   - Currency — assets group under their own currency
   - Liquidity — assets group under `Illiquid`
   - Purpose — assets group under their category
   - Type — `Accounts` vs `Assets`; only offered when scope includes assets
2. **Trend view:** Area chart showing historical net worth with two period options:
   - **12 months** — monthly data points
   - **30 days** — daily data points

   Account values are computed by replaying transactions backward from the current balance; asset values come from `assetValueAt()`. Both are summed per data point by the shared `netWorthAt()` helper.

The summary panel sits at the top of the right column and exposes its view toggle (`Breakdown` / `Trend`) and the scope toggle above the card. When in breakdown mode, it also exposes grouping controls. When in trend mode, it exposes the period toggle (`12m`, `30d`).

### `TransactionDetailPanel`

**File:** `src/components/networth/transaction-detail-panel.tsx`

Right-panel detail view for the selected account:

- Account name, description, and action buttons (Add Transaction, Update Value, Edit, Delete)
- A top summary row that places the balance summary and metadata badges beside the chart to use horizontal space more efficiently
- Current balance (converted + original if different)
- Account badges for purpose, location, and currency
- Account start metadata badges for start date and start balance
- Balance trend area chart with two period options:
  - **12 months** — monthly reconstructed balance history
  - **30 days** — daily reconstructed balance history
- Panel-level scrolling so the entire selected-account view can scroll if needed inside its allocated area
- Recent transaction list showing the latest 5 entries (newest first) with type icons:
  - Income: green up-right arrow
  - Expense: red down-right arrow
  - Transfer: blue refresh icon
  - MarketChange: purple trending-up icon

### `AssetDetailPanel`

**File:** `src/components/networth/asset-detail-panel.tsx`

Right-panel detail view for the selected asset — the asset counterpart to `TransactionDetailPanel`:

- Asset name, "Sold" badge where applicable, description, and action buttons (Update Value, Edit, Delete)
- Current value (converted + original if different)
- **Since Purchase** gain — absolute change and percentage against `acquisitionCost`, shown instead of the 1D/1W/1M deltas used for accounts, since those windows say little about a house or a car
- Badges for category, currency, acquisition date, and acquisition cost
- Value trend area chart (amber) with 12-month and 30-day periods, driven by `assetValueAt()`
- Value history list showing the latest 5 snapshots (newest first), each with its note, date, absolute value, and the delta against the snapshot before it, with a hover-revealed delete button

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
| Assets                  | Track property, vehicles, gold, and other non-account holdings    |
| Separated totals        | Accounts, assets, and combined totals shown as three lines        |
| Asset scope toggle      | Fold assets into the headline figure and charts, or leave them out |
| Asset value snapshots   | Dated absolute valuations, back-datable, instead of deltas        |
| Asset gain tracking     | Change against acquisition cost, in currency and percent          |
| Sold assets             | Retained for history but contribute nothing to any total          |
| Fixed-height dashboard  | Uses the available shell height without normal page-level scroll  |
| Recent transactions     | Shows the latest 5 transactions in the account detail panel       |
| Account metadata        | Purpose, location, liquidity tier, status (active/archived), tags |
| Start metadata          | Capture account start date and start balance                      |
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
│           │       ├── route.ts               # POST add transaction / update value
│           │       └── [txId]/
│           │           └── route.ts           # DELETE transaction (reverses balance)
│           ├── assets/
│           │   ├── route.ts                   # GET (list) / POST (create + seed history)
│           │   └── [id]/
│           │       ├── route.ts               # GET / PUT / DELETE by ID
│           │       └── value/
│           │           ├── route.ts           # POST record value snapshot
│           │           └── [entryId]/
│           │               └── route.ts       # DELETE value snapshot
│           └── exchange-rates/
│               └── route.ts                   # GET exchange rates (cached)
├── components/
│   └── networth/
│       ├── networth-client.tsx                # Main client orchestrator
│       ├── account-card.tsx                   # AccountListItem sidebar card
│       ├── asset-card.tsx                     # AssetListItem sidebar card
│       ├── account-form-dialog.tsx            # Create/edit account dialog
│       ├── asset-form-dialog.tsx              # Create/edit asset dialog
│       ├── transaction-dialog.tsx             # Add transaction / update value dialog
│       ├── asset-value-dialog.tsx             # Record asset value snapshot dialog
│       ├── transaction-detail-panel.tsx        # Selected account detail + tx list
│       ├── asset-detail-panel.tsx             # Selected asset detail + value history
│       ├── networth-motion.ts                 # Shared motion constants & transitions
│       └── net-worth-summary.tsx              # Breakdown + trend charts, scope toggle
├── lib/
│   ├── networth-types.ts                      # TypeScript types, enums, constants
│   └── asset-utils.ts                         # assetValueAt / assetCurrentValue / sumAssets
└── models/
    ├── networth_account.ts                    # Mongoose model & schema
    └── asset.ts                               # Asset model, schema, syncAssetValue()
```
