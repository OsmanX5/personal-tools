"use client";

import { useMemo, useState } from "react";
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
import { CURRENCIES } from "@/lib/networth-types";
import {
  REMINDER_UNITS,
  SUBSCRIPTION_BILLING_CYCLES,
  SUBSCRIPTION_STATUSES,
  type Subscription,
  type SubscriptionFormData,
} from "@/lib/subscriptions-types";

interface SubscriptionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SubscriptionFormData) => void;
  initialData?: Subscription | null;
  loading?: boolean;
}

const todayStr = () => new Date().toISOString().split("T")[0];

function formFromInitial(
  initialData?: Subscription | null,
): SubscriptionFormData {
  if (initialData) {
    return {
      name: initialData.name,
      description: initialData.description,
      amount: initialData.amount,
      currency: initialData.currency,
      billingCycle: initialData.billingCycle,
      nextRenewalDate: initialData.nextRenewalDate.split("T")[0],
      status: initialData.status,
      autoRenew: initialData.autoRenew,
      reminderLead: initialData.reminderLead,
      reminderUnit: initialData.reminderUnit,
      tags: initialData.tags,
    };
  }

  return {
    name: "",
    description: "",
    amount: 0,
    currency: "USD",
    billingCycle: "Monthly",
    nextRenewalDate: todayStr(),
    status: "Active",
    autoRenew: true,
    reminderLead: 3,
    reminderUnit: "days",
    tags: [],
  };
}

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
}: SubscriptionFormDialogProps) {
  const [form, setForm] = useState<SubscriptionFormData>(
    formFromInitial(initialData),
  );

  const tagString = useMemo(() => form.tags.join(", "), [form.tags]);

  const update = <K extends keyof SubscriptionFormData>(
    key: K,
    value: SubscriptionFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      tags: tagString
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) {
          setForm(formFromInitial(initialData));
        }
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Subscription" : "Add Subscription"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Netflix"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(e) => update("amount", Number(e.target.value || 0))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Currency *</Label>
              <ToggleGroup
                items={CURRENCIES}
                value={form.currency}
                onValueChange={(value) =>
                  update("currency", value as SubscriptionFormData["currency"])
                }
                className="flex-wrap"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Billing cycle *</Label>
              <ToggleGroup
                items={SUBSCRIPTION_BILLING_CYCLES}
                value={form.billingCycle}
                onValueChange={(value) =>
                  update(
                    "billingCycle",
                    value as SubscriptionFormData["billingCycle"],
                  )
                }
                className="flex-wrap"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="next-renewal">Next renewal date *</Label>
              <Input
                id="next-renewal"
                type="date"
                value={form.nextRenewalDate}
                onChange={(e) => update("nextRenewalDate", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <ToggleGroup
                items={SUBSCRIPTION_STATUSES}
                value={form.status}
                onValueChange={(value) =>
                  update("status", value as SubscriptionFormData["status"])
                }
                className="flex-wrap"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reminder-lead">Reminder lead</Label>
              <Input
                id="reminder-lead"
                type="number"
                min={0}
                value={form.reminderLead}
                onChange={(e) =>
                  update("reminderLead", Number(e.target.value || 0))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reminder unit</Label>
              <ToggleGroup
                items={REMINDER_UNITS.map((unit) => ({
                  value: unit,
                  label: unit === "days" ? "Days" : "Weeks",
                }))}
                value={form.reminderUnit}
                onValueChange={(value) =>
                  update(
                    "reminderUnit",
                    value as SubscriptionFormData["reminderUnit"],
                  )
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="auto-renew"
              type="checkbox"
              checked={form.autoRenew}
              onChange={(e) => update("autoRenew", e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="auto-renew">Auto-renew</Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={tagString}
              onChange={(e) =>
                update(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                )
              }
              placeholder="streaming, work, productivity"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Optional notes"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initialData ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
