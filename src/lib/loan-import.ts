import type { ImportRowError, ParsedImportResult } from "@/lib/table-import";
import type { LoanMode } from "@/lib/loans-data";
import type { CoopLoanTypeSummary } from "@/types/coop-loans";
import {
  alternativeIdColumn,
  amountOf,
  cell,
  dateOf,
  downloadTemplate,
  findMember,
  readFilledRows,
  text,
  type MemberLookup,
} from "@/lib/import-template";

/**
 * Bringing in loans members already had before using the app (Loans → a loan type → Export /
 * Import). Each row is a loan that was already paid out; it's added as running (or finished, if
 * every month is paid) with its past payments — see LoanImportController.
 */
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

export function downloadLoanImportTemplate(
  loanType: CoopLoanTypeSummary,
  lookup: MemberLookup,
) {
  downloadTemplate({
    filename: `${loanType.name.replace(/[^\w-]+/g, "-").toLowerCase()}-loans-template.xlsx`,
    title: `Adding old "${loanType.name}" loans`,
    steps: [
      "Use this for loans members already had before they started using the app.",
      `Every row you add becomes a "${loanType.name}" loan, paid back over ${loanType.durationMonths} months.`,
      "No money is sent and nobody is asked to approve. The loan is simply recorded.",
      "Write one loan on each row, and delete the example row before you upload.",
      "Don't upload the same file twice, or the loans will be added twice.",
    ],
    columns: [
      {
        name: "Membership ID",
        required: "Yes, or the other ID",
        help: "The borrower's membership ID, e.g. MB-0001.",
        width: 16,
      },
      alternativeIdColumn(lookup),
      {
        name: "Amount",
        required: "Yes",
        help: "How much was borrowed. Numbers only, e.g. 50000.",
        width: 14,
      },
      {
        name: "Loan Mode",
        required: "No",
        help: 'Type "Times two" (borrowed against savings) or "Within" (borrowed from their own savings). Empty means Times two.',
        width: 14,
      },
      {
        name: "Guarantor Membership ID",
        required: "No",
        help: "The membership ID of the person who stood for the loan. Leave empty for Within loans.",
        width: 26,
      },
      {
        name: "Start Date",
        required: "No",
        help: "The day the loan was given, e.g. 2026-01-15. Empty means today. It can't be a future date.",
        width: 14,
      },
      {
        name: "Months Already Paid",
        required: "No",
        help: `How many monthly payments are already made, from 0 to ${loanType.durationMonths}. If all are paid, the loan is recorded as finished.`,
        width: 20,
      },
    ],
    rows: [["MB-0001", "", 50000, "Times two", "MB-0002", "2026-01-15", 2]],
  });
}

export async function parseLoanImportFile(
  file: File,
  loanType: CoopLoanTypeSummary,
  lookup: MemberLookup,
): Promise<ParsedImportResult<ImportedLoanRow>> {
  const raws = await readFilledRows(file);
  if (!raws)
    return { rows: [], errors: [{ row: 1, message: "The file is empty" }] };
  const rows: ImportedLoanRow[] = [];
  const errors: ImportRowError[] = [];

  raws.forEach((raw, index) => {
    const rowNumber = index + 2;
    const fail = (message: string) => errors.push({ row: rowNumber, message });
    const who = findMember(raw, lookup);
    const amount = amountOf(cell(raw, "Amount"));
    if (who.empty && amount == null) return;
    if (who.empty)
      return void fail(`Type the Membership ID or ${lookup.label}`);
    if (who.error) return void fail(who.error);
    if (amount == null || Number.isNaN(amount) || amount <= 0)
      return void fail("The Amount must be a number bigger than 0");

    const modeRaw = text(cell(raw, "Loan Mode"))
      .toLowerCase()
      .replace(/\s+/g, "");
    const loanMode: LoanMode | undefined =
      !modeRaw || modeRaw === "timestwo"
        ? "TimesTwo"
        : modeRaw === "within"
          ? "Within"
          : undefined;
    if (!loanMode)
      return void fail('Loan Mode must be "Times two" or "Within"');

    const startDate = dateOf(cell(raw, "Start Date"));
    if (startDate === null)
      return void fail("Write the Start Date like this: 2026-01-15");

    const paidRaw = cell(raw, "Months Already Paid", "Repayments Made");
    const repaymentsMade =
      paidRaw === "" || paidRaw == null ? 0 : Number(paidRaw);
    if (
      !Number.isInteger(repaymentsMade) ||
      repaymentsMade < 0 ||
      repaymentsMade > loanType.durationMonths
    ) {
      return void fail(
        `Months Already Paid must be a whole number from 0 to ${loanType.durationMonths}`,
      );
    }

    const guarantorTyped = text(
      cell(raw, "Guarantor Membership ID", "Guarantor"),
    );
    const guarantorMemberId = guarantorTyped
      ? (lookup.ids.get(guarantorTyped.toUpperCase()) ??
        lookup.byAlternativeId.get(guarantorTyped.toLowerCase()))
      : undefined;
    if (guarantorTyped && !guarantorMemberId) {
      return void fail(
        `There is no member "${guarantorTyped}" to be the guarantor`,
      );
    }

    rows.push({
      rowNumber,
      memberId: who.memberId!,
      loanTypeId: loanType.id,
      amount,
      loanMode,
      guarantorMemberId:
        loanMode === "TimesTwo" ? guarantorMemberId : undefined,
      startDate,
      repaymentsMade,
    });
  });

  return { rows, errors };
}
