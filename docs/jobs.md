# Job Applications — Technical Documentation

> **Tool slug:** `jobs`
> **Status:** Active
> **Description:** Track job applications, statuses, and follow-ups in one place.

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

The Job Applications tool allows users to manage their job search pipeline using a Kanban-style board. Each job application is represented as a card that moves through five status columns: Interested → Applied → In-Process → Rejected → Offered. Applications can be filtered by country and position type. The tool also includes a Quick Links bar for pinning frequently visited job-search URLs (e.g. LinkedIn, Indeed) to the top of the page.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                     Next.js Page                       │
│               src/app/jobs/page.tsx                    │
│            (Server Component → renders client)         │
└──────────────────────┬─────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────┐
│                   JobsClient                           │
│          src/components/jobs/jobs-client.tsx           │
│    (Client Component — manages all state & API calls)  │
│                                                        │
│  ┌────────────────┐  ┌─────────────────────────────┐   │
│  │  QuickLinksBar │  │       KanbanBoard            │   │
│  │ (bookmark bar) │  │  (5 status columns,          │   │
│  └────────────────┘  │   drag-and-drop cards)       │   │
│                      │                              │   │
│                      │   ┌─────────────────────┐   │   │
│                      │   │  JobCardComponent   │   │   │
│                      │   │  (expandable card)  │   │   │
│                      │   └─────────────────────┘   │   │
│                      └─────────────────────────────┘   │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │               JobFormDialog                      │  │
│  │          (create / edit application)             │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │ fetch()
┌──────────────────────▼─────────────────────────────────┐
│                    REST API Layer                       │
│               src/app/api/jobs/                        │
│                                                        │
│   GET / POST    /api/jobs                              │
│   PUT / DELETE  /api/jobs/[id]                         │
│                                                        │
│               src/app/api/quick-links/                 │
│   GET / POST    /api/quick-links                       │
│   DELETE        /api/quick-links/[id]                  │
└──────────────────────┬─────────────────────────────────┘
                       │ Mongoose
┌──────────────────────▼─────────────────────────────────┐
│                    MongoDB                             │
│   Collection: jobs        Model: src/models/job.ts     │
│   Collection: quicklinks  Model: src/models/quick_link.ts │
└────────────────────────────────────────────────────────┘
```

---

## Data Model

### Job (Mongoose document)

| Field               | Type     | Required | Default        | Description                                           |
| ------------------- | -------- | -------- | -------------- | ----------------------------------------------------- |
| `_id`               | ObjectId | auto     | —              | MongoDB document ID                                   |
| `company`           | String   | yes      | —              | Company name (trimmed)                                |
| `position`          | String   | yes      | —              | Job title / role (trimmed)                            |
| `country`           | String   | yes      | —              | Country of the role (trimmed)                         |
| `workStyle`         | Enum     | yes      | —              | `"Remote"` \| `"On-site"` \| `"Hybrid"`               |
| `expectedSalary`    | Number   | no       | `null`         | Expected annual salary in USD, or null if unspecified |
| `fitPercentage`     | Number   | yes      | —              | Self-assessed fit score from 1–10                     |
| `level`             | Enum     | yes      | —              | `"Junior"` \| `"Mid"` \| `"Senior"` \| `"Lead"`       |
| `status`            | Enum     | no       | `"Interested"` | Pipeline stage (see `JobStatus` enum)                 |
| `applicationMethod` | Enum     | yes      | —              | Channel used to apply (see `ApplicationMethod` enum)  |
| `resumeId`          | String   | no       | `""`           | Identifier for the resume version used                |
| `applicationLink`   | String   | no       | `""`           | Direct link to the job posting                        |
| `companyLink`       | String   | no       | `""`           | Link to the company website                           |
| `createdAt`         | Date     | auto     | —              | Mongoose timestamp                                    |
| `updatedAt`         | Date     | auto     | —              | Mongoose timestamp                                    |

### QuickLink (Mongoose document)

| Field       | Type     | Required | Description              |
| ----------- | -------- | -------- | ------------------------ |
| `_id`       | ObjectId | auto     | MongoDB document ID      |
| `url`       | String   | yes      | Bookmarked URL (trimmed) |
| `createdAt` | Date     | auto     | Mongoose timestamp       |
| `updatedAt` | Date     | auto     | Mongoose timestamp       |

### Enums

```typescript
type JobStatus =
  | "Interested"
  | "Applied"
  | "In-Process"
  | "Rejected"
  | "Offered";

type WorkStyle = "Remote" | "On-site" | "Hybrid";

type JobLevel = "Junior" | "Mid" | "Senior" | "Lead";

type ApplicationMethod =
  | "Company Website"
  | "LinkedIn"
  | "Indeed"
  | "Glassdoor"
  | "Referral"
  | "Other";
