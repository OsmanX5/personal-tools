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
import type { FuturePlan, FuturePlanFormData } from "@/lib/budget-types";
import {
  PLAN_PRIORITIES,
  PLAN_STATUSES,
} from "@/lib/budget-types";
import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/finance-types";
import type { Currency } from "@/lib/finance-types";
import type { PlanPriority, PlanStatus } from "@/lib/budget-types";

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FuturePlanFormData) => void;
  initialData?: FuturePlan | null;
  loading?: boolean;
}

const defaultForm: FuturePlanFormData = {
  name: "",
  description: "",
  estimatedCost: 0,
  amountSaved: 0,
  currency: "SAR",
  priority: "Medium",
  status: "Active",
};

export function PlanFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
}: PlanFormDialogProps) {
  const [form, setForm] = useState<FuturePlanFormData>(
    initialData
      ? {
          name: initialData.name,
          description: initialData.description ?? "",
          estimatedCost: initialData.estimatedCost,
          amountSaved: initialData.amountSaved,
          currency: initialData.currency,
          targetDate: initialData.targetDate
            ? initialData.targetDate.split("T")[0]
            : undefined,
          priority: initialData.priority,
          status: initialData.status,
        }
      : defaultForm,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const update = <K extends keyof FuturePlanFormData>(
    key: K,
    value: FuturePlanFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Plan" : "Add Future Plan"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Marriage, Master's Degree, Car…"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Details about this plan…"
              rows={2}
            />
          </div>

          {/* Cost + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="cost">Estimated Cost *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={form.estimatedCost || ""}
                onChange={(e) => update("estimatedCost", Number(e.target.value))}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => update("currency", v as Currency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CURRENCY_SYMBOLS[c]} {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount saved */}
          <div className="space-y-1.5">
            <Label htmlFor="saved">Amount Saved So Far</Label>
            <Input
              id="saved"
              type="number"
              step="0.01"
              min="0"
              value={form.amountSaved || ""}
              onChange={(e) => update("amountSaved", Number(e.target.value))}
              placeholder="0.00"
            />
          </div>

          {/* Target date */}
          <div className="space-y-1.5">
            <Label htmlFor="targetDate">Target Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={form.targetDate ?? ""}
              onChange={(e) =>
                update("targetDate", e.target.value || undefined)
              }
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <div className="flex rounded-md border">
              {PLAN_PRIORITIES.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => update("priority", p as PlanPriority)}
                  className={`flex-1 px-2 py-1.5 text-sm transition-colors ${
                    i > 0 ? "border-l" : ""
                  } ${
                    form.priority === p
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Status (for editing) */}
          {initialData && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => update("status", v as PlanStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" disabled={loading} className="mt-2">
            {loading
              ? "Saving…"
              : initialData
                ? "Update Plan"
                : "Add Plan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
