"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import {
  type VideoCard,
  type Playlist,
  STATUS_HEADER_COLORS,
  PRIORITY_COLORS,
  playlistColorClass,
} from "@/lib/youtube-types";

interface VideoListProps {
  videos: VideoCard[];
  playlists: Playlist[];
  onEdit: (video: VideoCard) => void;
  onDelete: (id: string) => void;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function VideoList({
  videos,
  playlists,
  onEdit,
  onDelete,
}: VideoListProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">No videos to show.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1 rounded-lg border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/60 backdrop-blur">
          <tr className="text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Title</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Priority</th>
            <th className="px-3 py-2 font-medium">Pillar</th>
            <th className="px-3 py-2 font-medium">Playlists</th>
            <th className="px-3 py-2 font-medium">Target</th>
            <th className="px-3 py-2 font-medium">Progress</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => {
            const doneCount = video.checklist.filter((c) => c.done).length;
            const totalCount = video.checklist.length;
            const isOverdue =
              video.targetDate != null &&
              video.status !== "Published" &&
              new Date(video.targetDate) < new Date(new Date().toDateString());
            return (
              <tr
                key={video._id}
                className="border-t transition-colors hover:bg-muted/30"
              >
                <td className="max-w-[260px] px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{video.title}</span>
                    {video.videoUrl && (
                      <a
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-white dark:text-foreground ${STATUS_HEADER_COLORS[video.status]}`}
                  >
                    {video.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[video.priority]}`}
                  >
                    {video.priority}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {video.pillar || "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {playlists
                      .filter((p) => video.playlistIds.includes(p._id))
                      .map((p) => (
                        <span
                          key={p._id}
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${playlistColorClass(p.color)}`}
                        >
                          {p.name}
                        </span>
                      ))}
                    {video.playlistIds.length === 0 && (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </td>
                <td
                  className={`px-3 py-2 ${isOverdue ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}`}
                >
                  {formatDate(video.targetDate)}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {totalCount ? `${doneCount}/${totalCount}` : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(video)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(video._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ScrollArea>
  );
}
