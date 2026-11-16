"use client";

import type { CSSProperties } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityPoint } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

type SeriesKey = keyof Omit<ActivityPoint, "label">;
type SeriesDef = { key: SeriesKey; label: string };

const CHART_COLOR_VARS: CSSProperties = {
  "--chart-series-savings": "light-dark(#1baf7a, #199e70)",
  "--chart-series-loans": "light-dark(#eb6834, #d95926)",
  "--chart-series-dividends": "light-dark(#4a3aa7, #9085e9)",
} as CSSProperties;

/** The super admin console's series: its own chart colours (green, gold, emerald in light;
 * gold, emerald, slate in dark), set in globals.css under html[data-console]. */
const CONSOLE_COLOR_VARS: CSSProperties = {
  "--chart-series-savings": "var(--chart-1)",
  "--chart-series-loans": "var(--chart-2)",
  "--chart-series-dividends": "var(--chart-3)",
} as CSSProperties;

interface ActivityChartProps {
  data: ActivityPoint[];
  series: SeriesDef[];
  activityRate: number;
  /** What the rate measures, e.g. "of members saved or repaid a loan in the last 30 days". */
  activityLabel?: string | null;
  /** "console" is the super admin's look; everyone else gets the default. */
  variant?: "default" | "console";
}

export function ActivityChart({
  data,
  series,
  activityRate,
  activityLabel,
  variant = "default",
}: ActivityChartProps) {
  const isConsole = variant === "console";
  return (
    <Card className={cn(isConsole && "h-full rounded-3xl")}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className={cn(isConsole && "flex items-start gap-3")}>
            {isConsole ? (
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm">
                <TrendingUp className="size-5" aria-hidden="true" />
              </span>
            ) : null}
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Activity rate
              </CardTitle>
              <p
                className={cn(
                  "mt-1 text-2xl text-foreground sm:text-3xl",
                  isConsole ? "font-bold tracking-tight" : "font-semibold",
                )}
              >
                {activityRate.toFixed(2)}%
              </p>
              {activityLabel ? (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {activityLabel} · last 30 days below
                </p>
              ) : null}
            </div>
          </div>
          <ul
            className={cn(
              "flex flex-wrap items-center",
              isConsole ? "gap-2" : "gap-4",
            )}
          >
            {series.map(({ key, label }) => (
              <li
                key={key}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium text-muted-foreground",
                  isConsole && "rounded-full bg-muted px-2.5 py-1",
                )}
                style={isConsole ? CONSOLE_COLOR_VARS : CHART_COLOR_VARS}
              >
                <span
                  className={cn(
                    "rounded-full",
                    isConsole ? "size-2" : "h-0.5 w-3",
                  )}
                  style={{ backgroundColor: `var(--chart-series-${key})` }}
                  aria-hidden="true"
                />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="h-64 w-full sm:h-80"
          style={isConsole ? CONSOLE_COLOR_VARS : CHART_COLOR_VARS}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              {isConsole ? (
                <defs>
                  {series.map(({ key }) => (
                    <linearGradient
                      key={key}
                      id={`console-fill-${key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={`var(--chart-series-${key})`}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor={`var(--chart-series-${key})`}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  ))}
                </defs>
              ) : null}
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="label"
                interval="preserveStartEnd"
                minTickGap={24}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                dy={8}
              />
              {series.map(({ key }) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--chart-series-${key})`}
                  strokeWidth={isConsole ? 2.5 : 2}
                  fill={
                    isConsole
                      ? `url(#console-fill-${key})`
                      : `var(--chart-series-${key})`
                  }
                  fillOpacity={isConsole ? 1 : 0.1}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
                />
              ))}
              <Tooltip
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                content={<ActivityTooltip series={series} />}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivityTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ dataKey: string; value: number }>;
  series: SeriesDef[];
}

function ActivityTooltip({
  active,
  label,
  payload,
  series,
}: ActivityTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-border bg-popover p-3 text-sm shadow-md ring-1 ring-foreground/10">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </p>
      <dl className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="h-0.5 w-3 shrink-0 rounded-full"
              style={{
                backgroundColor: `var(--chart-series-${entry.dataKey})`,
              }}
              aria-hidden="true"
            />
            <dt className="text-muted-foreground">
              {series.find((s) => s.key === entry.dataKey)?.label ??
                entry.dataKey}
            </dt>
            <dd className="ml-auto font-semibold text-foreground">
              {entry.value.toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
