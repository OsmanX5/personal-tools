"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff } from "lucide-react";
import { AccountListItem } from "@/components/networth/account-card";
import { AssetListItem } from "@/components/networth/asset-card";
import { AccountFormDialog } from "@/components/networth/account-form-dialog";
import { AssetFormDialog } from "@/components/networth/asset-form-dialog";
import { AssetValueDialog } from "@/components/networth/asset-value-dialog";
import { TransactionDialog } from "@/components/networth/transaction-dialog";
import { TransactionDetailPanel } from "@/components/networth/transaction-detail-panel";
import { AssetDetailPanel } from "@/components/networth/asset-detail-panel";
import { NetWorthSummary } from "@/components/networth/net-worth-summary";
import { assetCurrentValue } from "@/lib/asset-utils";
import type {
  NetWorthAccount,
  NetWorthAccountFormData,
  Asset,
  AssetFormData,
  AssetCategory,
  TransactionType,
  Currency,
  ExchangeRates,
  AccountPurpose,
} from "@/lib/networth-types";
import {
  CURRENCIES,
  CURRENCY_SYMBOLS,
  ACCOUNT_PURPOSES,
  ASSET_CATEGORIES,
} from "@/lib/networth-types";
import { ToggleGroup } from "@/components/ui/toggle-group";
import {
  getNetWorthEnterTransition,
  NETWORTH_MOTION_FAST_DURATION,
  NETWORTH_MOTION_STAGGER,
} from "@/components/networth/networth-motion";

type ListTab = "accounts" | "assets";

