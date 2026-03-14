"use client";

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
  const salaryDisplay =
    job.expectedSalary != null
      ? `$${job.expectedSalary.toLocaleString()}`
      : "N/A";

  return (
    <Card
      className={`border-l-4 transition-shadow hover:shadow-md ${STATUS_COLORS[job.status]}`}
    >
      <CardContent className="space-y-2.5 p-3">
        {/* Header: Company & Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold">{job.position}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{job.company}</span>
              {job.companyLink && (
                <a
                  href={job.companyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onEdit(job)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => onDelete(job._id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

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
      </CardContent>
    </Card>
  );
}
