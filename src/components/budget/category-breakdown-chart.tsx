"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { Expense } from "@/lib/budget-types";
import {
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  convertAmount,
} from "@/lib/budget-types";
import { CURRENCY_SYMBOLS } from "@/lib/finance-types";
import type { Currency, ExchangeRates } from "@/lib/finance-types";

interface CategoryBreakdownChartProps {
  expenses: Expense[];
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
}

export function CategoryBreakdownChart({
  expenses,
  displayCurrency,
  exchangeRates,
}: CategoryBreakdownChartProps) {
  const symbol = CURRENCY_SYMBOLS[displayCurrency];

  const data = useMemo(() => {
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      const val = convertAmount(
        e.amount,
        e.currency,
        displayCurrency,
        exchangeRates,
      );
      byCategory[e.category] = (byCategory[e.category] || 0) + val;
    }
    return EXPENSE_CATEGORIES.map((cat) => ({
      name: cat,
      value: Math.round((byCategory[cat] || 0) * 100) / 100,
      color: CATEGORY_COLORS[cat],
    })).filter((d) => d.value > 0);
  }, [expenses, displayCurrency, exchangeRates]);

  if (data.length === 0) {
    return (
      <Card className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No expenses to visualize
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="shrink-0 px-4 pb-2 pt-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          Spending by Category
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 gap-4 px-4 pb-3">
        {/* Donut chart */}
        <div className="w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  `${symbol}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="flex w-1/2 flex-col justify-center gap-1 overflow-y-auto text-xs">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
              />
              <span className="flex-1 truncate">{d.name}</span>
              <span className="font-medium">
                {symbol}
                {d.value.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
