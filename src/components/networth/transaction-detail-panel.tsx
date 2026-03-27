"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wallet, Pencil, Trash2, Plus, RefreshCw } from "lucide-react";
import { Chart } from "@/components/ui/chart";
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
  onDeleteTransaction: (accountId: string, txId: string) => void;
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
  onDeleteTransaction,
}: TransactionDetailPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const accountCurrency = account.currency ?? "USD";
  const accountStartDate = account.startDate ?? account.createdAt;
  const accountStartBalance = account.startBalance ?? account.amount;
  const startDateLabel = new Date(accountStartDate).toLocaleDateString();
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const displayAmt = convertAmount(
    account.amount,
    accountCurrency,
    displayCurrency,
    exchangeRates,
  );
  const transactions = account.transactions.slice().reverse();

  const [trendPeriod, setTrendPeriod] = useState<"12m" | "30d">("30d");

  const accountPeriodChanges = useMemo(() => {
    const txs = account.transactions
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const getAmountAt = (endOfDay: Date) => {
      const created = new Date(accountStartDate);
      if (created > endOfDay) return 0;
      if (txs.length === 0)
        return convertAmount(
          account.amount,
          accountCurrency,
          displayCurrency,
          exchangeRates,
        );
      const sumAfter = txs
        .filter((tx) => new Date(tx.date) > endOfDay)
        .reduce((s, tx) => s + tx.amount, 0);
      return convertAmount(
        Math.max(0, account.amount - sumAfter),
        accountCurrency,
        displayCurrency,
        exchangeRates,
      );
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
      { label: "1D", past: getAmountAt(eod(1)) },
      { label: "1W", past: getAmountAt(eod(7)) },
      { label: "1M", past: getAmountAt(eod(30)) },
    ];
  }, [
    account,
    accountCurrency,
    accountStartDate,
    displayCurrency,
    exchangeRates,
  ]);

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
      const created = new Date(accountStartDate);
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
  }, [
    account,
    accountCurrency,
    accountStartDate,
    displayCurrency,
    exchangeRates,
  ]);

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
      const created = new Date(accountStartDate);
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
  }, [
    account,
    accountCurrency,
    accountStartDate,
    displayCurrency,
    exchangeRates,
  ]);

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
                  <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    Balance
                  </p>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <motion.span
                      className="text-3xl font-extrabold tracking-tight"
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
                  <div className="mt-3 flex flex-col gap-1.5 border-t pt-3">
                    {accountPeriodChanges.map(({ label, past }) => {
                      const change = displayAmt - past;
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
                              className={`text-xs font-semibold tabular-nums ${
                                isPos ? "text-green-600" : "text-red-500"
                              }`}
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
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    account.purpose,
                    account.location,
                    `${CURRENCY_SYMBOLS[accountCurrency]} ${accountCurrency}`,
                    `Start: ${startDateLabel}`,
                    hideValues
                      ? "Start Balance: ****"
                      : `Start Balance: ${CURRENCY_SYMBOLS[accountCurrency]}${accountStartBalance.toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}`,
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
                  <Chart
                    data={
                      trendPeriod === "12m" ? historyData12m : historyData30d
                    }
                    xKey="month"
                    dataKey="value"
                    color="#22c55e"
                    tickFontSize={9}
                    margin={{ top: 4, right: 8, bottom: 0, left: 4 }}
                    yWidth={40}
                    tooltipFormatter={(value) => [
                      `${symbol}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      "Balance",
                    ]}
                  />
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
                    className="group flex items-center justify-between rounded-md border px-3 py-2 text-sm"
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                        onClick={() => onDeleteTransaction(account._id, tx._id)}
                        title="Delete transaction"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
