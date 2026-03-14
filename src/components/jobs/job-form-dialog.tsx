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
import {
  type JobCard,
  type JobCardFormData,
  WORK_STYLES,
  JOB_LEVELS,
  JOB_STATUSES,
  APPLICATION_METHODS,
} from "@/lib/jobs-types";

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JobCardFormData) => void;
  initialData?: JobCard | null;
  loading?: boolean;
}

const defaultFormData: JobCardFormData = {
  company: "",
  position: "",
  country: "",
  workStyle: "Remote",
  expectedSalary: null,
  fitPercentage: 5,
  level: "Mid",
  status: "Interested",
  applicationMethod: "Company Website",
  resumeId: "",
  applicationLink: "",
  companyLink: "",
};

export function JobFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  loading,
}: JobFormDialogProps) {
  const [form, setForm] = useState<JobCardFormData>(
    initialData
      ? {
          company: initialData.company,
          position: initialData.position,
          country: initialData.country,
          workStyle: initialData.workStyle,
          expectedSalary: initialData.expectedSalary,
          fitPercentage: initialData.fitPercentage,
          level: initialData.level,
          status: initialData.status,
          applicationMethod: initialData.applicationMethod,
          resumeId: initialData.resumeId,
          applicationLink: initialData.applicationLink,
          companyLink: initialData.companyLink,
        }
      : defaultFormData,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const update = <K extends keyof JobCardFormData>(
    key: K,
    value: JobCardFormData[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Job Application" : "Add Job Application"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Company & Position */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                placeholder="Google"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                value={form.position}
                onChange={(e) => update("position", e.target.value)}
                placeholder="Software Engineer"
                required
              />
            </div>
          </div>

          {/* Country & Work Style */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
                placeholder="United States"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Work Style *</Label>
              <Select
                value={form.workStyle}
                onValueChange={(v) =>
                  update("workStyle", v as JobCardFormData["workStyle"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_STYLES.map((ws) => (
                    <SelectItem key={ws} value={ws}>
                      {ws}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Level & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Level *</Label>
              <Select
                value={form.level}
                onValueChange={(v) =>
                  update("level", v as JobCardFormData["level"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  update("status", v as JobCardFormData["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary & Fit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="salary">Expected Salary</Label>
              <Input
                id="salary"
                type="number"
                value={form.expectedSalary ?? ""}
                onChange={(e) =>
                  update(
                    "expectedSalary",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                placeholder="N/A"
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fit">Fit (1-10) *</Label>
              <Input
                id="fit"
                type="number"
                value={form.fitPercentage}
                onChange={(e) =>
                  update("fitPercentage", Number(e.target.value))
                }
                min={1}
                max={10}
                required
              />
            </div>
          </div>

          {/* Application Method */}
          <div className="space-y-1.5">
            <Label>Application Method *</Label>
            <Select
              value={form.applicationMethod}
              onValueChange={(v) =>
                update(
                  "applicationMethod",
                  v as JobCardFormData["applicationMethod"],
                )
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="appLink">Application Link</Label>
              <Input
                id="appLink"
                value={form.applicationLink}
                onChange={(e) => update("applicationLink", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="companyLink">Company Link</Label>
              <Input
                id="companyLink"
                value={form.companyLink}
                onChange={(e) => update("companyLink", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Resume ID */}
          <div className="space-y-1.5">
            <Label htmlFor="resumeId">Resume ID</Label>
            <Input
              id="resumeId"
              value={form.resumeId}
              onChange={(e) => update("resumeId", e.target.value)}
              placeholder="e.g. resume-v2"
            />
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading
              ? "Saving…"
              : initialData
                ? "Update Application"
                : "Add Application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
