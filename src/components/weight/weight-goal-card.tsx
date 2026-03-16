"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  Target,
  CalendarClock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { type WeightGoal, GOAL_STATUS_COLORS } from "@/lib/weight-types";

interface WeightGoalCardProps {
  goal: WeightGoal;
  currentWeight?: number;
  onEdit: (goal: WeightGoal) => void;
  onDelete: (id: string) => void;
  onMarkAchieved: (id: string) => void;
  onMarkAbandoned: (id: string) => void;
}

export function WeightGoalCard({
  goal,
  currentWeight,
  onEdit,
  onDelete,
  onMarkAchieved,
  onMarkAbandoned,
}: WeightGoalCardProps) {
  const targetDateStr = goal.targetDate
    ? new Date(goal.targetDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Calculate progress toward goal
  let progressPercent: number | null = null;
  if (currentWeight != null) {
    const totalChange = Math.abs(goal.startWeight - goal.targetWeight);
    if (totalChange > 0) {
      const achieved = Math.abs(goal.startWeight - currentWeight);
      progressPercent = Math.min(
        100,
        Math.max(0, Math.round((achieved / totalChange) * 100)),
      );
      // If user is moving in the wrong direction, show 0
      const isLosing = goal.targetWeight < goal.startWeight;
      if (isLosing && currentWeight > goal.startWeight) progressPercent = 0;
      if (!isLosing && currentWeight < goal.startWeight) progressPercent = 0;
    }
  }

  const isActive = goal.status === "Active";

  return (
    <Card className="transition-shadow hover:shadow-md py-3">
      <CardContent className="px-4 py-0 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Target className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="font-semibold">{goal.targetWeight} kg</span>
              <span className="ml-2 text-xs text-muted-foreground">
                from {goal.startWeight} kg
              </span>
            </div>
            <Badge
              variant="outline"
              className={GOAL_STATUS_COLORS[goal.status]}
            >
              {goal.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {isActive && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                  onClick={() => onMarkAchieved(goal._id)}
                  title="Mark achieved"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onMarkAbandoned(goal._id)}
                  title="Abandon goal"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(goal)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(goal._id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Progress bar (active goals only) */}
        {isActive && progressPercent !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Target date */}
        {targetDateStr && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            Target: {targetDateStr}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
