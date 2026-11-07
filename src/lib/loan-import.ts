import * as XLSX from "xlsx";
import { triggerDownload } from "@/lib/table-export";
import type { ImportRowError, ParsedImportResult } from "@/lib/table-import";
import type { LoanMode } from "@/lib/loans-data";
import type { CoopLoanTypeSummary } from "@/types/coop-loans";

const HEADERS = ["Loan Type", "Amount", "Loan Mode", "Guarantor Membership ID"];

export interface ImportedLoanApplicationRow {
  rowNumber: number;
  loanTypeId: string;
  amount: number;
  loanMode: LoanMode;
  guarantorMemberId?: string;
}

export function downloadLoanImportTemplate(loanTypes: CoopLoanTypeSummary[]) {
  const templateSheet = XLSX.utils.aoa_to_sheet([HEADERS]);
  templateSheet["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 28 }];

  const referenceSheet = XLSX.utils.aoa_to_sheet([
    ["Field", "Notes"],
    [
      "Loan Type",
      `Required — use an active type name exactly as configured: ${loanTypes.map((type) => type.name).join(", ") || "no active types available"}`,
    ],
    [
      "Amount",
      "Required — positive amount within your savings-based eligibility and the type maximum.",
    ],
    ["Loan Mode", 'Required — use "TimesTwo" or "Within".'],
    [
      "Guarantor Membership ID",
      'Required for "TimesTwo"; leave blank for "Within". The guarantor must belong to this co-operative.',
    ],
    [
      "Processing",
      "Each valid row creates a loan application for the signed-in admin and follows the normal guarantor and approval workflow. Each upload creates new applications, so do not import the same file twice.",
    ],
  ]);
  referenceSheet["!cols"] = [{ wch: 30 }, { wch: 100 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, templateSheet, "Template");
  XLSX.utils.book_append_sheet(workbook, referenceSheet, "Field Reference");

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  triggerDownload(
    new Blob([buffer], { type: "application/octet-stream" }),
    "my-loans-import-template.xlsx",
  );
}

export async function parseLoanImportFile(
  file: File,
  loanTypes: CoopLoanTypeSummary[],
): Promise<ParsedImportResult<ImportedLoanApplicationRow>> {
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
  const rows: ImportedLoanApplicationRow[] = [];
  const errors: ImportRowError[] = [];
  const typesByName = new Map<string, CoopLoanTypeSummary[]>();

  for (const type of loanTypes.filter((item) => item.status === "Active")) {
    const key = type.name.trim().toLowerCase();
    typesByName.set(key, [...(typesByName.get(key) ?? []), type]);
  }

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;
    const typeName = String(raw["Loan Type"] ?? "").trim();
    const amountRaw = raw["Amount"];
    const modeRaw = String(raw["Loan Mode"] ?? "")
      .trim()
      .toLowerCase();
    const guarantorMemberId = String(
      raw["Guarantor Membership ID"] ?? "",
    ).trim();
    if (
      !typeName &&
      (amountRaw === "" || amountRaw == null) &&
      !modeRaw &&
      !guarantorMemberId
    ) {
      return;
    }

    if (!typeName) {
      errors.push({ row: rowNumber, message: "Loan Type is required" });
      return;
    }
    const matchedTypes = typesByName.get(typeName.toLowerCase()) ?? [];
    if (matchedTypes.length === 0) {
      errors.push({
        row: rowNumber,
        message: `"${typeName}" is not an active loan type`,
      });
      return;
    }
    if (matchedTypes.length > 1) {
      errors.push({
        row: rowNumber,
        message: `"${typeName}" matches more than one active loan type`,
      });
      return;
    }

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push({
        row: rowNumber,
        message: "Amount must be a number greater than zero",
      });
      return;
    }
    if (amount > matchedTypes[0].maxAmount) {
      errors.push({
        row: rowNumber,
        message: `Amount exceeds the "${matchedTypes[0].name}" maximum of ${matchedTypes[0].maxAmount}`,
      });
      return;
    }

    const loanMode: LoanMode | undefined =
      modeRaw === "times two" || modeRaw === "timestwo"
        ? "TimesTwo"
        : modeRaw === "within"
          ? "Within"
          : undefined;
    if (!loanMode) {
      errors.push({
        row: rowNumber,
        message: 'Loan Mode must be "TimesTwo" or "Within"',
      });
      return;
    }
    if (loanMode === "TimesTwo" && !guarantorMemberId) {
      errors.push({
        row: rowNumber,
        message: "Guarantor Membership ID is required for TimesTwo loans",
      });
      return;
    }

    rows.push({
      rowNumber,
      loanTypeId: matchedTypes[0].id,
      amount,
      loanMode,
      guarantorMemberId: guarantorMemberId || undefined,
    });
  });

  return { rows, errors };
}
