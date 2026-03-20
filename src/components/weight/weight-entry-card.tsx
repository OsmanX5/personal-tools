"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, StickyNote } from "lucide-react";
import {
  type WeightEntry,
  getBmiCategory,
  BMI_CATEGORY_COLORS,
} from "@/lib/weight-types";

interface WeightEntryCardProps {
  entry: WeightEntry;
  onEdit: (entry: WeightEntry) => void;
  onDelete: (id: string) => void;
  hideValues?: boolean;
}

export function WeightEntryCard({
  entry,
  onEdit,
  onDelete,
  hideValues,
}: WeightEntryCardProps) {
  const bmiCategory = getBmiCategory(entry.bmi);
  const dateStr = new Date(entry.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="transition-shadow hover:shadow-md py-3">
      <CardContent className="px-4 py-0">
        <div className="flex items-center justify-between gap-3">
          {/* Left: weight + date */}
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xl font-bold">
                {hideValues ? "****" : entry.weight}
              </span>
              <span className="ml-1 text-sm text-muted-foreground">kg</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {dateStr}
            </div>
          </div>

          {/* Right: BMI badge + actions */}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`gap-1 ${BMI_CATEGORY_COLORS[bmiCategory]}`}
            >
              BMI {hideValues ? "**" : entry.bmi} · {bmiCategory}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(entry)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(entry._id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Note */}
        {entry.note && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <StickyNote className="mt-0.5 h-3 w-3 shrink-0" />
            <span>{entry.note}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
