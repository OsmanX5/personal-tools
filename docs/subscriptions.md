# Subscriptions — Technical Documentation

> **Tool slug:** `subscriptions`
> **Status:** Active
> **Description:** Manage recurring subscriptions, renewal dates, reminders, and budget sync.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [API Reference](#api-reference)
5. [Frontend Components](#frontend-components)
6. [Features](#features)
7. [File Map](#file-map)

---

## Overview

The Subscriptions tool tracks recurring services and memberships in one place. Each subscription stores amount, billing cycle, currency, renewal date, lifecycle status, auto-renew toggle, and reminder lead time, with optional tags for grouping.

This tool includes first-pass integration with Budget Planner. Active subscriptions are synchronized to a recurring expense template in the Budget database category "Subscriptions", so recurring costs appear in monthly budget projections.

---

## Architecture

```text
┌────────────────────────────────────────────────────────┐
│                     Next.js Page                       │
│            src/app/subscriptions/page.tsx              │
│            (Server Component → renders client)         │
└──────────────────────┬─────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────┐
│                SubscriptionsClient                     │
│  src/components/subscriptions/subscriptions-client.tsx │
│  (Client state, filtering, CRUD actions, dialog flow) │
│                                                        │
│  ┌────────────────────┐  ┌──────────────────────────┐  │
│  │SubscriptionsOverview│  │SubscriptionCard          │  │
│  │summary metrics      │  │list/grid item display    │  │
│  └────────────────────┘  └──────────────────────────┘  │
│                                                        │
│         ┌──────────────────────────────────────┐       │
│         │ SubscriptionFormDialog               │       │
│         │ create/edit form                     │       │
│         └──────────────────────────────────────┘       │
└──────────────────────┬─────────────────────────────────┘
                       │ fetch()
┌──────────────────────▼─────────────────────────────────┐
│                    REST API Layer                       │
│              src/app/api/subscriptions/                 │
│                                                        │
│  GET/POST    /api/subscriptions                        │
│  PUT/DELETE  /api/subscriptions/[id]                   │
└──────────────────────┬─────────────────────────────────┘
                       │ Mongoose
┌──────────────────────▼─────────────────────────────────┐
│                    MongoDB                             │
│  Model: src/models/subscription.ts                     │
│  Budget sync helper: src/lib/subscriptions-budget-sync.ts
│  Budget target model: src/models/expense.ts            │
└────────────────────────────────────────────────────────┘
```

---

## Data Model

### Subscription (Mongoose document)

| Field             | Type     | Required | Default     | Description                                                    |
| ----------------- | -------- | -------- | ----------- | -------------------------------------------------------------- |
| `_id`             | ObjectId | auto     | —           | MongoDB document ID.                                           |
| `name`            | String   | yes      | —           | Subscription name, trimmed.                                    |
| `description`     | String   | no       | `""`        | Optional notes, trimmed.                                       |
| `amount`          | Number   | yes      | —           | Recurring charge amount, min `0`.                              |
| `currency`        | Enum     | no       | `"USD"`     | `"USD"` \| `"SAR"` \| `"EUR"`.                                 |
| `billingCycle`    | Enum     | yes      | `"Monthly"` | `"Weekly"` \| `"Monthly"` \| `"Every 6 Months"` \| `"Yearly"`. |
| `nextRenewalDate` | Date     | yes      | —           | Next renewal/charge date.                                      |
| `status`          | Enum     | no       | `"Active"`  | `"Active"` \| `"Paused"` \| `"Cancelled"`.                     |
| `autoRenew`       | Boolean  | no       | `true`      | Whether service auto-renews.                                   |
| `reminderLead`    | Number   | no       | `3`         | Reminder lead count, min `0`.                                  |
| `reminderUnit`    | Enum     | no       | `"days"`    | `"days"` \| `"weeks"`.                                         |
| `tags`            | String[] | no       | `[]`        | Free-form tags, normalized in API.                             |
| `budgetExpenseId` | String   | no       | —           | Linked budget recurring-template expense ID.                   |
| `createdAt`       | Date     | auto     | —           | Mongoose timestamp.                                            |
| `updatedAt`       | Date     | auto     | —           | Mongoose timestamp.                                            |

### Indexes

| Index                               | Purpose                                        |
| ----------------------------------- | ---------------------------------------------- |
| `{ status: 1, nextRenewalDate: 1 }` | Fast status and renewal sorting/filtering.     |
| `{ tags: 1 }`                       | Tag filtering support.                         |
| `{ budgetExpenseId: 1 }`            | Efficient link lookup for budget sync updates. |

---

## API Reference

All endpoints call `dbConnect()` before DB access and return JSON.

### `GET /api/subscriptions`

List all subscriptions sorted by `createdAt` descending.

- **Response:** `200` — `Subscription[]`

### `POST /api/subscriptions`

Create a subscription.

- **Request body:** `SubscriptionFormData`

| Field             | Type                | Required | Description                        |
| ----------------- | ------------------- | -------- | ---------------------------------- |
| `name`            | string              | yes      | Name/title of subscription.        |
| `description`     | string              | no       | Optional notes.                    |
| `amount`          | number              | yes      | Cost per cycle.                    |
| `currency`        | `USD`\|`SAR`\|`EUR` | no       | Currency code.                     |
| `billingCycle`    | enum                | yes      | Charge cadence.                    |
| `nextRenewalDate` | ISO date string     | yes      | Next charge date.                  |
| `status`          | enum                | no       | Active/Paused/Cancelled.           |
| `autoRenew`       | boolean             | no       | Auto-renew flag.                   |
| `reminderLead`    | number              | no       | Reminder offset count.             |
| `reminderUnit`    | `days`\|`weeks`     | no       | Reminder offset unit.              |
| `tags`            | string[]            | no       | Normalized (trim/lowercase/dedup). |

- **Response:** `201` — created `Subscription`
- **Error responses:** Mongoose validation errors bubble as `500` in current global behavior.
- **Special behavior:** If status is `Active`, creates/updates a linked recurring Budget expense template in category `Subscriptions`.

### `PUT /api/subscriptions/[id]`

Update a subscription by ID.

- **Request body:** Partial `SubscriptionFormData`
- **Response:** `200` — updated `Subscription`
- **Error responses:**
  - `404` — `{ "error": "Subscription not found" }`
  - Validation errors follow global route error behavior.
- **Special behavior:** Re-syncs Budget link.
  - `Active`: upsert linked recurring expense template.
  - `Paused` / `Cancelled`: delete linked recurring expense and clear `budgetExpenseId`.

### `DELETE /api/subscriptions/[id]`

Delete a subscription by ID.

- **Response:** `200` — `{ "ok": true }`
- **Error responses:**
  - `404` — `{ "error": "Subscription not found" }`
- **Special behavior:** Deletes linked budget recurring expense if `budgetExpenseId` exists.

### Budget Sync Mapping

Linked recurring expense payload (to `Expense` model in Budget):

| Field                | Value source                                                    |
| -------------------- | --------------------------------------------------------------- |
| `amount`             | `subscription.amount`                                           |
| `currency`           | `subscription.currency`                                         |
| `category`           | fixed `"Subscriptions"`                                         |
| `description`        | `"Subscription: <name> - <description>"` (description optional) |
| `date`               | `subscription.nextRenewalDate`                                  |
| `recurring`          | `true`                                                          |
| `recurringFrequency` | mapped from `billingCycle`                                      |

---

## Frontend Components

### Page: `src/app/subscriptions/page.tsx`

Server component that renders `<SubscriptionsClient />`.

### `SubscriptionsClient`

**File:** `src/components/subscriptions/subscriptions-client.tsx`

Role:

- Main orchestrator for loading data, filtering, and CRUD actions.

Key behaviors:

- Fetches all subscriptions from `GET /api/subscriptions` on mount.
- Handles create/update/delete through API routes.
- Maintains status/cycle/tag filters.
- Opens create/edit dialog with selected record state.

Layout:

- Header with title, count, add button.
- Overview stats cards.
- Three filters (status, billing cycle, tag).
- Responsive card grid for matching subscriptions.

### `SubscriptionFormDialog`

**File:** `src/components/subscriptions/subscription-form-dialog.tsx`

Role:

- Create/edit form modal.

Key behaviors:

- Supports all v1 fields (amount/currency/cycle/date/status/auto-renew/reminder/tags).
- Tags entered as comma-separated string and transformed to array.
- Uses shared select options from type constants.

Props:

- `open`, `onOpenChange`, `onSubmit`, `initialData`, `loading`.

### `SubscriptionCard`

**File:** `src/components/subscriptions/subscription-card.tsx`

Role:

- Displays one subscription with core metadata and actions.

Key behaviors:

- Shows status badge, renewal date, amount + currency, monthly-equivalent estimate.
- Renders tags and auto-renew badge.
- Provides edit and delete actions.

Props:

- `subscription`, `onEdit`, `onDelete`.

### `SubscriptionsOverview`

**File:** `src/components/subscriptions/subscriptions-overview.tsx`

Role:

- Aggregated metrics cards.

Key behaviors:

- Shows total subscriptions.
- Shows active count.
- Shows paused/cancelled combined count.
- Shows monthly-equivalent total across active subscriptions.

Props:

- `subscriptions`.

---

## Features

| Feature                    | Description                                                 |
| -------------------------- | ----------------------------------------------------------- |
| Subscription CRUD          | Add, edit, and delete recurring subscriptions.              |
| Status lifecycle           | Track `Active`, `Paused`, or `Cancelled`.                   |
| Renewal tracking           | Store and display next renewal date.                        |
| Reminder metadata          | Keep reminder lead + unit fields per subscription.          |
| Auto-renew flag            | Track whether each subscription renews automatically.       |
| Tagging                    | Free-form tags with normalization for filtering.            |
| Multi-currency storage     | Each subscription stores its own currency code.             |
| Filtered views             | Filter by status, billing cycle, and tag.                   |
| Monthly-equivalent summary | Convert active subscriptions to a monthly-equivalent total. |
| Budget sync                | Active subscriptions sync to Budget recurring expenses.     |

---

## File Map

```text
src/
├── app/
│   ├── subscriptions/
│   │   └── page.tsx
│   └── api/
│       └── subscriptions/
│           ├── route.ts
│           └── [id]/
│               └── route.ts
├── components/
│   └── subscriptions/
│       ├── subscriptions-client.tsx
│       ├── subscriptions-overview.tsx
│       ├── subscription-card.tsx
│       └── subscription-form-dialog.tsx
├── lib/
│   ├── subscriptions-types.ts
│   └── subscriptions-budget-sync.ts
└── models/
    └── subscription.ts

docs/
└── subscriptions.md
```
