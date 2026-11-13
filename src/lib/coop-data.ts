export type CoopStatus = "Active" | "Disabled";
export type CoopMemberRole = "Admin" | "Member";
export type CoopMemberStatus = "Active" | "Inactive";

export interface CoopMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: CoopMemberRole;
  status: CoopMemberStatus;
  guarantor: string;
  country: string;
  state: string;
  city: string;
  /** Bank payout details — required for real Paystack Transfers (loan disbursement, savings withdrawal). */
  bankCode: string;
  accountNumber: string;
  accountName: string;
  /** The rest are optional — carried for "View Full Profile" (CoopMemberHeaderCard); views that
   * build a `CoopMember` by hand (e.g. from an imported row) don't set these. */
  otherName?: string;
  gender?: string;
  phone?: string;
  nin?: string;
  homeAddress?: string;
  facebook?: string;
  twitter?: string;
  avatarUrl?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinEmail?: string;
  nextOfKinRelationship?: string;
  nextOfKinAuthorityLevel?: string;
  /** Optional typed-in second ID (e.g. a staff number), unique within the co-op. */
  alternativeId?: string;
}

export type CoopSavingsStatus = "Success" | "Pending" | "Failed";

export interface CoopSavingsRecord {
  id: string;
  memberId: string;
  memberName: string;
  savingsType: string;
  amount: number;
  balanceAfter: number;
  method: "Paystack" | "Flutterwave" | "Manual Upload";
  transactionId: string;
  date: string;
  status: CoopSavingsStatus;
  /** Base64 data URL of an uploaded teller/receipt image, when recorded that way. */
  receiptUrl?: string;
}

export type SavingsRequestType = "Deposit" | "Withdrawal";
export type SavingsRequestStatus = "Pending" | "Approved" | "Declined";

/** Reserved `savingsType` value meaning "spread across all of the member's savings types" rather than one specific type. */
export const TOTAL_SAVINGS_WITHDRAWAL = "Total Savings";

export interface SavingsRequest {
  id: string;
  memberId: string;
  memberName: string;
  type: SavingsRequestType;
  savingsType: string;
  amount: number;
  note?: string;
  status: SavingsRequestStatus;
  requestedAt: string;
  resolvedAt?: string;
  /**
   * Withdrawal-only: the combined co-op + platform fee percentage, locked
   * in at request time (a later settings change shouldn't retroactively
   * change a pending request's terms), and the resulting fee/net amounts.
   */
  feePercent?: number;
  feeAmount?: number;
  netAmount?: number;
}

/**
 * A loan moves: guarantors accept → the loan committee approves in the admin's order (each
 * suggests an amount and period) → the borrower accepts the approved terms and picks the payout
 * account → it's paid out (Active). It can be Rejected along the way, or Declined by the borrower.
 */
export type CoopLoanStatus =
  | "Awaiting Guarantor"
  | "Awaiting Approval"
  | "Awaiting Acceptance"
  | "Pending Disbursement"
  | "Active"
  | "Completed"
  | "Rejected"
  | "Declined";

/** Every status a loan request can be in before it's paid out, rejected or declined. */
export const PENDING_LOAN_STATUSES: CoopLoanStatus[] = [
  "Awaiting Guarantor",
  "Awaiting Approval",
  "Awaiting Acceptance",
  "Pending Disbursement",
];

/** Waiting on the loan committee (past the guarantors). */
export function isAwaitingOfficer(status: CoopLoanStatus): boolean {
  return status === "Awaiting Approval";
}

/** How a loan's status reads: "Awaiting Treasurer" while it's with the committee. */
export function loanStatusLabel(
  record: Pick<CoopLoanRecord, "status" | "approvalStepTitle">,
): string {
  if (record.status === "Awaiting Approval")
    return record.approvalStepTitle
      ? `Awaiting ${record.approvalStepTitle}`
      : "Awaiting approval";
  if (record.status === "Awaiting Acceptance") return "Awaiting your answer";
  return record.status;
}

/** The same, for someone other than the borrower. */
export function loanStatusLabelForStaff(
  record: Pick<CoopLoanRecord, "status" | "approvalStepTitle">,
): string {
  if (record.status === "Awaiting Acceptance") return "Awaiting borrower";
  return loanStatusLabel(record);
}

