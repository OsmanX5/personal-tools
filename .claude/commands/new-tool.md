---
description: Scaffold a new tool (registry, page, model, API routes)
argument-hint: <name> <slug> [group]
---

Scaffold a new tool in this Next.js personal dashboard. The tool to create:

**Arguments:** `$ARGUMENTS`
(Format: `<name> <slug> [group]`. If any are missing or ambiguous, ask before generating files.)

Follow the project's layered tool structure exactly. The sidebar and home dashboard update automatically once the registry entry is added.

## Steps

1. **Register the tool** — Add an entry to the `tools` array in [src/lib/tools-registry.ts](src/lib/tools-registry.ts):
   ```ts
   import { SomeIcon } from "lucide-react"; // pick a fitting Lucide icon
   {
     name: "<name>",
     slug: "<slug>",
     description: "<one-line description>",
     icon: SomeIcon,
     status: "coming-soon", // switch to "active" when the UI is ready
     group: "<group>",       // sidebar section, e.g. Finance | Career | Health | Learning
   }
   ```

2. **Create the page** — `src/app/<slug>/page.tsx`. Start with the placeholder, then replace with the real client component when built:
   ```tsx
   import { ToolPlaceholder } from "@/components/tool-placeholder";
   import { tools } from "@/lib/tools-registry";

   export default function Page() {
     const tool = tools.find((t) => t.slug === "<slug>")!;
     return <ToolPlaceholder name={tool.name} description={tool.description} />;
   }
   ```

3. **Create the Mongoose model** — Copy `src/models/_example.ts` to `src/models/<model>.ts` and edit the interface, schema fields, and model name to match the data.

4. **Create API routes** — Always call `dbConnect()` first, and check the iron-session (`getIronSession()`, return 401 if `!session.isLoggedIn`):
   - `src/app/api/<slug>/route.ts` — `GET` (list) + `POST` (create)
   - `src/app/api/<slug>/[id]/route.ts` — `PUT` (update) + `DELETE`

5. **Client component** (when building real UI) — `src/components/<slug>/<slug>-client.tsx` as the `"use client"` orchestrator owning all state and fetch calls, with sub-components in `src/components/<slug>/`. Types go in `src/lib/<slug>-types.ts`.

6. **Mark active** — Once the real UI is ready, set `status: "active"` in the registry to drop the "Coming Soon" badge.

After scaffolding, run `npm run lint` to confirm the new files pass. Use the existing active tools (e.g. `networth`) as reference for conventions.
