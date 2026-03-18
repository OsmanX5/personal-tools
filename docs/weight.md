# Weight Tracker — Technical Documentation

> **Tool slug:** `weight`
> **Status:** Active
> **Description:** Log weight, track BMI automatically, and set weight goals.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [API Reference](#api-reference)
5. [Frontend Components](#frontend-components)
6. [Features](#features)
7. [BMI Calculation](#bmi-calculation)
8. [File Map](#file-map)

---

## Overview

The Weight Tracker tool allows users to log weight entries over time, automatically compute BMI from a stored height, and set weight goals with progress tracking. Each entry records a weight, date, optional note, and a calculated BMI value. Goals track a start weight, target weight, optional target date, and a status lifecycle (Active → Achieved / Abandoned). A line chart visualises recent entries against the active goal weight.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                     Next.js Page                       │
│              src/app/weight/page.tsx                   │
│            (Server Component → renders client)         │
└──────────────────────┬─────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────┐
│                   WeightClient                         │
│         src/components/weight/weight-client.tsx        │
│    (Client Component — manages all state & API calls)  │
│                                                        │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Stats Cards    │  │  WeightChart                │  │
│  │  (4-up grid)    │  │  (line chart, 7D / 30D)     │  │
│  └─────────────────┘  └─────────────────────────────┘  │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  WeightGoalCard list  (goals section)           │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  WeightEntryCard list  (weight log section)     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌──────────────────────┐  ┌────────────────────────┐  │
│  │ WeightEntryFormDialog│  │ WeightGoalFormDialog   │  │
│  │ (log / edit entry)   │  │ (create / edit goal)   │  │
│  └──────────────────────┘  └────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │ fetch()
┌──────────────────────▼─────────────────────────────────┐
│                    REST API Layer                       │
│               src/app/api/weight/                      │
│                                                        │
│   GET/POST    /api/weight                              │
│   PUT/DELETE  /api/weight/[id]                         │
│   GET/POST    /api/weight/goals                        │
│   PUT/DELETE  /api/weight/goals/[id]                   │
│   GET/PUT     /api/settings          (shared route)    │
└──────────────────────┬─────────────────────────────────┘
                       │ Mongoose
┌──────────────────────▼─────────────────────────────────┐
│                    MongoDB                             │
│   Collection: weightentries  → Model: weight_entry.ts  │
│   Collection: weightgoals    → Model: weight_goal.ts   │
│   Collection: usersettings   → Model: user_settings.ts │
└────────────────────────────────────────────────────────┘
```

---

## Data Model

### WeightEntry (Mongoose document)

| Field       | Type     | Required | Default    | Description                                           |
| ----------- | -------- | -------- | ---------- | ----------------------------------------------------- |
| `_id`       | ObjectId | auto     | —          | MongoDB document ID                                   |
| `weight`    | Number   | yes      | —          | Weight in kilograms (must be > 0)                     |
| `bmi`       | Number   | no       | —          | Computed from weight + stored height; set server-side |
| `date`      | Date     | no       | `Date.now` | Date of the measurement                               |
| `note`      | String   | no       | —          | Optional free-text note (trimmed)                     |
| `createdAt` | Date     | auto     | —          | Mongoose timestamp                                    |
| `updatedAt` | Date     | auto     | —          | Mongoose timestamp                                    |

### WeightGoal (Mongoose document)

| Field          | Type     | Required | Default    | Description                                 |
| -------------- | -------- | -------- | ---------- | ------------------------------------------- |
| `_id`          | ObjectId | auto     | —          | MongoDB document ID                         |
| `targetWeight` | Number   | yes      | —          | Desired weight in kg (must be > 0)          |
| `startWeight`  | Number   | yes      | —          | Starting weight in kg (must be > 0)         |
| `targetDate`   | Date     | no       | —          | Optional deadline                           |
| `status`       | Enum     | no       | `"Active"` | `"Active"` \| `"Achieved"` \| `"Abandoned"` |
| `createdAt`    | Date     | auto     | —          | Mongoose timestamp                          |
| `updatedAt`    | Date     | auto     | —          | Mongoose timestamp                          |

### UserSettings (Mongoose document — shared)

| Field    | Type   | Required | Default | Description                                               |
| -------- | ------ | -------- | ------- | --------------------------------------------------------- |
| `height` | Number | no       | `null`  | User's height in cm; used for server-side BMI calculation |

### Enums

```typescript
type GoalStatus = "Active" | "Achieved" | "Abandoned";

type BmiCategory = "Underweight" | "Normal" | "Overweight" | "Obese";
```

---

## API Reference

All endpoints call `dbConnect()` before any database access.

### `GET /api/weight`

List all weight entries, sorted by `date` descending.

- **Response:** `200` — `WeightEntry[]`

### `POST /api/weight`

Create a new weight entry. If a `UserSettings` document with a `height` exists, the server computes and stores `bmi` automatically.

- **Body:**

| Field    | Type   | Required | Description             |
| -------- | ------ | -------- | ----------------------- |
| `weight` | Number | yes      | Weight in kg            |
| `date`   | String | yes      | ISO date string         |
| `note`   | String | no       | Optional free-text note |

- **Side effect:** sets `body.bmi = round((weight / heightM²) * 100) / 100` when height is available.
- **Response:** `201` — created `WeightEntry`

### `PUT /api/weight/[id]`

Update a weight entry by ID. Re-computes BMI server-side if `weight` is present in the body and `height` is set in `UserSettings`.

- **Body:** Any subset of `WeightEntry` fields (weight, date, note).
- **Response:** `200` — updated `WeightEntry`
- **Error:** `404` — `{ error: "Entry not found" }`

### `DELETE /api/weight/[id]`

Delete a weight entry permanently.

- **Response:** `200` — `{ ok: true }`
- **Error:** `404` — `{ error: "Entry not found" }`

### `GET /api/weight/goals`

List all weight goals, sorted by `createdAt` descending.

- **Response:** `200` — `WeightGoal[]`

### `POST /api/weight/goals`

Create a new weight goal.

- **Body:**

| Field          | Type   | Required | Description                       |
| -------------- | ------ | -------- | --------------------------------- |
| `targetWeight` | Number | yes      | Target weight in kg               |
| `startWeight`  | Number | yes      | Starting weight in kg             |
| `targetDate`   | String | no       | Optional ISO date string deadline |
| `status`       | String | no       | Defaults to `"Active"`            |

- **Response:** `201` — created `WeightGoal`

### `PUT /api/weight/goals/[id]`

Update a goal by ID. Used for edits and status transitions (Achieved / Abandoned).

- **Body:** Any subset of `WeightGoal` fields (targetWeight, startWeight, targetDate, status).
- **Response:** `200` — updated `WeightGoal`
- **Error:** `404` — `{ error: "Goal not found" }`

### `DELETE /api/weight/goals/[id]`

Delete a goal permanently.

- **Response:** `200` — `{ ok: true }`
- **Error:** `404` — `{ error: "Goal not found" }`

### `GET /api/settings` / `PUT /api/settings` _(shared route)_

Read or update the single `UserSettings` document. The weight tool uses it to persist the user's height and to trigger BMI recalculation on all entries when height changes.

---

## Frontend Components

### Page: `src/app/weight/page.tsx`

Server component that renders `<WeightClient />` directly.

---

### `WeightClient` — Main orchestrator

**File:** `src/components/weight/weight-client.tsx`

Central client component that:

- Fetches entries (`GET /api/weight`), goals (`GET /api/weight/goals`), and settings (`GET /api/settings`) in parallel on mount.
- Manages all UI state: entry/goal dialog open states, editing targets, height inline-edit state.
- Computes derived values:
  - `latestEntry` — the most recent entry (index 0, since list is sorted descending).
  - `activeGoal` — first goal with `status === "Active"`.
- Provides CRUD callbacks for entries and goals, updating local state optimistically after API success.
- On height save, re-fetches entries to pick up recalculated BMI values from the server.

**Layout (single-column, stacked):**

| Section            | Content                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| Header             | Title + entry count; "Set Goal" and "Log Weight" action buttons                                 |
| Stats Cards (4-up) | Current Weight · Height (inline editable) · Body Mass Index (with category badge) · Active Goal |
| Weight Trend Chart | `<WeightChart>` with 7D / 30D range toggle and goal reference line                              |
| Goals section      | List of `<WeightGoalCard>` components (only rendered when goals exist)                          |
| Weight Log section | List of `<WeightEntryCard>` components; empty-state illustration when no entries                |
| Dialogs            | `<WeightEntryFormDialog>` and `<WeightGoalFormDialog>` (mounted always, controlled by state)    |

---

### `WeightChart`

**File:** `src/components/weight/weight-chart.tsx`

Line chart showing weight over a recent time window.

**Props:**

| Prop         | Type            | Description                                              |
| ------------ | --------------- | -------------------------------------------------------- |
| `entries`    | `WeightEntry[]` | All entries; filtered client-side by selected range      |
| `goalWeight` | `number?`       | Active goal weight — rendered as a dashed reference line |

**Behaviors:**

- Toggle between **7D** and **30D** range via button group.
- Filters and sorts entries within the selected range client-side using `useMemo`.
- Y-axis domain auto-pads ±15% around the data range (including `goalWeight` if set, minimum padding 1).
- Tooltip shows weight in kg; dashed `ReferenceLine` labelled `"Goal: X kg"` when `goalWeight` is provided.
- Empty state shows a message when no entries fall within the selected range.

---

### `WeightEntryCard`

**File:** `src/components/weight/weight-entry-card.tsx`

Compact card for displaying a single logged weight entry.

**Props:**

| Prop       | Type                           | Description                      |
| ---------- | ------------------------------ | -------------------------------- |
| `entry`    | `WeightEntry`                  | The entry to display             |
| `onEdit`   | `(entry: WeightEntry) => void` | Callback to open the edit dialog |
| `onDelete` | `(id: string) => void`         | Callback to delete the entry     |

**Renders:** Weight (kg) + formatted date on the left; BMI value and category badge + edit/delete icon buttons on the right. Optional note rendered below with a sticky-note icon.

---

### `WeightEntryFormDialog`

**File:** `src/components/weight/weight-entry-form-dialog.tsx`

Modal dialog for creating or editing a weight entry.

**Props:**

| Prop           | Type                                  | Description                         |
| -------------- | ------------------------------------- | ----------------------------------- |
| `open`         | `boolean`                             | Controls dialog visibility          |
| `onOpenChange` | `(open: boolean) => void`             | Dialog open state callback          |
| `onSubmit`     | `(data: WeightEntryFormData) => void` | Called with form data on submit     |
| `initialData`  | `WeightEntry \| null`                 | Pre-fills fields when editing       |
| `userHeight`   | `number \| null`                      | Used for live BMI preview           |
| `loading`      | `boolean?`                            | Disables submit button while saving |

**Fields:**

- **Weight (kg)** — required number input (step 0.1, min 1).
- **Live BMI preview** — badge showing computed BMI and category, visible if `userHeight` is set (client-side, using `calculateBmi()`).
- **Date** — required date input, defaults to today.
- **Note** — optional textarea.

---

### `WeightGoalCard`

**File:** `src/components/weight/weight-goal-card.tsx`

Card for displaying a single weight goal with progress tracking.

**Props:**

| Prop              | Type                         | Description                                  |
| ----------------- | ---------------------------- | -------------------------------------------- |
| `goal`            | `WeightGoal`                 | The goal to display                          |
| `currentWeight`   | `number?`                    | Latest entry weight for progress calculation |
| `onEdit`          | `(goal: WeightGoal) => void` | Callback to open the edit dialog             |
| `onDelete`        | `(id: string) => void`       | Callback to delete the goal                  |
| `onMarkAchieved`  | `(id: string) => void`       | Callback to transition status to Achieved    |
| `onMarkAbandoned` | `(id: string) => void`       | Callback to transition status to Abandoned   |

**Renders:**

- Target weight, start weight, and status badge.
- **Progress bar** (active goals only): calculates `progressPercent = min(100, |startWeight - currentWeight| / |startWeight - targetWeight| * 100)`. Progress is clamped to 0 if the user is moving in the wrong direction.
- Optional target date with calendar icon.
- Achieved (✓) and Abandon (✗) quick-action buttons for active goals; edit and delete buttons always visible.

---

### `WeightGoalFormDialog`

**File:** `src/components/weight/weight-goal-form-dialog.tsx`

Modal dialog for creating or editing a weight goal.

**Props:**

| Prop            | Type                                 | Description                          |
| --------------- | ------------------------------------ | ------------------------------------ |
| `open`          | `boolean`                            | Controls dialog visibility           |
| `onOpenChange`  | `(open: boolean) => void`            | Dialog open state callback           |
| `onSubmit`      | `(data: WeightGoalFormData) => void` | Called with form data on submit      |
| `initialData`   | `WeightGoal \| null`                 | Pre-fills fields when editing        |
| `currentWeight` | `number?`                            | Pre-fills start weight when creating |
| `loading`       | `boolean?`                           | Disables submit button while saving  |

**Fields:**

- **Start Weight (kg)** — required; pre-filled with `currentWeight` when creating.
- **Target Weight (kg)** — required.
- **Target Date** — optional date input.
- **Status** — select dropdown (Active / Achieved / Abandoned); only shown when editing an existing goal.

---

## Features

| Feature                     | Description                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------- |
| Weight logging              | Record weight in kg with a date and optional note                                     |
| Automatic BMI calculation   | BMI computed server-side on create/update using the stored height                     |
| BMI category classification | Entries and form previews display a colour-coded category badge (Underweight → Obese) |
| Live BMI preview            | Entry form shows real-time BMI and category before submitting                         |
| Inline height editing       | Height can be updated directly on the stats card without opening a dialog             |
| BMI recalculation on height | Updating height triggers a re-fetch of all entries to reflect the new BMI values      |
| Weight trend chart          | Line chart over the last 7 or 30 days with a dashed goal reference line               |
| Weight goals                | Set a target weight with a start weight, optional deadline, and status lifecycle      |
| Goal progress bar           | Visual progress toward goal based on current vs. start weight, direction-aware        |
| Goal status transitions     | One-click buttons to mark a goal as Achieved or Abandoned directly from the card      |
| Full CRUD for entries/goals | Create, read, update, and delete both entries and goals                               |

---

## BMI Calculation

BMI is computed on the server during `POST /api/weight` and `PUT /api/weight/[id]` using the user's stored height:

$$
\text{BMI} = \frac{\text{weight (kg)}}{\text{height (m)}^2}
$$

In code:

```typescript
const heightM = settings.height / 100;
body.bmi = Math.round((body.weight / (heightM * heightM)) * 100) / 100;
```

The client also computes a preview BMI in the entry form dialog using the same formula via `calculateBmi()` from `weight-types.ts`.

BMI category thresholds:

| Range           | Category    |
| --------------- | ----------- |
| BMI < 18.5      | Underweight |
| 18.5 ≤ BMI < 25 | Normal      |
| 25 ≤ BMI < 30   | Overweight  |
| BMI ≥ 30        | Obese       |

---

## File Map

```
src/
├── app/
│   ├── weight/
│   │   └── page.tsx                              # Page route (server component)
│   └── api/
│       ├── weight/
│       │   ├── route.ts                           # GET (list) / POST (create entry)
│       │   ├── [id]/
│       │   │   └── route.ts                       # PUT / DELETE entry by ID
│       │   └── goals/
│       │       ├── route.ts                       # GET (list) / POST (create goal)
│       │       └── [id]/
│       │           └── route.ts                   # PUT / DELETE goal by ID
│       └── settings/
│           └── route.ts                           # GET / PUT user settings (shared)
├── components/
│   └── weight/
│       ├── weight-client.tsx                      # Main orchestrator client component
│       ├── weight-chart.tsx                       # Line chart (7D / 30D trend)
│       ├── weight-entry-card.tsx                  # Single entry display card
│       ├── weight-entry-form-dialog.tsx           # Create / edit entry dialog
│       ├── weight-goal-card.tsx                   # Single goal display card with progress
│       └── weight-goal-form-dialog.tsx            # Create / edit goal dialog
├── lib/
│   └── weight-types.ts                            # TypeScript types, enums, BMI helpers
└── models/
    ├── weight_entry.ts                            # Mongoose model — WeightEntry
    ├── weight_goal.ts                             # Mongoose model — WeightGoal
    └── user_settings.ts                           # Mongoose model — UserSettings (shared)
```
