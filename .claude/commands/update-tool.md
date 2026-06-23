---
description: Update an existing tool (find its layers, change safely, lint)
argument-hint: <slug> [what to change]
---

Update an existing tool in this Next.js personal dashboard. The target:

**Arguments:** `$ARGUMENTS`
(Format: `<slug> [what to change]`. If the slug is missing or the change is unclear, ask before editing.)

Every tool follows the same layered structure. Before changing anything, locate the relevant layers for `<slug>` and read them so the change stays consistent with the existing code.

## Layers to check

| Layer | Location | When to touch it |
|---|---|---|
| Registry | [src/lib/tools-registry.ts](src/lib/tools-registry.ts) | name, description, icon, `status`, `group` |
| Page | `src/app/<slug>/page.tsx` | rarely — it just renders the client component |
| Client | `src/components/<slug>/<slug>-client.tsx` | state, data fetching, orchestration |
| Sub-components | `src/components/<slug>/*.tsx` | UI panels, dialogs, charts |
| Types | `src/lib/<slug>-types.ts` | TypeScript types, enums, constant arrays |
| Model | `src/models/<model>.ts` | Mongoose schema/fields |
| API | `src/app/api/<slug>/route.ts`, `src/app/api/<slug>/[id]/route.ts` | REST handlers |

## Rules

- **Find first.** Use the table above (and Grep/Glob) to locate the exact files for this tool. Read them before editing — match surrounding naming, comment density, and idiom.
- **Schema changes ripple.** A change in the Mongoose model usually needs matching updates in `<slug>-types.ts`, the API handlers, and the client. Trace the field end to end.
- **API contract.** Every route must call `dbConnect()` first and validate the iron-session (`getIronSession()`, return 401 if `!session.isLoggedIn`). Keep response shapes consistent with what the client expects.
- **UI conventions.** Use the wrapped primitives in `src/components/ui/` (`Button`, `Card`, `Dialog`, `Chart`, etc.), `toast` from `sonner` for feedback, and Framer Motion for animation (180–320ms, 6–18px, reduced-motion support — see `docs/animation-guidelines.md`).
- **Cross-tool sync.** If touching `subscriptions` or `budget`, account for `src/lib/subscriptions-budget-sync.ts` and `src/lib/recurring-utils.ts` — changes there can affect the linked `Expense` records.
- **Status toggle.** To publish/unpublish a tool, flip `status` between `"active"` and `"coming-soon"` in the registry.
- **Docs.** If the tool has a doc under `docs/<slug>.md`, update it to reflect behavior changes (follow `docs/DOCUMENTATION_GUIDE.md`).

After editing, run `npm run lint` and report what changed across which layers.
