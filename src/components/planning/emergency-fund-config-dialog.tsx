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
import type {
  EmergencyFundConfig,
  EmergencyFundConfigFormData,
  EmergencyFundTargetType,
} from "@/lib/planning-types";
import { EMERGENCY_FUND_TARGET_TYPES } from "@/lib/planning-types";
import { CURRENCIES } from "@/lib/networth-types";
import type { Currency } from "@/lib/networth-types";

interface EmergencyFundConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EmergencyFundConfigFormData) => void;
  config: EmergencyFundConfig | null;
  saving: boolean;
}

const TARGET_TYPE_LABELS: Record<EmergencyFundTargetType, string> = {
  months: "Months of Expenses",
  fixed: "Fixed Amount",
  both: "Higher of Both",
};

function EmergencyFundConfigDialogInner({
  onOpenChange,
  onSubmit,
  config,
  saving,
}: Omit<EmergencyFundConfigDialogProps, "open">) {
  const [targetType, setTargetType] = useState<EmergencyFundTargetType>(
    config?.targetType ?? "months",
  );
  const [targetMonths, setTargetMonths] = useState(
    config?.targetMonths.toString() ?? "6",
  );
  const [fixedTargetAmount, setFixedTargetAmount] = useState(
    config?.fixedTargetAmount?.toString() ?? "",
  );
  const [fixedTargetCurrency, setFixedTargetCurrency] = useState<Currency>(
    config?.fixedTargetCurrency ?? "SAR",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      targetType,
      targetMonths: parseInt(targetMonths, 10) || 6,
      fixedTargetAmount: fixedTargetAmount
        ? parseFloat(fixedTargetAmount)
        : undefined,
      fixedTargetCurrency,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Emergency Fund Settings</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Target Type</Label>
          <ToggleGroup
            items={EMERGENCY_FUND_TARGET_TYPES.map((t) => ({
              value: t,
              label: TARGET_TYPE_LABELS[t],
            }))}
            value={targetType}
            onValueChange={setTargetType}
            buttonClassName="flex-1 text-xs"
          />
        </div>

        {(targetType === "months" || targetType === "both") && (
          <div className="space-y-2">
            <Label htmlFor="target-months">Target Months of Expenses</Label>
            <Input
              id="target-months"
              type="number"
              min="1"
              max="24"
              value={targetMonths}
              onChange={(e) => setTargetMonths(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Based on your average monthly spending
            </p>
          </div>
        )}

        {(targetType === "fixed" || targetType === "both") && (
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="fixed-amount">Fixed Target Amount</Label>
              <Input
                id="fixed-amount"
                type="number"
                min="0"
                step="0.01"
                value={fixedTargetAmount}
                onChange={(e) => setFixedTargetAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="w-24 space-y-2">
              <Label>Currency</Label>
              <ToggleGroup
                items={CURRENCIES}
                value={fixedTargetCurrency}
                onValueChange={setFixedTargetCurrency}
                buttonClassName="flex-1 px-1 text-xs"
              />
            </div>
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
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function EmergencyFundConfigDialog({
  open,
  onOpenChange,
  onSubmit,
  config,
  saving,
}: EmergencyFundConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <EmergencyFundConfigDialogInner
            key={config?._id ?? "new"}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
            config={config}
            saving={saving}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
