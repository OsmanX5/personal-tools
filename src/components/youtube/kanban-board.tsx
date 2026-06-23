"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { VideoCardComponent } from "@/components/youtube/video-card";
import {
  type VideoCard,
  type VideoStatus,
  type Playlist,
  VIDEO_STATUSES,
  STATUS_HEADER_COLORS,
} from "@/lib/youtube-types";

interface KanbanBoardProps {
  videos: VideoCard[];
  playlists: Playlist[];
  onEdit: (video: VideoCard) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: VideoStatus) => void;
  onAddVideo: () => void;
}

export function KanbanBoard({
  videos,
  playlists,
  onEdit,
  onDelete,
  onStatusChange,
  onAddVideo,
}: KanbanBoardProps) {
  const columns = VIDEO_STATUSES.map((status) => ({
    status,
    videos: videos.filter((v) => v.status === status),
  }));

  return (
    <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-4">
      {columns.map(({ status, videos: columnVideos }) => (
        <div
          key={status}
          className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("ring-2", "ring-primary/30");
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("ring-2", "ring-primary/30");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("ring-2", "ring-primary/30");
            const videoId = e.dataTransfer.getData("text/plain");
            if (videoId) {
              onStatusChange(videoId, status);
            }
          }}
        >
          {/* Column Header */}
          <div
            className={`flex items-center justify-between rounded-t-lg px-3 py-2 ${STATUS_HEADER_COLORS[status]}`}
          >
            <h2 className="text-sm font-semibold text-white dark:text-foreground">
              {status}
            </h2>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 dark:bg-foreground/10 text-xs font-medium text-white dark:text-foreground">
              {columnVideos.length}
            </span>
          </div>

          {/* Cards */}
          <ScrollArea
            className="flex-1 px-2 py-2"
            style={{ maxHeight: "calc(100vh - 220px)" }}
          >
            <div className="flex flex-col gap-2">
              {columnVideos.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Nothing here
                </p>
              )}
              {columnVideos.map((video) => (
                <div
                  key={video._id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", video._id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <VideoCardComponent
                    video={video}
                    playlists={playlists}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Add Video button at bottom of Idea column */}
          {status === "Idea" && (
            <div className="px-2 pb-2">
              <Button
                variant="ghost"
                className="w-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                onClick={onAddVideo}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Idea
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
