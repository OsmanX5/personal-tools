"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2 } from "lucide-react";
import type { CategoryBudget, Expense, ExpenseCategory } from "@/lib/budget-types";
import {
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  convertAmount,
} from "@/lib/budget-types";
import { CURRENCY_SYMBOLS } from "@/lib/finance-types";
import type { Currency, ExchangeRates } from "@/lib/finance-types";

interface BudgetOverviewProps {
  budgets: CategoryBudget[];
  expenses: Expense[];
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  onEditBudget: (category: ExpenseCategory) => void;
  onDeleteBudget: (id: string) => void;
}

export function BudgetOverview({
  budgets,
  expenses,
  displayCurrency,
  exchangeRates,
  onEditBudget,
  onDeleteBudget,
}: BudgetOverviewProps) {
  const symbol = CURRENCY_SYMBOLS[displayCurrency];

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      const val = convertAmount(e.amount, e.currency, displayCurrency, exchangeRates);
      map[e.category] = (map[e.category] || 0) + val;
    }
    return map;
  }, [expenses, displayCurrency, exchangeRates]);

  // Build rows: one per budget, plus categories with spending but no budget
  const rows = useMemo(() => {
    const budgetedCategories = new Set(budgets.map((b) => b.category));
    const result: {
      category: ExpenseCategory;
      budget: CategoryBudget | null;
      spent: number;
      limit: number;
    }[] = [];

    for (const b of budgets) {
      const limit = convertAmount(
        b.limitAmount,
        b.currency,
        displayCurrency,
        exchangeRates,
      );
      result.push({
        category: b.category as ExpenseCategory,
        budget: b,
        spent: spentByCategory[b.category] || 0,
        limit,
      });
    }

    // Categories with spending but no budget
    for (const cat of EXPENSE_CATEGORIES) {
      if (!budgetedCategories.has(cat) && (spentByCategory[cat] || 0) > 0) {
        result.push({
          category: cat,
          budget: null,
          spent: spentByCategory[cat],
          limit: 0,
        });
      }
    }

    return result.sort((a, b) => b.spent - a.spent);
  }, [budgets, spentByCategory, displayCurrency, exchangeRates]);

  if (rows.length === 0) {
    return (
      <Card className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          No budgets set and no expenses this month. Set a budget per category
          to track your spending.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex min-h-0 flex-1 flex-col">
      <CardHeader className="shrink-0 px-4 pb-2 pt-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          Category Budgets
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-4 pb-3">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 pr-3">
            {rows.map((row) => {
              const pct = row.limit > 0 ? (row.spent / row.limit) * 100 : 0;
              const over = row.limit > 0 && row.spent > row.limit;
              const barColor = over
                ? "bg-red-500"
                : pct > 75
                  ? "bg-amber-500"
                  : "bg-green-500";
              const remaining = row.limit > 0 ? row.limit - row.spent : 0;

              return (
                <div key={row.category} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_COLORS[row.category],
                      }}
                    />
                    <span className="flex-1 text-sm font-medium">
                      {row.category}
                    </span>
                    <span className="text-sm font-semibold">
                      {symbol}
                      {row.spent.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      {row.limit > 0 && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          / {symbol}
                          {row.limit.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      )}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onEditBudget(row.category)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {row.budget && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => onDeleteBudget(row.budget!._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {row.limit > 0 ? (
                    <>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${barColor}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {over ? (
                          <span className="text-red-500 font-medium">
                            Over budget by {symbol}
                            {Math.abs(remaining).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        ) : (
                          <>
                            {symbol}
                            {remaining.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            remaining ({pct.toFixed(0)}% used)
                          </>
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No budget set — click edit to set one
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
