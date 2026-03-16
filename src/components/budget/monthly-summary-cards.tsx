"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { Expense, ExpenseCategory } from "@/lib/budget-types";
import { EXPENSE_CATEGORIES, convertAmount } from "@/lib/budget-types";
import { CURRENCY_SYMBOLS } from "@/lib/networth-types";
import type { Currency, ExchangeRates } from "@/lib/networth-types";

interface MonthlySummaryCardsProps {
  expenses: Expense[];
  prevExpenses: Expense[];
  totalSpent: number;
  prevTotalSpent: number;
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  month: number;
  year: number;
}

export function MonthlySummaryCards({
  expenses,
  totalSpent,
  prevTotalSpent,
  displayCurrency,
  exchangeRates,
  month,
  year,
}: MonthlySummaryCardsProps) {
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const daysSoFar =
    today.getFullYear() === year && today.getMonth() + 1 === month
      ? today.getDate()
      : daysInMonth;

  const avgDaily = daysSoFar > 0 ? totalSpent / daysSoFar : 0;

  const topCategory = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      const val = convertAmount(e.amount, e.currency, displayCurrency, exchangeRates);
      byCategory[e.category] = (byCategory[e.category] || 0) + val;
    }
    let top: ExpenseCategory | null = null;
    let max = 0;
    for (const cat of EXPENSE_CATEGORIES) {
      if ((byCategory[cat] || 0) > max) {
        max = byCategory[cat];
        top = cat;
      }
    }
    return top;
  }, [expenses, displayCurrency, exchangeRates]);

  const pctChange =
    prevTotalSpent > 0
      ? ((totalSpent - prevTotalSpent) / prevTotalSpent) * 100
      : null;

  const cards = [
    {
      label: "Total Spent",
      value: `${symbol}${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub:
        pctChange !== null
          ? `${pctChange > 0 ? "+" : ""}${pctChange.toFixed(1)}% vs last month`
          : "No previous data",
      icon:
        pctChange === null ? (
          <Minus className="h-4 w-4 text-muted-foreground" />
        ) : pctChange > 0 ? (
          <TrendingUp className="h-4 w-4 text-red-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-green-500" />
        ),
    },
    {
      label: "Daily Average",
      value: `${symbol}${avgDaily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sub: `Over ${daysSoFar} day${daysSoFar !== 1 ? "s" : ""}`,
      icon: null,
    },
    {
      label: "Transactions",
      value: expenses.length.toString(),
      sub: `${expenses.filter((e) => e.recurring).length} recurring`,
      icon: null,
    },
    {
      label: "Top Category",
      value: topCategory ?? "—",
      sub: topCategory ? "Highest spending" : "No expenses",
      icon: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {c.label}
              </p>
              {c.icon}
            </div>
            <p className="mt-1 text-xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
