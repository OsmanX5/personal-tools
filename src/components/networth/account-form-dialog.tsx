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
import { ToggleGroup } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  NetWorthAccount,
  NetWorthAccountFormData,
} from "@/lib/networth-types";
import {
  ACCOUNT_PURPOSES,
  ACCOUNT_LOCATIONS,
  ACCOUNT_LIQUIDITIES,
  CURRENCIES,
  CURRENCY_SYMBOLS,
} from "@/lib/networth-types";
import type { Currency } from "@/lib/networth-types";

function toDateInputValue(dateValue?: string): string {
  if (!dateValue) return new Date().toISOString().slice(0, 10);
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

interface AccountFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NetWorthAccountFormData) => void;
  initialData?: NetWorthAccount | null;
  loading?: boolean;
}

const defaultFormData: NetWorthAccountFormData = {
  name: "",
  description: "",
  status: "active",
  amount: 0,
  startBalance: 0,
  startDate: new Date().toISOString().slice(0, 10),
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
  const [form, setForm] = useState<NetWorthAccountFormData>(
    initialData
      ? {
          name: initialData.name,
          description: initialData.description ?? "",
          status: initialData.status,
          amount: initialData.amount,
          startBalance: initialData.startBalance ?? initialData.amount,
          startDate: toDateInputValue(
            initialData.startDate ?? initialData.createdAt,
          ),
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
    const parsedStartDate = new Date(form.startDate);
    onSubmit({
      ...form,
      startDate: Number.isNaN(parsedStartDate.getTime())
        ? new Date().toISOString()
        : parsedStartDate.toISOString(),
    });
  };

  const update = <K extends keyof NetWorthAccountFormData>(
    key: K,
    value: NetWorthAccountFormData[K],
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
                onChange={(e) => {
                  const amount = Number(e.target.value);
                  update("amount", amount);
                  if (!initialData) {
                    update("startBalance", amount);
                  }
                }}
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

          {/* Start Date + Start Balance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Account Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startBalance">Account Start Balance</Label>
              <Input
                id="startBalance"
                type="number"
                step="0.01"
                value={form.startBalance}
                onChange={(e) => update("startBalance", Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <ToggleGroup
              items={ACCOUNT_PURPOSES}
              value={form.purpose}
              onValueChange={(v) => update("purpose", v)}
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label>Location</Label>
            <ToggleGroup
              items={ACCOUNT_LOCATIONS}
              value={form.location}
              onValueChange={(v) => update("location", v)}
            />
          </div>

          {/* Liquidity */}
          <div className="space-y-1.5">
            <Label>Liquidity</Label>
            <ToggleGroup
              items={ACCOUNT_LIQUIDITIES}
              value={form.liquidity}
              onValueChange={(v) => update("liquidity", v)}
            />
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