```

### Constant Color Maps (UI only)

```typescript
// Card background + border color per status
STATUS_COLORS: Record<JobStatus, string>;

// Column header background color per status
STATUS_HEADER_COLORS: Record<JobStatus, string>;
```

---

## API Reference

All endpoints call `dbConnect()` before database access and return JSON.

### `GET /api/jobs`

List all job applications sorted by `createdAt` descending.

- **Response:** `200` — `Job[]`

### `POST /api/jobs`

Create a new job application.

- **Body:** `JobCardFormData` (all fields except `_id`, `createdAt`, `updatedAt`)
- **Response:** `201` — created `Job`

### `PUT /api/jobs/[id]`

Update a job application. Runs Mongoose validators. Supports partial updates (e.g. updating only `status` for drag-and-drop moves).

- **Body:** Partial `JobCardFormData`
- **Response:** `200` — updated `Job`
- **Error:** `404` — `{ error: "Job not found" }`

### `DELETE /api/jobs/[id]`

Permanently delete a job application.

- **Response:** `200` — `{ ok: true }`
- **Error:** `404` — `{ error: "Job not found" }`

### `GET /api/quick-links`

List all saved quick links.

- **Response:** `200` — `QuickLink[]`

### `POST /api/quick-links`

Save a new quick link bookmark.

- **Body:** `{ url: string }`
- **Response:** `201` — created `QuickLink`

### `DELETE /api/quick-links/[id]`

Remove a quick link bookmark.

- **Response:** `200` — `{ ok: true }`
- **Error:** `404` — `{ error: "Quick link not found" }`

---

## Frontend Components

### Page: `src/app/jobs/page.tsx`

Server component that renders `<JobsClient />`.

---

### `JobsClient` — Main orchestrator

**File:** `src/components/jobs/jobs-client.tsx`

Central client component that:

- Fetches all jobs on mount (`GET /api/jobs`)
- Manages all UI state: jobs list, dialog open state, editing target, country filter, position filter
- Derives the country filter options dynamically from the loaded jobs
- Provides CRUD callbacks (`handleSubmit`, `handleDelete`, `handleEdit`, `handleStatusChange`) that call the API and update local state
- Performs optimistic updates for status changes (drag-and-drop); reverts on API failure

**Layout:**

```
┌──────────────────────────────────────────────────────┐
│  QuickLinksBar (full width)                          │
├──────────────────────────────────────────────────────┤
│  Header: title + count  |  Country filter  Position filter │
├──────────────────────────────────────────────────────┤
│  KanbanBoard (flex-1, horizontally scrollable)       │
└──────────────────────────────────────────────────────┘
```

**Filters:**

| Filter   | Type           | Options                                                                 |
| -------- | -------------- | ----------------------------------------------------------------------- |
| Country  | Dynamic select | `All` + unique country values from loaded jobs, sorted alphabetically   |
| Position | Static select  | All, Game Developer, XR Developer, Backend, Frontend, Software Engineer |

Both filters combine with AND logic. Filtering only affects what is passed to `KanbanBoard`; it does not re-fetch from the API.

---

### `KanbanBoard`

**File:** `src/components/jobs/kanban-board.tsx`

Renders five vertical status columns, one per `JobStatus` value.

**Props:**

| Prop             | Type                                      | Description                        |
| ---------------- | ----------------------------------------- | ---------------------------------- |
| `jobs`           | `JobCard[]`                               | Filtered jobs to display           |
| `onEdit`         | `(job: JobCard) => void`                  | Called when user edits a card      |
| `onDelete`       | `(id: string) => void`                    | Called when user deletes a card    |
| `onStatusChange` | `(id: string, status: JobStatus) => void` | Called on successful drag-and-drop |
| `onAddJob`       | `() => void`                              | Opens the create dialog            |

**Behavior:**

- Each column is a separate `div` with `onDragOver`, `onDragLeave`, and `onDrop` handlers for HTML5 drag-and-drop.
- A visual ring highlight (`ring-2 ring-primary/30`) appears on the column while a card is dragged over it.
- The `JobId` is transferred via `dataTransfer.setData("text/plain", job._id)`.
- A `+ Add Job` button is rendered at the bottom of the **Interested** column only.
- Column card lists are wrapped in a `ScrollArea` capped at `calc(100vh - 220px)`.

---

### `JobCardComponent`

**File:** `src/components/jobs/job-card.tsx`

Compact, expandable card for a single job application.

**Props:**

| Prop       | Type                     | Description                        |
| ---------- | ------------------------ | ---------------------------------- |
| `job`      | `JobCard`                | The job data to display            |
| `onEdit`   | `(job: JobCard) => void` | Opens the edit dialog for this job |
| `onDelete` | `(id: string) => void`   | Deletes this job                   |

**Collapsed state (default):**

- Left border color-coded by status (`STATUS_COLORS`)
- Shows: company name, position (as subtitle), expand toggle

**Expanded state (on chevron click):**

- Company link (external link to company website, if set)
- Location / work style / level badges
- Expected salary and fit score (1–10 star rating visual)
- Application method badge
- Application link (external link, if set)
- Edit and Delete action buttons

Clicking the company name / position row while collapsed opens the edit dialog directly.

---

### `JobFormDialog`

**File:** `src/components/jobs/job-form-dialog.tsx`

Modal dialog for creating or editing a job application.

**Props:**

| Prop           | Type                              | Description                         |
| -------------- | --------------------------------- | ----------------------------------- |
| `open`         | `boolean`                         | Controls dialog visibility          |
| `onOpenChange` | `(open: boolean) => void`         | Called when dialog should close     |
| `onSubmit`     | `(data: JobCardFormData) => void` | Called with validated form data     |
| `initialData`  | `JobCard \| null \| undefined`    | Pre-fills the form when editing     |
| `loading`      | `boolean \| undefined`            | Disables submit button while saving |

**Form fields (3-column grid layout):**

| Row | Fields                                                                                       |
| --- | -------------------------------------------------------------------------------------------- |
| 1   | Company (text), Level (select), Position (select)                                            |
| 2   | Work Style (select), Country (select + "Other" text fallback), Application Method (select)   |
| 3   | Expected Salary (number, optional), Fit % (1–10 number), Status (select)                     |
| 4   | Resume ID (text, optional), Application Link (text, optional), Company Link (text, optional) |

Country selection has a two-mode fallback: a preset dropdown (KSA, UAE, USA, UK, Germany, Remote) or a free-text input toggled by selecting "Other".

**Defaults for new applications:** position = `"Software Engineer"`, country = `"KSA"`, workStyle = `"Remote"`, fitPercentage = `5`, level = `"Mid"`, status = `"Interested"`, applicationMethod = `"Company Website"`.

---

### `QuickLinksBar`

**File:** `src/components/jobs/quick-links-bar.tsx`

A persistent bookmark bar displayed at the top of the Jobs page.

**Behavior:**

- Fetches existing quick links on mount (`GET /api/quick-links`)
- Renders each link as a favicon + domain label button that opens the URL in a new tab
- Hovering a link reveals an `×` delete button (optimistic removal; refetches on failure)
- A `+` button reveals an inline text input for adding a new URL
- Validates that the entered value is a parseable URL (via `new URL()`) before saving
- Displays the favicon via `https://www.google.com/s2/favicons?domain=<hostname>&sz=32`