export interface CoopLoanRecord {
  id: string;
  memberId: string;
  memberName: string;
  loanType: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  numberOfRepayments: number;
  monthlyRepayment: number;
  totalRepayment: number;
  /** Always set by the backend (hard FK) — optional only so hand-built records type-check. */
  guarantorId?: string | null;
  /** Null for a "Within" loan, which has no guarantor. */
  guarantorName: string | null;
  /** "TimesTwo" (up to twice your savings, two or more guarantors) or "Within" (from your own savings). */
  loanMode?: "TimesTwo" | "Within";
  date: string;
  status: CoopLoanStatus;
  repaymentsMade: number;
  /** Set once the guarantor accepts — a payslip/proof upload, base64 data URL. */
  guarantorDocumentUrl?: string;
  guarantorAcceptedAt?: string;
  /** Set when an officer rejects — shown wherever this record is viewed. */
  rejectionReason?: string;
  /** Set once the Secretary's approval pays the loan out — principal minus loan charges. */
  disbursedAmount?: number | null;
  disbursementReference?: string | null;
  disbursedAt?: string | null;
  /** Every guarantor and where each stands — a Times two loan has two or more. */
  guarantors?: LoanGuarantorInfo[];
  /** What the member asked for; `amount`/`durationMonths` are the terms the committee settled on. */
  requestedAmount?: number;
  requestedMonths?: number;
  /** 1-based committee position while "Awaiting Approval", and who that is (e.g. "Treasurer"). */
  approvalStep?: number | null;
  approvalStepTitle?: string | null;
  offerRespondedAt?: string | null;
  payoutAccountType?: "Registered" | "Other" | null;
  payoutBankName?: string | null;
  payoutAccountNumber?: string | null;
  payoutAccountName?: string | null;
  /** False when the bank couldn't be asked to confirm the account name. */
  payoutNameVerified?: boolean | null;
  disbursementMethod?: "Online" | "Cheque" | "Import" | null;
  chequeUrl?: string | null;
  chequeNumber?: string | null;
  disbursedByName?: string | null;
  /** Repaid so far and still owed (principal + interest), from the backend — the same figures
   * the dashboard uses. */
  amountRepaid?: number;
  outstandingBalance?: number;
}

/** What's still owed on these loans — "Total Loans" / "My Loans" everywhere. */
export function totalOwed(records: CoopLoanRecord[]): number {
  return (
    Math.round(
      records.reduce(
        (sum, record) => sum + (record.outstandingBalance ?? 0),
        0,
      ) * 100,
    ) / 100
  );
}

/** Savings that actually went through — pending and failed payments don't count. */
export function totalSaved(records: CoopSavingsRecord[]): number {
  return (
    Math.round(
      records
        .filter((record) => record.status === "Success")
        .reduce((sum, record) => sum + record.amount, 0) * 100,
    ) / 100
  );
}

export type LoanGuarantorStatus = "Pending" | "Accepted" | "Declined";

export interface LoanGuarantorInfo {
  memberId: string;
  name: string;
  status: LoanGuarantorStatus;
  documentUrl: string | null;
  respondedAt: string | null;
}

/** A loan's guarantors — falling back to the single summary fields for an older record. */
export function loanGuarantorsOf(record: CoopLoanRecord): LoanGuarantorInfo[] {
  if (record.guarantors && record.guarantors.length > 0)
    return record.guarantors;
  if (!record.guarantorId || !record.guarantorName) return [];
  return [
    {
      memberId: record.guarantorId,
      name: record.guarantorName,
      status: record.guarantorAcceptedAt
        ? "Accepted"
        : record.status === "Awaiting Guarantor"
          ? "Pending"
          : "Accepted",
      documentUrl: record.guarantorDocumentUrl ?? null,
      respondedAt: record.guarantorAcceptedAt ?? null,
    },
  ];
}

export function coopMemberFullName(member: CoopMember): string {
  return `${member.firstName} ${member.lastName}`;
}

export function coopLoanStatusBadgeVariant(
  status: CoopLoanStatus,
): "secondary" | "outline" | "destructive" {
  if (status === "Active" || status === "Completed") return "secondary";
  if (status === "Declined") return "outline";
  if (PENDING_LOAN_STATUSES.includes(status)) return "outline";
  return "destructive";
}
