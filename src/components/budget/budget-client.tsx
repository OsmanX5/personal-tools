"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { MonthlySummaryCards } from "@/components/budget/monthly-summary-cards";
import { CategoryBreakdownChart } from "@/components/budget/category-breakdown-chart";
import { ExpenseList } from "@/components/budget/expense-list";
import { ExpenseFormDialog } from "@/components/budget/expense-form-dialog";
import type { AccountOption } from "@/components/budget/expense-form-dialog";
import { BudgetOverview } from "@/components/budget/budget-overview";
import { BudgetFormDialog } from "@/components/budget/budget-form-dialog";
import { PlansList } from "@/components/budget/plans-list";
import { PlanFormDialog } from "@/components/budget/plan-form-dialog";
import type {
  Expense,
  ExpenseFormData,
  CategoryBudget,
  CategoryBudgetFormData,
  FuturePlan,
  FuturePlanFormData,
  ExpenseCategory,
} from "@/lib/budget-types";
import { CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/networth-types";
import type { Currency, ExchangeRates } from "@/lib/networth-types";
import { convertAmount } from "@/lib/budget-types";

type Tab = "expenses" | "budgets" | "plans";

export default function BudgetClient() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [plans, setPlans] = useState<FuturePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [displayCurrency, setDisplayCurrency] = useState<Currency>("SAR");
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    USD: 1,
    SAR: 3.75,
    EUR: 0.92,
  });

  const [tab, setTab] = useState<Tab>("expenses");

  // Expense dialog
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Budget dialog
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [editingBudgetCategory, setEditingBudgetCategory] =
    useState<ExpenseCategory | null>(null);

  // Plan dialog
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FuturePlan | null>(null);

  // Previous month expenses for comparison
  const [prevExpenses, setPrevExpenses] = useState<Expense[]>([]);

  // NetWorth accounts for withdraw-from-account feature
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  // ── Fetch ─────────────────────────────────────────────────────────

  const fetchExpenses = useCallback(async (m: number, y: number) => {
    try {
      const res = await fetch(`/api/budget/expenses?month=${m}&year=${y}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return (await res.json()) as Expense[];
    } catch {
      toast.error("Failed to load expenses");
      return [];
    }
  }, []);

  const fetchBudgets = useCallback(async (m: number, y: number) => {
    try {
      const res = await fetch(`/api/budget/budgets?month=${m}&year=${y}`);
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return (await res.json()) as CategoryBudget[];
    } catch {
      toast.error("Failed to load budgets");
      return [];
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/budget/plans");
      if (!res.ok) throw new Error("Failed to fetch plans");
      return (await res.json()) as FuturePlan[];
    } catch {
      toast.error("Failed to load plans");
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
    const [exp, bud, pln] = await Promise.all([
      fetchExpenses(month, year),
      fetchBudgets(month, year),
      fetchPlans(),
    ]);
    setExpenses(exp);
    setBudgets(bud);
    setPlans(pln);

    // Fetch previous month for comparison
    const prevM = month === 1 ? 12 : month - 1;
    const prevY = month === 1 ? year - 1 : year;
    const prev = await fetchExpenses(prevM, prevY);
    setPrevExpenses(prev);

    // Fetch networth accounts for withdraw-from-account dropdown
    try {
      const res = await fetch("/api/networth");
      if (res.ok) {
        const all = await res.json();
        setAccounts(
          all
            .filter((a: any) => a.status === "active")
            .map((a: any) => ({
              _id: a._id,
              name: a.name,
              currency: a.currency,
            })),
        );
      }
    } catch {
      // non-critical — dropdown will just be empty
    }

    setLoading(false);
  }, [month, year, fetchExpenses, fetchBudgets, fetchPlans]);

  useEffect(() => {
    fetchAll();
    fetchExchangeRates();
  }, [fetchAll, fetchExchangeRates]);

  // ── Month navigation ──────────────────────────────────────────────

  const goMonth = (dir: -1 | 1) => {
    setMonth((m) => {
      let newM = m + dir;
      if (newM < 1) {
        newM = 12;
        setYear((y) => y - 1);
      } else if (newM > 12) {
        newM = 1;
        setYear((y) => y + 1);
      }
      return newM;
    });
  };

  const monthLabel = new Date(year, month - 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // ── Expense CRUD ──────────────────────────────────────────────────

  const handleExpenseSubmit = async (data: ExpenseFormData) => {
    setSaving(true);
    try {
      if (editingExpense) {
        const res = await fetch(`/api/budget/expenses/${editingExpense._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        setExpenses((prev) =>
          prev.map((e) => (e._id === updated._id ? updated : e)),
        );
        toast.success("Expense updated");
      } else {
        const res = await fetch("/api/budget/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setExpenses((prev) => [created, ...prev]);
        toast.success("Expense added");
      }
      setExpenseDialogOpen(false);
      setEditingExpense(null);
    } catch {
      toast.error("Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleExpenseDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/budget/expenses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setExpenses((prev) => prev.filter((e) => e._id !== id));
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  // ── Budget CRUD ───────────────────────────────────────────────────

  const handleBudgetSubmit = async (data: CategoryBudgetFormData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/budget/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, month, year }),
      });
      if (!res.ok) throw new Error("Failed to save budget");
      const saved = await res.json();
      setBudgets((prev) => {
        const idx = prev.findIndex((b) => b.category === saved.category);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [...prev, saved];
      });
      toast.success("Budget saved");
      setBudgetDialogOpen(false);
      setEditingBudgetCategory(null);
    } catch {
      toast.error("Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const handleBudgetDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/budget/budgets/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setBudgets((prev) => prev.filter((b) => b._id !== id));
      toast.success("Budget removed");
    } catch {
      toast.error("Failed to delete budget");
    }
  };

  // ── Plan CRUD ─────────────────────────────────────────────────────

  const handlePlanSubmit = async (data: FuturePlanFormData) => {
    setSaving(true);
    try {
      if (editingPlan) {
        const res = await fetch(`/api/budget/plans/${editingPlan._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        setPlans((prev) =>
          prev.map((p) => (p._id === updated._id ? updated : p)),
        );
        toast.success("Plan updated");
      } else {
        const res = await fetch("/api/budget/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setPlans((prev) => [created, ...prev]);
        toast.success("Plan created");
      }
      setPlanDialogOpen(false);
      setEditingPlan(null);
    } catch {
      toast.error("Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handlePlanDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/budget/plans/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setPlans((prev) => prev.filter((p) => p._id !== id));
      toast.success("Plan deleted");
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  // ── Derived ───────────────────────────────────────────────────────

  const totalSpent = useMemo(
    () =>
      expenses.reduce(
        (sum, e) =>
          sum +
          convertAmount(e.amount, e.currency, displayCurrency, exchangeRates),
        0,
      ),
    [expenses, displayCurrency, exchangeRates],
  );

  const prevTotalSpent = useMemo(
    () =>
      prevExpenses.reduce(
        (sum, e) =>
          sum +
          convertAmount(e.amount, e.currency, displayCurrency, exchangeRates),
        0,
      ),
    [prevExpenses, displayCurrency, exchangeRates],
  );

  // ── Render ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading budget data…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budget Planner</h1>
          <p className="text-sm text-muted-foreground">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""} this
            month —{" "}
            <span className="font-semibold text-foreground">
              {CURRENCY_SYMBOLS[displayCurrency]}
              {totalSpent.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
        </div>
      </div>

      {/* Controls row: month nav + currency + tabs */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Month navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium">
            {monthLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => goMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Currency toggle */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex rounded-md border">
            {CURRENCIES.map((c, i) => (
              <button
                key={c}
                type="button"
                onClick={() => setDisplayCurrency(c)}
                className={`px-2 py-1 transition-colors ${
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Tabs */}
        <div className="flex rounded-md border text-sm">
          {(
            [
              { key: "expenses", label: "Expenses" },
              { key: "budgets", label: "Budgets" },
              { key: "plans", label: "Future Plans" },
            ] as const
          ).map(({ key, label }, i) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 transition-colors ${
                i > 0 ? "border-l" : ""
              } ${
                tab === key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {tab === "expenses" && (
          <>
            <MonthlySummaryCards
              expenses={expenses}
              prevExpenses={prevExpenses}
              totalSpent={totalSpent}
              prevTotalSpent={prevTotalSpent}
              displayCurrency={displayCurrency}
              exchangeRates={exchangeRates}
              month={month}
              year={year}
            />
            <div className="flex min-h-0 flex-1 gap-4">
              {/* Left: expense list */}
              <div className="min-h-0 w-1/2">
                <ExpenseList
                  expenses={expenses}
                  displayCurrency={displayCurrency}
                  exchangeRates={exchangeRates}
                  onEdit={(e) => {
                    setEditingExpense(e);
                    setExpenseDialogOpen(true);
                  }}
                  onDelete={handleExpenseDelete}
                  onAdd={() => {
                    setEditingExpense(null);
                    setExpenseDialogOpen(true);
                  }}
                />
              </div>
              {/* Right: chart */}
              <div className="h-full w-1/2 shrink-0">
                <CategoryBreakdownChart
                  expenses={expenses}
                  displayCurrency={displayCurrency}
                  exchangeRates={exchangeRates}
                />
              </div>
            </div>
          </>
        )}

        {tab === "budgets" && (
          <>
            <BudgetOverview
              budgets={budgets}
              expenses={expenses}
              displayCurrency={displayCurrency}
              exchangeRates={exchangeRates}
              onEditBudget={(category) => {
                setEditingBudgetCategory(category);
                setBudgetDialogOpen(true);
              }}
              onDeleteBudget={handleBudgetDelete}
            />
            <Button
              onClick={() => {
                setEditingBudgetCategory(null);
                setBudgetDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Set Category Budget
            </Button>
          </>
        )}

        {tab === "plans" && (
          <>
            <PlansList
              plans={plans}
              displayCurrency={displayCurrency}
              exchangeRates={exchangeRates}
              onEdit={(p) => {
                setEditingPlan(p);
                setPlanDialogOpen(true);
              }}
              onDelete={handlePlanDelete}
            />
            <Button
              onClick={() => {
                setEditingPlan(null);
                setPlanDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Future Plan
            </Button>
          </>
        )}
      </div>

      {/* Dialogs */}
      <ExpenseFormDialog
        open={expenseDialogOpen}
        onOpenChange={(open) => {
          setExpenseDialogOpen(open);
          if (!open) setEditingExpense(null);
        }}
        onSubmit={handleExpenseSubmit}
        initialData={editingExpense}
        loading={saving}
        accounts={accounts}
        key={editingExpense?._id ?? "new-expense"}
      />

      <BudgetFormDialog
        open={budgetDialogOpen}
        onOpenChange={(open) => {
          setBudgetDialogOpen(open);
          if (!open) setEditingBudgetCategory(null);
        }}
        onSubmit={handleBudgetSubmit}
        initialCategory={editingBudgetCategory}
        existingBudget={
          editingBudgetCategory
            ? (budgets.find((b) => b.category === editingBudgetCategory) ??
              null)
            : null
        }
        loading={saving}
        month={month}
        year={year}
        key={`budget-${editingBudgetCategory ?? "new"}`}
      />

      <PlanFormDialog
        open={planDialogOpen}
        onOpenChange={(open) => {
          setPlanDialogOpen(open);
          if (!open) setEditingPlan(null);
        }}
        onSubmit={handlePlanSubmit}
        initialData={editingPlan}
        loading={saving}
        key={editingPlan?._id ?? "new-plan"}
      />
    </div>
  );
}
