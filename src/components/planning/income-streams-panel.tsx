"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import type { IncomeStream, IncomeEntryRow } from "@/lib/planning-types";
import { INCOME_STREAM_TYPE_COLORS } from "@/lib/planning-types";
import { CURRENCY_SYMBOLS } from "@/lib/networth-types";
import type { Currency, ExchangeRates } from "@/lib/networth-types";
import { convertAmount } from "@/lib/planning-types";
import {
  PLANNING_MOTION_STAGGER,
  getPlanningEnterTransition,
} from "@/components/planning/planning-motion";

interface IncomeStreamsPanelProps {
  streams: IncomeStream[];
  entries: IncomeEntryRow[];
  month: number;
  year: number;
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  onMonthChange: (dir: -1 | 1) => void;
  onAddStream: () => void;
  onEditStream: (stream: IncomeStream) => void;
  onDeleteStream: (id: string) => void;
  onSaveEntry: (
    streamId: string,
    amount: number,
    currency: Currency,
    month: number,
    year: number,
  ) => void;
}

export function IncomeStreamsPanel({
  streams,
  entries,
  month,
  year,
  displayCurrency,
  exchangeRates,
  onMonthChange,
  onAddStream,
  onEditStream,
  onDeleteStream,
  onSaveEntry,
}: IncomeStreamsPanelProps) {
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const monthLabel = new Date(year, month - 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const totalIncome = entries.reduce(
    (sum, e) =>
      sum + convertAmount(e.amount, e.currency, displayCurrency, exchangeRates),
    0,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Income Streams</CardTitle>
          <Button variant="outline" size="sm" onClick={onAddStream}>
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onMonthChange(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{monthLabel}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onMonthChange(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm font-semibold">
            Total: {symbol}
            {totalIncome.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <AnimatePresence mode="popLayout">
          {entries.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No income streams yet. Add one to get started.
            </p>
          )}
          {entries.map((entry, i) => (
            <IncomeEntryItem
              key={entry.streamId}
              entry={entry}
              stream={streams.find((s) => s._id === entry.streamId) ?? null}
              displayCurrency={displayCurrency}
              exchangeRates={exchangeRates}
              index={i}
              onEditStream={onEditStream}
              onDeleteStream={onDeleteStream}
              onSaveEntry={(amount) =>
                onSaveEntry(entry.streamId, amount, entry.currency, month, year)
              }
            />
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

interface IncomeEntryItemProps {
  entry: IncomeEntryRow;
  stream: IncomeStream | null;
  displayCurrency: Currency;
  exchangeRates: ExchangeRates;
  index: number;
  onEditStream: (stream: IncomeStream) => void;
  onDeleteStream: (id: string) => void;
  onSaveEntry: (amount: number) => void;
}

function IncomeEntryItem({
  entry,
  stream,
  displayCurrency,
  exchangeRates,
  index,
  onEditStream,
  onDeleteStream,
  onSaveEntry,
}: IncomeEntryItemProps) {
  const [editing, setEditing] = useState(false);
  const [editAmount, setEditAmount] = useState(entry.amount.toString());
  const symbol = CURRENCY_SYMBOLS[displayCurrency];
  const converted = convertAmount(
    entry.amount,
    entry.currency,
    displayCurrency,
    exchangeRates,
  );

  const handleSave = () => {
    const amt = parseFloat(editAmount);
    if (!isNaN(amt) && amt >= 0) {
      onSaveEntry(amt);
      setEditing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={getPlanningEnterTransition(index * PLANNING_MOTION_STAGGER)}
      className="flex items-center justify-between rounded-lg border p-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">
              {entry.streamName ?? stream?.name ?? "Unknown"}
            </p>
            <Badge
              variant="outline"
              className={`text-[10px] ${INCOME_STREAM_TYPE_COLORS[entry.streamType ?? stream?.type ?? "Other"]}`}
            >
              {entry.streamType ?? stream?.type}
            </Badge>
            {entry.isVirtual && (
              <Badge variant="outline" className="text-[10px]">
                Default
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="h-7 w-28 text-right text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleSave}
            >
              <Check className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditAmount(entry.amount.toString());
              setEditing(true);
            }}
            className="text-right cursor-pointer hover:underline"
          >
            <p className="text-sm font-semibold">
              {symbol}
              {converted.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {entry.currency !== displayCurrency && (
              <p className="text-[10px] text-muted-foreground">
                {entry.currency} {entry.amount.toLocaleString()}
              </p>
            )}
          </button>
        )}
        {stream && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEditStream(stream)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={() => onDeleteStream(stream._id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
