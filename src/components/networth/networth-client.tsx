"use client";

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

export default function NetWorthClient() {
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

  const [hideValues, setHideValues] = useState(true);

  const filteredAccounts = useMemo(
    () =>
      purposeFilter === "All"
        ? sortedAccounts
        : sortedAccounts.filter((a) => a.purpose === purposeFilter),
    [sortedAccounts, purposeFilter],
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading accounts…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">NetWorth</h1>
          <p className="text-sm text-muted-foreground">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""} — Total:{" "}
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
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setHideValues((v) => !v)}
          title={hideValues ? "Show values" : "Hide values"}
        >
          {hideValues ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <p>No accounts yet. Add your first account to get started.</p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 gap-4">
          {/* Account list */}
          <div className="flex w-80 shrink-0 flex-col gap-2 overflow-y-auto">
            {/* Currency toggle */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="shrink-0 text-muted-foreground">Currency:</span>
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
            </div>
            {/* Purpose filter */}
            <div className="flex rounded-md border text-xs">
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
            </div>
            {filteredAccounts.map((account) => (
              <AccountListItem
                key={account._id}
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
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEditingAccount(null);
                setAccountDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </div>

          {/* Right panel: summary + detail */}
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {/* Net Worth Summary */}
            <div className="min-h-0 flex-1">
              <NetWorthSummary
                accounts={accounts}
                displayCurrency={displayCurrency}
                exchangeRates={exchangeRates}
                hideValues={hideValues}
              />
            </div>

            {/* Transaction detail */}
            <div className="min-h-0 flex-1">
              {selectedAccount ? (
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
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">
                    Select an account to view transactions
                  </p>
                </div>
              )}
            </div>
          </div>
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
    </div>
  );
}
