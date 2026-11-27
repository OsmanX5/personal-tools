"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Pencil,
  Trash2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  ListChecks,
} from "lucide-react";
import {
  type VideoCard,
  type Playlist,
  STATUS_COLORS,
  PRIORITY_COLORS,
  playlistColorClass,
} from "@/lib/youtube-types";

interface VideoCardComponentProps {
  video: VideoCard;
  playlists: Playlist[];
  onEdit: (video: VideoCard) => void;
  onDelete: (id: string) => void;
}

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function VideoCardComponent({
  video,
  playlists,
  onEdit,
  onDelete,
}: VideoCardComponentProps) {
  const [expanded, setExpanded] = useState(false);

  const videoPlaylists = playlists.filter((p) =>
    video.playlistIds.includes(p._id),
  );

  const doneCount = video.checklist.filter((c) => c.done).length;
  const totalCount = video.checklist.length;
  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const isOverdue =
    video.targetDate != null &&
    video.status !== "Published" &&
    new Date(video.targetDate) < new Date(new Date().toDateString());

  return (
    <Card
      className={`border-l-4 transition-shadow hover:shadow-md py-2 ${STATUS_COLORS[video.status]}`}
    >
      <CardContent
        className={`${expanded ? "space-y-2.5 px-3 py-0" : "px-2 py-0"}`}
      >
        {/* Header: Title & toggle */}
        <div className="flex items-start justify-between gap-1">
          <div
            className="min-w-0 flex-1 cursor-pointer"
            onClick={() => (expanded ? setExpanded(false) : onEdit(video))}
          >
            <h3 className="truncate text-xs font-semibold">{video.title}</h3>
            {!expanded && video.hook && (
              <p className="truncate text-[10px] text-muted-foreground">
                {video.hook}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-0.5">
            {expanded && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onEdit(video)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive hover:text-destructive"
                  onClick={() => onDelete(video._id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Meta row (always visible) */}
        <div className="flex flex-wrap items-center gap-1.5 pb-1">
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[video.priority]}`}
          >
            {video.priority}
          </span>
          {video.pillar && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Layers className="h-2.5 w-2.5" />
              {video.pillar}
            </Badge>
          )}
          {video.targetDate && (
            <Badge
              variant="outline"
              className={`gap-1 text-[10px] ${isOverdue ? "border-rose-400 text-rose-600 dark:text-rose-400" : ""}`}
            >
              <Calendar className="h-2.5 w-2.5" />
              {formatDate(video.targetDate)}
            </Badge>
          )}
          {videoPlaylists.map((p) => (
            <span
              key={p._id}
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${playlistColorClass(p.color)}`}
            >
              {p.name}
            </span>
          ))}
        </div>

        {/* Checklist progress (always visible) */}
        {totalCount > 0 && (
          <div className="flex items-center gap-1.5 pb-1">
            <ListChecks className="h-3 w-3 shrink-0 text-muted-foreground" />
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {doneCount}/{totalCount}
            </span>
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <>
            {video.hook && (
              <p className="text-xs text-muted-foreground">{video.hook}</p>
            )}

            {video.notes && (
              <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                {video.notes}
              </p>
            )}

            {video.checklist.length > 0 && (
              <ul className="space-y-0.5">
                {video.checklist.map((item, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-1.5 text-[11px] ${item.done ? "text-muted-foreground line-through" : ""}`}
                  >
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-sm border ${item.done ? "bg-primary border-primary" : "border-muted-foreground/40"}`}
                    />
                    {item.label}
                  </li>
                ))}
              </ul>
            )}

            {video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {video.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {video.videoUrl && (
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Watch video
              </a>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