export default function NetWorthClient() {
  const shouldReduceMotion = useReducedMotion();
  const [accounts, setAccounts] = useState<NetWorthAccount[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<NetWorthAccount | null>(
    null,
  );

  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [assetValueDialogOpen, setAssetValueDialogOpen] = useState(false);
  const [valueAsset, setValueAsset] = useState<Asset | null>(null);

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txAccount, setTxAccount] = useState<NetWorthAccount | null>(null);
  const [txMode, setTxMode] = useState<"transaction" | "update-value">(
    "transaction",
  );

  const [listTab, setListTab] = useState<ListTab>("accounts");

  // At most one of these is ever set — the detail panel shows whichever it is.
  const [selectedAccount, setSelectedAccount] =
    useState<NetWorthAccount | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const updateAccount = useCallback((updated: NetWorthAccount) => {
    setAccounts((prev) =>
      prev.map((a) => (a._id === updated._id ? updated : a)),
    );
    setSelectedAccount((prev) => (prev?._id === updated._id ? updated : prev));
  }, []);

  const updateAsset = useCallback((updated: Asset) => {
    setAssets((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
    setSelectedAsset((prev) => (prev?._id === updated._id ? updated : prev));
    setValueAsset((prev) => (prev?._id === updated._id ? updated : prev));
  }, []);

  const [displayCurrency, setDisplayCurrency] = useState<Currency>("SAR");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    USD: 1,
    SAR: 3.75,
    EUR: 0.92,
  });

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/networth");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAccounts(data);
    } catch {
      toast.error("Failed to load accounts");
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch("/api/networth/assets");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAssets(data);
    } catch {
      toast.error("Failed to load assets");
    }
  }, []);

  const fetchExchangeRates = useCallback(async () => {
    try {
      const res = await fetch("/api/networth/exchange-rates");
      if (!res.ok) throw new Error("Failed to fetch rates");
      const data = await res.json();
      setExchangeRates(data);
    } catch {
      // Keep fallback rates
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchAccounts(), fetchAssets()]).finally(() =>
      setLoading(false),
    );
    fetchExchangeRates();
  }, [fetchAccounts, fetchAssets, fetchExchangeRates]);

  const handleAccountSubmit = async (data: NetWorthAccountFormData) => {
    setSaving(true);
    try {
      if (editingAccount) {
        const res = await fetch(`/api/networth/${editingAccount._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        updateAccount(updated);
        toast.success("Account updated");
      } else {
        const res = await fetch("/api/networth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setAccounts((prev) => [created, ...prev]);
        toast.success("Account created");
      }
      setAccountDialogOpen(false);
      setEditingAccount(null);
    } catch {
      toast.error("Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/networth/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setAccounts((prev) => prev.filter((a) => a._id !== id));
      setSelectedAccount((prev) => (prev?._id === id ? null : prev));
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    }
  };

  const handleAssetSubmit = async (data: AssetFormData) => {
    setSaving(true);
    try {
      if (editingAsset) {
        const res = await fetch(`/api/networth/assets/${editingAsset._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        updateAsset(updated);
        toast.success("Asset updated");
      } else {
        const res = await fetch("/api/networth/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setAssets((prev) => [created, ...prev]);
        toast.success("Asset created");
      }
      setAssetDialogOpen(false);
      setEditingAsset(null);
    } catch {
      toast.error("Failed to save asset");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      const res = await fetch(`/api/networth/assets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setAssets((prev) => prev.filter((a) => a._id !== id));
      setSelectedAsset((prev) => (prev?._id === id ? null : prev));
      toast.success("Asset deleted");
    } catch {
      toast.error("Failed to delete asset");
    }
  };

  const handleAssetValueSubmit = async (
    assetId: string,
    data: { value: number; date: string; note?: string },
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/networth/assets/${assetId}/value`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to record value");
      const updated = await res.json();
      updateAsset(updated);
      toast.success("Value recorded");
      setAssetValueDialogOpen(false);
      setValueAsset(null);
    } catch {
      toast.error("Failed to record value");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteValueEntry = async (assetId: string, entryId: string) => {
    try {
      const res = await fetch(
        `/api/networth/assets/${assetId}/value/${entryId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete value entry");
      const updated = await res.json();
      updateAsset(updated);
      toast.success("Value entry deleted");
    } catch {
      toast.error("Failed to delete value entry");
    }
  };

  const handleAddTransaction = async (
    accountId: string,
    data: { amount: number; type: TransactionType },
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/networth/${accountId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to add transaction");
      const updated = await res.json();
      updateAccount(updated);
      toast.success("Transaction added");
      setTxDialogOpen(false);
      setTxAccount(null);
    } catch {
      toast.error("Failed to add transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async (accountId: string, txId: string) => {
    try {
      const res = await fetch(
        `/api/networth/${accountId}/transactions/${txId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete transaction");
      const updated = await res.json();
      updateAccount(updated);
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete transaction");
    }
  };

  const handleUpdateValue = async (
    accountId: string,
    newAmount: number,
    updateKind: "MarketChange" | "Transaction",
  ) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/networth/${accountId}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newAmount, updateKind }),
      });
      if (!res.ok) throw new Error("Failed to update value");
      const updated = await res.json();
      updateAccount(updated);
      toast.success("Value updated");
      setTxDialogOpen(false);
      setTxAccount(null);
    } catch {
      toast.error("Failed to update value");
    } finally {
      setSaving(false);
    }
  };

  const convertAmount = useCallback(
    (amount: number, from: Currency) => {
      if (from === displayCurrency) return amount;
      const inUsd = amount / exchangeRates[from];
      return inUsd * exchangeRates[displayCurrency];
    },
    [displayCurrency, exchangeRates],
  );

  // Accounts and assets are totalled separately so the liquid figure is
  // readable on its own; the combined figure is derived from the two.
  const accountsTotal = useMemo(
    () =>
      accounts.reduce(
        (sum, a) => sum + convertAmount(a.amount, a.currency ?? "USD"),
        0,
      ),
    [accounts, convertAmount],
  );

  const assetsTotal = useMemo(
    () =>
      assets.reduce(
        (sum, a) =>
          sum + convertAmount(assetCurrentValue(a), a.currency ?? "USD"),
        0,
      ),
    [assets, convertAmount],
  );

  const combinedTotal = accountsTotal + assetsTotal;

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) => {
        const aUsd = a.amount / exchangeRates[a.currency ?? "USD"];
        const bUsd = b.amount / exchangeRates[b.currency ?? "USD"];
        return bUsd - aUsd;
      }),
    [accounts, exchangeRates],
  );

  const sortedAssets = useMemo(
    () =>
      [...assets].sort((a, b) => {
        const aUsd = assetCurrentValue(a) / exchangeRates[a.currency ?? "USD"];
        const bUsd = assetCurrentValue(b) / exchangeRates[b.currency ?? "USD"];
        return bUsd - aUsd;
      }),
    [assets, exchangeRates],
  );

  const [purposeFilter, setPurposeFilter] = useState<AccountPurpose | "All">(
    "All",
  );
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | "All">(
    "All",
  );

  const [hideValues, setHideValues] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("networth-hide-values") === "true";
  });

  useEffect(() => {
    localStorage.setItem("networth-hide-values", String(hideValues));
  }, [hideValues]);

  const filteredAccounts = useMemo(
    () =>
      purposeFilter === "All"
        ? sortedAccounts
        : sortedAccounts.filter((a) => a.purpose === purposeFilter),
    [sortedAccounts, purposeFilter],
  );

  const filteredAssets = useMemo(
    () =>
      categoryFilter === "All"
        ? sortedAssets
        : sortedAssets.filter((a) => a.category === categoryFilter),
    [sortedAssets, categoryFilter],
  );

  const fmt = (v: number) =>
    hideValues
      ? "****"
      : `${CURRENCY_SYMBOLS[displayCurrency]}${v.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`;

  if (loading) {
    return (
      <motion.div
        className="flex flex-1 items-center justify-center"
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : getNetWorthEnterTransition()
        }
      >
        <p className="text-muted-foreground">Loading accounts…</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        shouldReduceMotion ? { duration: 0 } : getNetWorthEnterTransition()
      }
    >
      {accounts.length === 0 && assets.length === 0 ? (
        <motion.div
          className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground"
          initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : getNetWorthEnterTransition(NETWORTH_MOTION_FAST_DURATION)
          }
        >
          <p>Nothing tracked yet</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingAccount(null);
                setAccountDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Account
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEditingAsset(null);
                setListTab("assets");
                setAssetDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Asset
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
          {/* Account / asset list */}
          <motion.div
            className="flex w-80 shrink-0 flex-col gap-3 overflow-hidden"
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : getNetWorthEnterTransition(0.04)
            }
          >
            <motion.div
              className="shrink-0"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : getNetWorthEnterTransition(0.08)
              }
            >
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold leading-none">NetWorth</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setHideValues((v) => !v)}
                  title={hideValues ? "Show values" : "Hide values"}
                >
                  {hideValues ? (
                    <EyeOff className="h-6 w-6" />
                  ) : (
                    <Eye className="h-6 w-6" />
                  )}
                </Button>
              </div>
              {/* Accounts and assets are listed as separate lines so the
                  accounts-only net worth is readable at a glance. */}
              <motion.div
                className="mt-1.5 flex flex-col gap-0.5 text-xs"
                key={`${displayCurrency}-${hideValues}-${Math.round(combinedTotal)}`}
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : getNetWorthEnterTransition(0.1)
                }
              >
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {accounts.length} account{accounts.length !== 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {fmt(accountsTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    {assets.length} asset{assets.length !== 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold tabular-nums text-amber-600 dark:text-amber-500">
                    {fmt(assetsTotal)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between border-t pt-0.5">
                  <span className="font-medium uppercase tracking-wider text-muted-foreground">
                    Total
                  </span>
                  <span className="font-bold tabular-nums">
                    {fmt(combinedTotal)}
                  </span>
                </div>
              </motion.div>
            </motion.div>
            {/* Currency toggle */}
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
              <motion.div
                className="flex items-center gap-1.5 text-xs"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : getNetWorthEnterTransition(0.12)
                }
              >
                <span className="shrink-0 text-muted-foreground">
                  Currency:
                </span>
                <ToggleGroup
                  items={CURRENCIES.map((c) => ({
                    value: c,
                    label: `${CURRENCY_SYMBOLS[c]} ${c}`,
                  }))}
                  value={displayCurrency}
                  onValueChange={setDisplayCurrency}
                  className="flex-1"
                  buttonClassName="flex-1 px-1 text-xs"
                />
              </motion.div>
              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : getNetWorthEnterTransition(0.14)
                }
              >
                <ToggleGroup
                  items={[
                    {
                      value: "accounts" as const,
                      label: `Accounts (${accounts.length})`,
                    },
                    {
                      value: "assets" as const,
                      label: `Assets (${assets.length})`,
                    },
                  ]}
                  value={listTab}
                  onValueChange={setListTab}
                  buttonClassName="flex-1 text-xs"
                />
              </motion.div>
              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : getNetWorthEnterTransition(0.16)
                }
              >
                {listTab === "accounts" ? (
                  <ToggleGroup
                    items={["All" as const, ...ACCOUNT_PURPOSES]}
                    value={purposeFilter}
                    onValueChange={setPurposeFilter}
                    buttonClassName="flex-1 px-1 text-xs"
                  />
                ) : (
                  <ToggleGroup
                    items={[
                      { value: "All" as const, label: "All" },
                      ...ASSET_CATEGORIES.map((c) => ({
                        value: c,
                        // "Precious Metal" is too wide for the 320px panel.
                        label: c === "Precious Metal" ? "Metals" : c,
                      })),
                    ]}
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                    className="flex-wrap"
                    buttonClassName="px-1.5 text-xs"
                  />
                )}
              </motion.div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={listTab}
                    className="flex flex-col gap-2"
                    initial={
                      shouldReduceMotion ? undefined : { opacity: 0, x: 8 }
                    }
                    animate={{ opacity: 1, x: 0 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, x: -8 }
                    }
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : getNetWorthEnterTransition()
                    }
                  >
                    {listTab === "accounts"
                      ? filteredAccounts.map((account, index) => (
                          <motion.div
                            key={account._id}
                            layout={!shouldReduceMotion}
                            initial={
                              shouldReduceMotion
                                ? undefined
                                : { opacity: 0, y: 12, scale: 0.98 }
                            }
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={
                              shouldReduceMotion
                                ? { duration: 0 }
                                : getNetWorthEnterTransition(
                                    Math.min(index, 6) *
                                      NETWORTH_MOTION_STAGGER,
                                  )
                            }
                          >
                            <AccountListItem
                              account={account}
                              displayCurrency={displayCurrency}
                              exchangeRates={exchangeRates}
                              hideValues={hideValues}
                              selected={selectedAccount?._id === account._id}
                              onSelect={(a) => {
                                setSelectedAsset(null);
                                setSelectedAccount(a);
                              }}
                              onEdit={(a) => {
                                setEditingAccount(a);
                                setAccountDialogOpen(true);
                              }}
                              onAddTransaction={(a) => {
                                setTxAccount(a);
                                setTxMode("transaction");
                                setTxDialogOpen(true);
                              }}
                              onUpdateValue={(a) => {
                                setTxAccount(a);
                                setTxMode("update-value");
                                setTxDialogOpen(true);
                              }}
                            />
                          </motion.div>
                        ))
                      : filteredAssets.map((asset, index) => (
                          <motion.div
                            key={asset._id}
                            layout={!shouldReduceMotion}
                            initial={
                              shouldReduceMotion
                                ? undefined
                                : { opacity: 0, y: 12, scale: 0.98 }
                            }
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={
                              shouldReduceMotion
                                ? { duration: 0 }
                                : getNetWorthEnterTransition(
                                    Math.min(index, 6) *
                                      NETWORTH_MOTION_STAGGER,
                                  )
                            }
                          >
                            <AssetListItem
                              asset={asset}
                              displayCurrency={displayCurrency}
                              exchangeRates={exchangeRates}
                              hideValues={hideValues}
                              selected={selectedAsset?._id === asset._id}
                              onSelect={(a) => {
                                setSelectedAccount(null);
                                setSelectedAsset(a);
                              }}
                              onEdit={(a) => {
                                setEditingAsset(a);
                                setAssetDialogOpen(true);
                              }}
                              onUpdateValue={(a) => {
                                setValueAsset(a);
                                setAssetValueDialogOpen(true);
                              }}
                            />
                          </motion.div>
                        ))}
                    {listTab === "assets" && filteredAssets.length === 0 && (
                      <p className="px-1 py-6 text-center text-sm text-muted-foreground">
                        No assets yet. Add a property, vehicle, or anything else
                        you own.
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <motion.div
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : getNetWorthEnterTransition(0.2)
                }
              >
                <Button
                  variant="outline"
                  className="w-full shrink-0"
                  onClick={() => {
                    if (listTab === "accounts") {
                      setEditingAccount(null);
                      setAccountDialogOpen(true);
                    } else {
                      setEditingAsset(null);
                      setAssetDialogOpen(true);
                    }
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {listTab === "accounts" ? "Add Account" : "Add Asset"}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Right panel: summary + detail */}
          <motion.div
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
            initial={shouldReduceMotion ? undefined : { opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : getNetWorthEnterTransition(0.08)
            }
          >
            {/* Net Worth Summary */}
            <motion.div
              className="min-h-0 flex-[2]"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : getNetWorthEnterTransition(0.12)
              }
            >
              <NetWorthSummary
                accounts={accounts}
                assets={assets}
                displayCurrency={displayCurrency}
                exchangeRates={exchangeRates}
                hideValues={hideValues}
              />
            </motion.div>

            {/* Selected account or asset detail */}
            <div className="min-h-0 flex-[3]">
              <AnimatePresence mode="wait" initial={false}>
                {selectedAccount ? (
                  <motion.div
                    key={selectedAccount._id}
                    className="h-full"
                    initial={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: 0, y: 14, scale: 0.995 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -10, scale: 0.995 }
                    }
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : getNetWorthEnterTransition(0.04)
                    }
                  >
                    <TransactionDetailPanel
                      account={selectedAccount}
                      displayCurrency={displayCurrency}
                      exchangeRates={exchangeRates}
                      hideValues={hideValues}
                      onEdit={(a) => {
                        setEditingAccount(a);
                        setAccountDialogOpen(true);
                      }}
                      onDelete={handleDelete}
                      onAddTransaction={(a) => {
                        setTxAccount(a);
                        setTxMode("transaction");
                        setTxDialogOpen(true);
                      }}
                      onUpdateValue={(a) => {
                        setTxAccount(a);
                        setTxMode("update-value");
                        setTxDialogOpen(true);
                      }}
                      onDeleteTransaction={handleDeleteTransaction}
                    />
                  </motion.div>
                ) : selectedAsset ? (
                  <motion.div
                    key={selectedAsset._id}
                    className="h-full"
                    initial={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: 0, y: 14, scale: 0.995 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -10, scale: 0.995 }
                    }
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : getNetWorthEnterTransition(0.04)
                    }
                  >
                    <AssetDetailPanel
                      asset={selectedAsset}
                      displayCurrency={displayCurrency}
                      exchangeRates={exchangeRates}
                      hideValues={hideValues}
                      onEdit={(a) => {
                        setEditingAsset(a);
                        setAssetDialogOpen(true);
                      }}
                      onDelete={handleDeleteAsset}
                      onUpdateValue={(a) => {
                        setValueAsset(a);
                        setAssetValueDialogOpen(true);
                      }}
                      onDeleteValueEntry={handleDeleteValueEntry}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-selection"
                    className="flex h-full items-center justify-center rounded-lg border border-dashed"
                    initial={
                      shouldReduceMotion ? undefined : { opacity: 0, y: 10 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -8 }
                    }
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : getNetWorthEnterTransition(0.04)
                    }
                  >
                    <p className="text-sm text-muted-foreground">
                      Select an account or asset to view details
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}

      <AccountFormDialog
        open={accountDialogOpen}
        onOpenChange={(open) => {
          setAccountDialogOpen(open);
          if (!open) setEditingAccount(null);
        }}
        onSubmit={handleAccountSubmit}
        initialData={editingAccount}
        loading={saving}
        key={editingAccount?._id ?? "new"}
      />

      <AssetFormDialog
        open={assetDialogOpen}
        onOpenChange={(open) => {
          setAssetDialogOpen(open);
          if (!open) setEditingAsset(null);
        }}
        onSubmit={handleAssetSubmit}
        initialData={editingAsset}
        loading={saving}
        key={`asset-${editingAsset?._id ?? "new"}`}
      />

      <AssetValueDialog
        open={assetValueDialogOpen}
        onOpenChange={(open) => {
          setAssetValueDialogOpen(open);
          if (!open) setValueAsset(null);
        }}
        asset={valueAsset}
        onSubmit={handleAssetValueSubmit}
        loading={saving}
        key={`asset-value-${valueAsset?._id ?? "none"}`}
      />

      <TransactionDialog
        open={txDialogOpen}
        onOpenChange={(open) => {
          setTxDialogOpen(open);
          if (!open) setTxAccount(null);
        }}
        account={txAccount}
        mode={txMode}
        onSubmitTransaction={handleAddTransaction}
        onSubmitUpdateValue={handleUpdateValue}
        loading={saving}
        key={`tx-${txAccount?._id ?? "none"}-${txMode}`}
      />
    </motion.div>
  );
}
