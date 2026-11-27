"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingDown, TrendingUp, Check, CalendarClock } from "lucide-react";
import {
  type WeightEntry,
  BMI_TARGET_THRESHOLDS,
  BMI_CATEGORY_COLORS,
  getBmiCategory,
  weightForBmi,
  computeWeightTrend,
  projectBmiTarget,
} from "@/lib/weight-types";

interface BmiTargetsPanelProps {
  entries: WeightEntry[];
  heightCm: number | null;
  hideValues?: boolean;
}

function formatEta(days: number): string {
  const eta = new Date();
  eta.setDate(eta.getDate() + Math.round(days));
  const dateStr = eta.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (days < 14) {
    const d = Math.round(days);
    return `~${d} day${d === 1 ? "" : "s"} (${dateStr})`;
  }
  if (days < 365) {
    const w = Math.round(days / 7);
    return `~${w} week${w === 1 ? "" : "s"} (${dateStr})`;
  }
  const y = (days / 365).toFixed(1);
  return `~${y} years (${dateStr})`;
}

function progressToTarget(
  startWeight: number,
  currentWeight: number,
  targetWeight: number,
): number | null {
  const totalChange = Math.abs(startWeight - targetWeight);
  if (totalChange === 0) return null;
  const isLosing = targetWeight < startWeight;
  // If user is moving the wrong way from start, show 0
  if (isLosing && currentWeight > startWeight) return 0;
  if (!isLosing && currentWeight < startWeight) return 0;
  const achieved = Math.abs(startWeight - currentWeight);
  return Math.min(100, Math.round((achieved / totalChange) * 100));
}

export function BmiTargetsPanel({
  entries,
  heightCm,
  hideValues,
}: BmiTargetsPanelProps) {
  const trend = useMemo(() => computeWeightTrend(entries), [entries]);
  const currentWeight = entries[0]?.weight;
  // entries are sorted desc by date in the client, so the last item is the earliest
  const startWeight = entries[entries.length - 1]?.weight;

  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">BMI Targets</h2>

      {!heightCm ? (
        <Card>
          <CardContent className="px-4 py-4">
            <p className="text-sm text-muted-foreground">
              Set your height to see BMI targets.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {BMI_TARGET_THRESHOLDS.map((bmi) => {
            const targetWeight = weightForBmi(bmi, heightCm);
            const projection =
              currentWeight != null
                ? projectBmiTarget(
                    currentWeight,
                    targetWeight,
                    trend?.kgPerDay ?? null,
                  )
                : null;
            // The category that this BMI threshold marks the START of
            const category = getBmiCategory(bmi);
            const progress =
              currentWeight != null && startWeight != null
                ? projection?.reached
                  ? 100
                  : progressToTarget(startWeight, currentWeight, targetWeight)
                : null;

            return (
              <Card
                key={bmi}
                className="transition-shadow hover:shadow-md py-3"
              >
                <CardContent className="px-4 py-0 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="font-semibold">
                          {hideValues ? "**" : targetWeight} kg
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          BMI {bmi}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={BMI_CATEGORY_COLORS[category]}
                      >
                        {category}
                      </Badge>
                    </div>
                  </div>

                  {projection && (
                    <div className="space-y-2 text-xs">
                      {projection.reached ? (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3 w-3" />
                          Reached
                        </div>
                      ) : projection.deltaKg > 0 ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingDown className="h-3 w-3" />
                          {hideValues
                            ? "**"
                            : projection.deltaKg.toFixed(1)}{" "}
                          kg to lose
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          {hideValues
                            ? "**"
                            : Math.abs(projection.deltaKg).toFixed(1)}{" "}
                          kg to gain
                        </div>
                      )}

                      {progress !== null && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                projection.reached
                                  ? "bg-emerald-500"
                                  : "bg-primary"
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {!projection.reached && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <CalendarClock className="h-3 w-3" />
                          {trend == null
                            ? "Log more entries to project"
                            : projection.converging && projection.etaDays != null
                              ? formatEta(projection.etaDays)
                              : "Trend not moving toward this target"}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
