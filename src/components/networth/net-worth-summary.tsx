"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Chart } from "@/components/ui/chart";
import type {
  NetWorthAccount,
  Currency,
  ExchangeRates,
} from "@/lib/networth-types";
import { CURRENCY_SYMBOLS } from "@/lib/networth-types";
import {
  getNetWorthEnterTransition,
  NETWORTH_MOTION_FAST_DURATION,
  NETWORTH_MOTION_STAGGER,
} from "@/components/networth/networth-motion";

type BreakdownGroup = "account" | "currency" | "liquidity" | "purpose";

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
  accounts: NetWorthAccount[];
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  hideValues?: boolean;
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
  hideValues,
}: NetWorthSummaryProps) {
  const shouldReduceMotion = useReducedMotion();
  const symbol = CURRENCY_SYMBOLS[displayCurrency];

  const [view, setView] = useState<"breakdown" | "trend">("breakdown");
  const [trendPeriod, setTrendPeriod] = useState<"12m" | "30d">("30d");
  const [breakdownGroup, setBreakdownGroup] =
    useState<BreakdownGroup>("account");

  // Breakdown bar data: grouped by account / currency / liquidity
  const pieData = useMemo(() => {
    const groupMap = new Map<string, number>();
    for (const a of accounts) {
      const key =
        breakdownGroup === "account"
          ? a.name
          : breakdownGroup === "currency"
            ? (a.currency ?? "USD")
            : breakdownGroup === "liquidity"
              ? (a.liquidity ?? "Other")
              : (a.purpose ?? "Other");
      const converted = convertAmount(
        a.amount,
        a.currency ?? "USD",
        displayCurrency,
        exchangeRates,
      );
      groupMap.set(key, (groupMap.get(key) ?? 0) + converted);
    }
    return Array.from(groupMap.entries())
      .map(([name, value]) => ({ name, value: Math.max(0, value) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [accounts, displayCurrency, exchangeRates, breakdownGroup]);

  const total = useMemo(
    () => pieData.reduce((sum, d) => sum + d.value, 0),
    [pieData],
  );

  // Historical net worth from transaction history (last 12 months)
  const historyData12m = useMemo(() => {
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
          const created = new Date(account.startDate ?? account.createdAt);
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
        const created = new Date(account.startDate ?? account.createdAt);
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

  // Historical net worth — daily points for last 30 days
  const historyData30d = useMemo(() => {
    const now = new Date();
    const days: { label: string; endOfDay: Date }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const endOfDay = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
      );
      days.push({
        label: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        endOfDay,
      });
    }

    return days.map(({ label, endOfDay }) => {
      let dayTotal = 0;
      for (const account of accounts) {
        const txs = account.transactions
          .slice()
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );

        if (txs.length === 0) {
          const created = new Date(account.startDate ?? account.createdAt);
          if (created <= endOfDay) {
            dayTotal += convertAmount(
              account.amount,
              account.currency ?? "USD",
              displayCurrency,
              exchangeRates,
            );
          }
          continue;
        }

        const txsAfter = txs.filter((tx) => new Date(tx.date) > endOfDay);
        const sumAfter = txsAfter.reduce((s, tx) => s + tx.amount, 0);
        const amountAtDay = account.amount - sumAfter;

        const created = new Date(account.startDate ?? account.createdAt);
        if (created <= endOfDay) {
          dayTotal += convertAmount(
            Math.max(0, amountAtDay),
            account.currency ?? "USD",
            displayCurrency,
            exchangeRates,
          );
        }
      }

      return { month: label, value: Math.round(dayTotal * 100) / 100 };
    });
  }, [accounts, displayCurrency, exchangeRates]);

  const periodChanges = useMemo(() => {
    const getNetWorthAt = (endOfDay: Date) => {
      let t = 0;
      for (const account of accounts) {
        const created = new Date(account.startDate ?? account.createdAt);
        if (created > endOfDay) continue;
        const txs = account.transactions
          .slice()
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );
        if (txs.length === 0) {
          t += convertAmount(
            account.amount,
            account.currency ?? "USD",
            displayCurrency,
            exchangeRates,
          );
          continue;
        }
        const sumAfter = txs
          .filter((tx) => new Date(tx.date) > endOfDay)
          .reduce((s, tx) => s + tx.amount, 0);
        t += convertAmount(
          Math.max(0, account.amount - sumAfter),
          account.currency ?? "USD",
          displayCurrency,
          exchangeRates,
        );
      }
      return t;
    };
    const now = new Date();
    const eod = (daysAgo: number) =>
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - daysAgo,
        23,
        59,
        59,
      );
    return [
      { label: "1D", past: getNetWorthAt(eod(1)) },
      { label: "1W", past: getNetWorthAt(eod(7)) },
      { label: "1M", past: getNetWorthAt(eod(30)) },
    ];
  }, [accounts, displayCurrency, exchangeRates]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Selector row — above the card */}
      <motion.div
        className="flex shrink-0 items-center justify-between"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : getNetWorthEnterTransition()
        }
      >
        <ToggleGroup
          items={(["breakdown", "trend"] as const).map((v) => ({
            value: v,
            label: v.charAt(0).toUpperCase() + v.slice(1),
          }))}
          value={view}
          onValueChange={setView}
          size="xs"
        />
        {view === "breakdown" && (
          <ToggleGroup
            items={(
              [
                ["account", "Account"],
                ["currency", "Currency"],
                ["liquidity", "Liquidity"],
                ["purpose", "Purpose"],
              ] as [BreakdownGroup, string][]
            ).map(([key, label]) => ({ value: key, label }))}
            value={breakdownGroup}
            onValueChange={setBreakdownGroup}
            size="xs"
          />
        )}
        {view === "trend" && (
          <ToggleGroup
            items={(["12m", "30d"] as const).map((p) => ({
              value: p,
              label: p.toUpperCase(),
            }))}
            value={trendPeriod}
            onValueChange={setTrendPeriod}
            size="xs"
          />
        )}
      </motion.div>
      <motion.div
        className="flex min-h-0 flex-1"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : getNetWorthEnterTransition(0.04)
        }
      >
        <Card className="flex min-h-0 flex-1 flex-row">
          <CardHeader className="w-52 shrink-0 justify-center gap-0 pb-3 pt-3 px-5">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Net Worth
            </p>
            <motion.p
              className="text-3xl font-extrabold tracking-tight"
              key={`${view}-${trendPeriod}-${breakdownGroup}-${displayCurrency}-${Math.round(total)}`}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : getNetWorthEnterTransition(NETWORTH_MOTION_FAST_DURATION)
              }
            >
              {hideValues
                ? "****"
                : `${symbol}${total.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}`}
            </motion.p>
            <div className="mt-3 flex flex-col gap-1.5 border-t pt-3">
              {periodChanges.map(({ label, past }) => {
                const change = total - past;
                const pct = past > 0 ? (change / past) * 100 : null;
                const isPos = change >= 0;
                const fmtAmt = (v: number) => {
                  const abs = Math.abs(v);
                  const str =
                    abs >= 1_000_000
                      ? `${symbol}${(abs / 1_000_000).toFixed(1)}M`
                      : abs >= 1000
                        ? `${symbol}${(abs / 1000).toFixed(1)}k`
                        : `${symbol}${abs.toFixed(0)}`;
                  return `${v >= 0 ? "+" : "-"}${str}`;
                };
                return (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {label}
                    </span>
                    {hideValues ? (
                      <span className="text-xs font-semibold">****</span>
                    ) : (
                      <span
                        className={`text-xs font-semibold tabular-nums ${isPos ? "text-green-600" : "text-red-500"}`}
                      >
                        {fmtAmt(change)}
                        {pct !== null && (
                          <span className="ml-1 font-normal opacity-70">
                            ({pct >= 0 ? "+" : ""}
                            {pct.toFixed(1)}%)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 px-4 pb-3">
            <AnimatePresence mode="wait" initial={false}>
              {view === "breakdown" ? (
                <motion.div
                  key={`breakdown-${breakdownGroup}`}
                  className="flex h-full flex-col"
                  initial={
                    shouldReduceMotion ? undefined : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
                  }
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : getNetWorthEnterTransition(0.02)
                  }
                >
                  {pieData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No data
                    </div>
                  ) : (
                    <div className="flex h-full flex-col gap-4 md:flex-row md:gap-4 justify-center items-center">
                      {/* Pie Chart */}
                      <div className="h-full w-full md:w-2/3 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius="85%"
                              paddingAngle={2}
                            >
                              {pieData.map((entry, i) => (
                                <Cell
                                  key={`cell-${entry.name}`}
                                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => {
                                if (hideValues) return "****";
                                return `${symbol}${Number(value).toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )}`;
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Legend */}
                      <div className="flex w-full md:w-1/3 flex-col gap-2 overflow-y-auto text-xs">
                        {pieData.map((d, i) => (
                          <motion.div
                            key={d.name}
                            className="flex items-center gap-2"
                            initial={
                              shouldReduceMotion
                                ? undefined
                                : { opacity: 0, x: -8 }
                            }
                            animate={{ opacity: 1, x: 0 }}
                            transition={
                              shouldReduceMotion
                                ? { duration: 0 }
                                : getNetWorthEnterTransition(
                                    i * NETWORTH_MOTION_STAGGER,
                                  )
                            }
                          >
                            <span
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[i % PIE_COLORS.length],
                              }}
                            />
                            <span className="flex-1 truncate text-muted-foreground">
                              {d.name}
                            </span>
                            <span className="font-medium shrink-0">
                              {hideValues
                                ? "****"
                                : `${symbol}${d.value.toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    },
                                  )}`}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={`trend-${trendPeriod}`}
                  className="flex h-full flex-col gap-2"
                  initial={
                    shouldReduceMotion ? undefined : { opacity: 0, y: 10 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }
                  }
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : getNetWorthEnterTransition(0.02)
                  }
                >
                  <Chart
                    data={
                      trendPeriod === "12m" ? historyData12m : historyData30d
                    }
                    xKey="month"
                    dataKey="value"
                    color="#3b82f6"
                    tooltipFormatter={(value) => [
                      `${symbol}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      "Net Worth",
                    ]}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
