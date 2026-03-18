"use client";

import { useMemo } from "react";
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
  const accountCurrency = account.currency ?? "USD";
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const displayAmt = convertAmount(
    account.amount,
    accountCurrency,
    displayCurrency,
    exchangeRates,
  );
  const transactions = account.transactions.slice().reverse();

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

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-center justify-between">
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
        </div>
        {account.description && (
          <p className="text-sm text-muted-foreground">{account.description}</p>
        )}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-3xl font-bold">
            {hideValues
              ? "****"
              : `${symbol}${displayAmt.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </span>
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
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="outline" className="text-xs">
            {account.purpose}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {account.location}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {CURRENCY_SYMBOLS[accountCurrency]} {accountCurrency}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        {/* Account balance trend */}
        <div className="h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={historyData}
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
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
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

        <h3 className="text-sm font-semibold text-muted-foreground">
          Transactions ({transactions.length})
        </h3>
        {transactions.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No transactions yet.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-1.5 pr-3">
              {transactions.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
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
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
