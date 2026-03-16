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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FinanceAccount, TransactionType } from "@/lib/finance-types";
import { TRANSACTION_TYPES, CURRENCY_SYMBOLS } from "@/lib/finance-types";

type Mode = "transaction" | "update-value";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: FinanceAccount | null;
  mode: Mode;
  onSubmitTransaction: (
    accountId: string,
    data: { amount: number; type: TransactionType },
  ) => void;
  onSubmitUpdateValue: (accountId: string, newAmount: number) => void;
  loading?: boolean;
}

export function TransactionDialog({
  open,
  onOpenChange,
  account,
  mode,
  onSubmitTransaction,
  onSubmitUpdateValue,
  loading,
}: TransactionDialogProps) {
  const [amount, setAmount] = useState<number>(0);
  const [type, setType] = useState<TransactionType>("Income");
  const [newValue, setNewValue] = useState<number>(account?.amount ?? 0);

  // Reset form when account changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && account) {
      setAmount(0);
      setType("Income");
      setNewValue(account.amount);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    if (mode === "transaction") {
      onSubmitTransaction(account._id, { amount, type });
    } else {
      onSubmitUpdateValue(account._id, newValue);
    }
  };

  if (!account) return null;

  const diff = newValue - account.amount;
  const symbol = CURRENCY_SYMBOLS[account.currency ?? "USD"];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "transaction"
              ? `Add Transaction — ${account.name}`
              : `Update Value — ${account.name}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {mode === "transaction" ? (
            <>
              {/* Transaction Type */}
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as TransactionType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="tx-amount">
                  Amount (positive = add, negative = subtract)
                </Label>
                <Input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                />
              </div>

              {/* Preview */}
              <div className="rounded-md border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current balance</span>
                  <span>
                    {symbol}
                    {account.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction</span>
                  <span
                    className={amount >= 0 ? "text-green-600" : "text-red-600"}
                  >
                    {amount >= 0 ? "+" : ""}
                    {amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="mt-1 flex justify-between border-t pt-1 font-medium">
                  <span>New balance</span>
                  <span>
                    {symbol}
                    {(account.amount + amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* New Value */}
              <div className="space-y-1.5">
                <Label htmlFor="new-value">New Account Value</Label>
                <Input
                  id="new-value"
                  type="number"
                  step="0.01"
                  value={newValue}
                  onChange={(e) => setNewValue(Number(e.target.value))}
                  required
                />
              </div>

              {/* Preview */}
              <div className="rounded-md border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current balance</span>
                  <span>
                    {symbol}
                    {account.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Calculated transaction
                  </span>
                  <span
                    className={diff >= 0 ? "text-green-600" : "text-red-600"}
                  >
                    {diff >= 0 ? "+" : ""}
                    {diff.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}{" "}
                    ({diff >= 0 ? "Income" : "Expense"})
                  </span>
                </div>
                <div className="mt-1 flex justify-between border-t pt-1 font-medium">
                  <span>New balance</span>
                  <span>
                    {symbol}
                    {newValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? "Saving…"
              : mode === "transaction"
                ? "Add Transaction"
                : "Update Value"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
