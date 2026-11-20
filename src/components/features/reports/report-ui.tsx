"use client";

import { useState, type ReactNode } from "react";
import { TablePagination } from "@/components/ui/table-pagination";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

/** A white rounded section — the design's `.panel`. */
export function Panel({
  title,
  aside,
  children,
  className,
}: {
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      {title || aside ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title ? (
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
          ) : (
            <span />
          )}
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** A rounded pill used for periods and filters — the design's `.filter-chip`. */
export function Chip({
  pressed,
  onClick,
  disabled,
  children,
}: {
  pressed: boolean;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors disabled:cursor-default",
        pressed
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Small "Today" tag for figures that are a position now, not a total for the period. */
export function TodayTag() {
  return (
    <span className="rounded-full bg-sky-100 px-2 py-px text-xs font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
      Today
    </span>
  );
}

/**
 * Change against the earlier period as a coloured pill. `invert` for figures where going down is
 * good (rejections). Renders nothing when there's nothing to compare with.
 */
export function Delta({
  now,
  before,
  invert = false,
}: {
  now: number;
  before: number | null | undefined;
  invert?: boolean;
}) {
  if (before == null) return null;
  const pill = (tone: "up" | "down" | "flat", text: string) => (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold whitespace-nowrap",
        tone === "up" &&
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        tone === "down" &&
          "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
        tone === "flat" && "bg-muted text-muted-foreground",
      )}
    >
      {text}
    </span>
  );
  if (!before && !now) return pill("flat", "No change");
  if (!before) return pill(invert ? "down" : "up", "New");
  const change = (now - before) / Math.abs(before);
  if (Math.abs(change) < 0.005) return pill("flat", "No change");
  const good = invert ? change < 0 : change > 0;
  return pill(
    good ? "up" : "down",
    `${change > 0 ? "▲" : "▼"} ${Math.abs(change * 100).toFixed(Math.abs(change) > 1 ? 0 : 1)}%`,
  );
}

/** One label/amount line of a ledger. */
export function LedgerRow({
  label,
  value,
  variant,
}: {
  label: ReactNode;
  value: ReactNode;
  variant?: "total" | "grand";
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3 border-b py-2.5 text-muted-foreground",
        variant === "total"
          ? "border-foreground/20 font-bold text-foreground"
          : "border-border",
        variant === "grand" &&
          "border-b-0 pt-3.5 text-base font-bold text-foreground",
      )}
    >
      <span className={cn(variant && "text-foreground")}>{label}</span>
      <b
        className={cn(
          "font-semibold whitespace-nowrap text-foreground",
          variant === "grand" && "text-lg font-bold",
        )}
      >
        {value}
      </b>
    </div>
  );
}

export function LedgerHead({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 text-xs font-bold tracking-wider text-muted-foreground/80 uppercase">
      {children}
    </div>
  );
}

export function Avatar({
  name,
  url,
  size = "md",
}: {
  name: string;
  url?: string | null;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-8 text-xs" : "size-10 text-sm";
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={cn(box, "shrink-0 rounded-full bg-muted object-cover")}
    />
  ) : (
    <span
      className={cn(
        box,
        "grid shrink-0 place-items-center rounded-full bg-primary/10 font-bold text-primary",
      )}
    >
      {getInitials(name)}
    </span>
  );
}

export function MemberCell({
  name,
  meta,
  url,
}: {
  name: string;
  meta: ReactNode;
  url?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} url={url} size="sm" />
      <div className="min-w-0">
        <b className="block truncate font-semibold text-foreground">{name}</b>
        <div className="text-sm text-muted-foreground">{meta}</div>
      </div>
    </div>
  );
}

export type Tone =
  "success" | "warning" | "danger" | "info" | "violet" | "neutral";

export const TONE_BADGE: Record<Tone, string> = {
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  info: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  neutral: "bg-muted text-muted-foreground",
};

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap",
        TONE_BADGE[tone],
      )}
    >
      {children}
    </span>
  );
}

export interface Column<T> {
  key: string;
  label: string;
  /** Right-aligned figures. */
  numeric?: boolean;
  className?: string;
  render: (row: T) => ReactNode;
}

/**
 * The design's data table: uppercase header on a tinted band, roomy rows, optional click-through
 * and a "View N per page" pager. Scrolls sideways on small screens.
 */
export function ReportTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  pageSize: initialSize = 10,
  pageSizes,
  empty,
  compact,
  minWidth = 640,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  pageSizes?: number[];
  empty: string;
  compact?: boolean;
  minWidth?: number;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  const shown = rows.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "h-11 px-4 text-xs font-bold tracking-wider whitespace-nowrap text-muted-foreground uppercase first:pl-5 last:pr-5",
                    column.numeric && "text-right",
                    column.className,
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <strong className="font-semibold text-foreground">
                    {empty}
                  </strong>
                </td>
              </tr>
            ) : (
              shown.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-border text-muted-foreground transition-colors last:border-0 hover:bg-muted/40",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-4 align-middle first:pl-5 last:pr-5",
                        compact ? "py-2.5" : "py-3.5",
                        column.numeric && "text-right whitespace-nowrap",
                        column.className,
                      )}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > pageSize || pageSizes ? (
        rows.length > 0 ? (
          <TablePagination
            page={current}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={pageSizes ?? [pageSize]}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        ) : null
      ) : null}
    </div>
  );
}

/** A thin bar split into coloured parts. */
export function StackBar({
  parts,
  className,
  label,
}: {
  parts: { value: number; color: string }[];
  className?: string;
  label: string;
}) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "flex h-2 overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      {parts.map((part, index) => (
        <span
          key={index}
          className="block h-full"
          style={{
            width: `${total ? (part.value / total) * 100 : 0}%`,
            background: part.color,
          }}
        />
      ))}
    </div>
  );
}

export const pct = (value: number | null | undefined, digits = 0) =>
  value == null ? "—" : `${(value * 100).toFixed(digits)}%`;
