"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Chart } from "@/components/ui/chart";
import { assetValueAt, assetCurrentValue } from "@/lib/asset-utils";
import type {
  NetWorthAccount,
  Asset,
  Currency,
  ExchangeRates,
} from "@/lib/networth-types";
import { CURRENCY_SYMBOLS } from "@/lib/networth-types";
import {
  getNetWorthEnterTransition,
  NETWORTH_MOTION_FAST_DURATION,
  NETWORTH_MOTION_STAGGER,
} from "@/components/networth/networth-motion";

type BreakdownGroup = "account" | "currency" | "liquidity" | "purpose" | "type";

/** Whether assets are folded into the headline figure, or kept out of it. */
type Scope = "accounts" | "total";

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
  assets: Asset[];
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
  assets,
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
  // Default to accounts-only so the liquid net worth reads clean; assets are
  // opted into rather than silently baked in.
  const [scope, setScope] = useState<Scope>("accounts");
  const includeAssets = scope === "total";

  const accountsTotal = useMemo(
    () =>
      accounts.reduce(
        (sum, a) =>
          sum +
          convertAmount(
            a.amount,
            a.currency ?? "USD",
            displayCurrency,
            exchangeRates,
          ),
        0,
      ),
    [accounts, displayCurrency, exchangeRates],
  );

  const assetsTotal = useMemo(
    () =>
      assets.reduce(
        (sum, a) =>
          sum +
          convertAmount(
            assetCurrentValue(a),
            a.currency ?? "USD",
            displayCurrency,
            exchangeRates,
          ),
        0,
      ),
    [assets, displayCurrency, exchangeRates],
  );

  const total = includeAssets ? accountsTotal + assetsTotal : accountsTotal;

  // "type" only says something once assets are in play.
  const breakdownGroups = useMemo(() => {
    const groups: [BreakdownGroup, string][] = [
      ["account", "Account"],
      ["currency", "Currency"],
      ["liquidity", "Liquidity"],
      ["purpose", "Purpose"],
    ];
    if (includeAssets) groups.push(["type", "Type"]);
    return groups;
  }, [includeAssets]);

  const activeBreakdownGroup =
    breakdownGroup === "type" && !includeAssets ? "account" : breakdownGroup;

  const pieData = useMemo(() => {
    const groupMap = new Map<string, number>();

    for (const a of accounts) {
      const key =
        activeBreakdownGroup === "account"
          ? a.name
          : activeBreakdownGroup === "currency"
            ? (a.currency ?? "USD")
            : activeBreakdownGroup === "liquidity"
              ? (a.liquidity ?? "Other")
              : activeBreakdownGroup === "purpose"
                ? (a.purpose ?? "Other")
                : "Accounts";
      const converted = convertAmount(
        a.amount,
        a.currency ?? "USD",
        displayCurrency,
        exchangeRates,
      );
      groupMap.set(key, (groupMap.get(key) ?? 0) + converted);
    }

    if (includeAssets) {
      for (const asset of assets) {
        const key =
          activeBreakdownGroup === "account"
            ? asset.name
            : activeBreakdownGroup === "currency"
              ? (asset.currency ?? "USD")
              : activeBreakdownGroup === "liquidity"
                ? "Illiquid"
                : activeBreakdownGroup === "purpose"
                  ? asset.category
                  : "Assets";
        const converted = convertAmount(
          assetCurrentValue(asset),
          asset.currency ?? "USD",
          displayCurrency,
          exchangeRates,
        );
        groupMap.set(key, (groupMap.get(key) ?? 0) + converted);
      }
    }

    return Array.from(groupMap.entries())
      .map(([name, value]) => ({ name, value: Math.max(0, value) }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [
    accounts,
    assets,
    includeAssets,
    displayCurrency,
    exchangeRates,
    activeBreakdownGroup,
  ]);

  /** Total across all accounts (and optionally assets) at a point in time. */
  const netWorthAt = useMemo(() => {
    return (endOfPeriod: Date) => {
      let sum = 0;

      for (const account of accounts) {
        const created = new Date(account.startDate ?? account.createdAt);
        if (created > endOfPeriod) continue;

        const txs = account.transactions
          .slice()
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          );

        if (txs.length === 0) {
          sum += convertAmount(
            account.amount,
            account.currency ?? "USD",
            displayCurrency,
            exchangeRates,
          );
          continue;
        }

        // Walk back from the current balance by undoing later transactions.
        const sumAfter = txs
          .filter((tx) => new Date(tx.date) > endOfPeriod)
          .reduce((s, tx) => s + tx.amount, 0);
        sum += convertAmount(
          Math.max(0, account.amount - sumAfter),
          account.currency ?? "USD",
          displayCurrency,
          exchangeRates,
        );
      }

      if (includeAssets) {
        for (const asset of assets) {
          sum += convertAmount(
            assetValueAt(asset, endOfPeriod),
            asset.currency ?? "USD",
            displayCurrency,
            exchangeRates,
          );
        }
      }

      return sum;
    };
  }, [accounts, assets, includeAssets, displayCurrency, exchangeRates]);

  const historyData12m = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const endOfMonth = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      return {
        month: d.toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        }),
        value: Math.round(netWorthAt(endOfMonth) * 100) / 100,
      };
    });
  }, [netWorthAt]);

  const historyData30d = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (29 - i),
      );
      const endOfDay = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
      );
      return {
        month: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        value: Math.round(netWorthAt(endOfDay) * 100) / 100,
      };
    });
  }, [netWorthAt]);

  const periodChanges = useMemo(() => {
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
      { label: "1D", past: netWorthAt(eod(1)) },
      { label: "1W", past: netWorthAt(eod(7)) },
      { label: "1M", past: netWorthAt(eod(30)) },
    ];
  }, [netWorthAt]);

  const fmt = (v: number) =>
    hideValues
      ? "****"
      : `${symbol}${v.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Selector row — above the card */}
      <motion.div
        className="flex shrink-0 items-center justify-between gap-2"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : getNetWorthEnterTransition()
        }
      >
        <div className="flex items-center gap-2">
          <ToggleGroup
            items={(["breakdown", "trend"] as const).map((v) => ({
              value: v,
              label: v.charAt(0).toUpperCase() + v.slice(1),
            }))}
            value={view}
            onValueChange={setView}
            size="xs"
          />
          <ToggleGroup
            items={[
              { value: "accounts" as const, label: "Accounts" },
              { value: "total" as const, label: "+ Assets" },
            ]}
            value={scope}
            onValueChange={setScope}
            size="xs"
          />
        </div>
        {view === "breakdown" && (
          <ToggleGroup
            items={breakdownGroups.map(([key, label]) => ({
              value: key,
              label,
            }))}
            value={activeBreakdownGroup}
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
          <CardHeader className="w-56 shrink-0 justify-center gap-0 pb-3 pt-3 px-5">
            <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              {includeAssets ? "Total Net Worth" : "Net Worth · Accounts"}
            </p>
            <motion.p
              className="text-3xl font-extrabold tracking-tight"
              key={`${scope}-${displayCurrency}-${Math.round(total)}`}
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : getNetWorthEnterTransition(NETWORTH_MOTION_FAST_DURATION)
              }
            >
              {fmt(total)}
            </motion.p>

            {/* Always show the split, so the accounts-only figure stays
                readable no matter which scope is active. */}
            <div className="mt-2 flex flex-col gap-1 border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Accounts
                </span>
                <span className="text-xs font-semibold tabular-nums">
                  {fmt(accountsTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Assets
                </span>
                <span className="text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-500">
                  {fmt(assetsTotal)}
                </span>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-1.5 border-t pt-2">
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
                  key={`breakdown-${activeBreakdownGroup}-${scope}`}
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
                  key={`trend-${trendPeriod}-${scope}`}
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
                    color={includeAssets ? "#f59e0b" : "#3b82f6"}
                    tooltipFormatter={(value) => [
                      `${symbol}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      includeAssets ? "Total Net Worth" : "Accounts",
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
