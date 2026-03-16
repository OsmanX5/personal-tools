"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, Target, Calendar } from "lucide-react";
import type { FuturePlan } from "@/lib/budget-types";
import {
  PRIORITY_COLORS,
  PLAN_STATUS_COLORS,
  calcMonthlySavingsNeeded,
  convertAmount,
} from "@/lib/budget-types";
import { CURRENCY_SYMBOLS } from "@/lib/networth-types";
import type { Currency, ExchangeRates } from "@/lib/networth-types";

interface PlansListProps {
  plans: FuturePlan[];
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  onEdit: (plan: FuturePlan) => void;
  onDelete: (id: string) => void;
}

export function PlansList({
  plans,
  displayCurrency,
  exchangeRates,
  onEdit,
  onDelete,
}: PlansListProps) {
  const symbol = CURRENCY_SYMBOLS[displayCurrency];

  if (plans.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-8">
        <p className="text-sm text-muted-foreground">
          No future plans yet. Add a plan to start tracking your financial
          goals.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="grid gap-3 pr-3 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const cost = convertAmount(
            plan.estimatedCost,
            plan.currency,
            displayCurrency,
            exchangeRates,
          );
          const saved = convertAmount(
            plan.amountSaved,
            plan.currency,
            displayCurrency,
            exchangeRates,
          );
          const pct = cost > 0 ? (saved / cost) * 100 : 0;
          const monthly = calcMonthlySavingsNeeded(
            cost,
            saved,
            plan.targetDate,
          );

          return (
            <Card key={plan._id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {plan.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(plan)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(plan._id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex gap-2">
                  <Badge
                    variant="outline"
                    className={PRIORITY_COLORS[plan.priority]}
                  >
                    {plan.priority}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={PLAN_STATUS_COLORS[plan.status]}
                  >
                    {plan.status}
                  </Badge>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>
                      {symbol}
                      {saved.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}{" "}
                      saved
                    </span>
                    <span>
                      {symbol}
                      {cost.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}{" "}
                      total
                    </span>
                  </div>
                </div>

                {/* Monthly savings + target date */}
                <div className="mt-auto flex flex-col gap-1 text-xs">
                  {monthly !== null && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Target className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Need{" "}
                        <span className="font-semibold text-foreground">
                          {symbol}
                          {monthly.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        /month
                      </span>
                    </div>
                  )}
                  {plan.targetDate && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Target:{" "}
                        {new Date(plan.targetDate).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
