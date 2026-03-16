"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Flame, Pencil, Trash2, TrendingUp } from "lucide-react";
import {
  type HabitWithStats,
  type HabitLog,
  toMidnightUTC,
} from "@/lib/habit-types";

interface HabitCardProps {
  habit: HabitWithStats;
  /** ISO date string of "today" (e.g. 2026-03-16) */
  today: string;
  onCheckOff: (habit: HabitWithStats) => void;
  onUnlog: (log: HabitLog) => void;
  onEdit: (habit: HabitWithStats) => void;
  onDelete: (id: string) => void;
}

/** Returns a YYYY-MM-DD string from a Date (UTC) */
function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Build a 60-element array of { dateStr, logged } working backwards from today */
function buildHeatmap(logs: HabitLog[], today: string) {
  const todayMs = toMidnightUTC(new Date(today)).getTime();
  const loggedSet = new Set(
    logs.map((l) => toMidnightUTC(new Date(l.date)).getTime()),
  );

  return Array.from({ length: 60 }, (_, i) => {
    const ms = todayMs - i * 86_400_000;
    return {
      dateStr: toDateStr(new Date(ms)),
      logged: loggedSet.has(ms),
    };
  }).reverse();
}

export function HabitCard({
  habit,
  today,
  onCheckOff,
  onUnlog,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDoneToday = !!habit.todayLog;

  const heatmap = useMemo(
    () => buildHeatmap(habit.recentLogs, today),
    [habit.recentLogs, today],
  );

  return (
    <Card className="flex flex-col gap-3 p-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {/* Color dot */}
          <span
            className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: habit.color }}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{habit.name}</p>
            {habit.description && (
              <p className="truncate text-xs text-muted-foreground">
                {habit.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onEdit(habit)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {confirmDelete ? (
            <>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete(habit._id);
                }}
              >
                Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {habit.category && (
          <Badge variant="secondary" className="text-xs">
            {habit.category}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs capitalize">
          {habit.frequency === "custom"
            ? `Every ${habit.frequencyInterval}d`
            : habit.frequency}
        </Badge>
        {habit.hasValue && habit.targetValue != null && (
          <Badge variant="outline" className="text-xs">
            <TrendingUp className="mr-1 h-3 w-3" />
            Target: {habit.targetValue} {habit.unit}
          </Badge>
        )}
      </div>

      {/* Streak badges */}
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1 font-medium">
          <Flame className="h-4 w-4 text-orange-500" />
          {habit.currentStreak}
          <span className="text-xs text-muted-foreground">streak</span>
        </span>
        <span className="text-xs text-muted-foreground">
          best: {habit.longestStreak}
        </span>
      </div>

      {/* Today's value (if quantitative and logged) */}
      {habit.hasValue && habit.todayLog && (
        <div className="text-xs text-muted-foreground">
          Today:{" "}
          <span className="font-semibold text-foreground">
            {habit.todayLog.value} {habit.unit}
          </span>
          {habit.targetValue != null && (
            <span>
              {" "}
              / {habit.targetValue} {habit.unit}
            </span>
          )}
        </div>
      )}

      {/* 60-day heatmap */}
      <div className="flex flex-wrap gap-0.5">
        {heatmap.map(({ dateStr, logged }) => (
          <div
            key={dateStr}
            className={
              logged
                ? "h-2.5 w-2.5 rounded-sm"
                : "h-2.5 w-2.5 rounded-sm bg-muted"
            }
            style={{
              backgroundColor: logged ? habit.color : undefined,
            }}
            title={dateStr}
          />
        ))}
      </div>

      {/* Check-off / unlog */}
      <div className="flex gap-2">
        {isDoneToday ? (
          <Button
            variant="outline"
            size="sm"
            className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/40"
            onClick={() => onUnlog(habit.todayLog!)}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Done today — undo
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => onCheckOff(habit)}
            style={{ backgroundColor: habit.color, borderColor: habit.color }}
            className="text-white hover:opacity-90"
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            {habit.hasValue ? "Log value…" : "Mark done"}
          </Button>
        )}
      </div>
    </Card>
  );
}
