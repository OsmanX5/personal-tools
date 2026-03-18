"use client";

import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  type WeightEntry,
  type WeightEntryFormData,
  calculateBmi,
  getBmiCategory,
  BMI_CATEGORY_COLORS,
} from "@/lib/weight-types";

interface WeightEntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: WeightEntryFormData) => void;
  initialData?: WeightEntry | null;
  userHeight?: number | null;
  loading?: boolean;
}

export function WeightEntryFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  userHeight,
  loading,
}: WeightEntryFormDialogProps) {
  const [weight, setWeight] = useState(
    initialData ? String(initialData.weight) : "",
  );
  const [date, setDate] = useState(
    initialData
      ? new Date(initialData.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );
  const [note, setNote] = useState(initialData?.note ?? "");

  const previewBmi = useMemo(() => {
    const w = parseFloat(weight);
    if (w > 0 && userHeight && userHeight > 0)
      return calculateBmi(w, userHeight);
    return null;
  }, [weight, userHeight]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      weight: parseFloat(weight),
      date,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Weight Entry" : "Log Weight"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="weight">Weight (kg) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              min="1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70.5"
              required
            />
          </div>

          {/* Live BMI preview */}
          {previewBmi !== null && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">BMI:</span>
              <Badge
                variant="outline"
                className={BMI_CATEGORY_COLORS[getBmiCategory(previewBmi)]}
              >
                {previewBmi} · {getBmiCategory(previewBmi)}
              </Badge>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note..."
              rows={2}
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : initialData ? "Update Entry" : "Log Weight"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
