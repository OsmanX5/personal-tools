"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, RefreshCw } from "lucide-react";
import { convertAmount } from "@/components/networth/account-card";
import type { Asset, Currency, ExchangeRates } from "@/lib/networth-types";
import {
  CURRENCY_SYMBOLS,
  ASSET_CATEGORY_BORDER,
  ASSET_CATEGORY_SELECTED,
} from "@/lib/networth-types";
import {
  NETWORTH_MOTION_FAST_DURATION,
  NETWORTH_MOTION_SPRING,
} from "@/components/networth/networth-motion";

interface AssetListItemProps {
  asset: Asset;
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  hideValues?: boolean;
  selected: boolean;
  onSelect: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onUpdateValue: (asset: Asset) => void;
}

export function AssetListItem({
  asset,
  displayCurrency,
  exchangeRates,
  hideValues,
  selected,
  onSelect,
  onEdit,
  onUpdateValue,
}: AssetListItemProps) {
  const assetCurrency = asset.currency ?? "USD";
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const displayAmt = convertAmount(
    asset.value,
    assetCurrency,
    displayCurrency,
    exchangeRates,
  );
  const acquiredDate = new Date(asset.acquisitionDate ?? asset.createdAt);
  const acquiredLabel = acquiredDate.toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
  const isSold = asset.status === "sold";
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
        className={`cursor-pointer border-l-4 border-dashed transition-all hover:shadow-md ${
          ASSET_CATEGORY_BORDER[asset.category] ?? "border-l-gray-500"
        } ${
          selected
            ? (ASSET_CATEGORY_SELECTED[asset.category] ??
              "bg-gray-100 dark:bg-gray-800/40")
            : ""
        } ${isSold ? "opacity-60" : ""}`}
        onClick={() => onSelect(asset)}
        onDoubleClick={() => onEdit(asset)}
      >
        <CardContent className="flex items-center gap-3 px-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className="truncate text-sm font-semibold">
                {asset.name}
              </span>
              {isSold && (
                <span className="rounded bg-muted px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Sold
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
              <span>{asset.category}</span>
              <span>·</span>
              <span>Since {acquiredLabel}</span>
              {assetCurrency !== displayCurrency && !hideValues && (
                <span className="text-muted-foreground/80">
                  (
                  {asset.value.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}{" "}
                  {CURRENCY_SYMBOLS[assetCurrency]})
                </span>
              )}
            </div>
          </div>

          <motion.button
            type="button"
            className="group shrink-0 flex cursor-pointer items-center gap-1 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-base font-bold leading-tight transition-colors hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateValue(asset);
            }}
            title="Click to record a new value"
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
              onClick={() => onEdit(asset)}
              title="Edit Asset"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
