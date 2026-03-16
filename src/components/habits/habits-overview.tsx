"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle2, Flame, ListChecks } from "lucide-react";
import type { HabitWithStats } from "@/lib/habit-types";

interface HabitsOverviewProps {
  habits: HabitWithStats[];
}

export function HabitsOverview({ habits }: HabitsOverviewProps) {
  const total = habits.length;
  const completedToday = habits.filter((h) => h.todayLog).length;
  const bestStreak = Math.max(0, ...habits.map((h) => h.longestStreak));

  const stats = [
    {
      label: "Active habits",
      value: total,
      icon: ListChecks,
      color: "text-blue-500",
    },
    {
      label: "Done today",
      value: `${completedToday} / ${total}`,
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
    {
      label: "Best streak ever",
      value: bestStreak,
      icon: Flame,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="flex items-center gap-3 p-3">
          <Icon className={`h-5 w-5 shrink-0 ${color}`} />
          <div className="min-w-0">
            <p className="text-xl font-bold leading-tight">{value}</p>
            <p className="truncate text-xs text-muted-foreground">{label}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
