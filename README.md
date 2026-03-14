# Personal Tools

A modular collection of personal productivity tools built with Next.js, MongoDB, and shadcn/ui. Designed for single-user use behind a simple password gate.

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Framework   | Next.js 16 (App Router, TypeScript) |
| Styling     | Tailwind CSS v4 + shadcn/ui         |
| Database    | MongoDB via Mongoose                |
| Auth        | iron-session (encrypted cookie)     |
| Validation  | Zod                                 |
| Icons       | Lucide React                        |
| Hosting     | Render (Web Service)                |

## Current Tools

| Tool                     | Status       |
| ------------------------ | ------------ |
| Finance Tracker          | Coming Soon  |
| Job Applications Tracker | Coming Soon  |

## Project Structure

```
src/
├── app/                        # Next.js App Router pages & API routes
│   ├── api/
│   │   └── auth/route.ts       # Login / logout API
│   ├── finance/page.tsx        # Finance tool page
│   ├── jobs/page.tsx           # Jobs tool page
│   ├── login/page.tsx          # Login page
│   ├── layout.tsx              # Root layout (theme, shell, toaster)
│   ├── page.tsx                # Home dashboard
│   └── globals.css             # Tailwind + shadcn theme tokens
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx       # Sidebar + header wrapper
│   │   ├── header.tsx          # Top bar with theme toggle & logout
│   │   └── sidebar.tsx         # Nav sidebar (auto-generated from registry)
│   ├── ui/                     # shadcn/ui primitives
│   ├── theme-provider.tsx      # next-themes wrapper
│   └── tool-placeholder.tsx    # Reusable "Coming Soon" placeholder
├── lib/
│   ├── db.ts                   # Cached Mongoose connection
│   ├── session.ts              # iron-session config
│   ├── tools-registry.ts       # Central tool definitions (drives nav + home)
│   └── utils.ts                # shadcn utility (cn)
└── models/
    └── _example.ts             # Example Mongoose model (copy to start a new one)
```

## Local Development

### Prerequisites

- Node.js 18+
- npm
- MongoDB (local or Atlas)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/OsmanX5/personal-tools.git
cd personal-tools

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env.local
# Then edit .env.local with your values:
#   MONGODB_URI  — your MongoDB connection string
#   APP_PASSWORD — password to access the app
#   SESSION_SECRET — random string, min 32 characters

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login` — enter the password from `APP_PASSWORD`.

## How to Add a New Tool

Adding a new tool takes 4 simple steps. The sidebar and home page update automatically.

### Step 1: Register the tool

Open `src/lib/tools-registry.ts` and add an entry to the `tools` array:

```ts
import { Calculator } from "lucide-react"; // pick an icon from lucide-react

// Add to the tools array:
{
  name: "Budget Planner",
  slug: "budget",
  description: "Plan monthly budgets and track spending goals.",
  icon: Calculator,
  status: "coming-soon",   // change to "active" when ready
}
```

> That's it for navigation — the sidebar and home page card are generated automatically from this array.

### Step 2: Create the page

Create `src/app/<slug>/page.tsx`. Start with the placeholder, then replace it when you build the real UI:

```tsx
// src/app/budget/page.tsx
import { ToolPlaceholder } from "@/components/tool-placeholder";
import { tools } from "@/lib/tools-registry";

export default function BudgetPage() {
  const tool = tools.find((t) => t.slug === "budget")!;
  return <ToolPlaceholder name={tool.name} description={tool.description} />;
}
```

### Step 3: Create the Mongoose model

Copy the example model and modify it:

```bash
cp src/models/_example.ts src/models/budget.ts
```

Then edit the interface, schema fields, and model name to match your data. See `src/models/_example.ts` for detailed comments.

### Step 4: Create API routes

Create REST endpoints for your tool:

```
src/app/api/budget/route.ts          — GET (list) + POST (create)
src/app/api/budget/[id]/route.ts     — PUT (update) + DELETE
```

Example API route pattern:

```ts
// src/app/api/budget/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Budget from "@/models/budget";

export async function GET() {
  await dbConnect();
  const items = await Budget.find().sort({ createdAt: -1 });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  await dbConnect();
  const body = await request.json();
  const item = await Budget.create(body);
  return NextResponse.json(item, { status: 201 });
}
```

### Step 5 (optional): Mark as active

Once you've built out the real UI, update the tool's status in `tools-registry.ts`:

```ts
status: "active",
```

This removes the "Coming Soon" badge from the sidebar and home page.

## Deployment (Render)

### Option A: Blueprint (recommended)

1. Push the repo to GitHub
2. In the Render dashboard, click **New → Blueprint**
3. Connect the repo — Render reads `render.yaml` and creates the service
4. Set environment variables (`MONGODB_URI`, `APP_PASSWORD`) in the Render dashboard

### Option B: Manual

1. In Render, create a **New Web Service** → connect the GitHub repo
2. **Build command:** `npm install && npm run build`
3. **Start command:** `npm start`
4. **Environment:** Node
5. Add environment variables: `MONGODB_URI`, `APP_PASSWORD`, `SESSION_SECRET`, `NODE_ENV=production`

The app auto-deploys on every push to `main`.

## Environment Variables

| Variable         | Required | Description                                |
| ---------------- | -------- | ------------------------------------------ |
| `MONGODB_URI`    | Yes      | MongoDB connection string                  |
| `APP_PASSWORD`   | Yes      | Password for the login gate                |
| `SESSION_SECRET` | Yes      | Encryption key for cookies (min 32 chars)  |
| `NODE_ENV`       | No       | Set to `production` in deployed environments |

## License

Private — personal use only.
