import type { CooperativeSummary } from "@/types/cooperative";

/** Where a co-op's new-member guarantors may come from (Settings → Co-operative → New members). */
export type GuarantorSource = "Any" | "CoopOnly" | "Mix";

export interface GuarantorRules {
  required: boolean;
  min: number;
  source: GuarantorSource;
  fromCoop: number;
  fromOutside: number;
}

/** One row in the guarantor editor. */
export interface GuarantorEntry {
  key: string;
  kind: "member" | "outside";
  memberId: string;
  name: string;
  phone: string;
  email: string;
}

/** What the backend takes (MemberGuarantorInput). */
export interface GuarantorPayload {
  memberId?: string;
  name?: string;
  phone?: string;
  email?: string;
}

/** GET /cooperatives/{id}/members/{memberId}/guarantors */
export interface MemberGuarantorRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  respondedAt: string | null;
  guarantorMemberId: string | null;
}

export function guarantorRulesOf(
  coop: CooperativeSummary | undefined,
): GuarantorRules {
  return {
    required: !!coop?.requireMemberGuarantors,
    min: Math.max(1, coop?.minGuarantors ?? 1),
    source: coop?.memberGuarantorSource ?? "Any",
    fromCoop: coop?.memberGuarantorsFromCoop ?? 0,
    fromOutside: coop?.memberGuarantorsFromOutside ?? 0,
  };
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "At least 3 guarantors — at least 1 from the co-op and 1 from outside." */
export function describeGuarantorRules(rules: GuarantorRules): string {
  if (!rules.required)
    return "Optional — add guarantors if the member has any.";
  const base = `At least ${plural(rules.min, "guarantor")}`;
  if (rules.source === "CoopOnly")
    return `${base}, all members of this co-operative.`;
  if (rules.source === "Mix") {
    const parts = [
      rules.fromCoop > 0 ? `${rules.fromCoop} from the co-operative` : null,
      rules.fromOutside > 0 ? `${rules.fromOutside} from outside` : null,
    ].filter(Boolean);
    return `${base} — at least ${parts.join(" and ")}.`;
  }
  return `${base}, from the co-operative or outside it.`;
}

let counter = 0;
export function newGuarantorEntry(
  kind: GuarantorEntry["kind"] = "member",
): GuarantorEntry {
  counter += 1;
  return {
    key: `g${Date.now()}-${counter}`,
    kind,
    memberId: "",
    name: "",
    phone: "",
    email: "",
  };
}

/** Empty rows to start with, already split the way the rules ask. */
export function startingGuarantorEntries(
  rules: GuarantorRules,
): GuarantorEntry[] {
  if (!rules.required) return [];
  const entries: GuarantorEntry[] = [];
  if (rules.source === "Mix") {
    for (let i = 0; i < rules.fromCoop; i++)
      entries.push(newGuarantorEntry("member"));
    for (let i = 0; i < rules.fromOutside; i++)
      entries.push(newGuarantorEntry("outside"));
  }
  while (entries.length < rules.min) entries.push(newGuarantorEntry("member"));
  return entries;
}

export function entriesFromRecords(
  records: MemberGuarantorRecord[],
): GuarantorEntry[] {
  return records.map((record) => ({
    ...newGuarantorEntry(record.guarantorMemberId ? "member" : "outside"),
    memberId: record.guarantorMemberId ?? "",
    name: record.guarantorMemberId ? "" : record.name,
    phone: record.guarantorMemberId ? "" : (record.phone ?? ""),
    email: record.guarantorMemberId ? "" : (record.email ?? ""),
  }));
}

function isBlank(entry: GuarantorEntry) {
  return entry.kind === "member"
    ? !entry.memberId
    : !entry.name.trim() && !entry.phone.trim() && !entry.email.trim();
}

export function toGuarantorPayload(
  entries: GuarantorEntry[],
): GuarantorPayload[] {
  return entries
    .filter((entry) => !isBlank(entry))
    .map((entry) =>
      entry.kind === "member"
        ? { memberId: entry.memberId }
        : {
            name: entry.name.trim(),
            phone: entry.phone.trim(),
            email: entry.email.trim() || undefined,
          },
    );
}

export interface GuarantorProblems {
  /** Per-row messages, by entry key. */
  rows: Record<string, string>;
  /** A rule the list as a whole breaks. */
  list?: string;
}

const PHONE = /^\+?[0-9][0-9 ()-]{6,19}$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** The same checks the backend makes (MemberGuarantorRules), so the admin sees them before saving. */
export function checkGuarantors(
  rules: GuarantorRules,
  entries: GuarantorEntry[],
): GuarantorProblems {
  const rows: Record<string, string> = {};
  const seenMembers = new Set<string>();
  const seenPhones = new Set<string>();
  let fromCoop = 0;
  let fromOutside = 0;

  for (const entry of entries) {
    if (isBlank(entry)) {
      // An empty row only matters when the list is short; the count check below covers it.
      continue;
    }
    if (entry.kind === "member") {
      if (seenMembers.has(entry.memberId)) {
        rows[entry.key] = "This member is already listed.";
        continue;
      }
      seenMembers.add(entry.memberId);
      fromCoop += 1;
    } else {
      const name = entry.name.trim();
      const phone = entry.phone.trim();
      const email = entry.email.trim();
      if (!name) rows[entry.key] = "Enter the guarantor's full name.";
      else if (!phone) rows[entry.key] = "Enter a phone number.";
      else if (!PHONE.test(phone))
        rows[entry.key] = "That doesn't look like a phone number.";
      else if (email && !EMAIL.test(email))
        rows[entry.key] = "Enter a valid email address, or leave it empty.";
      else if (seenPhones.has(phone.replace(/\D/g, "")))
        rows[entry.key] = "Another guarantor has this phone number.";
      if (phone) seenPhones.add(phone.replace(/\D/g, ""));
      fromOutside += 1;
    }
  }

  let list: string | undefined;
  if (rules.required) {
    const total = fromCoop + fromOutside;
    if (rules.source === "CoopOnly" && fromOutside > 0) {
      list = "Guarantors must be members of this co-operative.";
    } else if (total < rules.min) {
      list = `Add at least ${plural(rules.min, "guarantor")} — you've added ${total}.`;
    } else if (rules.source === "Mix" && fromCoop < rules.fromCoop) {
      list = `At least ${plural(rules.fromCoop, "guarantor")} ${rules.fromCoop === 1 ? "has" : "have"} to be a member of this co-operative — you've added ${fromCoop}.`;
    } else if (rules.source === "Mix" && fromOutside < rules.fromOutside) {
      list = `At least ${plural(rules.fromOutside, "guarantor")} ${rules.fromOutside === 1 ? "has" : "have"} to be from outside the co-operative — you've added ${fromOutside}.`;
    }
  }
  return { rows, list };
}

export function hasGuarantorProblems(problems: GuarantorProblems) {
  return !!problems.list || Object.keys(problems.rows).length > 0;
}

export function countGuarantors(entries: GuarantorEntry[]) {
  let fromCoop = 0;
  let fromOutside = 0;
  for (const entry of entries) {
    if (isBlank(entry)) continue;
    if (entry.kind === "member") fromCoop += 1;
    else fromOutside += 1;
  }
  return { fromCoop, fromOutside, total: fromCoop + fromOutside };
}
