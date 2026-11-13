"use client";

import { useMemo } from "react";
import { useCoopMembers } from "@/hooks/use-coop-members";
import { useCooperativeBranding } from "@/hooks/use-cooperative";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const DEFAULT_LABEL = "Alternative ID";

/**
 * "MB-0001 · Staff No. 507": a membership (or co-op) ID followed by its alternative ID, named the
 * way the co-op calls it. Inline text only; tables give the alternative ID its own column.
 */
export function formatMemberId(
  id: string,
  alternativeId?: string | null,
  label: string = DEFAULT_LABEL,
) {
  if (!alternativeId) return id;
  const name = label === DEFAULT_LABEL ? "Alt ID" : label;
  return `${id} · ${name} ${alternativeId}`;
}

/** The signed-in member's co-op (the admin's own ID is the co-op's). */
function useOwnCoopId() {
  const member = useAuthStore((state) => state.member);
  return (
    member?.cooperativeId ?? (member?.role === "admin" ? member.id : undefined)
  );
}

/** What the co-op calls the alternative ID ("Alternative ID" unless the admin renamed it). */
export function useAlternativeIdLabel(coopId?: string) {
  const own = useOwnCoopId();
  const { data } = useCooperativeBranding(coopId ?? own);
  return data?.alternativeIdLabel?.trim() || DEFAULT_LABEL;
}

/** memberId → alternative ID for a co-op, from its (cached) member list. */
export function useAlternativeIds(coopId?: string) {
  const own = useOwnCoopId();
  const { data: members = [] } = useCoopMembers(coopId ?? own);
  return useMemo(
    () =>
      new Map(
        members
          .filter((member) => member.alternativeId)
          .map((member) => [member.id, member.alternativeId as string]),
      ),
    [members],
  );
}

/** A formatter that always carries the alternative ID (and its name) along with the ID. */
export function useFormatMemberId(coopId?: string) {
  const ids = useAlternativeIds(coopId);
  const label = useAlternativeIdLabel(coopId);
  return (id: string) => formatMemberId(id, ids.get(id), label);
}

/**
 * Everything a table needs for its alternative-ID column: the header (the co-op's own name for
 * it) and a lookup by member ID.
 */
export function useAlternativeIdColumn(coopId?: string) {
  const ids = useAlternativeIds(coopId);
  const label = useAlternativeIdLabel(coopId);
  return { label, get: (memberId: string) => ids.get(memberId) ?? null };
}

/** An alternative-ID table cell: the value, or a quiet dash when the member has none. */
export function AlternativeIdValue({
  value,
  className,
}: {
  value?: string | null;
  className?: string;
}) {
  return value ? (
    <span className={cn("font-medium text-foreground tabular-nums", className)}>
      {value}
    </span>
  ) : (
    <span className="text-muted-foreground" aria-label="None">
      —
    </span>
  );
}

/**
 * A membership or co-op ID as text, followed by the alternative ID when the member has one.
 * Use it for inline text; in tables use a separate column (useAlternativeIdColumn).
 */
export function MemberIdText({
  id,
  coopId,
  className,
}: {
  id: string;
  /** Defaults to the signed-in member's co-op. */
  coopId?: string;
  className?: string;
}) {
  const format = useFormatMemberId(coopId);
  return <span className={className}>{format(id)}</span>;
}
