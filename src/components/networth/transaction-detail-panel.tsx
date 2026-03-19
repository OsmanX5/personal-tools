"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wallet, Pencil, Trash2, Plus, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  TRANSACTION_ICON,
  convertAmount,
} from "@/components/networth/account-card";
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

interface TransactionDetailPanelProps {
  account: NetWorthAccount;
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  hideValues?: boolean;
  onEdit: (account: NetWorthAccount) => void;
  onDelete: (id: string) => void;
  onAddTransaction: (account: NetWorthAccount) => void;
  onUpdateValue: (account: NetWorthAccount) => void;
}

export function TransactionDetailPanel({
  account,
  displayCurrency,
  exchangeRates,
  hideValues,
  onEdit,
  onDelete,
  onAddTransaction,
  onUpdateValue,
}: TransactionDetailPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const accountCurrency = account.currency ?? "USD";
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const displayAmt = convertAmount(
    account.amount,
    accountCurrency,
    displayCurrency,
    exchangeRates,
  );
  const transactions = account.transactions.slice().reverse();

  const [trendPeriod, setTrendPeriod] = useState<"12m" | "30d">("30d");

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

    const txs = account.transactions
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return months.map(({ label, date }) => {
      const endOfMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      const created = new Date(account.createdAt);
      if (created > endOfMonth) {
        return { month: label, value: 0 };
      }
      if (txs.length === 0) {
        return {
          month: label,
          value: convertAmount(
            account.amount,
            accountCurrency,
            displayCurrency,
            exchangeRates,
          ),
        };
      }
      const sumAfter = txs
        .filter((tx) => new Date(tx.date) > endOfMonth)
        .reduce((s, tx) => s + tx.amount, 0);
      const amt = account.amount - sumAfter;
      return {
        month: label,
        value:
          Math.round(
            convertAmount(
              Math.max(0, amt),
              accountCurrency,
              displayCurrency,
              exchangeRates,
            ) * 100,
          ) / 100,
      };
    });
  }, [account, accountCurrency, displayCurrency, exchangeRates]);

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

    const txs = account.transactions
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return days.map(({ label, endOfDay }) => {
      const created = new Date(account.createdAt);
      if (created > endOfDay) {
        return { month: label, value: 0 };
      }
      if (txs.length === 0) {
        return {
          month: label,
          value: convertAmount(
            account.amount,
            accountCurrency,
            displayCurrency,
            exchangeRates,
          ),
        };
      }
      const sumAfter = txs
        .filter((tx) => new Date(tx.date) > endOfDay)
        .reduce((s, tx) => s + tx.amount, 0);
      const amt = account.amount - sumAfter;
      return {
        month: label,
        value:
          Math.round(
            convertAmount(
              Math.max(0, amt),
              accountCurrency,
              displayCurrency,
              exchangeRates,
            ) * 100,
          ) / 100,
      };
    });
  }, [account, accountCurrency, displayCurrency, exchangeRates]);

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <ScrollArea className="min-h-0 flex-1">
        <motion.div
          className="flex min-h-full flex-col"
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion ? { duration: 0 } : getNetWorthEnterTransition()
          }
        >
          <CardHeader className="shrink-0 pb-3">
            <motion.div
              className="flex items-center justify-between"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : getNetWorthEnterTransition(0.04)
              }
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">{account.name}</CardTitle>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onAddTransaction(account)}
                  title="Add Transaction"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onUpdateValue(account)}
                  title="Update Value"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(account)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => onDelete(account._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
            {account.description && (
              <motion.p
                className="text-sm text-muted-foreground"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : getNetWorthEnterTransition(0.06)
                }
              >
                {account.description}
              </motion.p>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pb-4">
            <motion.div
              className="flex flex-col gap-4 lg:flex-row lg:items-stretch"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : getNetWorthEnterTransition(0.08)
              }
            >
              <motion.div
                className="flex shrink-0 flex-col justify-between gap-3 lg:w-64"
                initial={shouldReduceMotion ? undefined : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : getNetWorthEnterTransition(0.12)
                }
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Balance Summary
                  </p>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <motion.span
                      className="text-3xl font-bold"
                      key={`${account._id}-${displayCurrency}-${hideValues}-${Math.round(displayAmt)}`}
                      initial={
                        shouldReduceMotion ? undefined : { opacity: 0, y: 4 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : getNetWorthEnterTransition(
                              NETWORTH_MOTION_FAST_DURATION,
                            )
                      }
                    >
                      {hideValues
                        ? "****"
                        : `${symbol}${displayAmt.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                    </motion.span>
                    {accountCurrency !== displayCurrency && !hideValues && (
                      <span className="text-sm text-muted-foreground">
                        ({CURRENCY_SYMBOLS[accountCurrency]}
                        {account.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        )
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    account.purpose,
                    account.location,
                    `${CURRENCY_SYMBOLS[accountCurrency]} ${accountCurrency}`,
                  ].map((label, index) => (
                    <motion.div
                      key={label}
                      initial={
                        shouldReduceMotion ? undefined : { opacity: 0, y: 6 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : getNetWorthEnterTransition(
                              0.14 + index * NETWORTH_MOTION_STAGGER,
                            )
                      }
                    >
                      <Badge variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="min-w-0 flex-1"
                initial={shouldReduceMotion ? undefined : { opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : getNetWorthEnterTransition(0.12)
                }
              >
                <div className="mb-1 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Balance Trend
                  </h3>
                  <div className="flex rounded-md border text-xs">
                    {(["12m", "30d"] as const).map((p, i) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTrendPeriod(p)}
                        className={`px-2 py-0.5 uppercase transition-colors ${
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
                </div>
                <div className="h-36 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={
                        trendPeriod === "12m" ? historyData12m : historyData30d
                      }
                      margin={{ top: 4, right: 8, bottom: 0, left: 4 }}
                    >
                      <defs>
                        <linearGradient
                          id={`acctGrad-${account._id}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#22c55e"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#22c55e"
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
                        tick={{ fontSize: 9 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        tick={{ fontSize: 9 }}
                        className="fill-muted-foreground"
                        width={40}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                        }
                      />
                      <Tooltip
                        formatter={(value) => [
                          `${symbol}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                          "Balance",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fill={`url(#acctGrad-${account._id})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </motion.div>

            <motion.h3
              className="text-sm font-semibold text-muted-foreground"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : getNetWorthEnterTransition(0.18)
              }
            >
              Recent Transactions ({transactions.length})
            </motion.h3>
            {transactions.length === 0 ? (
              <motion.div
                className="flex min-h-24 items-center justify-center"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : getNetWorthEnterTransition(0.2)
                }
              >
                <p className="text-sm text-muted-foreground">
                  No transactions yet.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-1.5 pr-3">
                {transactions.slice(0, 5).map((tx, index) => (
                  <motion.div
                    key={tx._id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    initial={
                      shouldReduceMotion ? undefined : { opacity: 0, y: 10 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : getNetWorthEnterTransition(
                            0.2 + index * NETWORTH_MOTION_STAGGER,
                          )
                    }
                  >
                    <div className="flex items-center gap-2">
                      {TRANSACTION_ICON[tx.type]}
                      <span>{tx.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">
                        {new Date(tx.date).toLocaleDateString()}
                      </span>
                      <span
                        className={`font-medium ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {hideValues
                          ? "****"
                          : `${tx.amount >= 0 ? "+" : ""}${CURRENCY_SYMBOLS[accountCurrency]}${tx.amount.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}`}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </motion.div>
      </ScrollArea>
    </Card>
  );
}
