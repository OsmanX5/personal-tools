"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Target,
  Zap,
  RefreshCw,
} from "lucide-react";
import type { ProjectionsData, IncomeStreamType } from "@/lib/planning-types";
import { HORIZON_LABELS, INCOME_STREAM_TYPES } from "@/lib/planning-types";
import { CURRENCY_SYMBOLS } from "@/lib/networth-types";
import type { Currency } from "@/lib/networth-types";
import {
  getPlanningEnterTransition,
  PLANNING_MOTION_STAGGER,
} from "@/components/planning/planning-motion";

interface ProjectionsPanelProps {
  data: ProjectionsData | null;
  currentNetWorth: number;
  displayCurrency: Currency;
  hideValues?: boolean;
  includedTypes: Set<IncomeStreamType>;
  onToggleType: (type: IncomeStreamType) => void;
  includeInvestmentInterest: boolean;
  onToggleInvestmentInterest: () => void;
  /** Annual interest rate as a decimal (e.g. 0.06 = 6%) */
  interestRate: number;
  /** Called when the user clicks Recalculate. Receives the new annual rate as a decimal. */
  onRecalculate: (newRate: number) => void;
}

function fmt(value: number, symbol: string) {
  return `${symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatDuration(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12);
  const months = Math.round(totalMonths % 12);
  if (years === 0) return `${months} month${months !== 1 ? "s" : ""}`;
  if (months === 0) return `${years} y`;
  return `${years} y ${months} month${months !== 1 ? "s" : ""}`;
}

export function ProjectionsPanel({
  data,
  currentNetWorth,
  displayCurrency,
  hideValues,
  includedTypes,
  onToggleType,
  includeInvestmentInterest,
  onToggleInvestmentInterest,
  interestRate,
  onRecalculate,
}: ProjectionsPanelProps) {
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const money = (value: number) =>
    hideValues ? "****" : fmt(value, symbol);

  // Local draft of the rate as a percentage string so the user can type freely.
  const [rateInput, setRateInput] = useState(() =>
    (interestRate * 100).toString(),
  );
  useEffect(() => {
    setRateInput((interestRate * 100).toString());
  }, [interestRate]);

  const handleRecalculateClick = () => {
    const pct = parseFloat(rateInput);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) return;
    onRecalculate(pct / 100);
  };

  if (!data) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-48 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const { projections, emergencyFundFullDate, monthsToEmergencyFundFull } =
    data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Financial Projections</CardTitle>
        </div>
        {/* Income type toggle buttons and investment interest toggle */}
        <div className="flex flex-wrap gap-1 pt-1">
          {INCOME_STREAM_TYPES.map((type) => {
            const active = includedTypes.has(type);
            return (
              <Button
                key={type}
                size="sm"
                variant={active ? "default" : "outline"}
                className={`h-6 text-[11px] px-2 ${active ? "" : "opacity-60"}`}
                onClick={() => onToggleType(type)}
              >
                {active ? "\u2713 " : ""}
                {type}
              </Button>
            );
          })}
          {/* Investment interest toggle button */}
          <Button
            size="sm"
            variant={includeInvestmentInterest ? "default" : "outline"}
            className={`h-6 text-[11px] px-2 ${includeInvestmentInterest ? "" : "opacity-60"}`}
            onClick={onToggleInvestmentInterest}
            title="Toggle annual investment interest calculation"
          >
            {includeInvestmentInterest ? "\u2713 " : ""}
            <Zap className="mr-1 h-3 w-3" />
            Interest
          </Button>
        </div>

        {/* Interest rate setting */}
        <div className="flex items-center gap-2 pt-1">
          <label
            htmlFor="interest-rate-input"
            className="text-[11px] text-muted-foreground"
          >
            Annual rate
          </label>
          <div className="flex items-center gap-1">
            <Input
              id="interest-rate-input"
              type="number"
              inputMode="decimal"
              step="0.1"
              min={0}
              max={100}
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRecalculateClick();
              }}
              className="h-6 w-16 text-[11px]"
              disabled={!includeInvestmentInterest}
            />
            <span className="text-[11px] text-muted-foreground">%</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[11px] px-2"
            onClick={handleRecalculateClick}
            disabled={!includeInvestmentInterest}
            title="Recalculate projections with the new rate"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Recalculate
          </Button>
        </div>
        {projections.length > 0 && projections[0].monthlyContribution !== 0 && (
          <p className="text-xs text-muted-foreground">
            Based on avg monthly savings of{" "}
            <span className="font-medium">
              {money(projections[0].monthlyContribution)}
            </span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Net worth projection timeline */}
        <div className="space-y-1.5">
          {/* Current net worth row */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-sm font-medium">Now</span>
            </div>
            <span className="text-sm font-bold">
              {money(currentNetWorth)}
            </span>
          </div>

          {/* Future projections */}
          {projections.map((p, i) => {
            const growth =
              currentNetWorth > 0
                ? ((p.projectedNetWorth - currentNetWorth) / currentNetWorth) *
                  100
                : 0;
            const isPositive = p.projectedNetWorth > currentNetWorth;
            const baseGrowth = p.projectedSavings;
            const interestGrowth = p.interestEarned || 0;
            const hasInterest = interestGrowth > 0;

            // Marginal interest earned during this horizon's period
            // (i.e. since the previous horizon shown)
            const prev = i > 0 ? projections[i - 1] : null;
            const periodInterest =
              interestGrowth - (prev?.interestEarned ?? 0);
            const startYear = prev ? Math.round(prev.months / 12) : 0;
            const endYear = Math.round(p.months / 12);
            const periodLabel =
              startYear + 1 === endYear
                ? `Yr ${endYear}`
                : `Yrs ${startYear + 1}–${endYear}`;

            return (
              <motion.div
                key={p.horizon}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={getPlanningEnterTransition(
                  (i + 1) * PLANNING_MOTION_STAGGER,
                )}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${isPositive ? "bg-green-500" : "bg-red-500"}`}
                    />
                    <span className="text-sm">{HORIZON_LABELS[p.horizon]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {money(p.projectedNetWorth)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        isPositive
                          ? "border-green-200 text-green-700 dark:border-green-700/50 dark:text-green-200"
                          : "border-red-200 text-red-700 dark:border-red-700/50 dark:text-red-200"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {growth.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                {/* Interest breakdown */}
                {hasInterest && (
                  <div className="ml-3 flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span>• Savings</span>
                      </div>
                      <span>{money(baseGrowth)}</span>
                    </div>
                    <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>
                          Interest ({(interestRate * 100).toFixed(2)}% annual)
                        </span>
                      </div>
                      <span className="font-medium">
                        {money(interestGrowth)}
                      </span>
                    </div>
                    {prev && periodInterest > 0 && (
                      <div className="flex items-center justify-between pl-4 text-amber-600/80 dark:text-amber-400/80">
                        <span>↳ Earned in {periodLabel}</span>
                        <span>{money(periodInterest)}</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Milestone: time to $1M or time to $0 */}
        {projections.length > 0 &&
          projections[0].monthlyContribution !== 0 &&
          (() => {
            const monthly = projections[0].monthlyContribution;
            if (monthly > 0) {
              if (currentNetWorth >= 1_000_000) return null;

              // Calculate months to reach $1M
              let monthsTo: number;
              if (includeInvestmentInterest) {
                // When interest is enabled, find the projection that reaches $1M
                const milestoneProjection = projections.find(
                  (p) => p.projectedNetWorth >= 1_000_000,
                );
                if (milestoneProjection) {
                  // Use the milestone projection's months
                  monthsTo = milestoneProjection.months;
                } else {
                  // If none reach $1M in available horizons, estimate based on last projection
                  const lastProj = projections[projections.length - 1];
                  if (lastProj.projectedNetWorth > currentNetWorth) {
                    monthsTo =
                      (1_000_000 - currentNetWorth) /
                      ((lastProj.projectedNetWorth - currentNetWorth) /
                        lastProj.months);
                  } else {
                    monthsTo = (1_000_000 - currentNetWorth) / monthly;
                  }
                }
              } else {
                // Without interest, use simple linear calculation
                monthsTo = (1_000_000 - currentNetWorth) / monthly;
              }

              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={getPlanningEnterTransition(0.25)}
                  className="rounded-lg border bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-500" />
                    <p className="text-sm">
                      Reach{" "}
                      <span className="font-semibold">
                        {money(1_000_000)}
                      </span>{" "}
                      in{" "}
                      <span className="font-semibold">
                        {formatDuration(monthsTo)}
                      </span>
                    </p>
                  </div>
                </motion.div>
              );
            } else {
              if (currentNetWorth <= 0) return null;
              const monthsTo = currentNetWorth / Math.abs(monthly);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={getPlanningEnterTransition(0.25)}
                  className="rounded-lg border border-red-200 bg-red-50/50 dark:border-red-700/50 dark:bg-red-900/20 p-3"
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <p className="text-sm text-red-700 dark:text-red-200">
                      Net worth reaches{" "}
                      <span className="font-semibold">{money(0)}</span> in{" "}
                      <span className="font-semibold">
                        {formatDuration(monthsTo)}
                      </span>
                    </p>
                  </div>
                </motion.div>
              );
            }
          })()}

        {/* Emergency fund projection */}
        {monthsToEmergencyFundFull !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={getPlanningEnterTransition(0.3)}
            className="rounded-lg border bg-muted/30 p-3"
          >
            {monthsToEmergencyFundFull === 0 ? (
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <p className="text-sm font-medium text-green-700 dark:text-green-200">
                  Emergency fund is fully funded!
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm">
                    Emergency fund fully funded in{" "}
                    <span className="font-semibold">
                      {monthsToEmergencyFundFull} month
                      {monthsToEmergencyFundFull !== 1 ? "s" : ""}
                    </span>
                  </p>
                  {emergencyFundFullDate && (
                    <p className="text-xs text-muted-foreground">
                      Estimated{" "}
                      {new Date(emergencyFundFullDate).toLocaleDateString(
                        undefined,
                        {
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {projections.length > 0 && projections[0].monthlyContribution === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Add income data and track expenses to see accurate projections
          </p>
        )}
      </CardContent>
    </Card>
  );
}
