"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Target, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WeightEntryCard } from "@/components/weight/weight-entry-card";
import { WeightEntryFormDialog } from "@/components/weight/weight-entry-form-dialog";
import { WeightGoalCard } from "@/components/weight/weight-goal-card";
import { WeightGoalFormDialog } from "@/components/weight/weight-goal-form-dialog";
import {
  type WeightEntry,
  type WeightEntryFormData,
  type WeightGoal,
  type WeightGoalFormData,
  getBmiCategory,
  BMI_CATEGORY_COLORS,
} from "@/lib/weight-types";

export default function WeightClient() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [goals, setGoals] = useState<WeightGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Entry dialog state
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);

  // Goal dialog state
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WeightGoal | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [entriesRes, goalsRes] = await Promise.all([
        fetch("/api/weight"),
        fetch("/api/weight/goals"),
      ]);
      if (!entriesRes.ok || !goalsRes.ok) throw new Error("Failed to fetch");
      const [entriesData, goalsData] = await Promise.all([
        entriesRes.json(),
        goalsRes.json(),
      ]);
      setEntries(entriesData);
      setGoals(goalsData);
    } catch {
      toast.error("Failed to load weight data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived stats
  const latestEntry = useMemo(
    () => (entries.length > 0 ? entries[0] : null),
    [entries],
  );

  const activeGoal = useMemo(
    () => goals.find((g) => g.status === "Active") ?? null,
    [goals],
  );

  // ─── Entry CRUD ───────────────────────────────────────
  const handleEntrySubmit = async (data: WeightEntryFormData) => {
    setSaving(true);
    try {
      if (editingEntry) {
        const res = await fetch(`/api/weight/${editingEntry._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        setEntries((prev) =>
          prev.map((e) => (e._id === updated._id ? updated : e)),
        );
        toast.success("Entry updated");
      } else {
        const res = await fetch("/api/weight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setEntries((prev) => [created, ...prev]);
        toast.success("Weight logged");
      }
      setEntryDialogOpen(false);
      setEditingEntry(null);
    } catch {
      toast.error("Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const handleEntryDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/weight/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setEntries((prev) => prev.filter((e) => e._id !== id));
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  const handleEntryEdit = (entry: WeightEntry) => {
    setEditingEntry(entry);
    setEntryDialogOpen(true);
  };

  // ─── Goal CRUD ────────────────────────────────────────
  const handleGoalSubmit = async (data: WeightGoalFormData) => {
    setSaving(true);
    try {
      if (editingGoal) {
        const res = await fetch(`/api/weight/goals/${editingGoal._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        setGoals((prev) =>
          prev.map((g) => (g._id === updated._id ? updated : g)),
        );
        toast.success("Goal updated");
      } else {
        const res = await fetch("/api/weight/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setGoals((prev) => [created, ...prev]);
        toast.success("Goal created");
      }
      setGoalDialogOpen(false);
      setEditingGoal(null);
    } catch {
      toast.error("Failed to save goal");
    } finally {
      setSaving(false);
    }
  };

  const handleGoalDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/weight/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setGoals((prev) => prev.filter((g) => g._id !== id));
      toast.success("Goal deleted");
    } catch {
      toast.error("Failed to delete goal");
    }
  };

  const handleGoalEdit = (goal: WeightGoal) => {
    setEditingGoal(goal);
    setGoalDialogOpen(true);
  };

  const handleGoalStatusChange = async (
    id: string,
    status: "Achieved" | "Abandoned",
  ) => {
    try {
      const res = await fetch(`/api/weight/goals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const updated = await res.json();
      setGoals((prev) =>
        prev.map((g) => (g._id === updated._id ? updated : g)),
      );
      toast.success(`Goal marked as ${status.toLowerCase()}`);
    } catch {
      toast.error("Failed to update goal");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading weight data…</p>
      </div>
    );
  }

  const bmiCategory = latestEntry ? getBmiCategory(latestEntry.bmi) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Weight Tracker</h1>
          <p className="text-sm text-muted-foreground">
            {entries.length} entr{entries.length !== 1 ? "ies" : "y"} logged
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingGoal(null);
              setGoalDialogOpen(true);
            }}
          >
            <Target className="mr-1 h-4 w-4" />
            Set Goal
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingEntry(null);
              setEntryDialogOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            Log Weight
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Current Weight */}
        <Card>
          <CardContent className="flex items-center gap-3 px-4 py-4">
            <Scale className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Current Weight</p>
              {latestEntry ? (
                <p className="text-2xl font-bold">{latestEntry.weight} kg</p>
              ) : (
                <p className="text-lg text-muted-foreground">No entries yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Current BMI */}
        <Card>
          <CardContent className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-bold">
              BMI
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Body Mass Index</p>
              {latestEntry && bmiCategory ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{latestEntry.bmi}</span>
                  <Badge
                    variant="outline"
                    className={BMI_CATEGORY_COLORS[bmiCategory]}
                  >
                    {bmiCategory}
                  </Badge>
                </div>
              ) : (
                <p className="text-lg text-muted-foreground">—</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Goal */}
        <Card>
          <CardContent className="flex items-center gap-3 px-4 py-4">
            <Target className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Active Goal</p>
              {activeGoal ? (
                <p className="text-2xl font-bold">
                  {activeGoal.targetWeight} kg
                </p>
              ) : (
                <p className="text-lg text-muted-foreground">No active goal</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Section */}
      {goals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Goals</h2>
          <div className="grid gap-3">
            {goals.map((goal) => (
              <WeightGoalCard
                key={goal._id}
                goal={goal}
                currentWeight={latestEntry?.weight}
                onEdit={handleGoalEdit}
                onDelete={handleGoalDelete}
                onMarkAchieved={(id) => handleGoalStatusChange(id, "Achieved")}
                onMarkAbandoned={(id) =>
                  handleGoalStatusChange(id, "Abandoned")
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Entries Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Weight Log</h2>
        {entries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Scale className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No entries yet</p>
              <p className="text-sm text-muted-foreground">
                Click &quot;Log Weight&quot; to add your first entry.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {entries.map((entry) => (
              <WeightEntryCard
                key={entry._id}
                entry={entry}
                onEdit={handleEntryEdit}
                onDelete={handleEntryDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Entry Form Dialog */}
      <WeightEntryFormDialog
        open={entryDialogOpen}
        onOpenChange={(open) => {
          setEntryDialogOpen(open);
          if (!open) setEditingEntry(null);
        }}
        onSubmit={handleEntrySubmit}
        initialData={editingEntry}
        lastHeight={latestEntry?.height}
        loading={saving}
        key={editingEntry?._id ?? "new-entry"}
      />

      {/* Goal Form Dialog */}
      <WeightGoalFormDialog
        open={goalDialogOpen}
        onOpenChange={(open) => {
          setGoalDialogOpen(open);
          if (!open) setEditingGoal(null);
        }}
        onSubmit={handleGoalSubmit}
        initialData={editingGoal}
        currentWeight={latestEntry?.weight}
        loading={saving}
        key={editingGoal?._id ?? "new-goal"}
      />
    </div>
  );
}
