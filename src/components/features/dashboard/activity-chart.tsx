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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivityPoint } from "@/lib/dashboard-data";

type SeriesKey = keyof Omit<ActivityPoint, "hour">;
type SeriesDef = { key: SeriesKey; label: string };

const CHART_COLOR_VARS: CSSProperties = {
  "--chart-series-savings": "light-dark(#1baf7a, #199e70)",
  "--chart-series-loans": "light-dark(#eb6834, #d95926)",
  "--chart-series-dividends": "light-dark(#4a3aa7, #9085e9)",
} as CSSProperties;

interface ActivityChartProps {
  data: ActivityPoint[];
  series: SeriesDef[];
  activityRate: number;
}

export function ActivityChart({
  data,
  series,
  activityRate,
}: ActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Activity Rate
            </CardTitle>
            <p className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
              {activityRate.toFixed(2)}%
            </p>
          </div>
          <ul className="flex flex-wrap items-center gap-4">
            {series.map(({ key, label }) => (
              <li
                key={key}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <span
                  className="h-0.5 w-3 rounded-full"
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
        <div className="h-64 w-full sm:h-80" style={CHART_COLOR_VARS}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="hour"
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
                  strokeWidth={2}
                  fill={`var(--chart-series-${key})`}
                  fillOpacity={0.1}
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
        {label}:00
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
