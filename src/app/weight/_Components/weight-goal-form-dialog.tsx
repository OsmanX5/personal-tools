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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type WeightGoal,
  type WeightGoalFormData,
  GOAL_STATUSES,
} from "@/lib/weight-types";

interface WeightGoalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WeightGoalFormData) => void;
  initialData?: WeightGoal | null;
  currentWeight?: number;
  loading?: boolean;
}

export function WeightGoalFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  currentWeight,
  loading,
}: WeightGoalFormDialogProps) {
  const [targetWeight, setTargetWeight] = useState(
    initialData ? String(initialData.targetWeight) : "",
  );
  const [startWeight, setStartWeight] = useState(
    initialData
      ? String(initialData.startWeight)
      : currentWeight
        ? String(currentWeight)
        : "",
  );
  const [targetDate, setTargetDate] = useState(
    initialData?.targetDate
      ? new Date(initialData.targetDate).toISOString().split("T")[0]
      : "",
  );
  const [status, setStatus] = useState<WeightGoalFormData["status"]>(
    initialData?.status ?? "Active",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      targetWeight: parseFloat(targetWeight),
      startWeight: parseFloat(startWeight),
      targetDate: targetDate || undefined,
      status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Goal" : "Set Weight Goal"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startWeight">Start Weight (kg) *</Label>
              <Input
                id="startWeight"
                type="number"
                step="0.1"
                min="1"
                value={startWeight}
                onChange={(e) => setStartWeight(e.target.value)}
                placeholder="80"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetWeight">Target Weight (kg) *</Label>
              <Input
                id="targetWeight"
                type="number"
                step="0.1"
                min="1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="70"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            {initialData && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) =>
                    setStatus(v as WeightGoalFormData["status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : initialData ? "Update Goal" : "Set Goal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
