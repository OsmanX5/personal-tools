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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Habit,
  type HabitFormData,
  HABIT_COLORS,
  HABIT_FREQUENCIES,
} from "@/lib/habit-types";

const PRESET_CATEGORIES = [
  "Health",
  "Fitness",
  "Religion",
  "Career",
  "Learning",
  "Finance",
  "Social",
  "Creativity",
  "Mindfulness",
  "Productivity",
] as const;

interface HabitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: HabitFormData) => void;
  initialData?: Habit | null;
  loading?: boolean;
}

export function HabitFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
}: HabitFormDialogProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [color, setColor] = useState(initialData?.color ?? "#3b82f6");

  // Category: preset select + optional custom text input
  const initCategory = initialData?.category ?? "";
  const isPreset = PRESET_CATEGORIES.includes(
    initCategory as (typeof PRESET_CATEGORIES)[number],
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initCategory === "" ? "" : isPreset ? initCategory : "__custom__",
  );
  const [customCategory, setCustomCategory] = useState(
    isPreset ? "" : initCategory,
  );
  const category =
    selectedCategory === "__custom__" ? customCategory : selectedCategory;
  const [frequency, setFrequency] = useState<HabitFormData["frequency"]>(
    initialData?.frequency ?? "daily",
  );
  const [frequencyInterval, setFrequencyInterval] = useState(
    String(initialData?.frequencyInterval ?? "2"),
  );
  const [hasValue, setHasValue] = useState(initialData?.hasValue ?? false);
  const [targetValue, setTargetValue] = useState(
    initialData?.targetValue != null ? String(initialData.targetValue) : "",
  );
  const [unit, setUnit] = useState(initialData?.unit ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
      category: category.trim() || undefined,
      frequency,
      frequencyInterval:
        frequency === "custom" ? parseInt(frequencyInterval) : undefined,
      hasValue,
      targetValue:
        hasValue && targetValue ? parseFloat(targetValue) : undefined,
      unit: hasValue && unit.trim() ? unit.trim() : undefined,
      isActive: initialData?.isActive ?? true,
    });
  };

  const isEdit = !!initialData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Habit" : "New Habit"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="habit-name">Name *</Label>
            <Input
              id="habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning run"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="habit-desc">Description</Label>
            <Textarea
              id="habit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this habit"
              rows={2}
            />
          </div>

          {/* Category + Color row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="habit-category">Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={(v) => {
                  if (!v) return;
                  setSelectedCategory(v);
                  if (v !== "__custom__") setCustomCategory("");
                }}
              >
                <SelectTrigger id="habit-category">
                  <SelectValue placeholder="Select or type…" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Custom…</SelectItem>
                </SelectContent>
              </Select>
              {selectedCategory === "__custom__" && (
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Type category name"
                  autoFocus
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1.5">
                {HABIT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? "white" : "transparent",
                      outline: color === c ? `2px solid ${c}` : "none",
                      outlineOffset: "1px",
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="habit-freq">Frequency *</Label>
              <Select
                value={frequency}
                onValueChange={(v) =>
                  setFrequency(v as HabitFormData["frequency"])
                }
              >
                <SelectTrigger id="habit-freq">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {frequency === "custom" && (
              <div className="space-y-1.5">
                <Label htmlFor="habit-interval">Every N days *</Label>
                <Input
                  id="habit-interval"
                  type="number"
                  min="1"
                  value={frequencyInterval}
                  onChange={(e) => setFrequencyInterval(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Value tracking */}
          <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center gap-2">
              <input
                id="has-value"
                type="checkbox"
                checked={hasValue}
                onChange={(e) => setHasValue(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="has-value" className="cursor-pointer">
                Track a numeric value (e.g. glasses of water, km run)
              </Label>
            </div>
            {hasValue && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="target-value">Target value</Label>
                  <Input
                    id="target-value"
                    type="number"
                    min="0"
                    step="any"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="e.g. 8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="habit-unit">Unit</Label>
                  <Input
                    id="habit-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. glasses"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Saving…" : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
