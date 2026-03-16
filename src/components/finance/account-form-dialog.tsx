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
import { Textarea } from "@/components/ui/textarea";
import type {
  FinanceAccount,
  FinanceAccountFormData,
} from "@/lib/finance-types";
import {
  ACCOUNT_PURPOSES,
  ACCOUNT_LOCATIONS,
  ACCOUNT_LIQUIDITIES,
  CURRENCIES,
  CURRENCY_SYMBOLS,
} from "@/lib/finance-types";
import type { Currency } from "@/lib/finance-types";

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FinanceAccountFormData) => void;
  initialData?: FinanceAccount | null;
  loading?: boolean;
}

const defaultFormData: FinanceAccountFormData = {
  name: "",
  description: "",
  status: "active",
  amount: 0,
  currency: "USD",
  tags: [],
  purpose: "Current",
  location: "Bank",
  liquidity: "Immediate",
};

export function AccountFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
}: AccountFormDialogProps) {
  const [form, setForm] = useState<FinanceAccountFormData>(
    initialData
      ? {
          name: initialData.name,
          description: initialData.description ?? "",
          status: initialData.status,
          amount: initialData.amount,
          currency: initialData.currency ?? "USD",
          tags: initialData.tags,
          purpose: initialData.purpose,
          location: initialData.location,
          liquidity: initialData.liquidity,
        }
      : defaultFormData,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const update = <K extends keyof FinanceAccountFormData>(
    key: K,
    value: FinanceAccountFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Account" : "Add Account"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Account Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Main Savings"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Optional description…"
              rows={2}
            />
          </div>

          {/* Balance + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="amount">
                {initialData ? "Current Balance" : "Initial Balance"}
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => update("amount", Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency *</Label>
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

          {/* Purpose */}
          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <div className="flex rounded-md border">
              {ACCOUNT_PURPOSES.map((p, i) => (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    update("purpose", p as FinanceAccountFormData["purpose"])
                  }
                  className={`flex-1 px-2 py-1.5 text-sm transition-colors ${
                    i > 0 ? "border-l" : ""
                  } ${
                    form.purpose === p
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label>Location</Label>
            <div className="flex rounded-md border">
              {ACCOUNT_LOCATIONS.map((l, i) => (
                <button
                  key={l}
                  type="button"
                  onClick={() =>
                    update("location", l as FinanceAccountFormData["location"])
                  }
                  className={`flex-1 px-2 py-1.5 text-sm transition-colors ${
                    i > 0 ? "border-l" : ""
                  } ${
                    form.location === l
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Liquidity */}
          <div className="space-y-1.5">
            <Label>Liquidity</Label>
            <div className="flex rounded-md border">
              {ACCOUNT_LIQUIDITIES.map((l, i) => (
                <button
                  key={l}
                  type="button"
                  onClick={() =>
                    update(
                      "liquidity",
                      l as FinanceAccountFormData["liquidity"],
                    )
                  }
                  className={`flex-1 px-2 py-1.5 text-sm transition-colors ${
                    i > 0 ? "border-l" : ""
                  } ${
                    form.liquidity === l
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={form.tags.join(", ")}
              onChange={(e) =>
                update(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
              placeholder="e.g. personal, emergency"
            />
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? "Saving…"
              : initialData
                ? "Update Account"
                : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
