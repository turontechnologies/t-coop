import * as XLSX from "xlsx";
import type { CoopSavingsTypeSummary } from "@/types/coop-savings";
import { triggerDownload } from "@/lib/table-export";
import type { ImportRowError, ParsedImportResult } from "@/lib/table-import";

const HEADERS = ["Savings Type", "Amount"];

export interface ImportedSavingsRow {
  rowNumber: number;
  savingsTypeId: string;
  amount: number;
}

export function downloadSavingsImportTemplate(
  savingsTypes: CoopSavingsTypeSummary[],
) {
  const templateSheet = XLSX.utils.aoa_to_sheet([HEADERS]);
  templateSheet["!cols"] = [{ wch: 28 }, { wch: 16 }];

  const referenceSheet = XLSX.utils.aoa_to_sheet([
    ["Field", "Notes"],
    [
      "Savings Type",
      `Required — use an active type name exactly as configured: ${savingsTypes.map((type) => type.name).join(", ") || "no active types available"}`,
    ],
    ["Amount", "Required — positive amount in the cooperative currency."],
    [
      "Processing",
      "Imported amounts are recorded using the admin manual-deposit flow; configured savings charges may be deducted. Each upload creates new records, so do not import the same file twice.",
    ],
  ]);
  referenceSheet["!cols"] = [{ wch: 20 }, { wch: 90 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, templateSheet, "Template");
  XLSX.utils.book_append_sheet(workbook, referenceSheet, "Field Reference");

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  triggerDownload(
    new Blob([buffer], { type: "application/octet-stream" }),
    "my-savings-import-template.xlsx",
  );
}

export async function parseSavingsImportFile(
  file: File,
  savingsTypes: CoopSavingsTypeSummary[],
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
  const typesByName = new Map<string, CoopSavingsTypeSummary[]>();

  for (const type of savingsTypes.filter((item) => item.status === "Active")) {
    const key = type.name.trim().toLowerCase();
    typesByName.set(key, [...(typesByName.get(key) ?? []), type]);
  }

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;
    const typeName = String(raw["Savings Type"] ?? "").trim();
    const amountRaw = raw["Amount"];
    if (!typeName && (amountRaw === "" || amountRaw == null)) return;

    if (!typeName) {
      errors.push({ row: rowNumber, message: "Savings Type is required" });
      return;
    }
    const matchedTypes = typesByName.get(typeName.toLowerCase()) ?? [];
    if (matchedTypes.length === 0) {
      errors.push({
        row: rowNumber,
        message: `"${typeName}" is not an active savings type`,
      });
      return;
    }
    if (matchedTypes.length > 1) {
      errors.push({
        row: rowNumber,
        message: `"${typeName}" matches more than one active savings type`,
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

    const savingsType = matchedTypes[0];
    if (amount < savingsType.min || amount > savingsType.max) {
      errors.push({
        row: rowNumber,
        message: `Amount must be between ${savingsType.min} and ${savingsType.max} for "${savingsType.name}"`,
      });
      return;
    }

    rows.push({ rowNumber, savingsTypeId: savingsType.id, amount });
  });

  return { rows, errors };
}
