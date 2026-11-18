import { apiClient } from "@/lib/axios";
import type { CoopPaymentGateway } from "@/lib/coop-checkout";
import type { CoopLoanRecord } from "@/lib/coop-data";

export interface NextInstallment {
  installmentNumber: number;
  /** For `count` installments (1 unless more were asked for). */
  amount: number;
  count: number;
  remainingInstallments: number;
  installmentAmount: number;
  /** A bank-transfer repayment is waiting for the co-op to confirm. */
  pendingClaim: boolean;
  monthlyRepayment: number;
  amountRepaid: number;
  outstanding: number;
  totalRepayment: number;
  numberOfRepayments: number;
}

/** A repayment the borrower made by bank transfer, waiting for (or past) the co-op's check. */
export interface TransferClaim {
  id: string;
  loanId: string;
  memberId: string;
  memberName: string;
  loanTypeName: string;
  installments: number;
  amount: number;
  receiptUrl: string;
  transferReference: string | null;
  paidOn: string;
  note: string | null;
  status: "Pending" | "Confirmed" | "Rejected";
  submittedAt: string;
  decidedAt: string | null;
  decidedByName: string | null;
  rejectionReason: string | null;
}

export interface TransferClaimPayload {
  /** Any amount up to what's still owed. */
  amount: number;
  receiptUrl: string;
  transferReference?: string;
  paidOn?: string;
  note?: string;
}

export interface BulkRepaymentRow {
  row: number;
  memberId: string;
  loanType?: string;
  loanId?: string;
  amount: number;
  date?: string;
}

export interface BulkRepaymentLine {
  row: number;
  memberId: string;
  memberName: string;
  loanType: string;
  loanId: string;
  amount: number;
  /** How much of the schedule the row pays, e.g. 1.5. */
  monthsCovered: number;
  outstandingAfter: number;
  date: string;
  completesLoan: boolean;
}

export interface BulkResult<TLine> {
  dryRun: boolean;
  imported: number;
  totalAmount: number;
  lines: TLine[];
  errors: { row: number; message: string }[];
}

export interface InitializeRepaymentResult {
  reference: string;
  installmentNumber: number;
  amount: number;
  gateway: CoopPaymentGateway;
  publicKey: string;
}

export interface LoanRepaymentRecord {
  id: string;
  loanId: string;
  installmentNumber: number;
  amount: number;
  method:
    CoopPaymentGateway | "Manual Upload" | "Bank Transfer" | "Bulk Upload";
  transactionId: string;
  date: string;
  status: "Success";
  /** The receipt uploaded when the repayment was recorded by hand. */
  receiptUrl?: string | null;
  recordedByName?: string | null;
  note?: string | null;
}

export interface RepaymentResult {
  repayment: LoanRepaymentRecord;
  loan: CoopLoanRecord;
}

/**
 * A borrower's own loan-installment repayment (Paystack initialize/confirm, mirroring
 * `savings-self.service.ts`'s deposit pattern) and an admin's manual entry after receiving
 * payment offline — real backend, `LoanRepaymentController`. Every repayment pays exactly one
 * fixed installment; the amount always comes from the server, never client-supplied.
 */
export const loanRepaymentService = {
  async getNextInstallment(
    coopId: string,
    loanId: string,
    count = 1,
  ): Promise<NextInstallment> {
    const { data } = await apiClient.get<NextInstallment>(
      `/cooperatives/${coopId}/loans/${loanId}/repayments/next`,
      { params: count > 1 ? { count } : undefined },
    );
    return data;
  },

  async submitTransferClaim(
    coopId: string,
    loanId: string,
    payload: TransferClaimPayload,
  ): Promise<TransferClaim> {
    const { data } = await apiClient.post<TransferClaim>(
      `/cooperatives/${coopId}/loans/${loanId}/repayments/transfer-claims`,
      payload,
    );
    return data;
  },

  async loanTransferClaims(
    coopId: string,
    loanId: string,
  ): Promise<TransferClaim[]> {
    const { data } = await apiClient.get<TransferClaim[]>(
      `/cooperatives/${coopId}/loans/${loanId}/repayments/transfer-claims`,
    );
    return data;
  },

  async coopTransferClaims(
    coopId: string,
    status?: TransferClaim["status"],
  ): Promise<TransferClaim[]> {
    const { data } = await apiClient.get<TransferClaim[]>(
      `/cooperatives/${coopId}/loans/repayment-claims`,
      { params: status ? { status } : undefined },
    );
    return data;
  },

  async decideTransferClaim(
    coopId: string,
    claimId: string,
    decision: "Confirmed" | "Rejected",
    reason?: string,
  ): Promise<TransferClaim> {
    const { data } = await apiClient.patch<TransferClaim>(
      `/cooperatives/${coopId}/loans/repayment-claims/${claimId}`,
      { decision, reason: reason?.trim() || undefined },
    );
    return data;
  },

  /** Every row is checked first; with `dryRun` nothing is saved (the preview). */
  async bulk(
    coopId: string,
    rows: BulkRepaymentRow[],
    dryRun: boolean,
  ): Promise<BulkResult<BulkRepaymentLine>> {
    const { data } = await apiClient.post<BulkResult<BulkRepaymentLine>>(
      `/cooperatives/${coopId}/loans/repayments/bulk`,
      { rows, dryRun },
      { validateStatus: (status) => status === 200 || status === 422 },
    );
    return data;
  },

  /** `amount`: any amount up to what's owed; left out, it finishes the current installment. */
  async initialize(
    coopId: string,
    loanId: string,
    amount?: number,
  ): Promise<InitializeRepaymentResult> {
    const { data } = await apiClient.post<InitializeRepaymentResult>(
      `/cooperatives/${coopId}/loans/${loanId}/repayments/initialize`,
      amount ? { amount } : undefined,
    );
    return data;
  },

  async confirm(
    coopId: string,
    loanId: string,
    reference: string,
  ): Promise<RepaymentResult> {
    const { data } = await apiClient.post<RepaymentResult>(
      `/cooperatives/${coopId}/loans/${loanId}/repayments/confirm`,
      { reference },
    );
    return data;
  },

  async manual(
    coopId: string,
    loanId: string,
    proof: { receiptUrl: string; note?: string; amount?: number },
  ): Promise<RepaymentResult> {
    const { data } = await apiClient.post<RepaymentResult>(
      `/cooperatives/${coopId}/loans/${loanId}/repayments/manual`,
      proof,
    );
    return data;
  },

  async list(coopId: string, loanId: string): Promise<LoanRepaymentRecord[]> {
    const { data } = await apiClient.get<LoanRepaymentRecord[]>(
      `/cooperatives/${coopId}/loans/${loanId}/repayments`,
    );
    return data;
  },
};
