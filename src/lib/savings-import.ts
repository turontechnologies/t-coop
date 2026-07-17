import * as XLSX from "xlsx";
import { SAVINGS_TYPES, type SavingsStatus } from "@/lib/savings-data";
import { triggerDownload } from "@/lib/table-export";

const TEMPLATE_HEADERS = [
  "Savings Type",
  "Amount",
  "Date (YYYY-MM-DD)",
  "Status",
];
const VALID_STATUSES: SavingsStatus[] = ["Success", "Pending", "Failed"];

export interface ImportedSavingsRow {
  savingsType: string;
  amount: number;
  date: string;
  status: SavingsStatus;
}

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ParsedImportResult {
  rows: ImportedSavingsRow[];
  errors: ImportRowError[];
}

export function downloadSavingsImportTemplate() {
  const templateSheet = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    ["Basic Savings", 5000, "2026-07-01", "Success"],
  ]);
  templateSheet["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 20 }, { wch: 12 }];

  const referenceSheet = XLSX.utils.aoa_to_sheet([
    ["Savings Type", "Minimum", "Maximum"],
    ...SAVINGS_TYPES.map((type) => [type.name, type.min, type.max]),
    [],
    ['Status is optional and defaults to "Success" if left blank.'],
    [`Valid Status values: ${VALID_STATUSES.join(", ")}`],
  ]);
  referenceSheet["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 12 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, templateSheet, "Template");
  XLSX.utils.book_append_sheet(workbook, referenceSheet, "Valid Savings Types");

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  triggerDownload(
    new Blob([buffer], { type: "application/octet-stream" }),
    "savings-import-template.xlsx",
  );
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIsoDate(value);
  }
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return toIsoDate(parsed);
  }
  return null;
}

export async function parseSavingsImportFile(
  file: File,
): Promise<ParsedImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === "template") ??
    workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const rows: ImportedSavingsRow[] = [];
  const errors: ImportRowError[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2; // header occupies row 1
    const typeRaw = String(raw["Savings Type"] ?? "").trim();
    if (!typeRaw) return; // skip fully blank rows

    const type = SAVINGS_TYPES.find(
      (candidate) => candidate.name.toLowerCase() === typeRaw.toLowerCase(),
    );
    if (!type) {
      errors.push({
        row: rowNumber,
        message: `Unknown Savings Type "${typeRaw}"`,
      });
      return;
    }

    const amount = Number(raw["Amount"]);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push({
        row: rowNumber,
        message: "Amount must be a positive number",
      });
      return;
    }
    if (amount < type.min || amount > type.max) {
      errors.push({
        row: rowNumber,
        message: `Amount must be between ${type.min.toLocaleString()} and ${type.max.toLocaleString()} for ${type.name}`,
      });
      return;
    }

    const date = normalizeDate(raw["Date (YYYY-MM-DD)"] ?? raw["Date"]);
    if (!date) {
      errors.push({ row: rowNumber, message: "Invalid or missing Date" });
      return;
    }

    const statusRaw = String(raw["Status"] ?? "").trim();
    const status = (
      VALID_STATUSES.includes(statusRaw as SavingsStatus)
        ? statusRaw
        : "Success"
    ) as SavingsStatus;

    rows.push({ savingsType: type.name, amount, date, status });
  });

  return { rows, errors };
}
