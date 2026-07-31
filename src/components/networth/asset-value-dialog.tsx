"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Asset } from "@/lib/networth-types";
import { CURRENCY_SYMBOLS } from "@/lib/networth-types";

interface AssetValueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  onSubmit: (
    assetId: string,
    data: { value: number; date: string; note?: string },
  ) => void;
  loading?: boolean;
}

export function AssetValueDialog({
  open,
  onOpenChange,
  asset,
  onSubmit,
  loading,
}: AssetValueDialogProps) {
  const [value, setValue] = useState<string>(String(asset?.value ?? 0));
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState("");

  if (!asset) return null;

  const symbol = CURRENCY_SYMBOLS[asset.currency ?? "USD"];
  const newValue = Number(value);
  const diff = Number.isNaN(newValue) ? 0 : newValue - asset.value;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number.isNaN(newValue)) return;
    const parsedDate = new Date(date);
    onSubmit(asset._id, {
      value: newValue,
      date: Number.isNaN(parsedDate.getTime())
        ? new Date().toISOString()
        : parsedDate.toISOString(),
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Value — {asset.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="asset-new-value">New Value</Label>
            <Input
              id="asset-new-value"
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="asset-value-date">Valued On</Label>
            <Input
              id="asset-value-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="asset-value-note">Note</Label>
            <Input
              id="asset-value-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. yearly valuation"
            />
          </div>

          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current</span>
              <span className="font-medium tabular-nums">
                {symbol}
                {asset.value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Change</span>
              <span
                className={`font-semibold tabular-nums ${
                  diff >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {diff >= 0 ? "+" : "-"}
                {symbol}
                {Math.abs(diff).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving…" : "Record Value"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
