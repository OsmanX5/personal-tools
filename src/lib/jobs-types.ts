export type WorkStyle = "Remote" | "On-site" | "Hybrid";
export type JobLevel = "Junior" | "Mid" | "Senior" | "Lead";
export type JobStatus =
  | "Interested"
  | "Applied"
  | "In-Process"
  | "Rejected"
  | "Offered";
export type ApplicationMethod =
  | "Company Website"
  | "LinkedIn"
  | "Indeed"
  | "Glassdoor"
  | "Referral"
  | "Other";

export interface JobCard {
  _id: string;
  company: string;
  position: string;
  country: string;
  workStyle: WorkStyle;
  expectedSalary: number | null;
  fitPercentage: number; // 1-10
  level: JobLevel;
  status: JobStatus;
  applicationMethod: ApplicationMethod;
  resumeId: string;
  applicationLink: string;
  companyLink: string;
  createdAt: string;
  updatedAt: string;
}

export type JobCardFormData = Omit<JobCard, "_id" | "createdAt" | "updatedAt">;

export const JOB_STATUSES: JobStatus[] = [
  "Interested",
  "Applied",
  "In-Process",
  "Rejected",
  "Offered",
];

export const WORK_STYLES: WorkStyle[] = ["Remote", "On-site", "Hybrid"];

export const JOB_LEVELS: JobLevel[] = ["Junior", "Mid", "Senior", "Lead"];

export const APPLICATION_METHODS: ApplicationMethod[] = [
  "Company Website",
  "LinkedIn",
  "Indeed",
  "Glassdoor",
  "Referral",
  "Other",
];

export const STATUS_COLORS: Record<JobStatus, string> = {
  Interested:
    "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900",
  Applied:
    "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900",
  "In-Process":
    "bg-violet-50 border-violet-200 dark:bg-violet-950/40 dark:border-violet-900",
  Rejected:
    "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900",
  Offered:
    "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900",
};

export const STATUS_HEADER_COLORS: Record<JobStatus, string> = {
  Interested: "bg-blue-600 dark:bg-blue-800",
  Applied: "bg-amber-500 dark:bg-amber-700",
  "In-Process": "bg-violet-600 dark:bg-violet-800",
  Rejected: "bg-rose-600 dark:bg-rose-800",
  Offered: "bg-emerald-600 dark:bg-emerald-800",
};
