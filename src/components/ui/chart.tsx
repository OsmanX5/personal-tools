"use client";

import { useId, type ReactNode } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

const defaultKFormatter = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`;

interface ChartProps {
  /** Chart data array */
  data: Record<string, unknown>[];
  /** Data key for the X axis */
  xKey: string;
  /** Data key for the Y value */
  dataKey: string;
  /** Chart type — area (filled gradient) or line (stroke only) */
  variant?: "area" | "line";
  /** Stroke color (and gradient base for area variant) */
  color?: string;
  /** Show gradient fill under the area (area variant only, default true) */
  gradient?: boolean;
  /** Show data-point dots. Pass `{ radius }` for custom size. */
  showDots?: boolean | { radius?: number };
  /** Active (hovered) dot config. Pass `{ radius }` for custom size. */
  activeDot?: boolean | { radius?: number };
  /** ResponsiveContainer height — number (px) or "100%" */
  height?: number | "100%";
  /** Chart margin */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  /** Custom Y axis domain */
  yDomain?: [number, number];
  /** Fixed Y axis width */
  yWidth?: number;
  /** XAxis / YAxis tick font size */
  tickFontSize?: number;
  /** Custom Y axis tick formatter */
  yTickFormatter?: (value: number) => string;
  /** Recharts Tooltip formatter */
  tooltipFormatter?: (value: number, name: string) => [string, string] | string;
  /** Additional Recharts elements rendered inside the chart (e.g. ReferenceLine) */
  children?: ReactNode;
  /** Container className */
  className?: string;
}

export function Chart({
  data,
  xKey,
  dataKey,
  variant = "area",
  color = "#3b82f6",
  gradient = variant === "area",
  showDots = variant === "line",
  activeDot,
  height = "100%",
  margin = { top: 4, right: 12, bottom: 0, left: 4 },
  yDomain,
  yWidth,
  tickFontSize = 10,
  yTickFormatter = defaultKFormatter,
  tooltipFormatter,
  children,
  className,
}: ChartProps) {
  const autoId = useId();
  const gradientId = `chart-grad-${autoId}`;

  const dotConfig =
    showDots === true
      ? { r: 3, fill: color }
      : showDots && typeof showDots === "object"
        ? { r: showDots.radius ?? 3, fill: color }
        : false;

  const activeDotConfig =
    activeDot === true
      ? { r: 5 }
      : activeDot && typeof activeDot === "object"
        ? { r: activeDot.radius ?? 5 }
        : activeDot === false
          ? false
          : showDots
            ? { r: 5 }
            : undefined;

  const sharedElements = (
    <>
      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
      <XAxis
        dataKey={xKey}
        tick={{ fontSize: tickFontSize }}
        className="fill-muted-foreground"
      />
      <YAxis
        domain={yDomain}
        tick={{ fontSize: tickFontSize }}
        className="fill-muted-foreground"
        tickFormatter={yTickFormatter}
        {...(yWidth != null ? { width: yWidth } : {})}
      />
      <Tooltip
        contentStyle={{
          borderRadius: "8px",
          border: "1px solid var(--border)",
          backgroundColor: "var(--popover)",
          color: "var(--popover-foreground)",
          fontSize: "13px",
        }}
        {...(tooltipFormatter ? { formatter: tooltipFormatter as never } : {})}
      />
    </>
  );

  const chart =
    variant === "area" ? (
      <AreaChart data={data} margin={margin}>
        {gradient && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
        {sharedElements}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={gradient ? `url(#${gradientId})` : "none"}
        />
        {children}
      </AreaChart>
    ) : (
      <LineChart data={data} margin={margin}>
        {sharedElements}
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={dotConfig}
          {...(activeDotConfig != null ? { activeDot: activeDotConfig } : {})}
        />
        {children}
      </LineChart>
    );

  return (
    <div className={cn("h-full w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        {chart}
      </ResponsiveContainer>
    </div>
  );
}
