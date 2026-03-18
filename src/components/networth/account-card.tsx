"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import type {
  NetWorthAccount,
  Currency,
  ExchangeRates,
} from "@/lib/networth-types";
import { CURRENCY_SYMBOLS } from "@/lib/networth-types";

const PURPOSE_COLOR_MAP: Record<string, string> = {
  Savings: "border-l-green-500",
  Current: "border-l-blue-500",
  Investment: "border-l-purple-500",
  Other: "border-l-gray-500",
};

const PURPOSE_SELECTED_MAP: Record<string, string> = {
  Savings: "bg-green-100 dark:bg-green-950/60",
  Current: "bg-blue-100 dark:bg-blue-950/60",
  Investment: "bg-purple-100 dark:bg-purple-950/60",
  Other: "bg-gray-100 dark:bg-gray-950/60",
};

export const TRANSACTION_ICON: Record<string, React.ReactNode> = {
  Income: <ArrowUpRight className="h-3 w-3 text-green-600" />,
  Expense: <ArrowDownRight className="h-3 w-3 text-red-600" />,
  Transfer: <RefreshCw className="h-3 w-3 text-blue-600" />,
  MarketChange: <TrendingUp className="h-3 w-3 text-purple-600" />,
};

interface AccountListItemProps {
  account: NetWorthAccount;
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  hideValues?: boolean;
  selected: boolean;
  onSelect: (account: NetWorthAccount) => void;
  onEdit: (account: NetWorthAccount) => void;
  onAddTransaction: (account: NetWorthAccount) => void;
  onUpdateValue: (account: NetWorthAccount) => void;
}

export function convertAmount(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates,
): number {
  if (from === to) return amount;
  const inUsd = amount / rates[from];
  return inUsd * rates[to];
}

export function AccountListItem({
  account,
  displayCurrency,
  exchangeRates,
  hideValues,
  selected,
  onSelect,
  onEdit,
  onAddTransaction,
  onUpdateValue,
}: AccountListItemProps) {
  const accountCurrency = account.currency ?? "USD";
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const displayAmt = convertAmount(
    account.amount,
    accountCurrency,
    displayCurrency,
    exchangeRates,
  );

  return (
    <Card
      className={`cursor-pointer border-l-4 transition-all hover:shadow-md ${PURPOSE_COLOR_MAP[account.purpose] ?? "border-l-gray-500"} ${selected ? (PURPOSE_SELECTED_MAP[account.purpose] ?? "bg-gray-100 dark:bg-gray-950/60") : ""}`}
      onClick={() => onSelect(account)}
      onDoubleClick={() => onEdit(account)}
    >
      <CardContent className="flex items-center gap-3 px-3">
        {/* Name + original value */}
        <div className="min-w-0 flex-1">
          <span className="truncate font-semibold text-sm">{account.name}</span>
          {accountCurrency !== displayCurrency && !hideValues && (
            <span className="ml-1.5 text-xs text-muted-foreground/80">
              (
              {account.amount.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}{" "}
              {CURRENCY_SYMBOLS[accountCurrency]})
            </span>
          )}
        </div>

        {/* Amount – click to update value */}
        <button
          type="button"
          className="group shrink-0 flex items-center gap-1 rounded border border-border bg-muted/50 px-1.5 py-0.5 transition-colors hover:bg-muted cursor-pointer font-bold text-base leading-tight"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateValue(account);
          }}
          title="Click to update value"
        >
          {hideValues
            ? "****"
            : `${displayAmt.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })} ${symbol}`}
          <RefreshCw className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </button>

        {/* Actions */}
        <div
          className="flex shrink-0 gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onAddTransaction(account)}
            title="Add Transaction"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
