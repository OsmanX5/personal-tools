"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Repeat, Plus } from "lucide-react";
import type { Expense, ExpenseCategory } from "@/lib/budget-types";
import {
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_BG_COLORS,
  convertAmount,
} from "@/lib/budget-types";
import { CURRENCY_SYMBOLS } from "@/lib/networth-types";
import type { Currency, ExchangeRates } from "@/lib/networth-types";

interface ExpenseListProps {
  expenses: Expense[];
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
}

export function ExpenseList({
  expenses,
  displayCurrency,
  exchangeRates,
  onEdit,
  onDelete,
  onAdd,
}: ExpenseListProps) {
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const [filterCategory, setFilterCategory] = useState<
    ExpenseCategory | "All"
  >("All");

  const filtered = useMemo(
    () =>
      filterCategory === "All"
        ? expenses
        : expenses.filter((e) => e.category === filterCategory),
    [expenses, filterCategory],
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="shrink-0 px-4 pb-2 pt-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Expenses ({filtered.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
            value={filterCategory}
            onValueChange={(v) =>
              setFilterCategory(v as ExpenseCategory | "All")
            }
          >
            <SelectTrigger className="h-7 w-[160px] text-xs">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All categories</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
            </Select>
            {onAdd && (
              <Button size="sm" className="h-7 text-xs" onClick={onAdd}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-4 pb-3">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No expenses found</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 pr-3">
              {filtered.map((expense) => {
                const converted = convertAmount(
                  expense.amount,
                  expense.currency,
                  displayCurrency,
                  exchangeRates,
                );
                return (
                  <div
                    key={expense._id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_COLORS[expense.category],
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {expense.description || expense.category}
                        </span>
                        {expense.recurring && (
                          <Badge
                            variant="outline"
                            className="shrink-0 gap-1 text-[10px] px-1.5 py-0"
                          >
                            <Repeat className="h-2.5 w-2.5" />
                            {expense.recurringFrequency}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${CATEGORY_BG_COLORS[expense.category]}`}
                        >
                          {expense.category}
                        </Badge>
                        <span>
                          {new Date(expense.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">
                      {symbol}
                      {converted.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onEdit(expense)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(expense._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
