import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationCheck } from "@/services/membership.service";

const TONE = {
  high: "text-primary dark:text-emerald-300",
  medium: "text-amber-600 dark:text-amber-300",
  low: "text-destructive",
} as const;

const RING = {
  high: "stroke-primary",
  medium: "stroke-amber-500",
  low: "stroke-destructive",
} as const;

/** The authenticity score as a ring, e.g. 86%. */
export function ScoreRing({
  score,
  level,
  size = 112,
}: {
  score: number;
  level: "high" | "medium" | "low";
  size?: number;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        className="size-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          className="stroke-muted"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className={cn(
            "transition-[stroke-dashoffset] duration-700",
            RING[level],
          )}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-semibold tabular-nums",
          TONE[level],
        )}
        style={{ fontSize: size / 4.2 }}
      >
        {score}%
      </span>
    </div>
  );
}

/** A small pill with the score, for the list. */
export function ScorePill({
  score,
  level,
  label,
}: {
  score: number;
  level: "high" | "medium" | "low";
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        level === "high"
          ? "bg-primary/10 text-primary dark:text-emerald-300"
          : level === "medium"
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : "bg-destructive/10 text-destructive",
      )}
    >
      <span className="tabular-nums">{score}%</span>
      <span className="font-normal">· {label}</span>
    </span>
  );
}

const CHECK_LOOK = {
  pass: {
    icon: CheckCircle2,
    tone: "text-primary dark:text-emerald-300",
    word: "Passed",
  },
  warn: {
    icon: AlertTriangle,
    tone: "text-amber-600 dark:text-amber-300",
    word: "Check this",
  },
  fail: { icon: XCircle, tone: "text-destructive", word: "Problem" },
  info: { icon: Info, tone: "text-muted-foreground", word: "Not counted" },
} as const;

export function CheckList({ checks }: { checks: ApplicationCheck[] }) {
  return (
    <ul className="divide-y divide-border">
      {checks.map((check) => {
        const look = CHECK_LOOK[check.status];
        return (
          <li key={check.key} className="flex gap-3 py-3">
            <look.icon
              className={cn("mt-0.5 size-5 shrink-0", look.tone)}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  {check.label}
                </p>
                <span className={cn("text-xs font-medium", look.tone)}>
                  {look.word}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{check.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
