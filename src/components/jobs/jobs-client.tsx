"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { KanbanBoard } from "@/components/jobs/kanban-board";
import { JobFormDialog } from "@/components/jobs/job-form-dialog";
import type { JobCard, JobCardFormData, JobStatus } from "@/lib/jobs-types";

const POSITION_FILTERS = [
  "All",
  "Game Developer",
  "XR Developer",
  "Backend",
  "Frontend",
  "Software Engineer",
] as const;

export default function JobsClient() {
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobCard | null>(null);
  const [countryFilter, setCountryFilter] = useState("KSA");
  const [positionFilter, setPositionFilter] = useState("All");

  // Fetch all jobs
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setJobs(data);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Create or update job
  const handleSubmit = async (data: JobCardFormData) => {
    setSaving(true);
    try {
      if (editingJob) {
        const res = await fetch(`/api/jobs/${editingJob._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        const updated = await res.json();
        setJobs((prev) =>
          prev.map((j) => (j._id === updated._id ? updated : j)),
        );
        toast.success("Job updated");
      } else {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const created = await res.json();
        setJobs((prev) => [created, ...prev]);
        toast.success("Job added");
      }
      setDialogOpen(false);
      setEditingJob(null);
    } catch {
      toast.error("Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  // Delete job
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setJobs((prev) => prev.filter((j) => j._id !== id));
      toast.success("Job deleted");
    } catch {
      toast.error("Failed to delete job");
    }
  };

  // Edit job
  const handleEdit = (job: JobCard) => {
    setEditingJob(job);
    setDialogOpen(true);
  };

  // Drag & drop status change
  const handleStatusChange = async (id: string, status: JobStatus) => {
    const job = jobs.find((j) => j._id === id);
    if (!job || job.status === status) return;

    // Optimistic update
    setJobs((prev) => prev.map((j) => (j._id === id ? { ...j, status } : j)));

    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
    } catch {
      // Revert on failure
      setJobs((prev) =>
        prev.map((j) => (j._id === id ? { ...j, status: job.status } : j)),
      );
      toast.error("Failed to update status");
    }
  };

  const countries = useMemo(() => {
    const set = new Set(jobs.map((j) => j.country));
    return ["All", ...Array.from(set).sort()];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchCountry =
        countryFilter === "All" || j.country === countryFilter;
      const matchPosition =
        positionFilter === "All" ||
        j.position.toLowerCase().includes(positionFilter.toLowerCase());
      return matchCountry && matchPosition;
    });
  }, [jobs, countryFilter, positionFilter]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading jobs…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Applications</h1>
          <p className="text-sm text-muted-foreground">
            {filteredJobs.length} of {jobs.length} application
            {jobs.length !== 1 ? "s" : ""} shown
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            {POSITION_FILTERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        jobs={filteredJobs}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
        onAddJob={() => {
          setEditingJob(null);
          setDialogOpen(true);
        }}
      />

      {/* Form Dialog */}
      <JobFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingJob(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingJob}
        loading={saving}
        key={editingJob?._id ?? "new"}
      />
    </div>
  );
}
