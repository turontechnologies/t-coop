"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MobileRecordCardField {
  label: string;
  value: ReactNode;
}

interface MobileRecordCardProps {
  /** Primary heading for the card — usually the row's identifying name. */
  title: ReactNode;
  /** Rendered top-right, next to the title — typically a status Badge. */
  badge?: ReactNode;
  /** Label/value pairs rendered as a stacked definition list. */
  fields: MobileRecordCardField[];
  /** Row-level actions (buttons, icon buttons) rendered below the fields. */
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * The mobile (<sm) counterpart to a table row: one card per record, with
 * the row's cells reformatted as a stacked label/value list instead of
 * forcing horizontal scroll. Pair with a `hidden sm:block` table and a
 * `sm:hidden` wrapper around a list of these.
 */
export function MobileRecordCard({
  title,
  badge,
  fields,
  actions,
  onClick,
  className,
}: MobileRecordCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "space-y-3 rounded-xl border border-border p-4",
        onClick && "cursor-pointer active:bg-muted/50",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate font-medium text-foreground">{title}</p>
        {badge}
      </div>
      <dl className="space-y-1.5">
        {fields.map((field) => (
          <div
            key={field.label}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <dt className="shrink-0 text-muted-foreground">{field.label}</dt>
            <dd className="text-right text-foreground">{field.value}</dd>
          </div>
        ))}
      </dl>
      {actions ? (
        <div className="flex items-center gap-2 pt-1">{actions}</div>
      ) : null}
    </div>
  );
}

interface MobileRecordListProps {
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  className?: string;
}

export function MobileRecordList({
  children,
  emptyMessage = "Nothing to show.",
  isEmpty = false,
  className,
}: MobileRecordListProps) {
  return (
    <div className={cn("space-y-3 sm:hidden", className)}>
      {isEmpty ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </div>
  );
}
