"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { JobCardComponent } from "@/components/jobs/job-card";
import {
  type JobCard,
  type JobStatus,
  JOB_STATUSES,
  STATUS_HEADER_COLORS,
} from "@/lib/jobs-types";

interface KanbanBoardProps {
  jobs: JobCard[];
  onEdit: (job: JobCard) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: JobStatus) => void;
  onAddJob: () => void;
}

export function KanbanBoard({
  jobs,
  onEdit,
  onDelete,
  onStatusChange,
  onAddJob,
}: KanbanBoardProps) {
  const columns = JOB_STATUSES.map((status) => ({
    status,
    jobs: jobs.filter((j) => j.status === status),
  }));

  return (
    <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-4">
      {columns.map(({ status, jobs: columnJobs }) => (
        <div
          key={status}
          className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30"
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("ring-2", "ring-primary/30");
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove("ring-2", "ring-primary/30");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("ring-2", "ring-primary/30");
            const jobId = e.dataTransfer.getData("text/plain");
            if (jobId) {
              onStatusChange(jobId, status);
            }
          }}
        >
          {/* Column Header */}
          <div
            className={`flex items-center justify-between rounded-t-lg px-3 py-2 ${STATUS_HEADER_COLORS[status]}`}
          >
            <h2 className="text-sm font-semibold text-white">{status}</h2>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-medium text-white">
              {columnJobs.length}
            </span>
          </div>

          {/* Cards */}
          <ScrollArea
            className="flex-1 px-2 py-2"
            style={{ maxHeight: "calc(100vh - 220px)" }}
          >
            <div className="flex flex-col gap-2">
              {columnJobs.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No jobs here
                </p>
              )}
              {columnJobs.map((job) => (
                <div
                  key={job._id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", job._id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <JobCardComponent
                    job={job}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Add Job button at bottom of Interested column */}
          {status === "Interested" && (
            <div className="px-2 pb-2">
              <Button
                variant="ghost"
                className="w-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                onClick={onAddJob}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Job
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
