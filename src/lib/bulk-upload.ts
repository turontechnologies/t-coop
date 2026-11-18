import * as XLSX from "xlsx";
import { triggerDownload } from "@/lib/table-export";
import type { ImportRowError } from "@/lib/table-import";
import type { CoopLoanRecord, CoopMember } from "@/lib/coop-data";
import type { BulkSavingsRow } from "@/services/savings-self.service";
import type { BulkRepaymentRow } from "@/services/loan-repayment.service";

/**
 * Bulk uploads of savings and loan repayments. The templates come pre-filled — every active
 * member (savings) or every active loan (repayments) — so the admin only types the amounts.
 * Rows left without an amount are skipped. Excel (.xlsx) and CSV files are both read.
 */

export interface ParsedBulkFile<TRow> {
  rows: TRow[];
  errors: ImportRowError[];
  /** Rows skipped because they had no amount (the pre-filled template's untouched rows). */
  skipped: number;
}

const today = () => new Date().toISOString().slice(0, 10);

function save(workbook: XLSX.WorkBook, filename: string) {
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  triggerDownload(
    new Blob([buffer], { type: "application/octet-stream" }),
    filename,
  );
}

function referenceSheet(rows: string[][]) {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Column", "What to put in it"],
    ...rows,
  ]);
  sheet["!cols"] = [{ wch: 18 }, { wch: 100 }];
  return sheet;
}

/* ───────────────────────────── Savings ───────────────────────────── */

const SAVINGS_HEADERS = [
  "Membership ID",
  "Member Name",
  "Savings Type",
  "Amount",
  "Date",
];

export function downloadBulkSavingsTemplate(
  members: CoopMember[],
  savingsTypes: string[],
  formatId: (id: string) => string = (id) => id,
) {
  const defaultType = savingsTypes.length === 1 ? savingsTypes[0] : "";
  const active = members
    .filter((member) => member.status === "Active")
    .sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
      ),
    );
  const sheet = XLSX.utils.aoa_to_sheet([
    SAVINGS_HEADERS,
    ...active.map((member) => [
      formatId(member.id),
      `${member.firstName} ${member.lastName}`.trim(),
      defaultType,
      "",
      "",
    ]),
  ]);
  sheet["!cols"] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Savings");
  XLSX.utils.book_append_sheet(
    workbook,
    referenceSheet([
      [
        "Membership ID",
        "Already filled in for every active member. Add rows for anyone missing.",
      ],
      ["Member Name", "For your reference only; it isn't read."],
      [
        "Savings Type",
        `One of: ${savingsTypes.join(", ") || "(no active savings types yet)"}. Can be left empty when the co-operative has only one.`,
      ],
      ["Amount", "How much the member saved. Rows with no amount are skipped."],
      [
        "Date",
        `The day it was saved, as YYYY-MM-DD (e.g. ${today()}). Leave empty for today.`,
      ],
      [
        "Charges",
        "Savings charges are taken from each row exactly as for a teller upload. You see every row before anything is saved, and if any row is wrong nothing is saved.",
      ],
    ]),
    "How to fill it",
  );
  save(workbook, `bulk-savings-${today()}.xlsx`);
}

/* ───────────────────────────── Loan repayments ───────────────────────────── */

const REPAYMENT_HEADERS = [
  "Membership ID",
  "Member Name",
  "Loan Type",
  "Loan ID",
  "Installment",
  "Installments Left",
  "Amount",
  "Date",
];

export function downloadBulkRepaymentTemplate(
  loans: CoopLoanRecord[],
  formatId: (id: string) => string = (id) => id,
) {
  const active = loans
    .filter((loan) => loan.status === "Active")
    .sort((a, b) => a.memberName.localeCompare(b.memberName));
  const sheet = XLSX.utils.aoa_to_sheet([
    REPAYMENT_HEADERS,
    ...active.map((loan) => [
      formatId(loan.memberId),
      loan.memberName,
      loan.loanType,
      loan.id,
      loan.monthlyRepayment,
      Math.max(loan.numberOfRepayments - loan.repaymentsMade, 0),
      "",
      "",
    ]),
  ]);
  sheet["!cols"] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 20 },
    { wch: 38 },
    { wch: 13 },
    { wch: 17 },
    { wch: 14 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Repayments");
  XLSX.utils.book_append_sheet(
    workbook,
    referenceSheet([
      ["Membership ID", "Already filled in: one row for every active loan."],
      ["Member Name", "For your reference only; it isn't read."],
      ["Loan Type", "Needed only when a member has more than one active loan."],
      ["Loan ID", "Already filled in. Keep it so the right loan is credited."],
      ["Installment", "The member's monthly installment, for reference."],
      [
        "Amount",
        "What the member paid. It must be a whole number of installments (one, two, …). The last installment can be slightly different, to clear the loan exactly. Rows with no amount are skipped.",
      ],
      [
        "Date",
        `The day they paid, as YYYY-MM-DD (e.g. ${today()}). Leave empty for today.`,
      ],
      [
        "Checking",
        "You see every row before anything is saved, and if any row is wrong nothing is saved.",
      ],
    ]),
    "How to fill it",
  );
  save(workbook, `bulk-loan-repayments-${today()}.xlsx`);
}

