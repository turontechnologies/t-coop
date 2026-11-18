import type { ImportRowError } from "@/lib/table-import";
import type { CoopLoanRecord, CoopMember } from "@/lib/coop-data";
import {
  alternativeIdColumn,
  amountOf,
  cell,
  dateOf,
  downloadTemplate,
  findMember,
  readFilledRows,
  text,
  today,
  type MemberLookup,
} from "@/lib/import-template";
import type { BulkSavingsRow } from "@/services/savings-self.service";
import type { BulkRepaymentRow } from "@/services/loan-repayment.service";

/**
 * Bulk uploads of savings and loan repayments. The templates come filled in — every active
 * member (savings) or every active loan (repayments) — so you only type the amounts. Rows with
 * no amount are left out. Excel (.xlsx) and CSV files both work.
 */

export interface ParsedBulkFile<TRow> {
  rows: TRow[];
  errors: ImportRowError[];
  /** Rows left out because they had no amount. */
  skipped: number;
}

/* ───────────────────────────── Savings ───────────────────────────── */

export function downloadBulkSavingsTemplate(
  members: CoopMember[],
  savingsTypes: string[],
  lookup: MemberLookup,
) {
  const defaultType = savingsTypes.length === 1 ? savingsTypes[0] : "";
  const active = members
    .filter((member) => member.status === "Active")
    .sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
      ),
    );
  downloadTemplate({
    filename: `savings-upload-${today()}.xlsx`,
    title: "Uploading members' savings",
    steps: [
      "Every active member is already listed for you.",
      "Type how much each person saved in the Amount column.",
      "Leave the Amount empty for anyone who didn't save. They will be left out.",
      "Save the file, then upload it. You will see every row before anything is saved.",
      "If any row has a problem, nothing is saved. Fix it and upload again.",
    ],
    columns: [
      {
        name: "Membership ID",
        required: "Yes",
        help: "Already filled in. Don't change it.",
        width: 16,
      },
      alternativeIdColumn(lookup),
      {
        name: "Member Name",
        required: "No",
        help: "Just to help you see who is who. It is not read.",
        width: 28,
      },
      {
        name: "Savings Type",
        required: savingsTypes.length === 1 ? "No" : "Yes",
        help:
          savingsTypes.length === 1
            ? `Already filled in with "${savingsTypes[0]}".`
            : `Type one of these exactly: ${savingsTypes.join(", ") || "(no savings types yet)"}.`,
        width: 22,
      },
      {
        name: "Amount",
        required: "Yes",
        help: "How much the member saved. Numbers only, e.g. 5000.",
        width: 14,
      },
      {
        name: "Date",
        required: "No",
        help: `The day the money was saved, e.g. ${today()}. Leave empty to use today.`,
        width: 14,
      },
    ],
    rows: active.map((member) => [
      member.id,
      lookup.alternativeIdOf.get(member.id) ?? "",
      `${member.firstName} ${member.lastName}`.trim(),
      defaultType,
      "",
      "",
    ]),
  });
}

/* ───────────────────────────── Loan repayments ───────────────────────────── */

