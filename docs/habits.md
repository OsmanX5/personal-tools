# Habits Tracker — Technical Documentation

> **Tool slug:** `habits`
> **Status:** Active
> **Description:** Build daily routines, track streaks, and log quantitative habits.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [API Reference](#api-reference)
5. [Frontend Components](#frontend-components)
6. [Features](#features)
7. [Streak Calculation](#streak-calculation)
8. [File Map](#file-map)

---

## Overview

The Habits Tracker tool allows users to create and manage personal habits with flexible scheduling (daily, weekly, bi-weekly, monthly, or a custom N-day interval). Each habit can optionally track a numeric value (e.g. "8 glasses of water") alongside a target and unit. Completing a habit each period is recorded as a `HabitLog` document. The tool computes current and longest streaks per habit client-side, renders a 60-day heatmap on every card, and shows a summary overview of daily completion across all habits.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                     Next.js Page                       │
│              src/app/habits/page.tsx                   │
│            (Server Component → renders client)         │
└──────────────────────┬─────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────┐
│                   HabitsClient                         │
│         src/components/habits/habits-client.tsx        │
│    (Client Component — manages all state & API calls)  │
│                                                        │
│  ┌─────────────────┐  ┌────────────────────────────┐   │
│  │  HabitsOverview │  │  HabitCard (grid, 1–3 cols) │  │
│  │  (summary stats)│  │  (per-habit card + heatmap) │  │
│  └─────────────────┘  └────────────────────────────┘   │
│                                                        │
│  ┌──────────────────────┐  ┌────────────────────────┐  │
│  │  HabitFormDialog     │  │  HabitLogDialog        │  │
│  │  (create/edit habit) │  │  (log value + note)    │  │
│  └──────────────────────┘  └────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │ fetch()
┌──────────────────────▼─────────────────────────────────┐
│                    REST API Layer                       │
│               src/app/api/habits/                      │
│                                                        │
│   GET / POST       /api/habits                         │
│   PUT / DELETE     /api/habits/[id]                    │
│   GET / POST       /api/habits/logs                    │
│   DELETE           /api/habits/logs/[id]               │
└──────────────────────┬─────────────────────────────────┘
                       │ Mongoose
┌──────────────────────▼─────────────────────────────────┐
│                    MongoDB                             │
│   Collections: habits  /  habitlogs                   │
│   Models: src/models/habit.ts                         │
│           src/models/habit_log.ts                     │
└────────────────────────────────────────────────────────┘
```

---

## Data Model

### Habit (Mongoose document)

| Field               | Type     | Required | Default     | Description                                                           |
| ------------------- | -------- | -------- | ----------- | --------------------------------------------------------------------- |
| `_id`               | ObjectId | auto     | —           | MongoDB document ID                                                   |
| `name`              | String   | yes      | —           | Habit display name (trimmed)                                          |
| `description`       | String   | no       | —           | Optional description (trimmed)                                        |
| `color`             | String   | yes      | `"#3b82f6"` | Hex color used for heatmap and color dot                              |
| `category`          | String   | no       | —           | Optional grouping label (trimmed)                                     |
| `frequency`         | Enum     | yes      | `"daily"`   | Scheduling frequency (see enum below)                                 |
| `frequencyInterval` | Number   | no       | —           | Used when `frequency === "custom"`: repeat every N days (min 1)       |
| `hasValue`          | Boolean  | no       | `false`     | Whether this habit tracks a numeric quantity                          |
| `targetValue`       | Number   | no       | —           | Goal value for quantitative habits (min 0)                            |
| `unit`              | String   | no       | —           | Unit label displayed next to the logged value (trimmed)               |
| `isActive`          | Boolean  | no       | `true`      | Soft-delete flag; inactive habits are excluded from `GET /api/habits` |
| `createdAt`         | Date     | auto     | —           | Mongoose timestamp                                                    |
| `updatedAt`         | Date     | auto     | —           | Mongoose timestamp                                                    |

### HabitLog (Mongoose document)

| Field       | Type     | Required | Description                                                   |
| ----------- | -------- | -------- | ------------------------------------------------------------- |
| `_id`       | ObjectId | auto     | MongoDB document ID                                           |
| `habitId`   | ObjectId | yes      | Reference to the parent `Habit` document (indexed)            |
| `date`      | Date     | yes      | Midnight UTC of the logged day (indexed; normalised on write) |
| `value`     | Number   | no       | Recorded quantity for quantitative habits                     |
| `note`      | String   | no       | Optional free-text note (trimmed)                             |
| `createdAt` | Date     | auto     | Mongoose timestamp                                            |
| `updatedAt` | Date     | auto     | Mongoose timestamp                                            |

A compound index `{ habitId: 1, date: 1 }` speeds up per-habit date queries. One log per habit per day is enforced at the application level.

### Enums (defined in `habit-types.ts`)

```typescript
type HabitFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "custom";

// Period lengths used in streak calculation:
// daily    → 1 day
// weekly   → 7 days
// biweekly → 14 days
// monthly  → 30 days
// custom   → frequencyInterval days
```

### Color Palette

Ten preset hex colors are available (`HABIT_COLORS`):

```typescript
const HABIT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#64748b", // slate
  "#84cc16", // lime
];
```

### Preset Categories

Ten preset categories are offered in `HabitFormDialog` (with a "Custom…" option for free-form input):

`Health`, `Fitness`, `Religion`, `Career`, `Learning`, `Finance`, `Social`, `Creativity`, `Mindfulness`, `Productivity`

---

## API Reference

All endpoints live under `/api/habits/`. Every handler calls `dbConnect()` before database access.

### `GET /api/habits`

List all **active** habits sorted by `createdAt` ascending.

- **Response:** `200` — `Habit[]`

### `POST /api/habits`

Create a new habit.

- **Body:** `HabitFormData` (name, description, color, category, frequency, frequencyInterval, hasValue, targetValue, unit, isActive)
- **Response:** `201` — created `Habit`

### `PUT /api/habits/[id]`

Update an existing habit. Runs Mongoose validators.

- **Body:** Partial `HabitFormData`
- **Response:** `200` — updated `Habit`
- **Error:** `404` — `{ error: "Habit not found" }`

### `DELETE /api/habits/[id]`

Delete a habit and cascade-delete all of its logs.

- **Response:** `200` — `{ ok: true }`
- **Error:** `404` — `{ error: "Habit not found" }`
- **Side effect:** Calls `HabitLog.deleteMany({ habitId: id })`

### `GET /api/habits/logs`

Fetch habit logs with optional filters via query parameters.

| Query Param | Type   | Description                                 |
| ----------- | ------ | ------------------------------------------- |
| `habitId`   | String | Filter logs to a single habit               |
| `from`      | String | ISO date string — include logs on or after  |
| `to`        | String | ISO date string — include logs on or before |

- **Response:** `200` — `HabitLog[]` sorted by `date` descending

### `POST /api/habits/logs`

Create a new log entry. The `date` field is automatically normalised to midnight UTC before saving.

| Body Field | Type   | Required | Description                            |
| ---------- | ------ | -------- | -------------------------------------- |
| `habitId`  | String | yes      | ID of the habit being logged           |
| `date`     | String | yes      | ISO date string for the day to log     |
| `value`    | Number | no       | Recorded value for quantitative habits |
| `note`     | String | no       | Optional note                          |

- **Response:** `201` — created `HabitLog`

### `DELETE /api/habits/logs/[id]`

Delete a single log entry (un-log a habit for a given day).

- **Response:** `200` — `{ ok: true }`
- **Error:** `404` — `{ error: "Log not found" }`

---

## Frontend Components

### Page: `src/app/habits/page.tsx`

Server component that renders `<HabitsClient />` directly with no additional props.

### `HabitsClient` — Main orchestrator

**File:** `src/components/habits/habits-client.tsx`

Central client component that:

- Fetches all active habits (`GET /api/habits`) and the last 60 days of logs (`GET /api/habits/logs?from=...`) in parallel on mount
- Enriches raw habits into `HabitWithStats` objects (streaks, `todayLog`, `recentLogs`) via the `enrichHabits` helper
- Manages all UI state: habit form dialog, log dialog, saving flag, loading state
- Handles CRUD for habits (create, update, delete) and logs (submit, unlog)

**Layout (vertical, full-height):**

| Section           | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| Page header       | Title, date subtitle, "New Habit" button                   |
| `HabitsOverview`  | 3-column summary stats strip                               |
| Habit card grid   | Responsive 1 → 2 → 3 column grid of `HabitCard`s           |
| `HabitFormDialog` | Mounted at root level, opened for create or edit           |
| `HabitLogDialog`  | Mounted at root level, opened only for quantitative habits |

**Check-off logic:**

- Boolean habits are checked off instantly (no dialog) via `POST /api/habits/logs`
- Quantitative habits open `HabitLogDialog` for value + optional note entry

### `HabitsOverview`

**File:** `src/components/habits/habits-overview.tsx`

**Props:** `{ habits: HabitWithStats[] }`

Renders a 3-column card row with aggregate stats:

| Stat             | Calculation                               |
| ---------------- | ----------------------------------------- |
| Active habits    | `habits.length`                           |
| Done today       | Count of habits where `todayLog` is set   |
| Best streak ever | `Math.max` over all `habit.longestStreak` |

### `HabitCard`

**File:** `src/components/habits/habit-card.tsx`

**Props:** `{ habit, today, onCheckOff, onUnlog, onEdit, onDelete }`

Per-habit card that displays:

- **Color dot** — filled circle using `habit.color`
- **Name + description** — truncated with tooltip
- **Badges** — category (secondary), frequency (outline), target value/unit (outline, if quantitative)
- **Streak display** — current streak with flame icon, best streak label
- **Today's value** — shown only when `habit.hasValue && habit.todayLog`
- **60-day heatmap** — grid of 60 `2.5×2.5` squares; colored with `habit.color` if logged, muted otherwise; built by `buildHeatmap()` working backward from today
- **Check-off button** — green "Done" state if `todayLog` exists (clicking un-logs); primary "Mark done" / "Log value…" if not

A two-step delete confirmation is shown inline (Delete + Cancel buttons) before `onDelete` is called.

### `HabitFormDialog`

**File:** `src/components/habits/habit-form-dialog.tsx`

**Props:** `{ open, onOpenChange, onSubmit, initialData?, loading? }`

Modal dialog (max-width `lg`) for creating or editing a habit. Fields:

| Field               | Input type                       | Notes                                              |
| ------------------- | -------------------------------- | -------------------------------------------------- |
| Name                | Required text input              |                                                    |
| Description         | Optional textarea (2 rows)       |                                                    |
| Category            | Select (preset list + "Custom…") | Custom option reveals a free-text input            |
| Color               | Clickable color-swatch palette   | 10 preset colors; selected color gets ring outline |
| Frequency           | Select dropdown                  | Choosing "Custom" reveals the interval field       |
| Frequency interval  | Number input                     | Visible only when `frequency === "custom"`         |
| Quantitative toggle | Checkbox / boolean toggle        | Reveals target value and unit fields when enabled  |
| Target value        | Number input                     | Visible only when `hasValue === true`              |
| Unit                | Text input                       | Visible only when `hasValue === true`              |

The form title changes between "New Habit" (create) and "Edit Habit" (edit) based on whether `initialData` is provided.

### `HabitLogDialog`

**File:** `src/components/habits/habit-log-dialog.tsx`

**Props:** `{ open, onOpenChange, habit, existingLog?, date, onSubmit, loading? }`

Compact modal (max-width `sm`) used exclusively for quantitative habits. Fields:

| Field | Input type                 | Notes                                       |
| ----- | -------------------------- | ------------------------------------------- |
| Value | Number input               | Displays unit and target as hints; required |
| Note  | Optional textarea (2 rows) |                                             |

When `existingLog` is provided the title reads "Edit Log — \<habit name\>"; otherwise "Log — \<habit name\>". The submit button label toggles between "Log" and "Update" accordingly.

---

## Features

| Feature                  | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| Multiple frequencies     | Daily, weekly, bi-weekly, monthly, or custom N-day interval                  |
| Quantitative habits      | Optional numeric value logging with target and unit                          |
| Boolean check-off        | One-click instant logging for non-quantitative habits                        |
| Current streak           | Consecutive completed periods ending today or yesterday                      |
| Longest streak           | All-time best consecutive-period count                                       |
| 60-day heatmap           | Visual grid of the last 60 days, colored per habit's chosen color            |
| Today's completion badge | Distinct green check button when a habit is already logged for today         |
| Un-log                   | Undo today's log by clicking the done button again                           |
| Overview summary         | Aggregate stats: total active habits, done-today count, all-time best streak |
| Category grouping        | Optional label from preset list or custom free-form input                    |
| Color-coded cards        | 10-color palette; each habit independently styled                            |
| Cascade delete           | Deleting a habit also removes all its log entries                            |
| Date normalisation       | Log dates are always stored as midnight UTC, preventing timezone drift       |
| Parallel data fetch      | Habits and logs are fetched in parallel on mount to minimize load time       |

---

## Streak Calculation

Streak logic lives in `src/lib/habit-types.ts` and runs entirely client-side using the enriched `HabitWithStats` objects.

### Period length

Every frequency maps to a number of days:

```
daily    → 1
weekly   → 7
biweekly → 14
monthly  → 30
custom   → max(1, frequencyInterval)
```

### Current streak (`calculateCurrentStreak`)

1. Deduplicate log dates (multiple logs on the same day count once) and sort ascending.
2. Starting from today, walk backward in `period`-sized windows.
3. For each window: if a log falls within it, increment the streak counter and advance the window back by one period.
4. Stop as soon as a gap ≥ 1 period is found.

### Longest streak (`calculateLongestStreak`)

1. Same deduplication and sort as above.
2. Walk the sorted log days forward; if the gap between consecutive days is ≤ `period`, extend the current run.
3. Track the maximum run length seen.

---

## File Map

```
src/
├── app/
│   ├── habits/
│   │   └── page.tsx                          # Page route (server component)
│   └── api/
│       └── habits/
│           ├── route.ts                      # GET (list active) / POST (create)
│           ├── [id]/
│           │   └── route.ts                  # PUT (update) / DELETE (delete + cascade)
│           └── logs/
│               ├── route.ts                  # GET (filtered list) / POST (create log)
│               └── [id]/
│                   └── route.ts              # DELETE (remove single log)
├── components/
│   └── habits/
│       ├── habits-client.tsx                 # Main client orchestrator
│       ├── habits-overview.tsx               # 3-stat summary strip
│       ├── habit-card.tsx                    # Per-habit card with heatmap
│       ├── habit-form-dialog.tsx             # Create / edit habit dialog
│       └── habit-log-dialog.tsx              # Log value + note dialog
├── lib/
│   └── habit-types.ts                        # Types, enums, streak helpers
└── models/
    ├── habit.ts                              # Mongoose Habit schema & model
    └── habit_log.ts                          # Mongoose HabitLog schema & model
```
