"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { WeightEntry } from "@/lib/weight-types";

type RangeOption = 7 | 30;

interface WeightChartProps {
  entries: WeightEntry[];
  goalWeight?: number;
}

export function WeightChart({ entries, goalWeight }: WeightChartProps) {
  const [range, setRange] = useState<RangeOption>(7);

  const chartData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - range);

    return entries
      .filter((e) => new Date(e.date) >= cutoff)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((e) => ({
        date: new Date(e.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        weight: e.weight,
        bmi: e.bmi,
      }));
  }, [entries, range]);

  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    const weights = chartData.map((d) => d.weight);
    if (goalWeight) weights.push(goalWeight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = Math.max((max - min) * 0.15, 1);
    return [
      Math.floor((min - padding) * 10) / 10,
      Math.ceil((max + padding) * 10) / 10,
    ];
  }, [chartData, goalWeight]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Weight Trend</CardTitle>
        <div className="flex gap-1">
          {([7, 30] as const).map((d) => (
            <Button
              key={d}
              variant={range === d ? "default" : "outline"}
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setRange(d)}
            >
              {d}D
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        {chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No entries in the last {range} days
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                tickFormatter={(v: number) => `${v}`}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--popover)",
                  color: "var(--popover-foreground)",
                  fontSize: "13px",
                }}
                formatter={(value, name) => [
                  name === "weight" ? `${value} kg` : value,
                  name === "weight" ? "Weight" : "BMI",
                ]}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--chart-1)" }}
                activeDot={{ r: 5 }}
              />
              {goalWeight && (
                <ReferenceLine
                  y={goalWeight}
                  stroke="var(--chart-2)"
                  strokeDasharray="6 3"
                  label={{
                    value: `Goal: ${goalWeight} kg`,
                    position: "insideTopRight",
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
