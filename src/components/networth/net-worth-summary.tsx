"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
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
          const created = new Date(account.createdAt);
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

        const created = new Date(account.createdAt);
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
        {view === "breakdown" && (
          <div className="flex rounded-md border text-xs">
            {(
              [
                ["account", "Account"],
                ["currency", "Currency"],
                ["liquidity", "Liquidity"],
                ["purpose", "Purpose"],
              ] as [BreakdownGroup, string][]
            ).map(([key, label], i) => (
              <button
                key={key}
                type="button"
                onClick={() => setBreakdownGroup(key)}
                className={`px-3 py-1 transition-colors ${
                  i > 0 ? "border-l" : ""
                } ${
                  breakdownGroup === key
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {view === "trend" && (
          <div className="flex rounded-md border text-xs">
            {(["12m", "30d"] as const).map((p, i) => (
              <button
                key={p}
                type="button"
                onClick={() => setTrendPeriod(p)}
                className={`px-3 py-1 uppercase transition-colors ${
                  i > 0 ? "border-l" : ""
                } ${
                  trendPeriod === p
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
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
          <CardHeader className="shrink-0 pb-2 pt-3 px-4">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                Net Worth
              </CardTitle>
              <motion.p
                className="text-2xl font-bold"
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
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={
                        trendPeriod === "12m" ? historyData12m : historyData30d
                      }
                      margin={{ top: 4, right: 12, bottom: 0, left: 4 }}
                    >
                      <defs>
                        <linearGradient
                          id="netWorthGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
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
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
