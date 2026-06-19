"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  PiggyBank,
  Wallet,
} from "lucide-react";
import type { FinancialSnapshot } from "@/lib/planning-types";
import { CURRENCY_SYMBOLS } from "@/lib/networth-types";
import type { Currency } from "@/lib/networth-types";

interface FinancialHealthSummaryProps {
  snapshot: FinancialSnapshot | null;
  displayCurrency: Currency;
  hideValues?: boolean;
}

function fmt(value: number, symbol: string) {
  return `${symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function FinancialHealthSummary({
  snapshot,
  displayCurrency,
  hideValues,
}: FinancialHealthSummaryProps) {
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const money = (value: number) =>
    hideValues ? "****" : fmt(value, symbol);

  if (!snapshot) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const savingsColor =
    snapshot.savingsRate > 20
      ? "text-green-600 dark:text-green-400"
      : snapshot.savingsRate > 10
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const efPercent = snapshot.emergencyFund.percentFilled;
  const efColor =
    efPercent >= 100
      ? "text-green-600 dark:text-green-400"
      : efPercent >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  const cards = [
    {
      label: "Net Worth",
      value: money(snapshot.totalNetWorth),
      sub: `Avg savings ${money(snapshot.avgMonthlySavings)}/mo`,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
    {
      label: "Monthly Income",
      value: money(snapshot.monthlyIncome),
      sub: `Avg ${money(snapshot.avgMonthlyIncome)}/mo`,
      icon: <TrendingUp className="h-4 w-4 text-green-500" />,
    },
    {
      label: "Monthly Expenses",
      value: money(snapshot.monthlyExpenses),
      sub: `Expected ${money(snapshot.currentMonthExpectedTotal)} · Recurring ${money(snapshot.recurringMonthlyTotal)}/mo`,
      icon: <TrendingDown className="h-4 w-4 text-red-500" />,
    },
    {
      label: "Savings Rate",
      value: `${snapshot.savingsRate.toFixed(1)}%`,
      sub:
        snapshot.savingsRate > 20
          ? "Healthy"
          : snapshot.savingsRate > 10
            ? "Could improve"
            : "Needs attention",
      icon: <PiggyBank className="h-4 w-4 text-muted-foreground" />,
      valueClass: savingsColor,
    },
    {
      label: "Emergency Fund",
      value: `${efPercent.toFixed(0)}%`,
      sub: `${snapshot.emergencyFund.monthsOfExpensesCovered.toFixed(1)} months covered`,
      icon: snapshot.emergencyFund.isFullyFunded ? (
        <ShieldCheck className="h-4 w-4 text-green-500" />
      ) : (
        <Wallet className="h-4 w-4 text-muted-foreground" />
      ),
      valueClass: efColor,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {c.label}
              </p>
              {c.icon}
            </div>
            <p
              className={`mt-0.5 text-lg font-bold ${"valueClass" in c && c.valueClass ? c.valueClass : ""}`}
            >
              {c.value}
            </p>
            <p className="text-[11px] text-muted-foreground">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
