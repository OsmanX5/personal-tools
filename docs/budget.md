# Budget Planner — Technical Documentation

> **Tool slug:** `budget`
> **Status:** Active
> **Description:** Track expenses, set category budgets, and plan future financial goals.

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

The Budget Planner tool gives users a monthly view of their spending, per-category budget limits, and a tracker for long-term financial goals ("future plans"). Expenses are recorded with a category, amount, currency, date, and optional recurring flag. Category budgets set a monthly spending limit per category and display real-time progress bars. Future plans track a goal (e.g. a car, holiday, or degree) with an estimated cost, saved amount, target date, priority, and status. All monetary values support three currencies (USD, SAR, EUR) and are displayed in a user-chosen display currency using live exchange rates shared with the NetWorth tool. Expenses can optionally deduct directly from a NetWorth account, creating a cross-tool ledger link.

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      Next.js Page                          │
│              src/app/budget/page.tsx                        │
│            (Server Component → renders client)             │
└──────────────────────┬─────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────┐
│                   BudgetClient                             │
│         src/components/budget/budget-client.tsx             │
│    (Client Component — manages all state & API calls)      │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Tab: Expenses                                     │    │
│  │  ┌───────────────────┐  ┌────────────────────────┐│    │
│  │  │MonthlySummaryCards│  │CategoryBreakdownChart  ││    │
│  │  │  (4 KPI cards)    │  │  (donut chart)         ││    │
│  │  └───────────────────┘  └────────────────────────┘│    │
│  │  ┌───────────────────┐                            │    │
│  │  │  ExpenseList      │                            │    │
│  │  │  (scrollable list)│                            │    │
│  │  └───────────────────┘                            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Tab: Budgets                                      │    │
│  │  ┌───────────────────────────────────────────────┐ │    │
│  │  │  BudgetOverview (progress bars per category)  │ │    │
│  │  └───────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Tab: Future Plans                                 │    │
│  │  ┌───────────────────────────────────────────────┐ │    │
│  │  │  PlansList (responsive card grid)             │ │    │
│  │  └───────────────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────────────┘    │
│                                                            │
│  ┌──────────────────┐ ┌──────────────────┐ ┌───────────┐  │
│  │ ExpenseFormDialog│ │BudgetFormDialog  │ │PlanForm   │  │
│  │ (add/edit expense│ │(set/edit budget) │ │Dialog     │  │
│  └──────────────────┘ └──────────────────┘ └───────────┘  │
└──────────────────────┬─────────────────────────────────────┘
                       │ fetch()
┌──────────────────────▼─────────────────────────────────────┐
│                    REST API Layer                           │
│               src/app/api/budget/                           │
│                                                            │
│   GET/POST    /api/budget/expenses                         │
│   PUT/DELETE  /api/budget/expenses/[id]                    │
│   GET/POST    /api/budget/budgets                          │
│   PUT/DELETE  /api/budget/budgets/[id]                     │
│   GET/POST    /api/budget/plans                            │
│   GET/PUT/DEL /api/budget/plans/[id]                       │
│   GET         /api/networth/exchange-rates  (shared)       │
└──────────────────────┬─────────────────────────────────────┘
                       │ Mongoose
┌──────────────────────▼─────────────────────────────────────┐
│                    MongoDB                                 │
│   Collections: expenses · categorybudgets · futureplans    │
│   Models: expense.ts · category_budget.ts · future_plan.ts │
└────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Expense (Mongoose document)

| Field                | Type     | Required | Default | Description                                                        |
| -------------------- | -------- | -------- | ------- | ------------------------------------------------------------------ |
| `_id`                | ObjectId | auto     | —       | MongoDB document ID                                                |
| `amount`             | Number   | yes      | —       | Positive expense amount (min 0)                                    |
| `currency`           | Enum     | no       | `"USD"` | `"USD"` \| `"SAR"` \| `"EUR"`                                      |
| `category`           | Enum     | yes      | —       | One of 12 expense categories (see below)                           |
| `description`        | String   | no       | —       | Optional free-text description (trimmed)                           |
| `date`               | Date     | yes      | —       | The date the expense occurred                                      |
| `recurring`          | Boolean  | no       | `false` | Whether this is a recurring expense                                |
| `recurringFrequency` | Enum     | no       | —       | `"Weekly"` \| `"Monthly"` \| `"Every 6 Months"` \| `"Yearly"`      |
| `withdrawAccountId`  | String   | no       | —       | Optional — if set, deducts amount from the linked NetWorth account |
| `createdAt`          | Date     | auto     | —       | Mongoose timestamp                                                 |
| `updatedAt`          | Date     | auto     | —       | Mongoose timestamp                                                 |

**Indexes:** `{ date: -1 }`, `{ category: 1, date: -1 }`

---

### CategoryBudget (Mongoose document)

| Field         | Type     | Required | Default | Description                    |
| ------------- | -------- | -------- | ------- | ------------------------------ |
| `_id`         | ObjectId | auto     | —       | MongoDB document ID            |
| `category`    | Enum     | yes      | —       | One of 12 expense categories   |
| `limitAmount` | Number   | yes      | —       | Monthly spending limit (min 0) |
| `currency`    | Enum     | no       | `"USD"` | `"USD"` \| `"SAR"` \| `"EUR"`  |
| `month`       | Number   | yes      | —       | Calendar month (1–12)          |
| `year`        | Number   | yes      | —       | Calendar year                  |
| `createdAt`   | Date     | auto     | —       | Mongoose timestamp             |
| `updatedAt`   | Date     | auto     | —       | Mongoose timestamp             |

**Unique index:** `{ category: 1, month: 1, year: 1 }` — one budget per category per month.

---

### FuturePlan (Mongoose document)

| Field           | Type     | Required | Default    | Description                                  |
| --------------- | -------- | -------- | ---------- | -------------------------------------------- |
| `_id`           | ObjectId | auto     | —          | MongoDB document ID                          |
| `name`          | String   | yes      | —          | Plan display name (trimmed)                  |
| `description`   | String   | no       | —          | Optional description (trimmed)               |
| `estimatedCost` | Number   | yes      | —          | Total projected cost (min 0)                 |
| `amountSaved`   | Number   | no       | `0`        | Amount saved toward this goal so far (min 0) |
| `currency`      | Enum     | no       | `"USD"`    | `"USD"` \| `"SAR"` \| `"EUR"`                |
| `targetDate`    | Date     | no       | —          | Optional deadline for the plan               |
| `priority`      | Enum     | no       | `"Medium"` | `"High"` \| `"Medium"` \| `"Low"`            |
| `status`        | Enum     | no       | `"Active"` | `"Active"` \| `"Completed"` \| `"Cancelled"` |
| `createdAt`     | Date     | auto     | —          | Mongoose timestamp                           |
| `updatedAt`     | Date     | auto     | —          | Mongoose timestamp                           |

---

### Enums (defined in `src/lib/budget-types.ts`)

```typescript
type ExpenseCategory =
  | "Food & Groceries"
  | "Transport"
  | "Rent / Housing"
  | "Utilities"
  | "Entertainment"
  | "Health & Fitness"
  | "Education"
  | "Clothing"
  | "Subscriptions"
  | "Loaning Friends"
  | "Family Support"
  | "Other";

type RecurringFrequency = "Weekly" | "Monthly" | "Every 6 Months" | "Yearly";

type PlanPriority = "High" | "Medium" | "Low";

type PlanStatus = "Active" | "Completed" | "Cancelled";
```

---

## API Reference

All endpoints are under `/api/budget/`. Every handler calls `dbConnect()` before database access.

### `GET /api/budget/expenses`

List all expenses for the specified month, sorted by date descending.

- **Query params:** `month` (1–12), `year` — both default to current month/year
- **Logic:** Filters by `date >= start of month` and `date < start of next month`
- **Response:** `200` — `Expense[]`

### `POST /api/budget/expenses`

Create a new expense. Optionally deducts the expense from a NetWorth account.

- **Body:**

| Field                | Type    | Required | Description                        |
| -------------------- | ------- | -------- | ---------------------------------- |
| `amount`             | Number  | yes      | Positive expense amount            |
| `currency`           | String  | yes      | `"USD"` \| `"SAR"` \| `"EUR"`      |
| `category`           | String  | yes      | Expense category enum value        |
| `description`        | String  | no       | Free-text description              |
| `date`               | String  | yes      | ISO date string                    |
| `recurring`          | Boolean | no       | Whether this is recurring          |
| `recurringFrequency` | String  | no       | Frequency enum if recurring        |
| `withdrawAccountId`  | String  | no       | NetWorth account ID to deduct from |

- **Side effect:** If `withdrawAccountId` is provided, looks up the NetWorth account and subtracts the expense amount (converting currencies with fallback rates if needed), recording an `"Expense"` transaction on that account.
- **Response:** `201` — created `Expense`
- **Note:** Withdrawal failure is caught and logged; the expense is still created successfully.

### `PUT /api/budget/expenses/[id]`

Update an existing expense by ID. Runs Mongoose validators.

- **Body:** Partial expense fields
- **Response:** `200` — updated `Expense`
- **Error:** `404` — `{ error: "Expense not found" }`

### `DELETE /api/budget/expenses/[id]`

Delete an expense permanently.

- **Response:** `200` — `{ ok: true }`
- **Error:** `404` — `{ error: "Expense not found" }`

---

### `GET /api/budget/budgets`

List all category budgets for the specified month.

- **Query params:** `month` (1–12), `year` — both default to current month/year
- **Response:** `200` — `CategoryBudget[]`

### `POST /api/budget/budgets`

Create or update (upsert) a category budget for the given category+month+year combination.

- **Body:**

| Field         | Type   | Required | Description                   |
| ------------- | ------ | -------- | ----------------------------- |
| `category`    | String | yes      | Expense category enum value   |
| `month`       | Number | yes      | Calendar month (1–12)         |
| `year`        | Number | yes      | Calendar year                 |
| `limitAmount` | Number | yes      | Monthly spending limit        |
| `currency`    | String | yes      | `"USD"` \| `"SAR"` \| `"EUR"` |

- **Logic:** `findOneAndUpdate` with `upsert: true` — only one budget per category per month can exist.
- **Response:** `201` — created or updated `CategoryBudget`

### `PUT /api/budget/budgets/[id]`

Update a budget by ID. Runs Mongoose validators.

- **Body:** Partial `CategoryBudget` fields
- **Response:** `200` — updated `CategoryBudget`
- **Error:** `404` — `{ error: "Budget not found" }`

### `DELETE /api/budget/budgets/[id]`

Delete a category budget permanently.

- **Response:** `200` — `{ ok: true }`
- **Error:** `404` — `{ error: "Budget not found" }`

---

### `GET /api/budget/plans`

List all future plans, sorted by `createdAt` descending.

- **Query params:** `status` (optional) — filter by plan status (`"Active"`, `"Completed"`, or `"Cancelled"`)
- **Response:** `200` — `FuturePlan[]`

### `POST /api/budget/plans`

Create a new future plan.

- **Body:** `FuturePlanFormData` (name, description, estimatedCost, amountSaved, currency, targetDate, priority, status)
- **Response:** `201` — created `FuturePlan`

### `GET /api/budget/plans/[id]`

Fetch a single plan by ID.

- **Response:** `200` — `FuturePlan`
- **Error:** `404` — `{ error: "Plan not found" }`

### `PUT /api/budget/plans/[id]`

Update a plan by ID. Runs Mongoose validators.

- **Body:** Partial `FuturePlanFormData`
- **Response:** `200` — updated `FuturePlan`
- **Error:** `404` — `{ error: "Plan not found" }`

### `DELETE /api/budget/plans/[id]`

Delete a plan permanently.

- **Response:** `200` — `{ ok: true }`
- **Error:** `404` — `{ error: "Plan not found" }`

---

## Frontend Components

### Page: `src/app/budget/page.tsx`

Server component that renders `<BudgetClient />`.

---

### `BudgetClient` — Main orchestrator

**File:** `src/components/budget/budget-client.tsx`

Central client component that:

- Fetches expenses and budgets for the current (or navigated) month, all plans, and live exchange rates on mount and whenever the month changes
- Also fetches the previous month's expenses for month-over-month comparison
- Fetches active NetWorth accounts to populate the expense withdrawal dropdown
- Manages all UI state: active tab, month/year, display currency, dialog open states, editing targets
- Computes derived values: `totalSpent` and `prevTotalSpent` (all expenses converted to `displayCurrency`)
- Provides CRUD callbacks for expenses, budgets, and plans that call the API then update local state

**Layout:**

| Section                      | Contents                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| **Header row**               | Title, expense count, total spent in display currency                                               |
| **Controls row**             | Month navigator (← month →), currency toggle (USD/SAR/EUR), tab switcher                            |
| **Tab: Expenses**            | `MonthlySummaryCards` (top), then `ExpenseList` (left half) + `CategoryBreakdownChart` (right half) |
| **Tab: Budgets**             | `BudgetOverview` (full width) + "Set Category Budget" button                                        |
| **Tab: Future Plans**        | `PlansList` (full width) + "Add Future Plan" button                                                 |
| **Dialogs (always mounted)** | `ExpenseFormDialog`, `BudgetFormDialog`, `PlanFormDialog`                                           |

---

### `MonthlySummaryCards`

**File:** `src/components/budget/monthly-summary-cards.tsx`

Displays four KPI cards in a 2×2 (mobile) / 1×4 (desktop) grid.

| Card              | Value                                  | Sub-text                                   |
| ----------------- | -------------------------------------- | ------------------------------------------ |
| **Total Spent**   | Sum of all expenses (display currency) | % change vs previous month with trend icon |
| **Daily Average** | Total ÷ days elapsed in month          | "Over N days"                              |
| **Transactions**  | Count of expense records               | Count of recurring expenses                |
| **Top Category**  | Category with highest spending         | "Highest spending" or "No expenses"        |

---

### `CategoryBreakdownChart`

**File:** `src/components/budget/category-breakdown-chart.tsx`

Donut Recharts `PieChart` showing spending distribution across categories for the selected month.

- Segments are only rendered for categories with `value > 0`
- Right-side legend lists each category with its color dot and total amount
- Tooltip shows exact amount in display currency on hover
- Shows an empty state message if there are no expenses

---

### `ExpenseList`

**File:** `src/components/budget/expense-list.tsx`

Scrollable list of expenses for the selected month inside a card.

- **Category filter** dropdown (All or a specific category) at the top
- **"Add" button** in the card header
- Each row shows: color dot, description (or category as fallback), category badge, date, converted amount, recurring badge (with frequency if set), edit and delete icon buttons
- Color-coded category badge uses `CATEGORY_BG_COLORS` tailwind classes

---

### `ExpenseFormDialog`

**File:** `src/components/budget/expense-form-dialog.tsx`

Modal dialog for adding or editing an expense.

| Field                     | Type          | Required | Notes                                                  |
| ------------------------- | ------------- | -------- | ------------------------------------------------------ |
| **Amount**                | Number input  | yes      | Min 0, step 0.01                                       |
| **Currency**              | Select        | no       | Defaults to SAR                                        |
| **Category**              | Select        | yes      | All 12 categories                                      |
| **Description**           | Text input    | no       | "What was this for?"                                   |
| **Date**                  | Date input    | yes      | Defaults to today                                      |
| **Recurring**             | Toggle switch | no       | Reveals frequency selector when on                     |
| **Recurring Frequency**   | Select        | cond.    | Shown only when recurring is on                        |
| **Withdraw from Account** | Select        | no       | Lists active NetWorth accounts; auto-deducts on submit |

---

### `BudgetOverview`

**File:** `src/components/budget/budget-overview.tsx`

Full-width card showing per-category budget utilization for the selected month.

- Builds rows for every budget that exists, plus any category with spending but no budget set
- Rows are sorted by spending (descending)
- Each row includes: color dot, category name, `spent / limit` amounts, edit and delete buttons, and a progress bar
- Progress bar color: green (< 75% used) → amber (75–100%) → red (over budget)
- Over-budget message shows the excess amount in red; under-budget shows remaining amount and percentage used
- Categories with spending but no budget show "No budget set — click edit to set one" and no delete button

---

### `BudgetFormDialog`

**File:** `src/components/budget/budget-form-dialog.tsx`

Modal dialog for setting or editing a monthly category budget.

| Field             | Type         | Required | Notes                                    |
| ----------------- | ------------ | -------- | ---------------------------------------- |
| **Category**      | Select       | yes      | Disabled when editing an existing budget |
| **Monthly Limit** | Number input | yes      | Min 0, step 0.01                         |
| **Currency**      | Select       | no       | Defaults to SAR                          |

Submits as `POST /api/budget/budgets` (upsert) — month and year are injected by the parent.

---

### `PlansList`

**File:** `src/components/budget/plans-list.tsx`

Responsive grid (1 / 2 / 3 columns) of plan cards.

Each card contains:

- **Name** and optional description
- **Priority** and **Status** badges (color-coded)
- **Progress bar** — saved amount as a percentage of estimated cost
- **Saved / total** amounts below the bar (converted to display currency)
- **Monthly savings needed** — computed by `calcMonthlySavingsNeeded()`, shown only when a target date is set
- **Target date** — formatted as "Mon YYYY"
- Edit and delete icon buttons

---

### `PlanFormDialog`

**File:** `src/components/budget/plan-form-dialog.tsx`

Modal dialog for creating or editing a future plan.

| Field              | Type             | Required  | Notes                                               |
| ------------------ | ---------------- | --------- | --------------------------------------------------- |
| **Plan Name**      | Text input       | yes       | Free text                                           |
| **Description**    | Textarea         | no        | 2 rows                                              |
| **Estimated Cost** | Number input     | yes       | Min 0, step 0.01                                    |
| **Currency**       | Select           | no        | Defaults to SAR                                     |
| **Amount Saved**   | Number input     | no        | Defaults to 0                                       |
| **Target Date**    | Date input       | no        | When cleared, sends `undefined`                     |
| **Priority**       | Segmented toggle | no        | High / Medium / Low                                 |
| **Status**         | Select           | edit only | Shown only when editing; Active/Completed/Cancelled |

---

## Features

| Feature                     | Description                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------- |
| Monthly expense tracking    | Log expenses with amount, currency, category, description, and date                    |
| Month navigation            | Browse any past or future month using prev/next arrows                                 |
| Category filtering          | Filter the expense list by any of the 12 categories                                    |
| Recurring expenses          | Mark expenses as recurring with a frequency (Weekly/Monthly/Every 6 Months/Yearly)     |
| NetWorth account withdrawal | Link an expense to a NetWorth account; balance is automatically deducted on creation   |
| Category budgets            | Set a monthly spending limit per category; enforces one budget per category per month  |
| Budget progress bars        | Visual green → amber → red progress bar shows budget utilization in real time          |
| Month-over-month comparison | Total-spent card shows % change vs the previous calendar month                         |
| Category donut chart        | Pie chart visualizes spending distribution across categories for the current month     |
| KPI summary cards           | Total spent, daily average, transaction count, and top-spending category at a glance   |
| Future plans                | Track financial goals with estimated cost, saved amount, priority, status, target date |
| Monthly savings calculator  | Auto-calculates required monthly savings to reach a goal by the target date            |
| Multi-currency support      | Each expense, budget, and plan has its own currency                                    |
| Display currency toggle     | All amounts are converted and displayed in the chosen currency (USD/SAR/EUR)           |
| Live exchange rates         | Fetched from the shared `/api/networth/exchange-rates` endpoint (1-hour cache)         |
| Color-coded categories      | Consistent hex and Tailwind color mappings per category across charts and lists        |

---

## Currency & Exchange Rates

The budget tool reuses the exchange-rate endpoint from the NetWorth tool:

```
GET /api/networth/exchange-rates → { USD: number, SAR: number, EUR: number }
```

Conversion formula (same as NetWorth):

```
convertedAmount = (originalAmount / rates[fromCurrency]) * rates[toCurrency]
```

All rates are relative to USD (`rates.USD = 1`). The same formula is used in `convertAmount()` from `src/lib/budget-types.ts`. If the exchange-rate endpoint fails, the client retains its fallback rates `{ USD: 1, SAR: 3.75, EUR: 0.92 }`.

The expense `POST` handler also applies currency conversion when withdrawing from a NetWorth account, using hardcoded fallback rates (`FALLBACK_RATES`) directly in the route handler to ensure the deduction is correctly denominated even if the external rate API is unavailable.

---

## File Map

```
src/
├── app/
│   ├── budget/
│   │   └── page.tsx                          # Page route (server component)
│   └── api/
│       └── budget/
│           ├── expenses/
│           │   ├── route.ts                   # GET (list by month) / POST (create + withdraw)
│           │   └── [id]/
│           │       └── route.ts               # PUT / DELETE by ID
│           ├── budgets/
│           │   ├── route.ts                   # GET (list by month) / POST (upsert)
│           │   └── [id]/
│           │       └── route.ts               # PUT / DELETE by ID
│           └── plans/
│               ├── route.ts                   # GET (list, optional status filter) / POST (create)
│               └── [id]/
│                   └── route.ts               # GET / PUT / DELETE by ID
├── components/
│   └── budget/
│       ├── budget-client.tsx                  # Main client orchestrator
│       ├── monthly-summary-cards.tsx          # 4 KPI summary cards
│       ├── category-breakdown-chart.tsx       # Donut chart by category
│       ├── expense-list.tsx                   # Scrollable expense list with filter
│       ├── expense-form-dialog.tsx            # Add/edit expense dialog
│       ├── budget-overview.tsx                # Category budget progress bars
│       ├── budget-form-dialog.tsx             # Set/edit category budget dialog
│       ├── plans-list.tsx                     # Responsive plan cards grid
│       └── plan-form-dialog.tsx               # Add/edit future plan dialog
├── lib/
│   └── budget-types.ts                        # TypeScript types, enums, constants, utilities
└── models/
    ├── expense.ts                             # Mongoose Expense model & schema
    ├── category_budget.ts                     # Mongoose CategoryBudget model & schema
    └── future_plan.ts                         # Mongoose FuturePlan model & schema
```
