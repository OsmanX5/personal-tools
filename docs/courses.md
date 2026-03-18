# Courses Tracker — Technical Documentation

> **Tool slug:** `courses`
> **Status:** Active
> **Description:** Organize your learning — track courses, books, and tutorials with progress and skill tags.

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

The Courses Tracker tool lets users manage a personal learning backlog of courses, books, and tutorials. Each item moves through a status pipeline — Wishlist → In Progress → Paused / Completed / Dropped — with lesson-level progress tracking, priority levels, tags, and optional external URLs.

The UI uses a two-panel layout: a dedicated Wishlist sidebar on the left and a main content area on the right that groups active courses by status. Status overview cards at the top provide quick counts and act as clickable filters. Users can further filter by platform, priority, and tag.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                     Next.js Page                       │
│               src/app/courses/page.tsx                  │
│            (Server Component → renders client)         │
└──────────────────────┬─────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────┐
│                  CoursesClient                         │
│        src/components/courses/courses-client.tsx        │
│    (Client Component — manages all state & API calls)  │
│                                                        │
│  ┌──────────────┐  ┌──────────────────────────────┐    │
│  │ Wishlist      │  │ Main content: grouped by     │    │
│  │ sidebar       │  │ status (In Progress, Paused, │    │
│  │ (inline cards)│  │ Completed, Dropped)          │    │
│  └──────────────┘  │                              │    │
│                     │  ┌────────────────────────┐  │    │
│                     │  │     CourseCard          │  │    │
│                     │  │  (expandable card per   │  │    │
│                     │  │   course in grid)       │  │    │
│                     │  └────────────────────────┘  │    │
│                     └──────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │              CourseFormDialog                     │  │
│  │         (create / edit course modal)              │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │ fetch()
┌──────────────────────▼─────────────────────────────────┐
│                    REST API Layer                       │
│               src/app/api/courses/                      │
│                                                        │
│   GET/POST    /api/courses                             │
│   PUT/DELETE  /api/courses/[id]                        │
└──────────────────────┬─────────────────────────────────┘
                       │ Mongoose
┌──────────────────────▼─────────────────────────────────┐
│                    MongoDB                             │
│                Collection: courses                     │
│            Model: src/models/course.ts                 │
└────────────────────────────────────────────────────────┘
```

---

## Data Model

### Course (Mongoose document)

| Field              | Type     | Required | Default      | Description                                     |
| ------------------ | -------- | -------- | ------------ | ----------------------------------------------- |
| `_id`              | ObjectId | auto     | —            | MongoDB document ID                             |
| `title`            | String   | yes      | —            | Course display name (trimmed)                   |
| `platform`         | Enum     | yes      | —            | Source platform (see enum below)                |
| `type`             | Enum     | yes      | —            | Learning material type (see enum below)         |
| `url`              | String   | no       | `""`         | External link to the course (trimmed)           |
| `status`           | Enum     | no       | `"Wishlist"` | Current lifecycle status (see enum below)       |
| `priority`         | Enum     | no       | `"Medium"`   | Priority level (see enum below)                 |
| `totalLessons`     | Number   | no       | `0`          | Total number of lessons / chapters (min: 0)     |
| `completedLessons` | Number   | no       | `0`          | Number of completed lessons / chapters (min: 0) |
| `tags`             | String[] | no       | `[]`         | Free-form skill / topic tags                    |
| `startDate`        | Date     | no       | `null`       | When the user started the course                |
| `completionDate`   | Date     | no       | `null`       | When the user completed the course              |
| `createdAt`        | Date     | auto     | —            | Mongoose timestamp                              |
| `updatedAt`        | Date     | auto     | —            | Mongoose timestamp                              |

### Enums (defined in model & types file)

```typescript
type CourseStatus =
  | "Wishlist"
  | "In Progress"
  | "Paused"
  | "Completed"
  | "Dropped";

type CourseType = "Course" | "Book" | "Tutorial";

