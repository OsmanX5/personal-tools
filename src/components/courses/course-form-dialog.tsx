"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Course,
  type CourseFormData,
  COURSE_STATUSES,
  COURSE_TYPES,
  COURSE_PLATFORMS,
  COURSE_PRIORITIES,
} from "@/lib/courses-types";

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CourseFormData) => void;
  initialData?: Course | null;
  loading?: boolean;
}

const defaultFormData: CourseFormData = {
  title: "",
  platform: "Udemy",
  type: "Course",
  url: "",
  status: "Wishlist",
  priority: "Medium",
  totalLessons: 0,
  completedLessons: 0,
  tags: [],
  startDate: null,
  completionDate: null,
};

function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export function CourseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
}: CourseFormDialogProps) {
  const [form, setForm] = useState<CourseFormData>(
    initialData
      ? {
          title: initialData.title,
          platform: initialData.platform,
          type: initialData.type,
          url: initialData.url,
          status: initialData.status,
          priority: initialData.priority,
          totalLessons: initialData.totalLessons,
          completedLessons: initialData.completedLessons,
          tags: initialData.tags,
          startDate: initialData.startDate,
          completionDate: initialData.completionDate,
        }
      : defaultFormData,
  );

  const [tagsInput, setTagsInput] = useState(
    initialData ? initialData.tags.join(", ") : "",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    onSubmit({ ...form, tags });
  };

  const update = <K extends keyof CourseFormData>(
    key: K,
    value: CourseFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Course" : "Add Course"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Row 1: Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. React — The Complete Guide"
              required
            />
          </div>

          {/* Row 2: Platform, Type, Priority */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Platform *</Label>
              <Select
                value={form.platform}
                onValueChange={(v) =>
                  update("platform", v as CourseFormData["platform"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  update("type", v as CourseFormData["type"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  update("priority", v as CourseFormData["priority"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Status, Total Lessons, Completed Lessons */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  update("status", v as CourseFormData["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totalLessons">Total Lessons</Label>
              <Input
                id="totalLessons"
                type="number"
                value={form.totalLessons}
                onChange={(e) =>
                  update("totalLessons", Math.max(0, Number(e.target.value)))
                }
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="completedLessons">Completed</Label>
              <Input
                id="completedLessons"
                type="number"
                value={form.completedLessons}
                onChange={(e) =>
                  update(
                    "completedLessons",
                    Math.max(
                      0,
                      Math.min(Number(e.target.value), form.totalLessons),
                    ),
                  )
                }
                min={0}
                max={form.totalLessons}
              />
            </div>
          </div>

          {/* Row 4: URL */}
          <div className="space-y-1.5">
            <Label htmlFor="url">Course URL</Label>
            <Input
              id="url"
              value={form.url}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Row 5: Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">
              Tags{" "}
              <span className="text-xs text-muted-foreground">
                (comma-separated)
              </span>
            </Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="React, TypeScript, Frontend"
            />
          </div>

          {/* Row 6: Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={toDateInputValue(form.startDate)}
                onChange={(e) => update("startDate", e.target.value || null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="completionDate">Completion Date</Label>
              <Input
                id="completionDate"
                type="date"
                value={toDateInputValue(form.completionDate)}
                onChange={(e) =>
                  update("completionDate", e.target.value || null)
                }
              />
            </div>
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? "Saving…" : initialData ? "Update Course" : "Add Course"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
