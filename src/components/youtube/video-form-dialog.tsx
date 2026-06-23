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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListMusic, Plus, X } from "lucide-react";
import {
  type VideoCard,
  type VideoCardFormData,
  type ChecklistItem,
  type Playlist,
  VIDEO_STATUSES,
  VIDEO_PRIORITIES,
  PILLAR_OPTIONS,
  DEFAULT_CHECKLIST,
  playlistColorClass,
} from "@/lib/youtube-types";

interface VideoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: VideoCardFormData) => void;
  initialData?: VideoCard | null;
  loading?: boolean;
  playlists: Playlist[];
  onManagePlaylists: () => void;
}

const defaultFormData: VideoCardFormData = {
  title: "",
  hook: "",
  notes: "",
  status: "Idea",
  priority: "Medium",
  pillar: "",
  playlistIds: [],
  tags: [],
  targetDate: null,
  videoUrl: "",
  checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c })),
};

/** YYYY-MM-DD for <input type="date"> */
function toDateInput(date: string | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function VideoFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
  playlists,
  onManagePlaylists,
}: VideoFormDialogProps) {
  const isCustomPillar = initialData
    ? !!initialData.pillar && !PILLAR_OPTIONS.includes(initialData.pillar)
    : false;
  const [otherPillar, setOtherPillar] = useState(isCustomPillar);
  const [tagInput, setTagInput] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const [form, setForm] = useState<VideoCardFormData>(
    initialData
      ? {
          title: initialData.title,
          hook: initialData.hook,
          notes: initialData.notes,
          status: initialData.status,
          priority: initialData.priority,
          pillar: initialData.pillar,
          playlistIds: [...initialData.playlistIds],
          tags: [...initialData.tags],
          targetDate: initialData.targetDate,
          videoUrl: initialData.videoUrl,
          checklist: initialData.checklist.map((c) => ({ ...c })),
        }
      : defaultFormData,
  );

  const update = <K extends keyof VideoCardFormData>(
    key: K,
    value: VideoCardFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, "");
    if (tag && !form.tags.includes(tag)) {
      update("tags", [...form.tags, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    update(
      "tags",
      form.tags.filter((t) => t !== tag),
    );

  const togglePlaylist = (id: string) =>
    update(
      "playlistIds",
      form.playlistIds.includes(id)
        ? form.playlistIds.filter((p) => p !== id)
        : [...form.playlistIds, id],
    );

  const toggleChecklist = (index: number) =>
    update(
      "checklist",
      form.checklist.map((c, i) =>
        i === index ? { ...c, done: !c.done } : c,
      ),
    );

  const removeChecklist = (index: number) =>
    update(
      "checklist",
      form.checklist.filter((_, i) => i !== index),
    );

  const addChecklist = () => {
    const label = newChecklistItem.trim();
    if (label) {
      const item: ChecklistItem = { label, done: false };
      update("checklist", [...form.checklist, item]);
    }
    setNewChecklistItem("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Video" : "Add Video Idea"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="How I built my dashboard in a weekend"
              required
            />
          </div>

          {/* Hook */}
          <div className="space-y-1.5">
            <Label htmlFor="hook">Hook / One-liner</Label>
            <Input
              id="hook"
              value={form.hook}
              onChange={(e) => update("hook", e.target.value)}
              placeholder="The angle that makes people click"
            />
          </div>

          {/* Row: Status, Priority, Pillar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  update("status", v as VideoCardFormData["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
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
                  update("priority", v as VideoCardFormData["priority"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Pillar</Label>
              {otherPillar ? (
                <div className="flex gap-1">
                  <Input
                    value={form.pillar}
                    onChange={(e) => update("pillar", e.target.value)}
                    placeholder="Series / topic"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setOtherPillar(false);
                      update("pillar", "");
                    }}
                  >
                    List
                  </Button>
                </div>
              ) : (
                <Select
                  value={form.pillar || "__none__"}
                  onValueChange={(v) => {
                    if (v === "__other__") {
                      setOtherPillar(true);
                      update("pillar", "");
                    } else if (v === "__none__") {
                      update("pillar", "");
                    } else if (v) {
                      update("pillar", v);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {PILLAR_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                    <SelectItem value="__other__">Other…</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Row: Target Date, Video URL */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="targetDate">Target Publish Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={toDateInput(form.targetDate)}
                onChange={(e) =>
                  update(
                    "targetDate",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  )
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                value={form.videoUrl}
                onChange={(e) => update("videoUrl", e.target.value)}
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>

          {/* Playlists */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Playlists</Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={onManagePlaylists}
              >
                <ListMusic className="mr-1 h-3 w-3" />
                Manage
              </Button>
            </div>
            {playlists.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No playlists yet — use “Manage” to create one.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {playlists.map((p) => {
                  const selected = form.playlistIds.includes(p._id);
                  return (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => togglePlaylist(p._id)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${playlistColorClass(p.color)} ${selected ? "ring-2 ring-foreground/40" : "opacity-50 hover:opacity-100"}`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-1">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag and press Enter"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={addTag}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="space-y-1.5">
            <Label>Production Checklist</Label>
            <div className="space-y-1">
              {form.checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklist(i)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span
                    className={`flex-1 text-sm ${item.done ? "text-muted-foreground line-through" : ""}`}
                  >
                    {item.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeChecklist(i)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-1 pt-1">
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChecklist();
                  }
                }}
                placeholder="Add a task"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={addChecklist}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Script Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Outline, talking points, references…"
              rows={4}
            />
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading
              ? "Saving…"
              : initialData
                ? "Update Video"
                : "Add Video"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
