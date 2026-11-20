import { formatDateLong } from "@/lib/format";

export type PeriodKey =
  "month" | "last-month" | "quarter" | "year" | "12m" | "all" | "custom";

export interface ReportRange {
  from: string;
  to: string;
  key: PeriodKey;
}

export const PERIOD_PRESETS: [Exclude<PeriodKey, "custom">, string][] = [
  ["month", "This month"],
  ["last-month", "Last month"],
  ["quarter", "This quarter"],
  ["year", "This year"],
  ["12m", "Last 12 months"],
  ["all", "All time"],
];

/** Earliest date "All time" reaches back to. */
const ALL_TIME_FROM = "2000-01-01";

export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseIso(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function period(
  key: Exclude<PeriodKey, "custom">,
  now = new Date(),
): ReportRange {
  const y = now.getFullYear();
  const m = now.getMonth();
  const range = (a: Date, b: Date) => ({
    from: isoDate(a),
    to: isoDate(b),
    key,
  });
  switch (key) {
    case "month":
      return range(new Date(y, m, 1), now);
    case "last-month":
      return range(new Date(y, m - 1, 1), new Date(y, m, 0));
    case "quarter":
      return range(new Date(y, m - (m % 3), 1), now);
    case "year":
      return range(new Date(y, 0, 1), now);
    case "12m":
      return range(new Date(y, m - 11, 1), now);
    case "all":
      return { from: ALL_TIME_FROM, to: isoDate(now), key };
  }
}

/** Moves a date by whole months, keeping the day where the target month allows it. */
function shiftMonths(value: string, months: number): string {
  const date = parseIso(value);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, last));
  return isoDate(date);
}

/**
 * The period to compare against: the same dates one step back (last month, last quarter, the
 * same stretch of last year). Custom ranges use the same number of days just before. Null for
 * "All time", which has nothing before it.
 */
export function previousPeriod(range: ReportRange): ReportRange | null {
  if (range.key === "all") return null;
  const step: Partial<Record<PeriodKey, number>> = {
    month: -1,
    "last-month": -1,
    quarter: -3,
    year: -12,
    "12m": -12,
  };
  const months = step[range.key];
  if (months) {
    const from = shiftMonths(range.from, months);
    const to =
      range.key === "last-month"
        ? isoDate(
            new Date(
              parseIso(from).getFullYear(),
              parseIso(from).getMonth() + 1,
              0,
            ),
          )
        : shiftMonths(range.to, months);
    return { from, to, key: "custom" };
  }
  const a = parseIso(range.from);
  const b = parseIso(range.to);
  const days = Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
  const end = new Date(a);
  end.setDate(end.getDate() - 1);
  const start = new Date(a);
  start.setDate(start.getDate() - days);
  return { from: isoDate(start), to: isoDate(end), key: "custom" };
}

export function periodLabel(range: { from: string; to: string }): string {
  return `${formatDateLong(parseIso(range.from))} – ${formatDateLong(parseIso(range.to))}`;
}

/** "Jan 26" */
export function monthLabel(month: string): string {
  return parseIso(`${month}-01`).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}
