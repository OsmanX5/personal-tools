"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff } from "lucide-react";
import { AccountListItem } from "@/components/networth/account-card";
import { AccountFormDialog } from "@/components/networth/account-form-dialog";
import { TransactionDialog } from "@/components/networth/transaction-dialog";
import { TransactionDetailPanel } from "@/components/networth/transaction-detail-panel";
import { NetWorthSummary } from "@/components/networth/net-worth-summary";
import type {
  NetWorthAccount,
  NetWorthAccountFormData,
  TransactionType,
  Currency,
  ExchangeRates,
  AccountPurpose,
} from "@/lib/networth-types";
import {
  CURRENCIES,
  CURRENCY_SYMBOLS,
  ACCOUNT_PURPOSES,
} from "@/lib/networth-types";
import {
  getNetWorthEnterTransition,
  NETWORTH_MOTION_FAST_DURATION,
  NETWORTH_MOTION_STAGGER,
} from "@/components/networth/networth-motion";

export default function NetWorthClient() {
  const shouldReduceMotion = useReducedMotion();
  const [accounts, setAccounts] = useState<NetWorthAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<NetWorthAccount | null>(
    null,
  );

  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [txAccount, setTxAccount] = useState<NetWorthAccount | null>(null);
  const [txMode, setTxMode] = useState<"transaction" | "update-value">(
    "transaction",
  );

  const [selectedAccount, setSelectedAccount] =
    useState<NetWorthAccount | null>(null);

  const updateAccount = useCallback((updated: NetWorthAccount) => {
    setAccounts((prev) =>
      prev.map((a) => (a._id === updated._id ? updated : a)),
    );
    setSelectedAccount((prev) => (prev?._id === updated._id ? updated : prev));
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
    } finally {
      setLoading(false);
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
    fetchAccounts();
    fetchExchangeRates();
  }, [fetchAccounts, fetchExchangeRates]);

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

  const total = useMemo(
    () =>
      accounts.reduce(
        (sum, a) => sum + convertAmount(a.amount, a.currency ?? "USD"),
        0,
      ),
    [accounts, convertAmount],
  );

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) => {
        const aUsd = a.amount / exchangeRates[a.currency ?? "USD"];
        const bUsd = b.amount / exchangeRates[b.currency ?? "USD"];
        return bUsd - aUsd;
      }),
    [accounts, exchangeRates],
  );

  const [purposeFilter, setPurposeFilter] = useState<AccountPurpose | "All">(
    "All",
  );

  const [hideValues, setHideValues] = useState(false);

  const filteredAccounts = useMemo(
    () =>
      purposeFilter === "All"
        ? sortedAccounts
        : sortedAccounts.filter((a) => a.purpose === purposeFilter),
    [sortedAccounts, purposeFilter],
  );

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
      {accounts.length === 0 ? (
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
          <p>No accounts yet. Add your first account to get started.</p>
        </motion.div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
          {/* Account list */}
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
              <motion.p
                className="text-sm text-muted-foreground"
                key={`${displayCurrency}-${hideValues}-${accounts.length}-${Math.round(total)}`}
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : getNetWorthEnterTransition(0.1)
                }
              >
                {accounts.length} account{accounts.length !== 1 ? "s" : ""} —
                Total:{" "}
                <span className="font-semibold text-foreground">
                  {hideValues
                    ? "****"
                    : `${CURRENCY_SYMBOLS[displayCurrency]}${total.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}`}
                </span>
              </motion.p>
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
                <div className="flex flex-1 rounded-md border">
                  {CURRENCIES.map((c, i) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setDisplayCurrency(c)}
                      className={`flex-1 px-1.5 py-1 transition-colors ${
                        i > 0 ? "border-l" : ""
                      } ${
                        displayCurrency === c
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {CURRENCY_SYMBOLS[c]} {c}
                    </button>
                  ))}
                </div>
              </motion.div>
              <motion.div
                className="flex rounded-md border text-xs"
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : getNetWorthEnterTransition(0.16)
                }
              >
                {(["All", ...ACCOUNT_PURPOSES] as const).map((p, i) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPurposeFilter(p)}
                    className={`flex-1 px-1.5 py-1 transition-colors ${
                      i > 0 ? "border-l" : ""
                    } ${
                      purposeFilter === p
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </motion.div>
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    className="flex flex-col gap-2"
                    layout={!shouldReduceMotion}
                  >
                    {filteredAccounts.map((account, index) => (
                      <motion.div
                        key={account._id}
                        layout={!shouldReduceMotion}
                        initial={
                          shouldReduceMotion
                            ? undefined
                            : { opacity: 0, y: 12, scale: 0.98 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={
                          shouldReduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: -8, scale: 0.98 }
                        }
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : getNetWorthEnterTransition(
                                Math.min(index, 6) * NETWORTH_MOTION_STAGGER,
                              )
                        }
                      >
                        <AccountListItem
                          account={account}
                          displayCurrency={displayCurrency}
                          exchangeRates={exchangeRates}
                          hideValues={hideValues}
                          selected={selectedAccount?._id === account._id}
                          onSelect={setSelectedAccount}
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
                    ))}
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
                    setEditingAccount(null);
                    setAccountDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Account
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
                displayCurrency={displayCurrency}
                exchangeRates={exchangeRates}
                hideValues={hideValues}
              />
            </motion.div>

            {/* Transaction detail */}
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
                      Select an account to view transactions
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
