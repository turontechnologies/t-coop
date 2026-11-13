"use client";

import { useMemo } from "react";
import { useCoopMembers } from "@/hooks/use-coop-members";
import { useCooperativeBranding } from "@/hooks/use-cooperative";
import { useAuthStore } from "@/store/auth.store";

/** "MB-0001 · ALT-77" — a membership (or co-op) ID with its alternative ID, when there is one. */
export function formatMemberId(id: string, alternativeId?: string | null) {
  return alternativeId ? `${id} · ${alternativeId}` : id;
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
  return data?.alternativeIdLabel?.trim() || "Alternative ID";
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

/** A formatter that always carries the alternative ID along with the ID. */
export function useFormatMemberId(coopId?: string) {
  const ids = useAlternativeIds(coopId);
  return (id: string) => formatMemberId(id, ids.get(id));
}

/**
 * A membership or co-op ID as text, always followed by the alternative ID when the member has one.
 * Use it anywhere an ID is shown so the two never get separated.
 */
export function MemberIdText({
  id,
  coopId,
  className,
}: {
  id: string;
  /** Defaults to the signed-in member's co-op. When the alternative ID is already at hand, use
   * {@link formatMemberId} instead. */
  coopId?: string;
  className?: string;
}) {
  const ids = useAlternativeIds(coopId);
  return <span className={className}>{formatMemberId(id, ids.get(id))}</span>;
}
