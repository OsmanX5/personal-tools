import {
  LucideIcon,
  DollarSign,
  Briefcase,
  Weight,
  Receipt,
} from "lucide-react";

export interface ToolConfig {
  /** Display name of the tool */
  name: string;
  /** URL slug — must match the route directory name in src/app/ */
  slug: string;
  /** Short description shown on the home page card */
  description: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Whether the tool is built or still a placeholder */
  status: "active" | "coming-soon";
}

/**
 * Central registry of all tools.
 *
 * To add a new tool:
 * 1. Add an entry here
 * 2. Create src/app/<slug>/page.tsx (use ToolPlaceholder for stubs)
 * 3. Create src/models/<model>.ts (see src/models/_example.ts)
 * 4. Create src/app/api/<slug>/route.ts for API endpoints
 *
 * The sidebar and home page are auto-generated from this array.
 */
export const tools: ToolConfig[] = [
  {
    name: "Finance Tracker",
    slug: "finance",
    description: "Track income, expenses, and view spending summaries.",
    icon: DollarSign,
    status: "active",
  },
  {
    name: "Budget Planner",
    slug: "budget",
    description:
      "Track expenses, set category budgets, and plan future financial goals.",
    icon: Receipt,
    status: "active",
  },
  {
    name: "Job Applications",
    slug: "jobs",
    description:
      "Track job applications, statuses, and follow-ups in one place.",
    icon: Briefcase,
    status: "active",
  },
  {
    name: "Weight Tracker",
    slug: "weight",
    description: "Log weight, track BMI automatically, and set weight goals.",
    icon: Weight,
    status: "active",
  },
];
