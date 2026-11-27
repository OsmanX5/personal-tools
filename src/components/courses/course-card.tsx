"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Calendar,
} from "lucide-react";
import {
  type Course,
  STATUS_COLORS,
  PRIORITY_COLORS,
} from "@/lib/courses-types";
import { Minus, Plus } from "lucide-react";

interface CourseCardProps {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  onUpdateProgress?: (id: string, completedLessons: number) => void;
  defaultExpanded?: boolean;
}

export function CourseCard({
  course,
  onEdit,
  onDelete,
  onUpdateProgress,
  defaultExpanded = false,
}: CourseCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const progressPercent =
    course.totalLessons > 0
      ? Math.round((course.completedLessons / course.totalLessons) * 100)
      : null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Card
      className={`border-l-4 transition-shadow hover:shadow-md py-2 ${STATUS_COLORS[course.status]}`}
    >
      <CardContent
        className={`${expanded ? "space-y-2.5 px-3 py-0" : "px-3 py-0"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-1">
          <div
            className="min-w-0 flex-1 cursor-pointer"
            onClick={() => (expanded ? setExpanded(false) : onEdit(course))}
          >
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold">
                {course.title}
              </span>
              {course.url && (
                <a
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-0.5 shrink-0 text-muted-foreground hover:text-foreground"
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
              {!expanded && progressPercent !== null && (
                <span className="text-xs text-muted-foreground">
                  · {progressPercent}%
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-0.5">
            {expanded && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onEdit(course)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive hover:text-destructive"
                  onClick={() => onDelete(course._id)}
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

        {/* Expanded details */}
        {expanded && (
          <>
            {/* Badges row */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="gap-1 text-[10px]">
                <BookOpen className="h-2.5 w-2.5" />
                {course.type}
              </Badge>
              <Badge
                className={`text-[10px] ${PRIORITY_COLORS[course.priority]}`}
              >
                {course.priority}
              </Badge>
            </div>

            {/* Progress bar */}
            {course.totalLessons > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {course.completedLessons} / {course.totalLessons} lessons
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onUpdateProgress && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-5 w-5"
                          disabled={course.completedLessons <= 0}
                          onClick={() =>
                            onUpdateProgress(
                              course._id,
                              course.completedLessons - 1,
                            )
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-5 w-5"
                          disabled={
                            course.completedLessons >= course.totalLessons
                          }
                          onClick={() =>
                            onUpdateProgress(
                              course._id,
                              course.completedLessons + 1,
                            )
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <span>{progressPercent}%</span>
                  </div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tags */}
            {course.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {course.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Dates */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {formatDate(course.startDate) && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Started: {formatDate(course.startDate)}
                </span>
              )}
              {formatDate(course.completionDate) && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Completed: {formatDate(course.completionDate)}
                </span>
              )}
            </div>

            {/* URL link */}
            {course.url && (
              <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Open Course
              </a>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
