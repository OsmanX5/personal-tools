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
    "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900",
  "In Progress":
    "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900",
  Paused:
    "bg-slate-50 border-slate-200 dark:bg-slate-950/40 dark:border-slate-900",
  Completed:
    "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900",
  Dropped:
    "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900",
};

export const STATUS_HEADER_COLORS: Record<CourseStatus, string> = {
  Wishlist: "bg-blue-600 dark:bg-blue-800",
  "In Progress": "bg-amber-500 dark:bg-amber-700",
  Paused: "bg-slate-500 dark:bg-slate-700",
  Completed: "bg-emerald-600 dark:bg-emerald-800",
  Dropped: "bg-rose-600 dark:bg-rose-800",
};

export const PRIORITY_COLORS: Record<CoursePriority, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  Medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  High: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
};
