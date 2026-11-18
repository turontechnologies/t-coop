import type { CoopSavingsTypeSummary } from "@/types/coop-savings";
import type { ImportRowError, ParsedImportResult } from "@/lib/table-import";
import {
  alternativeIdColumn,
  amountOf,
  cell,
  downloadTemplate,
  findMember,
  readFilledRows,
  type MemberLookup,
} from "@/lib/import-template";

/**
 * Savings for one savings type (Savings → a savings type → Export / Import). Each row is saved
 * for the member it names, like a teller upload.
 */
export interface ImportedSavingsRow {
  rowNumber: number;
  memberId: string;
  savingsTypeId: string;
  amount: number;
}

export function downloadSavingsImportTemplate(
  savingsType: CoopSavingsTypeSummary,
  lookup: MemberLookup,
) {
  downloadTemplate({
    filename: `${savingsType.name.replace(/[^\w-]+/g, "-").toLowerCase()}-savings-template.xlsx`,
    title: `Uploading "${savingsType.name}" savings`,
    steps: [
      `Every row you add is saved into "${savingsType.name}".`,
      "Write one member on each row.",
      "Delete the example row before you upload.",
      "Savings charges are taken from each amount, the same as a teller upload.",
      "Don't upload the same file twice, or the savings will be added twice.",
    ],
    columns: [
      {
        name: "Membership ID",
        required: "Yes, or the other ID",
        help: "The member's membership ID, e.g. MB-0001.",
        width: 16,
      },
      alternativeIdColumn(lookup),
      {
        name: "Amount",
        required: "Yes",
        help: "How much the member saved. Numbers only, e.g. 5000.",
        width: 14,
      },
    ],
    rows: [["MB-0001", "", 5000]],
  });
}

export async function parseSavingsImportFile(
  file: File,
  savingsType: CoopSavingsTypeSummary,
  lookup: MemberLookup,
): Promise<ParsedImportResult<ImportedSavingsRow>> {
  const raws = await readFilledRows(file);
  if (!raws)
    return { rows: [], errors: [{ row: 1, message: "The file is empty" }] };
  const rows: ImportedSavingsRow[] = [];
  const errors: ImportRowError[] = [];

  raws.forEach((raw, index) => {
    const rowNumber = index + 2;
    const who = findMember(raw, lookup);
    const amount = amountOf(cell(raw, "Amount"));
    if (who.empty && amount == null) return;
    if (who.empty)
      return void errors.push({
        row: rowNumber,
        message: `Type the Membership ID or ${lookup.label}`,
      });
    if (who.error)
      return void errors.push({ row: rowNumber, message: who.error });
    if (amount == null || Number.isNaN(amount) || amount <= 0)
      return void errors.push({
        row: rowNumber,
        message: "The Amount must be a number bigger than 0",
      });
    rows.push({
      rowNumber,
      memberId: who.memberId!,
      savingsTypeId: savingsType.id,
      amount,
    });
  });

  return { rows, errors };
}
