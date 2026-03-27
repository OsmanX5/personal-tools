"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Target,
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
  includedTypes: Set<IncomeStreamType>;
  onToggleType: (type: IncomeStreamType) => void;
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
  includedTypes,
  onToggleType,
}: ProjectionsPanelProps) {
  const symbol = CURRENCY_SYMBOLS[displayCurrency];

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
        {/* Income type toggle buttons */}
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
        </div>
        {projections.length > 0 && projections[0].monthlyContribution !== 0 && (
          <p className="text-xs text-muted-foreground">
            Based on avg monthly savings of{" "}
            <span className="font-medium">
              {fmt(projections[0].monthlyContribution, symbol)}
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
              {fmt(currentNetWorth, symbol)}
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

            return (
              <motion.div
                key={p.horizon}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={getPlanningEnterTransition(
                  (i + 1) * PLANNING_MOTION_STAGGER,
                )}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${isPositive ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="text-sm">{HORIZON_LABELS[p.horizon]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {fmt(p.projectedNetWorth, symbol)}
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
              const monthsTo = (1_000_000 - currentNetWorth) / monthly;
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
                        {fmt(1_000_000, symbol)}
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
                      <span className="font-semibold">{fmt(0, symbol)}</span> in{" "}
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
