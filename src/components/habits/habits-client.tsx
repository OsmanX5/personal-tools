"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { HabitCard } from "@/components/habits/habit-card";
import { HabitsOverview } from "@/components/habits/habits-overview";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { HabitLogDialog } from "@/components/habits/habit-log-dialog";
import {
  type Habit,
  type HabitFormData,
  type HabitLog,
  type HabitWithStats,
  calculateCurrentStreak,
  calculateLongestStreak,
  toMidnightUTC,
} from "@/lib/habit-types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayUTCStr(): string {
  return toMidnightUTC().toISOString().split("T")[0];
}

/** Enrich habits with streak stats and recent log data */
function enrichHabits(
  habits: Habit[],
  logs: HabitLog[],
  today: string,
): HabitWithStats[] {
  const todayMs = toMidnightUTC(new Date(today)).getTime();

  return habits.map((habit) => {
    const habitLogs = logs
      .filter((l) => l.habitId === habit._id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Keep last 60 days for heatmap
    const cutoff = todayMs - 60 * 86_400_000;
    const recentLogs = habitLogs.filter(
      (l) => toMidnightUTC(new Date(l.date)).getTime() >= cutoff,
    );

    const todayLog = habitLogs.find(
      (l) => toMidnightUTC(new Date(l.date)).getTime() === todayMs,
    );

    return {
      ...habit,
      currentStreak: calculateCurrentStreak(
        habitLogs,
        habit.frequency,
        habit.frequencyInterval,
      ),
      longestStreak: calculateLongestStreak(
        habitLogs,
        habit.frequency,
        habit.frequencyInterval,
      ),
      todayLog,
      recentLogs,
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HabitsClient() {
  const today = useMemo(() => todayUTCStr(), []);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Habit form dialog
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);

  // Log dialog (check-off / value entry)
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [loggingHabit, setLoggingHabit] = useState<HabitWithStats | null>(null);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      // Fetch habits and last 60 days of logs in parallel
      const from = new Date(
        toMidnightUTC().getTime() - 60 * 86_400_000,
      ).toISOString();
      const [habitsRes, logsRes] = await Promise.all([
        fetch("/api/habits"),
        fetch(`/api/habits/logs?from=${encodeURIComponent(from)}`),
      ]);
      if (!habitsRes.ok || !logsRes.ok) throw new Error("Failed to fetch");
      const [habitsData, logsData] = await Promise.all([
        habitsRes.json(),
        logsRes.json(),
      ]);
      setHabits(habitsData);
      setLogs(logsData);
    } catch {
      toast.error("Failed to load habits data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Derived / enriched habits ───────────────────────────────────────────────

  const enrichedHabits = useMemo(
    () => enrichHabits(habits, logs, today),
    [habits, logs, today],
  );

  // ─── Habit CRUD ─────────────────────────────────────────────────────────────

  const handleHabitSubmit = async (data: HabitFormData) => {
    setSaving(true);
    try {
      if (editingHabit) {
        const res = await fetch(`/api/habits/${editingHabit._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated: Habit = await res.json();
        setHabits((prev) =>
          prev.map((h) => (h._id === updated._id ? updated : h)),
        );
        toast.success("Habit updated");
      } else {
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created: Habit = await res.json();
        setHabits((prev) => [...prev, created]);
        toast.success("Habit created");
      }
      setHabitDialogOpen(false);
      setEditingHabit(null);
    } catch {
      toast.error("Failed to save habit");
    } finally {
      setSaving(false);
    }
  };

  const handleHabitDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/habits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setHabits((prev) => prev.filter((h) => h._id !== id));
      setLogs((prev) => prev.filter((l) => l.habitId !== id));
      toast.success("Habit deleted");
    } catch {
      toast.error("Failed to delete habit");
    }
  };

  // ─── Log CRUD ───────────────────────────────────────────────────────────────

  /** Called when user clicks "Mark done" or "Log value…" */
  const handleCheckOff = (habit: HabitWithStats) => {
    setLoggingHabit(habit);
    setLogDialogOpen(true);
  };

  const submitLog = async (data: {
    habitId: string;
    date: string;
    value?: number;
    note?: string;
  }) => {
    setSaving(true);
    try {
      const res = await fetch("/api/habits/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to log");
      const created: HabitLog = await res.json();
      setLogs((prev) => [created, ...prev]);
      toast.success("Logged!");
      setLogDialogOpen(false);
      setLoggingHabit(null);
    } catch {
      toast.error("Failed to log habit");
    } finally {
      setSaving(false);
    }
  };

  const handleUnlog = async (log: HabitLog) => {
    try {
      const res = await fetch(`/api/habits/logs/${log._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to unlog");
      setLogs((prev) => prev.filter((l) => l._id !== log._id));
      toast.success("Removed log");
    } catch {
      toast.error("Failed to remove log");
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading habits…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Habits Tracker</h1>
          <p className="text-sm text-muted-foreground">
            {enrichedHabits.length} habit
            {enrichedHabits.length !== 1 ? "s" : ""} — {today}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingHabit(null);
            setHabitDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Habit
        </Button>
      </div>

      {enrichedHabits.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <p>No habits yet. Create your first habit to get started!</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <HabitsOverview habits={enrichedHabits} />

          {/* Habit cards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrichedHabits.map((habit) => (
              <HabitCard
                key={habit._id}
                habit={habit}
                today={today}
                onCheckOff={handleCheckOff}
                onUnlog={handleUnlog}
                onEdit={(h) => {
                  setEditingHabit(h);
                  setHabitDialogOpen(true);
                }}
                onDelete={handleHabitDelete}
              />
            ))}
          </div>
        </>
      )}

      {/* Habit form dialog */}
      <HabitFormDialog
        open={habitDialogOpen}
        onOpenChange={(open) => {
          setHabitDialogOpen(open);
          if (!open) setEditingHabit(null);
        }}
        onSubmit={handleHabitSubmit}
        initialData={editingHabit}
        loading={saving}
        key={editingHabit?._id ?? "new-habit"}
      />

      {/* Log dialog */}
      {loggingHabit && (
        <HabitLogDialog
          open={logDialogOpen}
          onOpenChange={(open) => {
            setLogDialogOpen(open);
            if (!open) setLoggingHabit(null);
          }}
          habit={loggingHabit}
          existingLog={loggingHabit.todayLog}
          date={today}
          onSubmit={submitLog}
          loading={saving}
          key={`log-${loggingHabit._id}`}
        />
      )}
    </div>
  );
}
