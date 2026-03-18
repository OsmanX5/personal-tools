# Documentation Guide — How to Generate Tool Docs

> **Purpose:** This guide is a prompt-ready specification for an AI to produce technical documentation for any tool in this project. Feed this file along with the reference doc (`docs/networth.md`) to an AI and ask it to document a specific tool.

---

## Project Context

This is a **Next.js 15 (App Router)** personal dashboard with multiple tools. Each tool follows a consistent architecture:

| Layer          | Location                             | Role                                     |
| -------------- | ------------------------------------ | ---------------------------------------- |
| Page route     | `src/app/<slug>/page.tsx`            | Server component, renders the client     |
| API routes     | `src/app/api/<slug>/...`             | REST endpoints (Next.js Route Handlers)  |
| Client comp.   | `src/components/<slug>/*-client.tsx` | Main orchestrator ("use client")         |
| Sub-components | `src/components/<slug>/*.tsx`        | UI pieces (cards, dialogs, charts, etc.) |
| Types          | `src/lib/<slug>-types.ts`            | TypeScript types, enums, constants       |
| Model          | `src/models/<model>.ts`              | Mongoose schema & model                  |
| Registry entry | `src/lib/tools-registry.ts`          | Name, slug, description, icon, status    |

The database is **MongoDB** accessed via **Mongoose**. The UI uses **shadcn/ui** components and **Recharts** for charts.

---

## Steps to Document a Tool

### 1. Gather all source files

Read **every file** related to the tool. Do NOT skip any. The file set for a tool named `<slug>` is:

```
src/app/<slug>/page.tsx
src/app/api/<slug>/          ← recursively, all route.ts files
src/components/<slug>/       ← all .tsx files
src/lib/<slug>-types.ts
src/models/<relevant>.ts     ← check imports in API routes to find the model(s)
```

Also check `src/lib/tools-registry.ts` for the tool's registry entry.

### 2. Analyze the code — what to extract

For each file, extract:

| File type        | What to extract                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Model**        | All fields with types, required/default, enums, embedded sub-documents, indexes                                                      |
| **API routes**   | HTTP method, path, request body fields, response shape, status codes, error cases, any special logic (e.g. caching, computed fields) |
| **Types file**   | All `type` / `interface` / `enum` definitions, constant arrays, helper mappings                                                      |
| **Client comp.** | State variables, which APIs it calls, layout structure, user interactions                                                            |
| **Sub-comps.**   | Props interface, what it renders, interactive behaviors                                                                              |

### 3. Write the document

Follow this exact structure (matches the reference doc `docs/networth.md`):

```markdown
# <ToolName> — Technical Documentation

> **Tool slug:** `<slug>`
> **Status:** Active
> **Description:** <from tools-registry.ts>

---

## Table of Contents

(numbered links to each section)

## Overview

1-2 paragraphs summarizing what the tool does, its key entities, and distinguishing features.

## Architecture

ASCII diagram showing: Page → Client Component → Sub-components → API → MongoDB.
Show the actual file paths. Show how components nest.

## Data Model

Table for each Mongoose model:

- Field | Type | Required | Default | Description
  Table for each embedded sub-document.
  List all enums with their values.

## API Reference

For each endpoint:

- HTTP method + path
- Description (one line)
- Request body table (field | type | required | description) — if applicable
- Response: status code + shape
- Error responses
- Special behavior notes (caching, computed fields, side effects)

## Frontend Components

For each component:

- File path
- Role (one line)
- Key behaviors / interactions
- Layout description (what goes where) — especially for the main client component
- Props interface summary for sub-components

## Features

Summary table: Feature | Description — listing all user-facing capabilities.

## File Map

Directory tree showing all files belonging to this tool.
```

### 4. Style rules

- Use **tables** for structured data (fields, endpoints, features).
- Use **ASCII art** for architecture diagrams (no Mermaid).
- Use **code blocks** for types, enums, file paths, and formulas.
- Keep descriptions **concise** — one sentence per table row.
- Document **both the happy path and error cases** for APIs.
- Note any **caching, computed values, or side effects** explicitly.
- If a component has multiple modes/views, describe each one.
- Include the **conversion formula** if the tool does any data transformation.

---

## Available Tools to Document

| Tool             | Slug      | Types file         | Model file(s)                                        |
| ---------------- | --------- | ------------------ | ---------------------------------------------------- |
| Budget Planner   | `budget`  | `budget-types.ts`  | `category_budget.ts`, `expense.ts`, `future_plan.ts` |
| Job Applications | `jobs`    | `jobs-types.ts`    | `job.ts`, `quick_link.ts`                            |
| Weight Tracker   | `weight`  | `weight-types.ts`  | `weight_entry.ts`, `weight_goal.ts`                  |
| Habits Tracker   | `habits`  | `habit-types.ts`   | `habit.ts`, `habit_log.ts`                           |
| Courses Tracker  | `courses` | `courses-types.ts` | `course.ts`                                          |

---

## Example Prompt for the AI

```
You are documenting a tool in a Next.js personal dashboard project.

Read the reference documentation at docs/networth.md to understand the exact
format, depth, and style expected.

Read the documentation guide at docs/DOCUMENTATION_GUIDE.md for step-by-step
instructions.

Now document the "<ToolName>" tool (slug: "<slug>").

1. Read ALL files listed below (do not skip any):
   - src/app/<slug>/page.tsx
   - src/app/api/<slug>/ (all route.ts files, recursively)
   - src/components/<slug>/ (all .tsx files)
   - src/lib/<slug>-types.ts
   - src/models/<model1>.ts, src/models/<model2>.ts
   - The tool's entry in src/lib/tools-registry.ts

2. Produce a complete technical doc following the exact same structure and
   style as docs/networth.md.

3. Save it to docs/<slug>.md.
```

Replace `<ToolName>`, `<slug>`, and model files from the table above.
