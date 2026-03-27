"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Chart } from "@/components/ui/chart";
import { ReferenceLine } from "recharts";
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
    if (chartData.length === 0) return undefined;
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
        <ToggleGroup
          items={([7, 30] as const).map((d) => ({
            value: String(d),
            label: `${d}D`,
          }))}
          value={String(range)}
          onValueChange={(v) => setRange(Number(v) as RangeOption)}
          size="sm"
          buttonClassName="h-7 px-2.5 text-xs"
        />
      </CardHeader>
      <CardContent className="px-2 pb-4">
        {chartData.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No entries in the last {range} days
            </p>
          </div>
        ) : (
          <div className="h-[220px]">
            <Chart
              data={chartData}
              xKey="date"
              dataKey="weight"
              color="#3b82f6"
              yDomain={yDomain}
              yWidth={45}
              yTickFormatter={(v) => `${v}`}
              tooltipFormatter={(value) => [`${value} kg`, "Weight"]}
            >
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
            </Chart>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
