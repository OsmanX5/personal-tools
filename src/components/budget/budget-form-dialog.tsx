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
import type {
  CategoryBudget,
  CategoryBudgetFormData,
  ExpenseCategory,
} from "@/lib/budget-types";
import { EXPENSE_CATEGORIES } from "@/lib/budget-types";
import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/networth-types";
import type { Currency } from "@/lib/networth-types";

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CategoryBudgetFormData) => void;
  initialCategory?: ExpenseCategory | null;
  existingBudget?: CategoryBudget | null;
  loading?: boolean;
  month: number;
  year: number;
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialCategory,
  existingBudget,
  loading,
  month,
  year,
}: BudgetFormDialogProps) {
  const [category, setCategory] = useState<ExpenseCategory>(
    initialCategory ?? existingBudget?.category as ExpenseCategory ?? "Food & Groceries",
  );
  const [limitAmount, setLimitAmount] = useState(
    existingBudget?.limitAmount ?? 0,
  );
  const [currency, setCurrency] = useState<Currency>(
    (existingBudget?.currency as Currency) ?? "SAR",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ category, limitAmount, currency, month, year });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingBudget ? "Edit Budget" : "Set Category Budget"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ExpenseCategory)}
              disabled={!!initialCategory}
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

          {/* Limit + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="limit">Monthly Limit *</Label>
              <Input
                id="limit"
                type="number"
                step="0.01"
                min="0"
                value={limitAmount || ""}
                onChange={(e) => setLimitAmount(Number(e.target.value))}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as Currency)}
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

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "Saving…" : existingBudget ? "Update Budget" : "Set Budget"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
