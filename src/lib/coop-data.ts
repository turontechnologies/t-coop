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

/** A loan moves Guarantor -> Vice President -> Treasurer -> Secretary; the Secretary's approval
 * pays it out and makes it Active. */
export type CoopLoanStatus =
  | "Awaiting Guarantor"
  | "Awaiting Vice President"
  | "Awaiting Treasurer"
  | "Awaiting Secretary"
  | "Active"
  | "Completed"
  | "Rejected";

/** Every status a loan request can be in before it's paid out or rejected. */
export const PENDING_LOAN_STATUSES: CoopLoanStatus[] = [
  "Awaiting Guarantor",
  "Awaiting Vice President",
  "Awaiting Treasurer",
  "Awaiting Secretary",
];

/** Waiting on one of the officers (past the guarantor). */
export function isAwaitingOfficer(status: CoopLoanStatus): boolean {
  return (
    status === "Awaiting Vice President" ||
    status === "Awaiting Treasurer" ||
    status === "Awaiting Secretary"
  );
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
  guarantorId?: string;
  guarantorName: string;
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
}

export function coopMemberFullName(member: CoopMember): string {
  return `${member.firstName} ${member.lastName}`;
}

export function coopLoanStatusBadgeVariant(
  status: CoopLoanStatus,
): "secondary" | "outline" | "destructive" {
  if (status === "Active" || status === "Completed") return "secondary";
  if (PENDING_LOAN_STATUSES.includes(status)) return "outline";
  return "destructive";
}
