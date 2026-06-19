"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, ShieldCheck, ShieldAlert } from "lucide-react";
import type { EmergencyFundStatus } from "@/lib/planning-types";
import { CURRENCY_SYMBOLS } from "@/lib/networth-types";
import type {
  Currency,
  ExchangeRates,
  NetWorthAccount,
} from "@/lib/networth-types";
import { convertAmount } from "@/lib/planning-types";
import {
  getPlanningEnterTransition,
  PLANNING_MOTION_STAGGER,
} from "@/components/planning/planning-motion";

interface EmergencyFundPanelProps {
  status: EmergencyFundStatus | null;
  accounts: NetWorthAccount[];
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  hideValues?: boolean;
  onOpenConfig: () => void;
}

function fmt(value: number, symbol: string) {
  return `${symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function EmergencyFundPanel({
  status,
  accounts,
  displayCurrency,
  exchangeRates,
  hideValues,
  onOpenConfig,
}: EmergencyFundPanelProps) {
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const money = (value: number) =>
    hideValues ? "****" : fmt(value, symbol);
  const immediateAccounts = accounts.filter(
    (a) =>
      a.liquidity === "Immediate" &&
      a.status === "active" &&
      a.purpose !== "Investment",
  );
  const hoursAccounts = accounts.filter(
    (a) =>
      a.liquidity === "Hours" &&
      a.status === "active" &&
      a.purpose !== "Investment",
  );
  const allLiquidAccounts = [...immediateAccounts, ...hoursAccounts];

  // Track which accounts are included in the EF calculation
  const [includedIds, setIncludedIds] = useState<Set<string> | null>(null);

  // Initialise on first render with accounts available
  const activeIds = useMemo(() => {
    const ids = new Set(allLiquidAccounts.map((a) => a._id));
    return ids;
  }, [allLiquidAccounts]);

  const included = includedIds ?? activeIds;

  const toggleAccount = (id: string) => {
    setIncludedIds((prev) => {
      const next = new Set(prev ?? activeIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Recalculate EF stats based on toggled accounts
  const localStatus = useMemo<EmergencyFundStatus | null>(() => {
    if (!status) return null;
    // Derive avg monthly expenses from original snapshot values
    const avgMonthlyExpenses =
      status.monthsOfExpensesCovered > 0
        ? status.currentAmount / status.monthsOfExpensesCovered
        : 0;

    let currentAmount = 0;
    for (const a of allLiquidAccounts) {
      if (!included.has(a._id)) continue;
      currentAmount += convertAmount(
        a.amount,
        a.currency,
        displayCurrency,
        exchangeRates,
      );
    }

    const targetAmount = status.targetAmount;
    const percentFilled =
      targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;
    const monthsOfExpensesCovered =
      avgMonthlyExpenses > 0 ? currentAmount / avgMonthlyExpenses : 0;

    return {
      currentAmount,
      targetAmount,
      percentFilled,
      monthsOfExpensesCovered,
      isFullyFunded: currentAmount >= targetAmount,
    };
  }, [status, included, allLiquidAccounts, displayCurrency, exchangeRates]);

  if (!localStatus) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-32 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const pct = localStatus.percentFilled;
  const barColor =
    pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  const renderAccountRow = (a: NetWorthAccount, index: number) => {
    const converted = convertAmount(
      a.amount,
      a.currency,
      displayCurrency,
      exchangeRates,
    );
    const active = included.has(a._id);
    return (
      <motion.button
        key={a._id}
        type="button"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: active ? 1 : 0.45, x: 0 }}
        transition={getPlanningEnterTransition(
          index * PLANNING_MOTION_STAGGER,
        )}
        onClick={() => toggleAccount(a._id)}
        className={`flex w-full items-center justify-between rounded border px-3 py-1.5 text-left transition-colors ${
          active
            ? "border-border bg-background"
            : "border-dashed border-muted-foreground/30 bg-muted/30"
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full transition-colors ${
              active ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          />
          <span className="text-sm">{a.name}</span>
          <Badge variant="outline" className="text-[10px]">
            {a.purpose}
          </Badge>
        </div>
        <span className={`text-sm font-medium ${active ? "" : "line-through"}`}>
          {money(converted)}
        </span>
      </motion.button>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {localStatus.isFullyFunded ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-amber-500" />
            )}
            <CardTitle className="text-base">Emergency Fund</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onOpenConfig}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{money(localStatus.currentAmount)}</span>
            <span className="text-muted-foreground">
              of {money(localStatus.targetAmount)}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pct, 100)}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{pct.toFixed(1)}% funded</span>
            <span>
              {localStatus.monthsOfExpensesCovered.toFixed(1)} months covered
            </span>
          </div>
        </div>

        {/* Contributing accounts (toggleable) */}
        {immediateAccounts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Immediate Liquidity
            </p>
            {immediateAccounts.map((a, i) => renderAccountRow(a, i))}
          </div>
        )}

        {hoursAccounts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Hours Liquidity
            </p>
            {hoursAccounts.map((a, i) =>
              renderAccountRow(a, immediateAccounts.length + i),
            )}
          </div>
        )}

        {allLiquidAccounts.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No accounts with immediate or hours liquidity found
          </p>
        )}
      </CardContent>
    </Card>
  );
}
