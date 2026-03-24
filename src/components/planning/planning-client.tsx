"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { FinancialHealthSummary } from "@/components/planning/financial-health-summary";
import { IncomeStreamsPanel } from "@/components/planning/income-streams-panel";
import { IncomeStreamDialog } from "@/components/planning/income-stream-dialog";
import { EmergencyFundPanel } from "@/components/planning/emergency-fund-panel";
import { EmergencyFundConfigDialog } from "@/components/planning/emergency-fund-config-dialog";
import { ProjectionsPanel } from "@/components/planning/projections-panel";
import type {
  IncomeStream,
  IncomeStreamFormData,
  IncomeStreamType,
  IncomeEntry,
  IncomeEntryRow,
  EmergencyFundConfig,
  EmergencyFundConfigFormData,
  FinancialSnapshot,
  ProjectionsData,
} from "@/lib/planning-types";
import { INCOME_STREAM_TYPES } from "@/lib/planning-types";
import { CURRENCIES } from "@/lib/networth-types";
import { ToggleGroup } from "@/components/ui/toggle-group";
import type {
  Currency,
  ExchangeRates,
  NetWorthAccount,
} from "@/lib/networth-types";

export default function PlanningClient() {
  // ── Core data ─────────────────────────────────────────────────────
  const [snapshot, setSnapshot] = useState<FinancialSnapshot | null>(null);
  const [projections, setProjections] = useState<ProjectionsData | null>(null);
  const [streams, setStreams] = useState<IncomeStream[]>([]);
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [efConfig, setEfConfig] = useState<EmergencyFundConfig | null>(null);
  const [accounts, setAccounts] = useState<NetWorthAccount[]>([]);

  // ── UI state ──────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("SAR");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    USD: 1,
    SAR: 3.75,
    EUR: 0.92,
  });

  // Income type toggles for projections
  const [includedTypes, setIncludedTypes] = useState<Set<IncomeStreamType>>(
    () => new Set(INCOME_STREAM_TYPES),
  );

  // Income month navigation
  const now = new Date();
  const [incomeMonth, setIncomeMonth] = useState(now.getMonth() + 1);
  const [incomeYear, setIncomeYear] = useState(now.getFullYear());

  // Dialog states
  const [streamDialogOpen, setStreamDialogOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<IncomeStream | null>(null);
  const [efConfigDialogOpen, setEfConfigDialogOpen] = useState(false);

  // ── Fetch functions ───────────────────────────────────────────────

  const fetchSnapshot = useCallback(async (dc: Currency) => {
    try {
      const res = await fetch(`/api/planning/snapshot?displayCurrency=${dc}`);
      if (!res.ok) throw new Error("Failed to fetch snapshot");
      return (await res.json()) as FinancialSnapshot;
    } catch {
      toast.error("Failed to load financial snapshot");
      return null;
    }
  }, []);

  const fetchProjections = useCallback(
    async (dc: Currency, types: Set<IncomeStreamType>) => {
      try {
        const typesParam = Array.from(types).join(",");
        const res = await fetch(
          `/api/planning/projections?displayCurrency=${dc}&includeTypes=${encodeURIComponent(typesParam)}&_t=${Date.now()}`,
        );
        if (!res.ok) throw new Error("Failed to fetch projections");
        return (await res.json()) as ProjectionsData;
      } catch {
        toast.error("Failed to load projections");
        return null;
      }
    },
    [],
  );

  const fetchStreams = useCallback(async () => {
    try {
      const res = await fetch("/api/planning/income-streams");
      if (!res.ok) throw new Error("Failed to fetch income streams");
      return (await res.json()) as IncomeStream[];
    } catch {
      toast.error("Failed to load income streams");
      return [];
    }
  }, []);

  const fetchEntries = useCallback(async (m: number, y: number) => {
    try {
      const res = await fetch(
        `/api/planning/income-entries?month=${m}&year=${y}`,
      );
      if (!res.ok) throw new Error("Failed to fetch income entries");
      return (await res.json()) as IncomeEntry[];
    } catch {
      toast.error("Failed to load income entries");
      return [];
    }
  }, []);

  const fetchEfConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/planning/emergency-fund");
      if (!res.ok) throw new Error("Failed to fetch EF config");
      return (await res.json()) as EmergencyFundConfig;
    } catch {
      toast.error("Failed to load emergency fund config");
      return null;
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/networth");
      if (!res.ok) throw new Error("Failed to fetch accounts");
      return (await res.json()) as NetWorthAccount[];
    } catch {
      return [];
    }
  }, []);

  const fetchExchangeRates = useCallback(async () => {
    try {
      const res = await fetch("/api/networth/exchange-rates");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setExchangeRates(data);
    } catch {
      // keep fallback
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [snap, proj, str, ent, ef, accts] = await Promise.all([
      fetchSnapshot(displayCurrency),
      fetchProjections(displayCurrency, includedTypes),
      fetchStreams(),
      fetchEntries(incomeMonth, incomeYear),
      fetchEfConfig(),
      fetchAccounts(),
    ]);
    setSnapshot(snap);
    setProjections(proj);
    setStreams(str);
    setEntries(ent);
    setEfConfig(ef);
    setAccounts(accts);
    setLoading(false);
  }, [
    displayCurrency,
    incomeMonth,
    incomeYear,
    fetchSnapshot,
    fetchProjections,
    fetchStreams,
    fetchEntries,
    fetchEfConfig,
    fetchAccounts,
  ]);

  useEffect(() => {
    fetchAll();
    fetchExchangeRates();
  }, [fetchAll, fetchExchangeRates]);

  // Refetch snapshot + projections when currency changes
  const handleCurrencyChange = async (c: Currency) => {
    setDisplayCurrency(c);
  };

  // ── Income type toggle ────────────────────────────────────────────

  const handleToggleIncomeType = async (type: IncomeStreamType) => {
    const next = new Set(includedTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    setIncludedTypes(next);
    const proj = await fetchProjections(displayCurrency, next);
    setProjections(proj);
  };

  // ── Income month navigation ───────────────────────────────────────

  const handleIncomeMonthChange = (dir: -1 | 1) => {
    setIncomeMonth((m) => {
      let newM = m + dir;
      if (newM < 1) {
        newM = 12;
        setIncomeYear((y) => y - 1);
      } else if (newM > 12) {
        newM = 1;
        setIncomeYear((y) => y + 1);
      }
      return newM;
    });
  };

  // ── Build income entry rows (merge persisted + virtual) ───────────

  const entryRows: IncomeEntryRow[] = streams
    .filter((s) => {
      if (!s.isActive) return false;
      // One-time streams only appear in their designated month
      if ((s.recurrence ?? "recurring") === "one-time") {
        return s.oneTimeMonth === incomeMonth && s.oneTimeYear === incomeYear;
      }
      return true;
    })
    .map((s) => {
      const existing = entries.find((e) => e.streamId === s._id);
      if (existing) {
        return {
          ...existing,
          streamName: s.name,
          streamType: s.type,
          isVirtual: false as const,
        };
      }
      return {
        _id: null,
        streamId: s._id,
        streamName: s.name,
        streamType: s.type,
        amount: s.defaultAmount,
        currency: s.currency,
        month: incomeMonth,
        year: incomeYear,
        isVirtual: true as const,
      };
    });

  // ── Stream CRUD ───────────────────────────────────────────────────

  const handleStreamSubmit = async (data: IncomeStreamFormData) => {
    setSaving(true);
    try {
      if (editingStream) {
        const res = await fetch(
          `/api/planning/income-streams/${editingStream._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          },
        );
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        setStreams((prev) =>
          prev.map((s) => (s._id === updated._id ? updated : s)),
        );
        toast.success("Income stream updated");
      } else {
        const res = await fetch("/api/planning/income-streams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setStreams((prev) => [created, ...prev]);
        toast.success("Income stream added");
      }
      setStreamDialogOpen(false);
      setEditingStream(null);
    } catch {
      toast.error("Failed to save income stream");
    } finally {
      setSaving(false);
    }
  };

  const handleStreamDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/planning/income-streams/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setStreams((prev) => prev.filter((s) => s._id !== id));
      setEntries((prev) => prev.filter((e) => e.streamId !== id));
      toast.success("Income stream deleted");
    } catch {
      toast.error("Failed to delete income stream");
    }
  };

  // ── Entry save (upsert) ──────────────────────────────────────────

  const handleSaveEntry = async (
    streamId: string,
    amount: number,
    currency: Currency,
    month: number,
    year: number,
  ) => {
    try {
      const res = await fetch("/api/planning/income-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId, amount, currency, month, year }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const saved = await res.json();
      setEntries((prev) => {
        const idx = prev.findIndex(
          (e) =>
            e.streamId === streamId && e.month === month && e.year === year,
        );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [...prev, saved];
      });
      toast.success("Income entry saved");
    } catch {
      toast.error("Failed to save income entry");
    }
  };

  // ── Emergency fund config ─────────────────────────────────────────

  const handleEfConfigSubmit = async (data: EmergencyFundConfigFormData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/planning/emergency-fund", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      const saved = await res.json();
      setEfConfig(saved);
      setEfConfigDialogOpen(false);
      toast.success("Emergency fund settings saved");
      // Refresh snapshot + projections since target changed
      const [snap, proj] = await Promise.all([
        fetchSnapshot(displayCurrency),
        fetchProjections(displayCurrency, includedTypes),
      ]);
      setSnapshot(snap);
      setProjections(proj);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Financial Planning
          </h1>
          <p className="text-sm text-muted-foreground">
            Track income, monitor your emergency fund, and project your future
          </p>
        </div>
        <ToggleGroup
          items={CURRENCIES}
          value={displayCurrency}
          onValueChange={handleCurrencyChange}
        />
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* KPI Summary */}
          <FinancialHealthSummary
            snapshot={snapshot}
            displayCurrency={displayCurrency}
          />

          {/* Main content: 3-column layout */}
          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-3">
            {/* Left column - Income */}
            <div className="min-h-0 overflow-y-auto">
              <IncomeStreamsPanel
                streams={streams}
                entries={entryRows}
                month={incomeMonth}
                year={incomeYear}
                displayCurrency={displayCurrency}
                exchangeRates={exchangeRates}
                onMonthChange={handleIncomeMonthChange}
                onAddStream={() => {
                  setEditingStream(null);
                  setStreamDialogOpen(true);
                }}
                onEditStream={(stream) => {
                  setEditingStream(stream);
                  setStreamDialogOpen(true);
                }}
                onDeleteStream={handleStreamDelete}
                onSaveEntry={handleSaveEntry}
              />
            </div>

            {/* Middle column - Emergency Fund */}
            <div className="min-h-0 overflow-y-auto">
              <EmergencyFundPanel
                status={snapshot?.emergencyFund ?? null}
                accounts={accounts}
                displayCurrency={displayCurrency}
                exchangeRates={exchangeRates}
                onOpenConfig={() => setEfConfigDialogOpen(true)}
              />
            </div>

            {/* Right column - Projections */}
            <div className="min-h-0 overflow-y-auto">
              <ProjectionsPanel
                data={projections}
                currentNetWorth={snapshot?.totalNetWorth ?? 0}
                displayCurrency={displayCurrency}
                includedTypes={includedTypes}
                onToggleType={handleToggleIncomeType}
              />
            </div>
          </div>
        </>
      )}

      {/* Dialogs */}
      <IncomeStreamDialog
        open={streamDialogOpen}
        onOpenChange={setStreamDialogOpen}
        onSubmit={handleStreamSubmit}
        editing={editingStream}
        saving={saving}
      />
      <EmergencyFundConfigDialog
        open={efConfigDialogOpen}
        onOpenChange={setEfConfigDialogOpen}
        onSubmit={handleEfConfigSubmit}
        config={efConfig}
        saving={saving}
      />
    </div>
  );
}
