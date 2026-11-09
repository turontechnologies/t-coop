import * as XLSX from "xlsx";
import { triggerDownload } from "@/lib/table-export";
import type { ImportRowError, ParsedImportResult } from "@/lib/table-import";
import type { LoanMode } from "@/lib/loans-data";
import type { CoopLoanTypeSummary } from "@/types/coop-loans";

/**
 * Admin import of members' existing loans (Loans → Members Loans → a loan type → Import). Each row
 * is a loan already paid out offline; the backend creates it Active (Completed once every
 * installment is paid) with its earlier repayments recorded — see LoanImportController.
 */
const HEADERS = [
  "Membership ID",
  "Amount",
  "Loan Mode",
  "Guarantor Membership ID",
  "Start Date",
  "Repayments Made",
];

export interface ImportedLoanRow {
  rowNumber: number;
  memberId: string;
  loanTypeId: string;
  amount: number;
  loanMode: LoanMode;
  guarantorMemberId?: string;
  startDate?: string;
  repaymentsMade: number;
}

export function downloadLoanImportTemplate(loanType: CoopLoanTypeSummary) {
  const templateSheet = XLSX.utils.aoa_to_sheet([
    HEADERS,
    ["MB-0001", 50000, "TimesTwo", "MB-0002", "2026-01-15", 2],
  ]);
  templateSheet["!cols"] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 26 },
    { wch: 14 },
    { wch: 18 },
  ];

  const referenceSheet = XLSX.utils.aoa_to_sheet([
    ["Field", "Notes"],
    [
      "Loan Type",
      `Every row is a "${loanType.name}" loan (${loanType.durationMonths} monthly installments, max ${loanType.maxAmount}).`,
    ],
    [
      "Membership ID",
      "Required — the borrower's membership ID in this co-operative.",
    ],
    ["Amount", "Required — the principal, a positive amount."],
    ["Loan Mode", 'Optional — "TimesTwo" (default) or "Within".'],
    [
      "Guarantor Membership ID",
      "Optional — another member of this co-operative. Ignored for Within loans.",
    ],
    [
      "Start Date",
      "Optional — when the loan was paid out, YYYY-MM-DD. Defaults to today; can't be in the future.",
    ],
    [
      "Repayments Made",
      `Optional — installments already paid, 0 to ${loanType.durationMonths}. A loan with all installments paid is imported as Completed.`,
    ],
    [
      "Processing",
      "Imported loans are existing loans: they skip guarantor and officer approval and no money is paid out. Interest follows the loan type. Delete the example row before uploading, and don't upload the same file twice.",
    ],
  ]);
  referenceSheet["!cols"] = [{ wch: 26 }, { wch: 110 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, templateSheet, "Template");
  XLSX.utils.book_append_sheet(workbook, referenceSheet, "Field Reference");

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  triggerDownload(
    new Blob([buffer], { type: "application/octet-stream" }),
    `${loanType.name.replace(/[^\w-]+/g, "-").toLowerCase()}-loans-import-template.xlsx`,
  );
}

/** Excel stores dates as serial numbers; accept those as well as YYYY-MM-DD text. */
function toDateString(raw: unknown): string | null | undefined {
  if (raw === "" || raw == null) return undefined;
  if (typeof raw === "number") {
    const parsed = XLSX.SSF.parse_date_code(raw);
    if (!parsed) return null;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`;
  }
  const text = String(raw).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

export async function parseLoanImportFile(
  file: File,
  loanType: CoopLoanTypeSummary,
): Promise<ParsedImportResult<ImportedLoanRow>> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === "template") ??
    workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet)
    return {
      rows: [],
      errors: [{ row: 1, message: "The file has no worksheet" }],
    };

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  const rows: ImportedLoanRow[] = [];
  const errors: ImportRowError[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;
    const memberId = String(raw["Membership ID"] ?? "").trim();
    const amountRaw = raw["Amount"];
    const modeRaw = String(raw["Loan Mode"] ?? "")
      .trim()
      .toLowerCase();
    const guarantorMemberId = String(
      raw["Guarantor Membership ID"] ?? "",
    ).trim();
    const startRaw = raw["Start Date"];
    const paidRaw = raw["Repayments Made"];
    if (!memberId && (amountRaw === "" || amountRaw == null)) return;

    const fail = (message: string) => errors.push({ row: rowNumber, message });

    if (!memberId) return void fail("Membership ID is required");

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return void fail("Amount must be a number greater than zero");
    }

    const loanMode: LoanMode | undefined =
      !modeRaw || modeRaw === "times two" || modeRaw === "timestwo"
        ? "TimesTwo"
        : modeRaw === "within"
          ? "Within"
          : undefined;
    if (!loanMode) return void fail('Loan Mode must be "TimesTwo" or "Within"');

    const startDate = toDateString(startRaw);
    if (startDate === null) return void fail("Start Date must be YYYY-MM-DD");

    const repaymentsMade =
      paidRaw === "" || paidRaw == null ? 0 : Number(paidRaw);
    if (
      !Number.isInteger(repaymentsMade) ||
      repaymentsMade < 0 ||
      repaymentsMade > loanType.durationMonths
    ) {
      return void fail(
        `Repayments Made must be a whole number from 0 to ${loanType.durationMonths}`,
      );
    }

    rows.push({
      rowNumber,
      memberId,
      loanTypeId: loanType.id,
      amount,
      loanMode,
      guarantorMemberId:
        loanMode === "TimesTwo" && guarantorMemberId
          ? guarantorMemberId
          : undefined,
      startDate,
      repaymentsMade,
    });
  });

  return { rows, errors };
}
