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
import { ToggleGroup } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Asset, AssetFormData, Currency } from "@/lib/networth-types";
import {
  ASSET_CATEGORIES,
  CURRENCIES,
  CURRENCY_SYMBOLS,
} from "@/lib/networth-types";

function toDateInputValue(dateValue?: string): string {
  if (!dateValue) return new Date().toISOString().slice(0, 10);
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AssetFormData) => void;
  initialData?: Asset | null;
  loading?: boolean;
}

const defaultFormData: AssetFormData = {
  name: "",
  description: "",
  status: "owned",
  value: 0,
  currency: "USD",
  category: "Property",
  acquisitionDate: new Date().toISOString().slice(0, 10),
  acquisitionCost: 0,
  tags: [],
};

export function AssetFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
}: AssetFormDialogProps) {
  const [form, setForm] = useState<AssetFormData>(
    initialData
      ? {
          name: initialData.name,
          description: initialData.description ?? "",
          status: initialData.status,
          value: initialData.value,
          currency: initialData.currency ?? "USD",
          category: initialData.category,
          acquisitionDate: toDateInputValue(
            initialData.acquisitionDate ?? initialData.createdAt,
          ),
          acquisitionCost: initialData.acquisitionCost ?? 0,
          tags: initialData.tags,
        }
      : defaultFormData,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedDate = new Date(form.acquisitionDate);
    onSubmit({
      ...form,
      acquisitionDate: Number.isNaN(parsedDate.getTime())
        ? new Date().toISOString()
        : parsedDate.toISOString(),
    });
  };

  const update = <K extends keyof AssetFormData>(
    key: K,
    value: AssetFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Asset" : "Add Asset"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="asset-name">Asset Name *</Label>
            <Input
              id="asset-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Apartment, Toyota Corolla"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="asset-description">Description</Label>
            <Textarea
              id="asset-description"
              value={form.description ?? ""}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Optional description…"
              rows={2}
            />
          </div>

          {/* Value + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="asset-value">Current Value</Label>
              <Input
                id="asset-value"
                type="number"
                step="0.01"
                value={form.value}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  update("value", value);
                  if (!initialData) {
                    update("acquisitionCost", value);
                  }
                }}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency *</Label>
              <Select
                value={form.currency}
                onValueChange={(v) => update("currency", v as Currency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CURRENCY_SYMBOLS[c]} {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Acquisition Date + Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="asset-acquisition-date">Acquisition Date</Label>
              <Input
                id="asset-acquisition-date"
                type="date"
                value={form.acquisitionDate}
                onChange={(e) => update("acquisitionDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-acquisition-cost">Acquisition Cost</Label>
              <Input
                id="asset-acquisition-cost"
                type="number"
                step="0.01"
                value={form.acquisitionCost}
                onChange={(e) =>
                  update("acquisitionCost", Number(e.target.value))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <ToggleGroup
              items={ASSET_CATEGORIES}
              value={form.category}
              onValueChange={(v) => update("category", v)}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <ToggleGroup
              items={(["owned", "sold"] as const).map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              }))}
              value={form.status}
              onValueChange={(v) => update("status", v)}
            />
            <p className="text-xs text-muted-foreground">
              Sold assets stay in the list but no longer count toward your net
              worth.
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="asset-tags">Tags (comma-separated)</Label>
            <Input
              id="asset-tags"
              value={form.tags.join(", ")}
              onChange={(e) =>
                update(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
              placeholder="e.g. family, inherited"
            />
          </div>

          {/* Submit */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving…" : initialData ? "Update Asset" : "Create Asset"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