type CoursePlatform = "Udemy" | "Coursera" | "YouTube" | "Book" | "Other";

type CoursePriority = "Low" | "Medium" | "High";
```

---

## API Reference

All endpoints live under `/api/courses/`. Every handler calls `dbConnect()` before database access and returns JSON.

### `GET /api/courses`

List all courses sorted by `createdAt` descending.

- **Response:** `200` — `Course[]`

### `POST /api/courses`

Create a new course.

- **Body:** `CourseFormData` (title, platform, type, url, status, priority, totalLessons, completedLessons, tags, startDate, completionDate)
- **Response:** `201` — created `Course`
- **Error:** `400` — Mongoose validation error (e.g. missing required fields)

### `PUT /api/courses/[id]`

Update a course by ID. Runs Mongoose validators. Supports partial updates (e.g. only `completedLessons` for progress tracking).

- **Body:** Partial `CourseFormData`
- **Response:** `200` — updated `Course`
- **Error:** `404` — `{ error: "Course not found" }`

### `DELETE /api/courses/[id]`

Delete a course permanently.

- **Response:** `200` — `{ ok: true }`
- **Error:** `404` — `{ error: "Course not found" }`

---

## Frontend Components

### Page: `src/app/courses/page.tsx`

Server component that renders `<CoursesClient />`.

### `CoursesClient` — Main orchestrator

**File:** `src/components/courses/courses-client.tsx`

Central client component that:

- Fetches courses (`GET /api/courses`) on mount
- Manages all UI state (filters, dialog open/close, editing course)
- Provides CRUD callbacks that call API endpoints and update local state optimistically
- Computes derived data: status counts, overall progress percentage, grouped courses by status, unique tags for filtering

**Layout (two-panel):**

| Wishlist Sidebar (w-72)                      | Main Content (flex-1)                                         |
| -------------------------------------------- | ------------------------------------------------------------- |
| Star icon + "Wishlist" heading + count badge | Status section headers (colored bar with icon + name + count) |
| Compact clickable cards per wishlist course  | Grid of `CourseCard` components (1–3 columns responsive)      |
| "+" button to add new course                 | Sections: In Progress → Paused → Completed → Dropped (if any) |

**Above both panels:**

- **Header row:** Tool icon, title ("Courses Tracker"), course count + overall progress percentage, "Add Course" button
- **Status overview cards:** 4 clickable stat cards (In Progress, Paused, Completed, Dropped) showing count per status. Clicking toggles the status filter.
- **Filters row:** Platform dropdown, Priority dropdown, Tag dropdown (dynamic from course tags), active filter indicator with "Clear filters" button and result count.

**State variables:**

| State            | Type           | Purpose                              |
| ---------------- | -------------- | ------------------------------------ |
| `courses`        | `Course[]`     | All courses from API                 |
| `loading`        | `boolean`      | Initial fetch loading state          |
| `saving`         | `boolean`      | Form submission loading state        |
| `dialogOpen`     | `boolean`      | Controls form dialog visibility      |
| `editingCourse`  | `Course\|null` | Course being edited, null for create |
| `statusFilter`   | `string`       | Active status filter ("All" or enum) |
| `platformFilter` | `string`       | Active platform filter               |
| `tagFilter`      | `string`       | Active tag filter                    |
| `priorityFilter` | `string`       | Active priority filter               |

**Computed values (useMemo):**

| Value             | Description                                              |
| ----------------- | -------------------------------------------------------- |
| `allTags`         | Unique sorted tags across all courses + "All"            |
| `filteredCourses` | Courses matching all active filters                      |
| `statusCounts`    | Count of courses per status                              |
| `overallProgress` | Aggregate % of completed/total lessons (null if no data) |
| `groupedByStatus` | Filtered courses grouped into status buckets             |

### `CourseCard`

**File:** `src/components/courses/course-card.tsx`

Expandable card for each course in the main content grid. Features:

- Color-coded left border and background by status (via `STATUS_COLORS`)
- Collapsed view: title, platform, external link icon, progress percentage
- Expanded view (toggle with chevron): type badge, priority badge, progress bar with +/- buttons, tags, dates (start/completion), external URL link, edit/delete buttons
- Clicking the title area when collapsed opens the edit dialog; when expanded, collapses the card
- `defaultExpanded` prop — "In Progress" courses are expanded by default

**Props:**

| Prop               | Type                                             | Description                       |
| ------------------ | ------------------------------------------------ | --------------------------------- |
| `course`           | `Course`                                         | Course data to display            |
| `onEdit`           | `(course: Course) => void`                       | Callback to open edit dialog      |
| `onDelete`         | `(id: string) => void`                           | Callback to delete the course     |
| `onUpdateProgress` | `(id: string, completedLessons: number) => void` | Callback for +/- progress buttons |
| `defaultExpanded`  | `boolean`                                        | Whether to show expanded on mount |

### `CourseFormDialog`

**File:** `src/components/courses/course-form-dialog.tsx`

Modal dialog for creating or editing a course. Fields organized in rows:

- **Row 1:** Title (required text input)
- **Row 2:** Platform (select), Type (select), Priority (select)
- **Row 3:** Status (select), Total Lessons (number), Completed Lessons (number, clamped to total)
- **Row 4:** Course URL (text input)
- **Row 5:** Tags (comma-separated text input, split into array on submit)
- **Row 6:** Start Date (date input), Completion Date (date input)

Dialog title changes based on mode: "Add Course" vs "Edit Course". Submit button shows loading state.

**Props:**

| Prop           | Type                             | Description                       |
| -------------- | -------------------------------- | --------------------------------- |
| `open`         | `boolean`                        | Controls dialog visibility        |
| `onOpenChange` | `(open: boolean) => void`        | Callback when dialog open changes |
| `onSubmit`     | `(data: CourseFormData) => void` | Callback with form data           |
| `initialData`  | `Course \| null`                 | Pre-fill for edit mode            |
| `loading`      | `boolean`                        | Disables submit during save       |

---

## Features

| Feature                  | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| Status pipeline          | Five lifecycle stages: Wishlist → In Progress → Paused → Completed → Dropped |
| Lesson progress tracking | Track completed vs total lessons with visual progress bar and +/- buttons    |
| Overall progress         | Aggregate completion percentage displayed in the header                      |
| Wishlist sidebar         | Dedicated sidebar for wishlist items, separate from active courses           |
| Multi-filter system      | Filter by status, platform, priority, and tag simultaneously                 |
| Clickable status cards   | Overview cards double as quick status filters                                |
| Priority levels          | Low / Medium / High priority with color-coded badges                         |
| Platform tracking        | Classify courses by source: Udemy, Coursera, YouTube, Book, Other            |
| Course types             | Distinguish between Course, Book, and Tutorial                               |
| Tagging system           | Free-form comma-separated tags for categorization and filtering              |
| Date tracking            | Optional start date and completion date per course                           |
| External links           | Direct URL to course with external link icons                                |
| Expandable cards         | Cards expand to show full details; In Progress cards auto-expand             |
| Inline progress update   | +/- buttons on expanded cards for quick lesson progress adjustment           |

---

## File Map

```
src/
├── app/
│   ├── courses/
│   │   └── page.tsx                          # Page route (server component)
│   └── api/
│       └── courses/
│           ├── route.ts                       # GET (list) / POST (create)
│           └── [id]/
│               └── route.ts                   # PUT / DELETE by ID
├── components/
│   └── courses/
│       ├── courses-client.tsx                 # Main client orchestrator
│       ├── course-card.tsx                    # Expandable course card
│       └── course-form-dialog.tsx             # Create/edit course dialog
├── lib/
│   └── courses-types.ts                       # TypeScript types, enums, constants
└── models/
    └── course.ts                              # Mongoose model & schema
```
