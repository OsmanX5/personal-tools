"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Boxes, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Chart } from "@/components/ui/chart";
import { convertAmount } from "@/components/networth/account-card";
import { assetValueAt } from "@/lib/asset-utils";
import type { Asset, Currency, ExchangeRates } from "@/lib/networth-types";
import { CURRENCY_SYMBOLS } from "@/lib/networth-types";
import {
  getNetWorthEnterTransition,
  NETWORTH_MOTION_FAST_DURATION,
  NETWORTH_MOTION_STAGGER,
} from "@/components/networth/networth-motion";

interface AssetDetailPanelProps {
  asset: Asset;
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  hideValues?: boolean;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
  onUpdateValue: (asset: Asset) => void;
  onDeleteValueEntry: (assetId: string, entryId: string) => void;
}

export function AssetDetailPanel({
  asset,
  displayCurrency,
  exchangeRates,
  hideValues,
  onEdit,
  onDelete,
  onUpdateValue,
  onDeleteValueEntry,
}: AssetDetailPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const assetCurrency = asset.currency ?? "USD";
  const acquisitionDate = asset.acquisitionDate ?? asset.createdAt;
  const acquisitionCost = asset.acquisitionCost ?? 0;
  const acquiredLabel = new Date(acquisitionDate).toLocaleDateString();
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const displayAmt = convertAmount(
    asset.value,
    assetCurrency,
    displayCurrency,
    exchangeRates,
  );
  const entries = useMemo(
    () =>
      (asset.valueHistory ?? [])
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [asset.valueHistory],
  );

  const [trendPeriod, setTrendPeriod] = useState<"12m" | "30d">("12m");

  // Gain relative to what was paid — the number that actually matters for an
  // asset, as opposed to an account's short-window deltas.
  const gain = useMemo(() => {
    if (acquisitionCost <= 0) return null;
    const change = asset.value - acquisitionCost;
    return { change, pct: (change / acquisitionCost) * 100 };
  }, [asset.value, acquisitionCost]);

  const historyData12m = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const endOfMonth = new Date(
        d.getFullYear(),
        d.getMonth() + 1,
        0,
        23,
        59,
        59,
      );
      return {
        month: d.toLocaleDateString(undefined, {
          month: "short",
          year: "2-digit",
        }),
        value:
          Math.round(
            convertAmount(
              assetValueAt(asset, endOfMonth),
              assetCurrency,
              displayCurrency,
              exchangeRates,
            ) * 100,
          ) / 100,
      };
    });
  }, [asset, assetCurrency, displayCurrency, exchangeRates]);

  const historyData30d = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (29 - i),
      );
      const endOfDay = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
        23,
        59,
        59,
      );
      return {
        month: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        value:
          Math.round(
            convertAmount(
              assetValueAt(asset, endOfDay),
              assetCurrency,
              displayCurrency,
              exchangeRates,
            ) * 100,
          ) / 100,
      };
    });
  }, [asset, assetCurrency, displayCurrency, exchangeRates]);

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
                <Boxes className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg">{asset.name}</CardTitle>
                {asset.status === "sold" && (
                  <Badge variant="outline" className="text-xs">
                    Sold
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onUpdateValue(asset)}
                  title="Update Value"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(asset)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => onDelete(asset._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
            {asset.description && (
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
                {asset.description}
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
                    Value
                  </p>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <motion.span
                      className="text-3xl font-extrabold tracking-tight"
                      key={`${asset._id}-${displayCurrency}-${hideValues}-${Math.round(displayAmt)}`}
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
                    {assetCurrency !== displayCurrency && !hideValues && (
                      <span className="text-sm text-muted-foreground">
                        ({CURRENCY_SYMBOLS[assetCurrency]}
                        {asset.value.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        )
                      </span>
                    )}
                  </div>
                  {gain && (
                    <div className="mt-3 flex flex-col gap-1.5 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Since Purchase
                        </span>
                        {hideValues ? (
                          <span className="text-xs font-semibold">****</span>
                        ) : (
                          <span
                            className={`text-xs font-semibold tabular-nums ${
                              gain.change >= 0
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            {gain.change >= 0 ? "+" : "-"}
                            {CURRENCY_SYMBOLS[assetCurrency]}
                            {Math.abs(gain.change).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                            <span className="ml-1 font-normal opacity-70">
                              ({gain.pct >= 0 ? "+" : ""}
                              {gain.pct.toFixed(1)}%)
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    asset.category,
                    `${CURRENCY_SYMBOLS[assetCurrency]} ${assetCurrency}`,
                    `Acquired: ${acquiredLabel}`,
                    hideValues
                      ? "Cost: ****"
                      : `Cost: ${CURRENCY_SYMBOLS[assetCurrency]}${acquisitionCost.toLocaleString(
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
                    Value Trend
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
                    color="#f59e0b"
                    tickFontSize={9}
                    margin={{ top: 4, right: 8, bottom: 0, left: 4 }}
                    yWidth={40}
                    tooltipFormatter={(value) => [
                      `${symbol}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      "Value",
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
              Value History ({entries.length})
            </motion.h3>
            {entries.length === 0 ? (
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
                  No value entries yet.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-1.5 pr-3">
                {entries.slice(0, 5).map((entry, index) => {
                  // Compare against the entry recorded immediately before it.
                  const previous = entries[index + 1];
                  const delta = previous ? entry.value - previous.value : null;
                  return (
                    <motion.div
                      key={entry._id}
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
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate">
                          {entry.note ?? "Valuation"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString()}
                        </span>
                        {delta !== null && !hideValues && (
                          <span
                            className={`text-xs tabular-nums ${
                              delta >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {delta >= 0 ? "+" : "-"}
                            {CURRENCY_SYMBOLS[assetCurrency]}
                            {Math.abs(delta).toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        )}
                        <span className="font-medium tabular-nums">
                          {hideValues
                            ? "****"
                            : `${CURRENCY_SYMBOLS[assetCurrency]}${entry.value.toLocaleString(
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
                          onClick={() => onDeleteValueEntry(asset._id, entry._id)}
                          title="Delete value entry"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </motion.div>
      </ScrollArea>
    </Card>
  );
}
