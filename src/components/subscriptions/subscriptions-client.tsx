"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import { SubscriptionFormDialog } from "@/components/subscriptions/subscription-form-dialog";
import { SubscriptionsOverview } from "@/components/subscriptions/subscriptions-overview";
import {
  CURRENCIES,
  CURRENCY_SYMBOLS,
  type Currency,
  type ExchangeRates,
} from "@/lib/networth-types";
import {
  SUBSCRIPTION_BILLING_CYCLES,
  SUBSCRIPTION_STATUSES,
  type Subscription,
  type SubscriptionFormData,
} from "@/lib/subscriptions-types";

export default function SubscriptionsClient() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("USD");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    USD: 1,
    SAR: 3.75,
    EUR: 0.92,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);

  const [statusFilter, setStatusFilter] = useState("All");
  const [cycleFilter, setCycleFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");

  const fetchSubscriptions = useCallback(async () => {
    try {
      const [subsRes, ratesRes] = await Promise.all([
        fetch("/api/subscriptions"),
        fetch("/api/networth/exchange-rates"),
      ]);

      if (!subsRes.ok) throw new Error("Failed to fetch");

      const subsData = await subsRes.json();
      setSubscriptions(subsData);

      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        setExchangeRates(ratesData);
      }
    } catch {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleSubmit = async (data: SubscriptionFormData) => {
    setSaving(true);
    try {
      if (editingSubscription) {
        const res = await fetch(
          `/api/subscriptions/${editingSubscription._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          },
        );
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        setSubscriptions((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item)),
        );
        toast.success("Subscription updated");
      } else {
        const res = await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setSubscriptions((prev) => [created, ...prev]);
        toast.success("Subscription added");
      }

      setDialogOpen(false);
      setEditingSubscription(null);
    } catch {
      toast.error("Failed to save subscription");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setSubscriptions((prev) => prev.filter((item) => item._id !== id));
      toast.success("Subscription deleted");
    } catch {
      toast.error("Failed to delete subscription");
    }
  };

  const tags = useMemo(() => {
    const all = subscriptions.flatMap((sub) => sub.tags);
    return ["All", ...Array.from(new Set(all)).sort()];
  }, [subscriptions]);

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchStatus = statusFilter === "All" || sub.status === statusFilter;
      const matchCycle =
        cycleFilter === "All" || sub.billingCycle === cycleFilter;
      const matchTag = tagFilter === "All" || sub.tags.includes(tagFilter);
      return matchStatus && matchCycle && matchTag;
    });
  }, [subscriptions, statusFilter, cycleFilter, tagFilter]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-sm text-muted-foreground">
            {filteredSubscriptions.length} of {subscriptions.length}{" "}
            subscriptions shown
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingSubscription(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground">Display currency</p>
        <ToggleGroup
          items={CURRENCIES.map((currency) => ({
            value: currency,
            label: `${currency} ${CURRENCY_SYMBOLS[currency]}`,
          }))}
          value={displayCurrency}
          onValueChange={(value) => setDisplayCurrency(value as Currency)}
          className="flex-wrap"
        />
      </div>

      <SubscriptionsOverview
        subscriptions={subscriptions}
        displayCurrency={displayCurrency}
        exchangeRates={exchangeRates}
      />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">Status</p>
          <ToggleGroup
            items={["All", ...SUBSCRIPTION_STATUSES]}
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="flex-wrap"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">Billing cycle</p>
          <ToggleGroup
            items={["All", ...SUBSCRIPTION_BILLING_CYCLES]}
            value={cycleFilter}
            onValueChange={setCycleFilter}
            className="flex-wrap"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">Tag</p>
          <ToggleGroup
            items={tags.map((tag) => ({
              value: tag,
              label: tag === "All" ? "All tags" : `#${tag}`,
            }))}
            value={tagFilter}
            onValueChange={setTagFilter}
            className="flex-wrap"
          />
        </div>
      </div>

      {filteredSubscriptions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No subscriptions matched your filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSubscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription._id}
              subscription={subscription}
              displayCurrency={displayCurrency}
              exchangeRates={exchangeRates}
              onEdit={(sub) => {
                setEditingSubscription(sub);
                setDialogOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <SubscriptionFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingSubscription(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingSubscription}
        loading={saving}
        key={editingSubscription?._id ?? "new-subscription"}
      />
    </div>
  );
}
