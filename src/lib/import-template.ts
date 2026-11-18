import * as XLSX from "xlsx";
import { triggerDownload } from "@/lib/table-export";

/**
 * Every upload template in the app is built here, so they all look and read the same: a
 * "Fill this in" sheet, and a "How to fill it" sheet in plain, simple English — short steps,
 * then one line per column saying whether you must fill it and what to put in it.
 */

export const FILL_SHEET = "Fill this in";
const GUIDE_SHEET = "How to fill it";

export interface TemplateColumn {
  name: string;
  /** "Yes", "No", or a short condition like "Only if…". */
  required: string;
  /** Plain words: what to type in this column. */
  help: string;
  width?: number;
}

export function downloadTemplate({
  filename,
  title,
  steps,
  columns,
  rows,
}: {
  filename: string;
  /** e.g. "Uploading members' savings" */
  title: string;
  steps: string[];
  columns: TemplateColumn[];
  /** Rows already filled in for the user (or one example row). */
  rows: (string | number)[][];
}) {
  const fill = XLSX.utils.aoa_to_sheet([columns.map((c) => c.name), ...rows]);
  fill["!cols"] = columns.map((c) => ({
    wch: c.width ?? Math.max(14, c.name.length + 4),
  }));

  const guide = XLSX.utils.aoa_to_sheet([
    [title],
    [],
    ["Steps"],
    ...steps.map((step, index) => [`${index + 1}. ${step}`]),
    [],
    ["Column", "Must you fill it?", "What to put in it"],
    ...columns.map((c) => [c.name, c.required, c.help]),
  ]);
  guide["!cols"] = [{ wch: 26 }, { wch: 18 }, { wch: 90 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, fill, FILL_SHEET);
  XLSX.utils.book_append_sheet(workbook, guide, GUIDE_SHEET);
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  triggerDownload(
    new Blob([buffer], { type: "application/octet-stream" }),
    filename,
  );
}

/** The rows of the sheet people fill in (never the guide). */
export async function readFilledRows(
  file: File,
): Promise<Record<string, unknown>[] | null> {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
  });
  const name =
    workbook.SheetNames.find((sheet) => sheet === FILL_SHEET) ??
    workbook.SheetNames.find((sheet) => sheet.toLowerCase() === "template") ??
    workbook.SheetNames.find(
      (sheet) => !/how to fill|field reference/i.test(sheet),
    ) ??
    workbook.SheetNames[0];
  const sheet = name ? workbook.Sheets[name] : undefined;
  return sheet
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
    : null;
}

/** A column's value, forgiving case and spaces ("membership id", "MembershipID"). */
export function cell(
  raw: Record<string, unknown>,
  ...names: string[]
): unknown {
  const wanted = names.map((name) => name.replace(/\s+/g, "").toLowerCase());
  for (const key of Object.keys(raw)) {
    if (wanted.includes(key.replace(/\s+/g, "").toLowerCase())) return raw[key];
  }
  return "";
}

export const text = (value: unknown) => String(value ?? "").trim();

/* ───────────────────────── Finding a member by either ID ───────────────────────── */

export interface MemberLookup {
  /** What the co-op calls the alternative ID ("Alternative ID", "Staff Number"…). */
  label: string;
  /** membership ID (upper-case) → membership ID as stored */
  ids: Map<string, string>;
  /** alternative ID (lower-case) → membership ID */
  byAlternativeId: Map<string, string>;
  /** membership ID → alternative ID */
  alternativeIdOf: Map<string, string>;
}

export function memberLookup(
  members: { id: string; alternativeId?: string | null }[],
  label = "Alternative ID",
): MemberLookup {
  const lookup: MemberLookup = {
    label,
    ids: new Map(),
    byAlternativeId: new Map(),
    alternativeIdOf: new Map(),
  };
  for (const member of members) {
    lookup.ids.set(member.id.toUpperCase(), member.id);
    if (member.alternativeId) {
      lookup.byAlternativeId.set(
        member.alternativeId.trim().toLowerCase(),
        member.id,
      );
      lookup.alternativeIdOf.set(member.id, member.alternativeId);
    }
  }
  return lookup;
}

/** The template column for the alternative ID, named the co-op's way. */
export function alternativeIdColumn(lookup: MemberLookup): TemplateColumn {
  return {
    name: lookup.label,
    required: "Only if no Membership ID",
    help: `The member's ${lookup.label}. You can use this instead of the Membership ID. If you fill both, they must be the same person.`,
    width: Math.max(16, lookup.label.length + 4),
  };
}

/**
 * Which member a row is about: by Membership ID, or by the alternative ID when that's all the
 * row has. Both filled in must point at the same person.
 */
export function findMember(
  raw: Record<string, unknown>,
  lookup: MemberLookup,
): { memberId?: string; error?: string; empty?: boolean } {
  const typedId = text(cell(raw, "Membership ID", "Member ID"));
  const typedAlt = text(cell(raw, lookup.label, "Alternative ID"));
  if (!typedId && !typedAlt) return { empty: true };
  const byId = typedId ? lookup.ids.get(typedId.toUpperCase()) : undefined;
  const byAlt = typedAlt
    ? lookup.byAlternativeId.get(typedAlt.toLowerCase())
    : undefined;
  if (typedId && !byId)
    return {
      error: `There is no member with Membership ID "${typedId}" in this co-operative`,
    };
  if (typedAlt && !byAlt && !byId)
    return {
      error: `There is no member with ${lookup.label} "${typedAlt}" in this co-operative`,
    };
  if (byId && byAlt && byId !== byAlt)
    return {
      error: `Membership ID "${typedId}" and ${lookup.label} "${typedAlt}" belong to two different people`,
    };
  return { memberId: byId ?? byAlt };
}

/** "₦12,500.00" / 12500 / "12500" → 12500; null when empty, NaN when not a number. */
export function amountOf(value: unknown): number | null {
  if (value === "" || value == null) return null;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : NaN;
}

/** Excel dates (Date objects or serial numbers) and typed dates → YYYY-MM-DD; undefined when
 * empty, null when it can't be read. Accepts 2026-11-18 and 18/11/2026. */
export function dateOf(value: unknown): string | undefined | null {
  if (value === "" || value == null) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const local = new Date(
      value.getTime() - value.getTimezoneOffset() * 60_000,
    );
    return local.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`;
  }
  const typed = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(typed)) return typed;
  const dmy = typed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy)
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  return null;
}

export const today = () => new Date().toISOString().slice(0, 10);
