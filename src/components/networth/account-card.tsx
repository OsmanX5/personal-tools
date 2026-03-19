"use client";

import { motion, useReducedMotion } from "framer-motion";
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
import {
  NETWORTH_MOTION_FAST_DURATION,
  NETWORTH_MOTION_SPRING,
} from "@/components/networth/networth-motion";

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
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      layout={!shouldReduceMotion}
      animate={selected ? { y: -2, scale: 1.01 } : { y: 0, scale: 1 }}
      whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.01 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              ...NETWORTH_MOTION_SPRING,
              duration: NETWORTH_MOTION_FAST_DURATION,
            }
      }
    >
      <Card
        className={`cursor-pointer border-l-4 transition-all hover:shadow-md ${PURPOSE_COLOR_MAP[account.purpose] ?? "border-l-gray-500"} ${selected ? (PURPOSE_SELECTED_MAP[account.purpose] ?? "bg-gray-100 dark:bg-gray-950/60") : ""}`}
        onClick={() => onSelect(account)}
        onDoubleClick={() => onEdit(account)}
      >
        <CardContent className="flex items-center gap-3 px-3">
          <div className="min-w-0 flex-1">
            <span className="truncate text-sm font-semibold">
              {account.name}
            </span>
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

          <motion.button
            type="button"
            className="group shrink-0 flex cursor-pointer items-center gap-1 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-base font-bold leading-tight transition-colors hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateValue(account);
            }}
            title="Click to update value"
            whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: NETWORTH_MOTION_FAST_DURATION }
            }
          >
            {hideValues
              ? "****"
              : `${displayAmt.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })} ${symbol}`}
            <RefreshCw className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50" />
          </motion.button>

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
    </motion.div>
  );
}
