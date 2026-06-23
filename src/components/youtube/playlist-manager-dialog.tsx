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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  type Playlist,
  type PlaylistColor,
  type PlaylistFormData,
  PLAYLIST_COLORS,
  PLAYLIST_COLOR_SWATCHES,
  playlistColorClass,
  DEFAULT_PLAYLIST_COLOR,
} from "@/lib/youtube-types";

interface PlaylistManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlists: Playlist[];
  videoCounts: Record<string, number>;
  onCreate: (data: PlaylistFormData) => void;
  onUpdate: (id: string, data: PlaylistFormData) => void;
  onDelete: (id: string) => void;
  saving?: boolean;
}

const emptyForm: PlaylistFormData = {
  name: "",
  description: "",
  color: DEFAULT_PLAYLIST_COLOR,
};

export function PlaylistManagerDialog({
  open,
  onOpenChange,
  playlists,
  videoCounts,
  onCreate,
  onUpdate,
  onDelete,
  saving,
}: PlaylistManagerDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlaylistFormData>(emptyForm);

  const update = <K extends keyof PlaylistFormData>(
    key: K,
    value: PlaylistFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const startEdit = (playlist: Playlist) => {
    setEditingId(playlist._id);
    setForm({
      name: playlist.name,
      description: playlist.description,
      color: playlist.color,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      onUpdate(editingId, form);
    } else {
      onCreate(form);
    }
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Playlists</DialogTitle>
        </DialogHeader>

        {/* Existing playlists */}
        {playlists.length > 0 && (
          <ScrollArea className="max-h-56 rounded-lg border">
            <div className="divide-y">
              {playlists.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center justify-between gap-2 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`inline-block h-3 w-3 shrink-0 rounded-full ${PLAYLIST_COLOR_SWATCHES[p.color as PlaylistColor] ?? ""}`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      {p.description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {videoCounts[p._id] ?? 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEdit(p)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => {
                        onDelete(p._id);
                        if (editingId === p._id) resetForm();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Create / edit form */}
        <form onSubmit={handleSave} className="grid gap-3 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">
              {editingId ? "Edit playlist" : "New playlist"}
            </Label>
            {editingId && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={resetForm}
              >
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pl-name">Name *</Label>
            <Input
              id="pl-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Beginner Series"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pl-desc">Description</Label>
            <Textarea
              id="pl-desc"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What this playlist is about"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {PLAYLIST_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => update("color", c)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${PLAYLIST_COLOR_SWATCHES[c]} ${form.color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
                  aria-label={c}
                >
                  {form.color === c && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${playlistColorClass(form.color)}`}
            >
              {form.name || "Preview"}
            </span>
          </div>

          <Button type="submit" size="sm" disabled={saving}>
            {editingId ? (
              "Save Playlist"
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" />
                Add Playlist
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
