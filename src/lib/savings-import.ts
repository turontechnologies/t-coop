import * as XLSX from "xlsx";
import type { CoopSavingsTypeSummary } from "@/types/coop-savings";
import { triggerDownload } from "@/lib/table-export";
import type { ImportRowError, ParsedImportResult } from "@/lib/table-import";

/**
 * Admin import of members' savings (Savings → Members Savings → a savings type → Import). Each row
 * is recorded for the member it names through the admin manual-deposit endpoint.
 */
const HEADERS = ["Membership ID", "Amount"];

export interface ImportedSavingsRow {
  rowNumber: number;
  memberId: string;
  savingsTypeId: string;
  amount: number;
}

export function downloadSavingsImportTemplate(
  savingsType: CoopSavingsTypeSummary,
) {
  const templateSheet = XLSX.utils.aoa_to_sheet([HEADERS, ["MB-0001", 5000]]);
  templateSheet["!cols"] = [{ wch: 18 }, { wch: 16 }];

  const referenceSheet = XLSX.utils.aoa_to_sheet([
    ["Field", "Notes"],
    ["Savings Type", `Every row is saved into "${savingsType.name}".`],
    [
      "Membership ID",
      "Required — the member's membership ID in this co-operative.",
    ],
    ["Amount", "Required — a positive amount in the co-operative's currency."],
    [
      "Processing",
      "Each row is recorded as a manual deposit for that member; configured savings charges are deducted as for any teller upload. Delete the example row before uploading, and don't upload the same file twice.",
    ],
  ]);
  referenceSheet["!cols"] = [{ wch: 20 }, { wch: 100 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, templateSheet, "Template");
  XLSX.utils.book_append_sheet(workbook, referenceSheet, "Field Reference");

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  triggerDownload(
    new Blob([buffer], { type: "application/octet-stream" }),
    `${savingsType.name.replace(/[^\w-]+/g, "-").toLowerCase()}-savings-import-template.xlsx`,
  );
}

export async function parseSavingsImportFile(
  file: File,
  savingsType: CoopSavingsTypeSummary,
): Promise<ParsedImportResult<ImportedSavingsRow>> {
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
  const rows: ImportedSavingsRow[] = [];
  const errors: ImportRowError[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;
    const memberId = String(raw["Membership ID"] ?? "").trim();
    const amountRaw = raw["Amount"];
    if (!memberId && (amountRaw === "" || amountRaw == null)) return;

    if (!memberId) {
      errors.push({ row: rowNumber, message: "Membership ID is required" });
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

    rows.push({ rowNumber, memberId, savingsTypeId: savingsType.id, amount });
  });

  return { rows, errors };
}
