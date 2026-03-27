export type CourseStatus =
  | "Wishlist"
  | "In Progress"
  | "Paused"
  | "Completed"
  | "Dropped";

export type CourseType = "Course" | "Book" | "Tutorial";

export type CoursePlatform =
  | "Udemy"
  | "Coursera"
  | "YouTube"
  | "Book"
  | "Other";

export type CoursePriority = "Low" | "Medium" | "High";

export interface Course {
  _id: string;
  title: string;
  platform: CoursePlatform;
  type: CourseType;
  url: string;
  status: CourseStatus;
  priority: CoursePriority;
  totalLessons: number;
  completedLessons: number;
  tags: string[];
  startDate: string | null;
  completionDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CourseFormData = Omit<Course, "_id" | "createdAt" | "updatedAt">;

export const COURSE_STATUSES: CourseStatus[] = [
  "Wishlist",
  "In Progress",
  "Paused",
  "Completed",
  "Dropped",
];

export const COURSE_TYPES: CourseType[] = ["Course", "Book", "Tutorial"];

export const COURSE_PLATFORMS: CoursePlatform[] = [
  "Udemy",
  "Coursera",
  "YouTube",
  "Book",
  "Other",
];

export const COURSE_PRIORITIES: CoursePriority[] = ["Low", "Medium", "High"];

export const STATUS_COLORS: Record<CourseStatus, string> = {
  Wishlist:
    "bg-blue-50 border-blue-200 dark:bg-blue-900/25 dark:border-blue-700/50",
  "In Progress":
    "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25",
  Paused:
    "bg-slate-50 border-slate-200 dark:bg-slate-900/25 dark:border-slate-700/50",
  Completed:
    "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/25 dark:border-emerald-700/50",
  Dropped:
    "bg-rose-50 border-rose-200 dark:bg-rose-900/25 dark:border-rose-700/50",
};

export const STATUS_HEADER_COLORS: Record<CourseStatus, string> = {
  Wishlist: "bg-blue-600 dark:bg-blue-500/15",
  "In Progress": "bg-amber-500 dark:bg-amber-500/12",
  Paused: "bg-slate-500 dark:bg-slate-400/15",
  Completed: "bg-emerald-600 dark:bg-emerald-500/15",
  Dropped: "bg-rose-600 dark:bg-rose-500/15",
};

export const PRIORITY_COLORS: Record<CoursePriority, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200",
  Medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
  High: "bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-200",
};