---

## Features

| Feature                    | Description                                                                   |
| -------------------------- | ----------------------------------------------------------------------------- |
| Kanban pipeline            | Five-column board (Interested → Applied → In-Process → Rejected → Offered)    |
| Drag-and-drop status moves | Drag cards across columns; status update is optimistic with rollback on error |
| Country filter             | Dynamic dropdown derived from the loaded jobs' country values                 |
| Position filter            | Static filter for common role types (Game Developer, XR Developer, etc.)      |
| Expandable job cards       | Collapsed summary view; expand to see full details and action buttons         |
| Color-coded columns        | Each status column has a distinct header color for quick visual orientation   |
| External links             | Per-card links to the job posting and company website                         |
| Fit score                  | Self-assessed 1–10 rating stored and displayed on each card                   |
| Application method tagging | Track where each application originated (LinkedIn, Referral, etc.)            |
| Resume ID field            | Reference which resume version was submitted for each application             |
| Quick links bar            | Pinnable bookmark row for frequently visited job-search sites                 |

---

## File Map

```
src/
├── app/
│   ├── jobs/
│   │   └── page.tsx                          # Page route (server component)
│   └── api/
│       ├── jobs/
│       │   ├── route.ts                      # GET (list) / POST (create)
│       │   └── [id]/
│       │       └── route.ts                  # PUT (update) / DELETE
│       └── quick-links/
│           ├── route.ts                      # GET (list) / POST (create)
│           └── [id]/
│               └── route.ts                  # DELETE
├── components/
│   └── jobs/
│       ├── jobs-client.tsx                   # Main client orchestrator
│       ├── kanban-board.tsx                  # 5-column drag-and-drop board
│       ├── job-card.tsx                      # Expandable per-job card
│       ├── job-form-dialog.tsx               # Create / edit dialog
│       └── quick-links-bar.tsx               # Bookmark bar component
├── lib/
│   └── jobs-types.ts                         # Types, enums, color maps, constants
└── models/
    ├── job.ts                                # Mongoose Job schema & model
    └── quick_link.ts                         # Mongoose QuickLink schema & model
```
