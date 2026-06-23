"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { ListMusic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { KanbanBoard } from "@/components/youtube/kanban-board";
import { VideoList } from "@/components/youtube/video-list";
import { VideoFormDialog } from "@/components/youtube/video-form-dialog";
import { PlaylistManagerDialog } from "@/components/youtube/playlist-manager-dialog";
import {
  type VideoCard,
  type VideoCardFormData,
  type VideoStatus,
  type Playlist,
  type PlaylistFormData,
  VIDEO_STATUSES,
} from "@/lib/youtube-types";

type ViewMode = "board" | "list";

export default function YoutubeClient() {
  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPlaylist, setSavingPlaylist] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoCard | null>(null);
  const [view, setView] = useState<ViewMode>("board");
  const [pillarFilter, setPillarFilter] = useState("All");
  const [playlistFilter, setPlaylistFilter] = useState("All");

  const fetchData = useCallback(async () => {
    try {
      const [videosRes, playlistsRes] = await Promise.all([
        fetch("/api/youtube"),
        fetch("/api/youtube/playlists"),
      ]);
      if (!videosRes.ok || !playlistsRes.ok) throw new Error("Failed to fetch");
      const videosData: VideoCard[] = await videosRes.json();
      // Older videos predate these array fields — normalize so they're iterable.
      setVideos(
        videosData.map((v) => ({
          ...v,
          playlistIds: v.playlistIds ?? [],
          tags: v.tags ?? [],
          checklist: v.checklist ?? [],
        })),
      );
      setPlaylists(await playlistsRes.json());
    } catch {
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (data: VideoCardFormData) => {
    setSaving(true);
    try {
      if (editingVideo) {
        const res = await fetch(`/api/youtube/${editingVideo._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        setVideos((prev) =>
          prev.map((v) => (v._id === updated._id ? updated : v)),
        );
        toast.success("Video updated");
      } else {
        const res = await fetch("/api/youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setVideos((prev) => [created, ...prev]);
        toast.success("Video added");
      }
      setDialogOpen(false);
      setEditingVideo(null);
    } catch {
      toast.error("Failed to save video");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/youtube/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setVideos((prev) => prev.filter((v) => v._id !== id));
      toast.success("Video deleted");
    } catch {
      toast.error("Failed to delete video");
    }
  };

  const handleEdit = (video: VideoCard) => {
    setEditingVideo(video);
    setDialogOpen(true);
  };

  const handleStatusChange = async (id: string, status: VideoStatus) => {
    const video = videos.find((v) => v._id === id);
    if (!video || video.status === status) return;

    // Optimistic update
    setVideos((prev) =>
      prev.map((v) => (v._id === id ? { ...v, status } : v)),
    );

    try {
      const res = await fetch(`/api/youtube/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch {
      // Revert on failure
      setVideos((prev) =>
        prev.map((v) => (v._id === id ? { ...v, status: video.status } : v)),
      );
      toast.error("Failed to update status");
    }
  };

  const handleCreatePlaylist = async (data: PlaylistFormData) => {
    setSavingPlaylist(true);
    try {
      const res = await fetch("/api/youtube/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      const created = await res.json();
      setPlaylists((prev) => [...prev, created]);
      toast.success("Playlist created");
    } catch {
      toast.error("Failed to create playlist");
    } finally {
      setSavingPlaylist(false);
    }
  };

  const handleUpdatePlaylist = async (id: string, data: PlaylistFormData) => {
    setSavingPlaylist(true);
    try {
      const res = await fetch(`/api/youtube/playlists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setPlaylists((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p)),
      );
      toast.success("Playlist updated");
    } catch {
      toast.error("Failed to update playlist");
    } finally {
      setSavingPlaylist(false);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    try {
      const res = await fetch(`/api/youtube/playlists/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setPlaylists((prev) => prev.filter((p) => p._id !== id));
      // The playlist was detached server-side; mirror that locally.
      setVideos((prev) =>
        prev.map((v) =>
          v.playlistIds.includes(id)
            ? { ...v, playlistIds: v.playlistIds.filter((pid) => pid !== id) }
            : v,
        ),
      );
      if (playlistFilter === id) setPlaylistFilter("All");
      toast.success("Playlist deleted");
    } catch {
      toast.error("Failed to delete playlist");
    }
  };

  const pillars = useMemo(() => {
    const set = new Set(videos.map((v) => v.pillar).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [videos]);

  const playlistVideoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of videos) {
      for (const id of v.playlistIds) {
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }
    return counts;
  }, [videos]);

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchPillar = pillarFilter === "All" || v.pillar === pillarFilter;
      const matchPlaylist =
        playlistFilter === "All" || v.playlistIds.includes(playlistFilter);
      return matchPillar && matchPlaylist;
    });
  }, [videos, pillarFilter, playlistFilter]);

  const publishedCount = videos.filter((v) => v.status === "Published").length;
  const inProgressCount = videos.filter(
    (v) => v.status !== "Idea" && v.status !== "Published",
  ).length;

  const openNew = () => {
    setEditingVideo(null);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading videos…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">YouTube Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {videos.length} video{videos.length !== 1 ? "s" : ""} ·{" "}
            {inProgressCount} in progress · {publishedCount} published
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pillars.length > 1 && (
            <select
              value={pillarFilter}
              onChange={(e) => setPillarFilter(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              {pillars.map((p) => (
                <option key={p} value={p}>
                  {p === "All" ? "All pillars" : p}
                </option>
              ))}
            </select>
          )}
          {playlists.length > 0 && (
            <select
              value={playlistFilter}
              onChange={(e) => setPlaylistFilter(e.target.value)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value="All">All playlists</option>
              {playlists.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPlaylistDialogOpen(true)}
          >
            <ListMusic className="mr-1.5 h-4 w-4" />
            Playlists
          </Button>
          <ToggleGroup<ViewMode>
            items={[
              { value: "board", label: "Board" },
              { value: "list", label: "List" },
            ]}
            value={view}
            onValueChange={setView}
          />
          <Button size="sm" onClick={openNew}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Video
          </Button>
        </div>
      </div>

      {/* View */}
      {view === "board" ? (
        <KanbanBoard
          videos={filteredVideos}
          playlists={playlists}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onAddVideo={openNew}
        />
      ) : (
        <VideoList
          videos={[...filteredVideos].sort(
            (a, b) =>
              VIDEO_STATUSES.indexOf(a.status) -
              VIDEO_STATUSES.indexOf(b.status),
          )}
          playlists={playlists}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Form Dialog */}
      <VideoFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingVideo(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingVideo}
        loading={saving}
        playlists={playlists}
        onManagePlaylists={() => setPlaylistDialogOpen(true)}
        key={editingVideo?._id ?? "new"}
      />

      {/* Playlist Manager */}
      <PlaylistManagerDialog
        open={playlistDialogOpen}
        onOpenChange={setPlaylistDialogOpen}
        playlists={playlists}
        videoCounts={playlistVideoCounts}
        onCreate={handleCreatePlaylist}
        onUpdate={handleUpdatePlaylist}
        onDelete={handleDeletePlaylist}
        saving={savingPlaylist}
      />
    </div>
  );
}
