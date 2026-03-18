"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Building2,
  ExternalLink,
  Pencil,
  Trash2,
  Briefcase,
  DollarSign,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { type JobCard, STATUS_COLORS } from "@/lib/jobs-types";

interface JobCardComponentProps {
  job: JobCard;
  onEdit: (job: JobCard) => void;
  onDelete: (id: string) => void;
}

export function JobCardComponent({
  job,
  onEdit,
  onDelete,
}: JobCardComponentProps) {
  const [expanded, setExpanded] = useState(false);

  const salaryDisplay =
    job.expectedSalary != null
      ? `$${job.expectedSalary.toLocaleString()}`
      : "N/A";

  return (
    <Card
      className={`border-l-4 transition-shadow hover:shadow-md py-2 ${STATUS_COLORS[job.status]}`}
    >
      <CardContent
        className={`${expanded ? "space-y-2.5 px-3 py-0" : "px-2 py-0"}`}
      >
        {/* Header: Title, Company & Actions */}
        <div className="flex items-center justify-between gap-1">
          <div
            className="min-w-0 flex-1 cursor-pointer"
            onClick={() => (expanded ? setExpanded(false) : onEdit(job))}
          >
            <div
              className={`flex items-center gap-1.5 ${expanded ? "flex-col items-start" : ""}`}
            >
              <div className="flex items-center gap-1 text-xs">
                {expanded && <Building2 className="h-3 w-3 shrink-0" />}
                <span
                  className={`truncate font-semibold ${expanded ? "" : "text-xs"}`}
                >
                  {job.company}
                </span>
                {job.applicationLink && (
                  <a
                    href={job.applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-0.5 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <h3
                className={`truncate ${expanded ? "text-sm" : "text-[10px]"} text-muted-foreground`}
              >
                {expanded ? job.position : `· ${job.position}`}
              </h3>
            </div>
          </div>
          <div className="flex shrink-0 gap-0.5">
            {expanded && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => onEdit(job)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive hover:text-destructive"
                  onClick={() => onDelete(job._id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <>
            {/* Company Link */}
            {job.companyLink && (
              <a
                href={job.companyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
                Company Website
              </a>
            )}

            {/* Info Row */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="gap-1 text-[10px]">
                <MapPin className="h-2.5 w-2.5" />
                {job.country}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {job.workStyle}
              </Badge>
              <Badge variant="outline" className="gap-1 text-[10px]">
                <Briefcase className="h-2.5 w-2.5" />
                {job.level}
              </Badge>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <DollarSign className="h-3 w-3" />
                  {salaryDisplay}
                </span>
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3" />
                  {job.fitPercentage}/10
                </span>
              </div>
              <span className="text-[10px]">{job.applicationMethod}</span>
            </div>

            {/* Application Link */}
            {job.applicationLink && (
              <a
                href={job.applicationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Application Link
              </a>
            )}

            {/* Resume Link */}
            {job.resumeId && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Resume: {job.resumeId}</span>
                <a
                  href={`https://www.dev-resume.com/cv-viewer/${job.resumeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