/* ───────────────────────────── Reading a file ───────────────────────────── */

async function readFirstSheet(file: File) {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
  });
  const name =
    workbook.SheetNames.find((sheet) => !/how to fill/i.test(sheet)) ??
    workbook.SheetNames[0];
  const sheet = name ? workbook.Sheets[name] : undefined;
  return sheet
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
    : null;
}

/** Column lookup that forgives case and spacing ("membership id", "MembershipID"). */
function cell(raw: Record<string, unknown>, ...names: string[]): unknown {
  const wanted = names.map((name) => name.replace(/\s+/g, "").toLowerCase());
  for (const key of Object.keys(raw)) {
    if (wanted.includes(key.replace(/\s+/g, "").toLowerCase())) return raw[key];
  }
  return "";
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

/** "₦12,500.00" / 12500 / "12500" → 12500. */
function amountOf(value: unknown): number | null {
  if (value === "" || value == null) return null;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/[^\d.-]/g, "");
  if (!cleaned) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : NaN;
}

/** Excel dates arrive as Date objects; typed ones as text. Both become YYYY-MM-DD. */
function dateOf(value: unknown): string | undefined | null {
  if (value === "" || value == null) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const local = new Date(
      value.getTime() - value.getTimezoneOffset() * 60_000,
    );
    return local.toISOString().slice(0, 10);
  }
  const typed = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(typed)) return typed;
  const dmy = typed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  return null;
}

export async function parseBulkSavingsFile(
  file: File,
): Promise<ParsedBulkFile<BulkSavingsRow>> {
  const raws = await readFirstSheet(file);
  if (!raws)
    return {
      rows: [],
      errors: [{ row: 1, message: "The file has no sheet" }],
      skipped: 0,
    };
  const rows: BulkSavingsRow[] = [];
  const errors: ImportRowError[] = [];
  let skipped = 0;
  raws.forEach((raw, index) => {
    const row = index + 2;
    const memberId = text(cell(raw, "Membership ID", "Member ID", "ID"));
    const amount = amountOf(cell(raw, "Amount"));
    if (amount == null) {
      if (memberId) skipped += 1;
      return;
    }
    if (!memberId)
      return errors.push({ row, message: "Membership ID is missing" });
    if (Number.isNaN(amount) || amount <= 0)
      return errors.push({
        row,
        message: "Amount must be a number more than zero",
      });
    const date = dateOf(cell(raw, "Date"));
    if (date === null)
      return errors.push({ row, message: "Write the date as YYYY-MM-DD" });
    rows.push({
      row,
      memberId,
      savingsType: text(cell(raw, "Savings Type", "Type")) || undefined,
      amount,
      date,
    });
  });
  return { rows, errors, skipped };
}

export async function parseBulkRepaymentFile(
  file: File,
): Promise<ParsedBulkFile<BulkRepaymentRow>> {
  const raws = await readFirstSheet(file);
  if (!raws)
    return {
      rows: [],
      errors: [{ row: 1, message: "The file has no sheet" }],
      skipped: 0,
    };
  const rows: BulkRepaymentRow[] = [];
  const errors: ImportRowError[] = [];
  let skipped = 0;
  raws.forEach((raw, index) => {
    const row = index + 2;
    const memberId = text(cell(raw, "Membership ID", "Member ID"));
    const amount = amountOf(cell(raw, "Amount", "Amount Paid"));
    if (amount == null) {
      if (memberId) skipped += 1;
      return;
    }
    if (!memberId)
      return errors.push({ row, message: "Membership ID is missing" });
    if (Number.isNaN(amount) || amount <= 0)
      return errors.push({
        row,
        message: "Amount must be a number more than zero",
      });
    const date = dateOf(cell(raw, "Date", "Date Paid"));
    if (date === null)
      return errors.push({ row, message: "Write the date as YYYY-MM-DD" });
    rows.push({
      row,
      memberId,
      loanType: text(cell(raw, "Loan Type")) || undefined,
      loanId: text(cell(raw, "Loan ID")) || undefined,
      amount,
      date,
    });
  });
  return { rows, errors, skipped };
}
