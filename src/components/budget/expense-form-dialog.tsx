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
import type { Expense, ExpenseFormData } from "@/lib/budget-types";
import { EXPENSE_CATEGORIES, RECURRING_FREQUENCIES } from "@/lib/budget-types";
import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/networth-types";
import type { Currency } from "@/lib/networth-types";
import type { ExpenseCategory, RecurringFrequency } from "@/lib/budget-types";

export interface AccountOption {
  _id: string;
  name: string;
  currency: Currency;
}

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExpenseFormData) => void;
  initialData?: Expense | null;
  loading?: boolean;
  accounts?: AccountOption[];
}

const today = () => new Date().toISOString().split("T")[0];

const defaultForm: ExpenseFormData = {
  amount: 0,
  currency: "SAR",
  category: "Other",
  description: "",
  date: today(),
  recurring: false,
};

export function ExpenseFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
  accounts = [],
}: ExpenseFormDialogProps) {
  const [form, setForm] = useState<ExpenseFormData>(
    initialData
      ? {
          amount: initialData.amount,
          currency: initialData.currency,
          category: initialData.category,
          description: initialData.description ?? "",
          date: initialData.date.split("T")[0],
          recurring: initialData.recurring,
          recurringFrequency: initialData.recurringFrequency,
          withdrawAccountId: initialData.withdrawAccountId,
        }
      : defaultForm,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const update = <K extends keyof ExpenseFormData>(
    key: K,
    value: ExpenseFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Amount + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount || ""}
                onChange={(e) => update("amount", Number(e.target.value))}
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

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select
              value={form.category}
              onValueChange={(v) => update("category", v as ExpenseCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What was this for?"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={form.date.split("T")[0]}
              onChange={(e) => update("date", e.target.value)}
              required
            />
          </div>

          {/* Recurring toggle */}
          <div className="flex items-center gap-3">
            <Label htmlFor="recurring" className="flex-1">
              Recurring expense?
            </Label>
            <button
              type="button"
              role="switch"
              aria-checked={form.recurring}
              onClick={() => {
                update("recurring", !form.recurring);
                if (form.recurring) {
                  update("recurringFrequency", undefined);
                }
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                form.recurring ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  form.recurring ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Recurring frequency */}
          {form.recurring && (
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select
                value={form.recurringFrequency ?? ""}
                onValueChange={(v) =>
                  update("recurringFrequency", v as RecurringFrequency)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {RECURRING_FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Withdraw from account (optional) */}
          {accounts.length > 0 && (
            <div className="space-y-1.5">
              <Label>Withdraw from account</Label>
              <Select
                value={form.withdrawAccountId ?? "none"}
                onValueChange={(v) => {
                  const accountId: string | undefined =
                    !v || v === "none" ? undefined : v;
                  setForm((prev) => ({
                    ...prev,
                    withdrawAccountId: accountId,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a._id} value={a._id}>
                      {a.name} ({CURRENCY_SYMBOLS[a.currency]} {a.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Automatically subtract this expense from the selected account
              </p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="mt-2">
            {loading
              ? "Saving…"
              : initialData
                ? "Update Expense"
                : "Add Expense"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