export function downloadBulkRepaymentTemplate(
  loans: CoopLoanRecord[],
  lookup: MemberLookup,
) {
  const active = loans
    .filter((loan) => loan.status === "Active")
    .sort((a, b) => a.memberName.localeCompare(b.memberName));
  downloadTemplate({
    filename: `loan-repayments-upload-${today()}.xlsx`,
    title: "Uploading loan repayments",
    steps: [
      "Every loan that is still being repaid is already listed for you.",
      "Type how much each person paid in the Amount Paid column.",
      "Any amount is fine: half a month, one month, two months, or the whole loan.",
      "You can't pay more than what is Left to Pay.",
      "Leave Amount Paid empty for anyone who didn't pay. They will be left out.",
      "Save the file, then upload it. You will see every row before anything is saved.",
      "If any row has a problem, nothing is saved. Fix it and upload again.",
    ],
    columns: [
      {
        name: "Membership ID",
        required: "Yes",
        help: "Already filled in. Don't change it.",
        width: 16,
      },
      alternativeIdColumn(lookup),
      {
        name: "Member Name",
        required: "No",
        help: "Just to help you see who is who. It is not read.",
        width: 26,
      },
      {
        name: "Loan Type",
        required: "No",
        help: "Already filled in. Don't change it.",
        width: 18,
      },
      {
        name: "Loan ID",
        required: "Yes",
        help: "Already filled in. Don't change it. It makes sure the right loan is paid.",
        width: 38,
      },
      {
        name: "Monthly Payment",
        required: "No",
        help: "What the member pays each month. Just for your information.",
        width: 16,
      },
      {
        name: "Left to Pay",
        required: "No",
        help: "What the member still owes. Just for your information.",
        width: 14,
      },
      {
        name: "Amount Paid",
        required: "Yes",
        help: "How much the member paid this time. Numbers only, e.g. 4788.",
        width: 14,
      },
      {
        name: "Date",
        required: "No",
        help: `The day they paid, e.g. ${today()}. Leave empty to use today.`,
        width: 14,
      },
    ],
    rows: active.map((loan) => [
      loan.memberId,
      lookup.alternativeIdOf.get(loan.memberId) ?? "",
      loan.memberName,
      loan.loanType,
      loan.id,
      loan.monthlyRepayment,
      loan.outstandingBalance ?? loan.totalRepayment,
      "",
      "",
    ]),
  });
}

/* ───────────────────────────── Reading a file ───────────────────────────── */

export async function parseBulkSavingsFile(
  file: File,
  lookup: MemberLookup,
): Promise<ParsedBulkFile<BulkSavingsRow>> {
  const raws = await readFilledRows(file);
  if (!raws)
    return {
      rows: [],
      errors: [{ row: 1, message: "The file is empty" }],
      skipped: 0,
    };
  const rows: BulkSavingsRow[] = [];
  const errors: ImportRowError[] = [];
  let skipped = 0;
  raws.forEach((raw, index) => {
    const row = index + 2;
    const who = findMember(raw, lookup);
    const amount = amountOf(cell(raw, "Amount"));
    if (amount == null) {
      if (!who.empty) skipped += 1;
      return;
    }
    if (who.empty)
      return errors.push({
        row,
        message: `Type the Membership ID or ${lookup.label}`,
      });
    if (who.error) return errors.push({ row, message: who.error });
    if (Number.isNaN(amount) || amount <= 0)
      return errors.push({
        row,
        message: "The Amount must be a number bigger than 0",
      });
    const date = dateOf(cell(raw, "Date"));
    if (date === null)
      return errors.push({
        row,
        message: "Write the date like this: 2026-11-18",
      });
    rows.push({
      row,
      memberId: who.memberId!,
      savingsType: text(cell(raw, "Savings Type", "Type")) || undefined,
      amount,
      date,
    });
  });
  return { rows, errors, skipped };
}

export async function parseBulkRepaymentFile(
  file: File,
  lookup: MemberLookup,
): Promise<ParsedBulkFile<BulkRepaymentRow>> {
  const raws = await readFilledRows(file);
  if (!raws)
    return {
      rows: [],
      errors: [{ row: 1, message: "The file is empty" }],
      skipped: 0,
    };
  const rows: BulkRepaymentRow[] = [];
  const errors: ImportRowError[] = [];
  let skipped = 0;
  raws.forEach((raw, index) => {
    const row = index + 2;
    const who = findMember(raw, lookup);
    const amount = amountOf(cell(raw, "Amount Paid", "Amount"));
    if (amount == null) {
      if (!who.empty) skipped += 1;
      return;
    }
    if (who.empty)
      return errors.push({
        row,
        message: `Type the Membership ID or ${lookup.label}`,
      });
    if (who.error) return errors.push({ row, message: who.error });
    if (Number.isNaN(amount) || amount <= 0)
      return errors.push({
        row,
        message: "The Amount Paid must be a number bigger than 0",
      });
    const date = dateOf(cell(raw, "Date", "Date Paid"));
    if (date === null)
      return errors.push({
        row,
        message: "Write the date like this: 2026-11-18",
      });
    rows.push({
      row,
      memberId: who.memberId!,
      loanType: text(cell(raw, "Loan Type")) || undefined,
      loanId: text(cell(raw, "Loan ID")) || undefined,
      amount,
      date,
    });
  });
  return { rows, errors, skipped };
}
