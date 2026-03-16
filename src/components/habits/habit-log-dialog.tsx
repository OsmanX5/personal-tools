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
import type { Habit, HabitLog } from "@/lib/habit-types";

interface HabitLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit;
  /** Pre-existing log for the selected date (for editing / un-logging) */
  existingLog?: HabitLog | null;
  /** The date to log for (ISO date string yyyy-mm-dd) */
  date: string;
  onSubmit: (data: {
    habitId: string;
    date: string;
    value?: number;
    note?: string;
  }) => void;
  loading?: boolean;
}

export function HabitLogDialog({
  open,
  onOpenChange,
  habit,
  existingLog,
  date,
  onSubmit,
  loading,
}: HabitLogDialogProps) {
  const [value, setValue] = useState(
    existingLog?.value != null ? String(existingLog.value) : "",
  );
  const [note, setNote] = useState(existingLog?.note ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      habitId: habit._id,
      date,
      value: habit.hasValue && value ? parseFloat(value) : undefined,
      note: note.trim() || undefined,
    });
  };

  const isEdit = !!existingLog;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Log" : "Log"} — {habit.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{date}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {habit.hasValue && (
            <div className="space-y-1.5">
              <Label htmlFor="log-value">
                Value{habit.unit ? ` (${habit.unit})` : ""}
                {habit.targetValue != null && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    target: {habit.targetValue}
                  </span>
                )}
              </Label>
              <Input
                id="log-value"
                type="number"
                step="any"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  habit.targetValue ? String(habit.targetValue) : "0"
                }
                required
                autoFocus
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="log-note">Note</Label>
            <Textarea
              id="log-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note…"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : isEdit ? "Update" : "Log"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
