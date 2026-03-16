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

const POSITION_OPTIONS = [
  "Game Developer",
  "XR Developer",
  "Backend",
  "Frontend",
  "Software Engineer",
];

const COUNTRY_OPTIONS = ["KSA", "UAE", "USA", "UK", "Germany", "Remote"];

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: JobCardFormData) => void;
  initialData?: JobCard | null;
  loading?: boolean;
}

const defaultFormData: JobCardFormData = {
  company: "",
  position: "Software Engineer",
  country: "KSA",
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
  const isCustomCountry = initialData
    ? !COUNTRY_OPTIONS.includes(initialData.country)
    : false;
  const [otherCountry, setOtherCountry] = useState(isCustomCountry);

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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Job Application" : "Add Job Application"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Row 1: Company, Level, Position */}
          <div className="grid grid-cols-3 gap-3">
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
              <Label>Position *</Label>
              <Select
                value={form.position}
                onValueChange={(v) => {
                  if (v) update("position", v);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITION_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Work Style, Country, Application Method */}
          <div className="grid grid-cols-3 gap-3">
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
            <div className="space-y-1.5">
              <Label>Country *</Label>
              {otherCountry ? (
                <div className="flex gap-1">
                  <Input
                    value={form.country}
                    onChange={(e) => update("country", e.target.value)}
                    placeholder="Enter country"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setOtherCountry(false);
                      update("country", "KSA");
                    }}
                  >
                    List
                  </Button>
                </div>
              ) : (
                <Select
                  value={form.country}
                  onValueChange={(v) => {
                    if (v === "__other__") {
                      setOtherCountry(true);
                      update("country", "");
                    } else if (v) {
                      update("country", v);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="KSA" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value="__other__">Other…</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>App Method *</Label>
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
          </div>

          {/* Row 3: Expected Salary, Resume ID */}
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
              <Label htmlFor="resumeId">Resume ID</Label>
              <Input
                id="resumeId"
                value={form.resumeId}
                onChange={(e) => update("resumeId", e.target.value)}
                placeholder="e.g. resume-v2"
              />
            </div>
          </div>

          {/* Row 4: Fit Level Slider */}
          <div className="space-y-1.5">
            <Label htmlFor="fit">
              Fit Level:{" "}
              <span className="font-semibold">{form.fitPercentage}/10</span>
            </Label>
            <input
              id="fit"
              type="range"
              min={1}
              max={10}
              value={form.fitPercentage}
              onChange={(e) => update("fitPercentage", Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {/* Row 5: Application Link */}
          <div className="space-y-1.5">
            <Label htmlFor="appLink">Application Link</Label>
            <Input
              id="appLink"
              value={form.applicationLink}
              onChange={(e) => update("applicationLink", e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Row 6: Company Link */}
          <div className="space-y-1.5">
            <Label htmlFor="companyLink">Company Link</Label>
            <Input
              id="companyLink"
              value={form.companyLink}
              onChange={(e) => update("companyLink", e.target.value)}
              placeholder="https://..."
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
