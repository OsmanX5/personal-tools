"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup } from "@/components/ui/toggle-group";
import type { IncomeStream, IncomeStreamFormData } from "@/lib/planning-types";
import { INCOME_STREAM_TYPES } from "@/lib/planning-types";
import { CURRENCIES } from "@/lib/networth-types";
import type { Currency } from "@/lib/networth-types";

interface IncomeStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: IncomeStreamFormData) => void;
  editing: IncomeStream | null;
  saving: boolean;
}

function IncomeStreamDialogInner({
  onOpenChange,
  onSubmit,
  editing,
  saving,
}: Omit<IncomeStreamDialogProps, "open">) {
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState<IncomeStreamFormData["type"]>(
    editing?.type ?? "Salary",
  );
  const [defaultAmount, setDefaultAmount] = useState(
    editing?.defaultAmount.toString() ?? "",
  );
  const [currency, setCurrency] = useState<Currency>(
    editing?.currency ?? "SAR",
  );
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      defaultAmount: parseFloat(defaultAmount) || 0,
      currency,
      isActive,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {editing ? "Edit Income Stream" : "Add Income Stream"}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stream-name">Name</Label>
          <Input
            id="stream-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Main Salary"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <ToggleGroup
            items={INCOME_STREAM_TYPES}
            value={type}
            onValueChange={setType}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="default-amount">Default Monthly Amount</Label>
            <Input
              id="default-amount"
              type="number"
              min="0"
              step="0.01"
              value={defaultAmount}
              onChange={(e) => setDefaultAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="w-24 space-y-2">
            <Label>Currency</Label>
            <ToggleGroup
              items={CURRENCIES}
              value={currency}
              onValueChange={setCurrency}
              buttonClassName="flex-1 px-1 text-xs"
            />
          </div>
        </div>

        {editing && (
          <div className="flex items-center gap-2">
            <Label>Active</Label>
            <Button
              type="button"
              size="sm"
              variant={isActive ? "default" : "outline"}
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? "Active" : "Inactive"}
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !name || !defaultAmount}>
            {saving ? "Saving…" : editing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function IncomeStreamDialog({
  open,
  onOpenChange,
  onSubmit,
  editing,
  saving,
}: IncomeStreamDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <IncomeStreamDialogInner
            key={editing?._id ?? "new"}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            editing={editing}
            saving={saving}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
