"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type {
  FinanceAccount,
  Currency,
  ExchangeRates,
} from "@/lib/finance-types";
import { CURRENCY_SYMBOLS } from "@/lib/finance-types";

const PIE_COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#a855f7", // purple
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

interface NetWorthSummaryProps {
  accounts: FinanceAccount[];
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
}

function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates,
): number {
  if (from === to) return amount;
  const inUsd = amount / rates[from];
  return inUsd * rates[to];
}

export function NetWorthSummary({
  accounts,
  displayCurrency,
  exchangeRates,
}: NetWorthSummaryProps) {
  const symbol = CURRENCY_SYMBOLS[displayCurrency];

  // Pie chart data: each account's value in display currency
  const pieData = useMemo(() => {
    return accounts
      .map((a) => ({
        name: a.name,
        value: Math.max(
          0,
          convertAmount(
            a.amount,
            a.currency ?? "USD",
            displayCurrency,
            exchangeRates,
          ),
        ),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [accounts, displayCurrency, exchangeRates]);

  const total = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0),
    [pieData],
  );

  // Historical net worth from transaction history (last 12 months)
  const historyData = useMemo(() => {
    const now = new Date();
    const months: { label: string; date: Date }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        }),
        date: d,
      });
    }

    return months.map(({ label, date }) => {
      const endOfMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
      );

      let monthTotal = 0;
      for (const account of accounts) {
        // Walk transactions to compute the account value at end of this month
        // Start from the earliest known state and accumulate
        const txs = account.transactions
          .slice()
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );

        if (txs.length === 0) {
          // No transactions — use current amount if account existed
          const created = new Date(account.createdAt);
          if (created <= endOfMonth) {
            monthTotal += convertAmount(
              account.amount,
              account.currency ?? "USD",
              displayCurrency,
              exchangeRates,
            );
          }
          continue;
        }

        // Compute balance at end of month by working backwards from current amount
        // current amount = initial + sum(all transactions)
        // amount at end of month = current amount - sum(transactions after end of month)
        const txsAfter = txs.filter((tx) => new Date(tx.date) > endOfMonth);
        const sumAfter = txsAfter.reduce((s, tx) => s + tx.amount, 0);
        const amountAtMonth = account.amount - sumAfter;

        // Only include if account existed by then
        const created = new Date(account.createdAt);
        if (created <= endOfMonth) {
          monthTotal += convertAmount(
            Math.max(0, amountAtMonth),
            account.currency ?? "USD",
            displayCurrency,
            exchangeRates,
          );
        }
      }

      return { month: label, value: Math.round(monthTotal * 100) / 100 };
    });
  }, [accounts, displayCurrency, exchangeRates]);

  const [view, setView] = useState<"breakdown" | "trend">("breakdown");

  return (
    <Card className="flex flex-col h-full min-h-0">
      <CardHeader className="shrink-0 pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Net Worth
            </CardTitle>
            <p className="text-2xl font-bold">
              {symbol}
              {total.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="flex rounded-md border text-xs">
            {(["breakdown", "trend"] as const).map((v, i) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`px-3 py-1 capitalize transition-colors ${
                  i > 0 ? "border-l" : ""
                } ${
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 px-4 pb-3">
        {view === "breakdown" ? (
          pieData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No data
            </div>
          ) : (
            <div className="flex flex-col justify-center gap-3 h-full">
              {/* Stacked horizontal bar */}
              <div className="flex h-6 w-full overflow-hidden rounded-full">
                {pieData.map((d, i) => {
                  const pct = total > 0 ? (d.value / total) * 100 : 0;
                  return (
                    <div
                      key={d.name}
                      className="relative group h-full transition-opacity hover:opacity-80"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                      title={`${d.name}: ${symbol}${d.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-muted-foreground">{d.name}</span>
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
            </div>
          )
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={historyData}
              margin={{ top: 4, right: 12, bottom: 0, left: 4 }}
            >
              <defs>
                <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                }
              />
              <Tooltip
                formatter={(value) => [
                  `${symbol}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  "Net Worth",
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#netWorthGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
