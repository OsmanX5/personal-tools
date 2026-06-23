import {
  LucideIcon,
  DollarSign,
  Briefcase,
  Weight,
  Receipt,
  CheckSquare,
  GraduationCap,
  TrendingUp,
  Repeat,
  Youtube,
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
  /** Sidebar group label */
  group: string;
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
    name: "NetWorth",
    slug: "networth",
    description:
      "Track accounts, transactions, and view your net worth across currencies.",
    icon: DollarSign,
    status: "active",
    group: "Finance",
  },
  {
    name: "Budget Planner",
    slug: "budget",
    description:
      "Track expenses, set category budgets, and plan future financial goals.",
    icon: Receipt,
    status: "active",
    group: "Finance",
  },
  {
    name: "Financial Planning",
    slug: "planning",
    description:
      "Track income, monitor emergency fund, and project your financial future.",
    icon: TrendingUp,
    status: "active",
    group: "Finance",
  },
  {
    name: "Subscriptions",
    slug: "subscriptions",
    description:
      "Manage recurring subscriptions, renewal dates, reminders, and budget sync.",
    icon: Repeat,
    status: "active",
    group: "Finance",
  },
  {
    name: "Job Applications",
    slug: "jobs",
    description:
      "Track job applications, statuses, and follow-ups in one place.",
    icon: Briefcase,
    status: "active",
    group: "Career",
  },
  {
    name: "Weight Tracker",
    slug: "weight",
    description: "Log weight, track BMI automatically, and set weight goals.",
    icon: Weight,
    status: "active",
    group: "Health",
  },
  {
    name: "Habits Tracker",
    slug: "habits",
    description:
      "Build daily routines, track streaks, and log quantitative habits.",
    icon: CheckSquare,
    status: "active",
    group: "Health",
  },
  {
    name: "Courses Tracker",
    slug: "courses",
    description:
      "Organize your learning — track courses, books, and tutorials with progress and skill tags.",
    icon: GraduationCap,
    status: "active",
    group: "Learning",
  },
  {
    name: "YouTube",
    slug: "youtube",
    description:
      "Manage video ideas through a production pipeline — from idea to published, with checklists, target dates, and content pillars.",
    icon: Youtube,
    status: "active",
    group: "Content",
  },
];
