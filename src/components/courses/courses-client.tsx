"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Plus,
  BookOpen,
  Clock,
  Pause,
  CheckCircle2,
  XCircle,
  Star,
  Filter,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CourseCard } from "@/components/courses/course-card";
import { CourseFormDialog } from "@/components/courses/course-form-dialog";
import type { Course, CourseFormData, CourseStatus } from "@/lib/courses-types";
import {
  COURSE_PLATFORMS,
  COURSE_PRIORITIES,
  STATUS_HEADER_COLORS,
  PRIORITY_COLORS,
} from "@/lib/courses-types";

const STATUS_ICONS: Record<CourseStatus, React.ReactNode> = {
  Wishlist: <Star className="h-4 w-4" />,
  "In Progress": <Clock className="h-4 w-4" />,
  Paused: <Pause className="h-4 w-4" />,
  Completed: <CheckCircle2 className="h-4 w-4" />,
  Dropped: <XCircle className="h-4 w-4" />,
};

const STAT_CARD_COLORS: Record<CourseStatus, string> = {
  Wishlist:
    "border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400",
  "In Progress":
    "border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400",
  Paused:
    "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400",
  Completed:
    "border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400",
  Dropped:
    "border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-400",
};

export default function CoursesClient() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCourses(data);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSubmit = async (data: CourseFormData) => {
    setSaving(true);
    try {
      if (editingCourse) {
        const res = await fetch(`/api/courses/${editingCourse._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        setCourses((prev) =>
          prev.map((c) => (c._id === updated._id ? updated : c)),
        );
        toast.success("Course updated");
      } else {
        const res = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setCourses((prev) => [created, ...prev]);
        toast.success("Course added");
      }
      setDialogOpen(false);
      setEditingCourse(null);
    } catch {
      toast.error("Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setCourses((prev) => prev.filter((c) => c._id !== id));
      toast.success("Course deleted");
    } catch {
      toast.error("Failed to delete course");
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setDialogOpen(true);
  };

  const handleUpdateProgress = async (id: string, completedLessons: number) => {
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedLessons }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      const updated = await res.json();
      setCourses((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c)),
      );
    } catch {
      toast.error("Failed to update progress");
    }
  };

  const allTags = useMemo(() => {
    const set = new Set(courses.flatMap((c) => c.tags));
    return ["All", ...Array.from(set).sort()];
  }, [courses]);

  const hasActiveFilters =
    statusFilter !== "All" ||
    platformFilter !== "All" ||
    tagFilter !== "All" ||
    priorityFilter !== "All";

  const clearFilters = () => {
    setStatusFilter("All");
    setPlatformFilter("All");
    setTagFilter("All");
    setPriorityFilter("All");
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchStatus = statusFilter === "All" || c.status === statusFilter;
      const matchPlatform =
        platformFilter === "All" || c.platform === platformFilter;
      const matchTag = tagFilter === "All" || c.tags.includes(tagFilter);
      const matchPriority =
        priorityFilter === "All" || c.priority === priorityFilter;
      return matchStatus && matchPlatform && matchTag && matchPriority;
    });
  }, [courses, statusFilter, platformFilter, tagFilter, priorityFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<CourseStatus, number> = {
      Wishlist: 0,
      "In Progress": 0,
      Paused: 0,
      Completed: 0,
      Dropped: 0,
    };
    for (const course of courses) {
      counts[course.status]++;
    }
    return counts;
  }, [courses]);

  const overallProgress = useMemo(() => {
    const withLessons = courses.filter((c) => c.totalLessons > 0);
    if (withLessons.length === 0) return null;
    const totalCompleted = withLessons.reduce(
      (sum, c) => sum + c.completedLessons,
      0,
    );
    const totalLessons = withLessons.reduce(
      (sum, c) => sum + c.totalLessons,
      0,
    );
    return Math.round((totalCompleted / totalLessons) * 100);
  }, [courses]);

  const groupedByStatus = useMemo(() => {
    const groups: Record<CourseStatus, Course[]> = {
      Wishlist: [],
      "In Progress": [],
      Paused: [],
      Completed: [],
      Dropped: [],
    };
    for (const course of filteredCourses) {
      groups[course.status].push(course);
    }
    return groups;
  }, [filteredCourses]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading courses…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Courses Tracker</h1>
            <p className="text-sm text-muted-foreground">
              {courses.length} course{courses.length !== 1 ? "s" : ""}
              {overallProgress !== null &&
                ` · ${overallProgress}% overall progress`}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingCourse(null);
            setDialogOpen(true);
          }}
          size="sm"
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Course
        </Button>
      </div>

      {/* Status overview cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(["In Progress", "Paused", "Completed", "Dropped"] as const).map(
          (status) => (
            <button
              key={status}
              onClick={() =>
                setStatusFilter(statusFilter === status ? "All" : status)
              }
              className={`rounded-lg border px-3 py-2 text-left transition-all hover:shadow-sm ${
                STAT_CARD_COLORS[status]
              } ${
                statusFilter === status
                  ? "ring-2 ring-primary/50 shadow-sm"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                {STATUS_ICONS[status]}
                <span className="text-lg font-bold">
                  {statusCounts[status]}
                </span>
              </div>
              <p className="mt-0.5 text-xs font-medium">{status}</p>
            </button>
          ),
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="rounded-md border bg-background px-2.5 py-1.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="All">All Platforms</option>
          {COURSE_PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-md border bg-background px-2.5 py-1.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="All">All Priorities</option>
          {COURSE_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        {allTags.length > 1 && (
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="rounded-md border bg-background px-2.5 py-1.5 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="All">All Tags</option>
            {allTags
              .filter((t) => t !== "All")
              .map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>
        )}
        {hasActiveFilters && (
          <>
            <div className="h-4 w-px bg-border" />
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Clear filters
            </button>
            <span className="text-xs text-muted-foreground">
              {filteredCourses.length} result
              {filteredCourses.length !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

      {/* Two-column layout: Wishlist sidebar + main content */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Wishlist sidebar */}
        <div className="flex w-72 shrink-0 flex-col gap-2 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold">Wishlist</h2>
              <Badge variant="secondary" className="text-xs">
                {groupedByStatus["Wishlist"].length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setEditingCourse(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {groupedByStatus["Wishlist"].length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed py-8 text-center">
              <Star className="h-6 w-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                No wishlist courses
              </p>
            </div>
          ) : (
            groupedByStatus["Wishlist"].map((course) => (
              <button
                key={course._id}
                onClick={() => handleEdit(course)}
                className="flex flex-col gap-1 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-left transition-all hover:shadow-sm dark:border-blue-900 dark:bg-blue-950/30"
              >
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium">
                    {course.title}
                  </span>
                  {course.url && (
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    {course.platform}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[course.priority]}`}
                  >
                    {course.priority}
                  </Badge>
                  {course.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] px-1 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Main content: other statuses */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-4">
          {(["In Progress", "Paused", "Completed", "Dropped"] as const).map(
            (status) => {
              const group = groupedByStatus[status];
              if (group.length === 0) return null;
              return (
                <section key={status}>
                  <div
                    className={`mb-3 flex items-center gap-2 rounded-md px-3 py-1.5 ${STATUS_HEADER_COLORS[status]}`}
                  >
                    <span className="text-white/80">
                      {STATUS_ICONS[status]}
                    </span>
                    <h2 className="text-sm font-semibold text-white">
                      {status}
                    </h2>
                    <Badge
                      variant="secondary"
                      className="bg-white/20 text-xs text-white hover:bg-white/30"
                    >
                      {group.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {group.map((course) => (
                      <CourseCard
                        key={course._id}
                        course={course}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onUpdateProgress={handleUpdateProgress}
                        defaultExpanded={status === "In Progress"}
                      />
                    ))}
                  </div>
                </section>
              );
            },
          )}

          {filteredCourses.filter((c) => c.status !== "Wishlist").length ===
            0 &&
            groupedByStatus["Wishlist"].length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "No courses match the current filters"
                    : "No courses yet — add your first one!"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Form Dialog */}
      <CourseFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingCourse(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingCourse}
        loading={saving}
        key={editingCourse?._id ?? "new"}
      />
    </div>
  );
}
