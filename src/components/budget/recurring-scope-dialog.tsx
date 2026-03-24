"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarDays, Calendar } from "lucide-react";
import type { EditScope } from "@/lib/budget-types";

interface RecurringScopeDialogProps {
  open: boolean;
  action: "edit" | "delete" | "stop";
  onSelect: (scope: EditScope) => void;
  onCancel: () => void;
}

export function RecurringScopeDialog({
  open,
  action,
  onSelect,
  onCancel,
}: RecurringScopeDialogProps) {
  const title =
    action === "edit"
      ? "Edit recurring expense"
      : action === "stop"
        ? "Stop recurring expense"
        : "Delete recurring expense";

  const singleLabel =
    action === "edit"
      ? "This occurrence only"
      : action === "stop"
        ? "Stop from this occurrence"
        : "This occurrence only";

  const futureLabel =
    action === "edit"
      ? "This and all future occurrences"
      : action === "stop"
        ? "Stop from this occurrence"
        : "This and all future occurrences";

  // stop action always means "future" scope — show simplified UI
  if (action === "stop") {
    return (
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) onCancel();
        }}
      >
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Stop this recurring expense from this occurrence onwards? Past
            occurrences will be kept.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => onSelect("future")}>
              Stop recurring
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-3">
          This is a recurring expense. What would you like to{" "}
          {action === "edit" ? "edit" : "delete"}?
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onSelect("single")}
            className="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
          >
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{singleLabel}</p>
              <p className="text-xs text-muted-foreground">
                Only this specific occurrence will be affected. Other months
                remain unchanged.
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onSelect("future")}
            className="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted"
          >
            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{futureLabel}</p>
              <p className="text-xs text-muted-foreground">
                This occurrence and all future ones will be{" "}
                {action === "edit" ? "updated" : "deleted"}. Past occurrences
                are not changed.
              </p>
            </div>
          </button>
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
