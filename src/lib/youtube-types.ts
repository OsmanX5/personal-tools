export type VideoStatus =
  | "Idea"
  | "Scripting"
  | "Recording"
  | "Editing"
  | "Scheduled"
  | "Published";

export type VideoPriority = "Low" | "Medium" | "High";

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface VideoCard {
  _id: string;
  title: string;
  hook: string;
  notes: string;
  status: VideoStatus;
  priority: VideoPriority;
  pillar: string;
  playlistIds: string[];
  tags: string[];
  targetDate: string | null;
  videoUrl: string;
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

export type VideoCardFormData = Omit<
  VideoCard,
  "_id" | "createdAt" | "updatedAt"
>;

export interface Playlist {
  _id: string;
  name: string;
  description: string;
  color: PlaylistColor;
  createdAt: string;
  updatedAt: string;
}

export type PlaylistFormData = Pick<
  Playlist,
  "name" | "description" | "color"
>;

export const VIDEO_STATUSES: VideoStatus[] = [
  "Idea",
  "Scripting",
  "Recording",
  "Editing",
  "Scheduled",
  "Published",
];

export const VIDEO_PRIORITIES: VideoPriority[] = ["Low", "Medium", "High"];

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { label: "Script", done: false },
  { label: "Record", done: false },
  { label: "Edit", done: false },
  { label: "Thumbnail", done: false },
  { label: "Upload", done: false },
];

/** Suggested content pillars — the form also allows a custom value. */
export const PILLAR_OPTIONS = [
  "Tutorial",
  "Devlog",
  "Review",
  "Vlog",
  "Short",
];

export const STATUS_COLORS: Record<VideoStatus, string> = {
  Idea: "bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700/50",
  Scripting:
    "bg-blue-50 border-blue-200 dark:bg-blue-900/25 dark:border-blue-700/50",
  Recording:
    "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25",
  Editing:
    "bg-violet-50 border-violet-200 dark:bg-violet-900/25 dark:border-violet-700/50",
  Scheduled:
    "bg-cyan-50 border-cyan-200 dark:bg-cyan-900/25 dark:border-cyan-700/50",
  Published:
    "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/25 dark:border-emerald-700/50",
};

export const STATUS_HEADER_COLORS: Record<VideoStatus, string> = {
  Idea: "bg-slate-500 dark:bg-slate-500/15",
  Scripting: "bg-blue-600 dark:bg-blue-500/15",
  Recording: "bg-amber-500 dark:bg-amber-500/12",
  Editing: "bg-violet-600 dark:bg-violet-500/15",
  Scheduled: "bg-cyan-600 dark:bg-cyan-500/15",
  Published: "bg-emerald-600 dark:bg-emerald-500/15",
};

export const PRIORITY_COLORS: Record<VideoPriority, string> = {
  Low: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300",
  Medium:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  High: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
};

export const PLAYLIST_COLORS = [
  "slate",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "pink",
] as const;

export type PlaylistColor = (typeof PLAYLIST_COLORS)[number];

export const DEFAULT_PLAYLIST_COLOR: PlaylistColor = "blue";

/** Badge styling (background + text) per playlist color. */
export const PLAYLIST_COLOR_CLASSES: Record<PlaylistColor, string> = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300",
  red: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  orange:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  green:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-300",
};

/** Solid swatch (for the color picker dots). */
export const PLAYLIST_COLOR_SWATCHES: Record<PlaylistColor, string> = {
  slate: "bg-slate-500",
  red: "bg-rose-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  teal: "bg-teal-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  pink: "bg-pink-500",
};

export function playlistColorClass(color: string): string {
  return (
    PLAYLIST_COLOR_CLASSES[color as PlaylistColor] ??
    PLAYLIST_COLOR_CLASSES[DEFAULT_PLAYLIST_COLOR]
  );
}
