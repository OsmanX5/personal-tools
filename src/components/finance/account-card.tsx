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
  FinanceAccount,
  Currency,
  ExchangeRates,
} from "@/lib/finance-types";
import { CURRENCY_SYMBOLS } from "@/lib/finance-types";

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
  account: FinanceAccount;
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  selected: boolean;
  onSelect: (account: FinanceAccount) => void;
  onAddTransaction: (account: FinanceAccount) => void;
  onUpdateValue: (account: FinanceAccount) => void;
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
  selected,
  onSelect,
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
    >
      <CardContent className="flex items-center gap-3 px-3">
        {/* Name */}
        <div className="min-w-0 flex-1">
          <span className="truncate font-semibold text-sm">{account.name}</span>
        </div>

        {/* Amount */}
        <div className="shrink-0 text-right font-bold text-sm">
          {displayAmt.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
          {"  "}
          {symbol}
        </div>

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
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onUpdateValue(account)}
            title="Update Value"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
