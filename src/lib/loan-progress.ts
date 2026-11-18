/**
 * How far along a loan is, in money and in months, part payments included — the same arithmetic
 * as the backend's LoanBalances: every installment is the monthly repayment, the last one takes
 * whatever is left of the total, and ₦X paid against an installment counts as that share of a
 * month (half an installment = half a month).
 */
export interface LoanTerms {
  monthlyRepayment: number;
  totalRepayment: number;
  numberOfRepayments: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/** What has to have been paid in total once installment k is cleared. */
export function cumulativeAt(loan: LoanTerms, k: number): number {
  if (k <= 0) return 0;
  if (k >= loan.numberOfRepayments) return loan.totalRepayment;
  return Math.min(loan.monthlyRepayment * k, loan.totalRepayment);
}

/** Whole installments covered by `paid`; the last one only by the full total. */
export function installmentsCovered(loan: LoanTerms, paid: number): number {
  const n = loan.numberOfRepayments;
  if (n <= 0) return 0;
  if (paid >= loan.totalRepayment - 0.005) return n;
  if (loan.monthlyRepayment <= 0) return 0;
  return Math.max(
    0,
    Math.min(Math.floor((paid + 0.005) / loan.monthlyRepayment), n - 1),
  );
}

/** Months of the schedule `paid` amounts to, e.g. 1.5. */
export function monthsAt(loan: LoanTerms, paid: number): number {
  const n = loan.numberOfRepayments;
  const covered = installmentsCovered(loan, paid);
  if (covered >= n) return n;
  const start = cumulativeAt(loan, covered);
  const size = cumulativeAt(loan, covered + 1) - start;
  return size > 0 ? covered + (paid - start) / size : covered;
}

/** "1 month", "½ a month", "1½ months", "2.3 months". */
export function formatMonths(months: number): string {
  const value = Math.round(months * 100) / 100;
  const whole = Math.floor(value + 0.001);
  const part = value - whole;
  const halfish = Math.abs(part - 0.5) < 0.01;
  if (value <= 0) return "0 months";
  if (part < 0.01) return `${whole} month${whole === 1 ? "" : "s"}`;
  if (halfish) return whole === 0 ? "half a month" : `${whole}½ months`;
  return `${value.toFixed(value < 1 ? 2 : 1)} months`;
}

export interface LoanProgress {
  repaid: number;
  outstanding: number;
  monthsPaid: number;
  monthsLeft: number;
  monthsTotal: number;
  /** 0–1 */
  share: number;
}

export function loanProgress(
  loan: LoanTerms & { amountRepaid?: number | null; repaymentsMade?: number },
): LoanProgress {
  const repaid = Math.min(
    loan.amountRepaid ??
      cumulativeAt(loan, Math.max(0, loan.repaymentsMade ?? 0)),
    loan.totalRepayment,
  );
  const monthsPaid = monthsAt(loan, repaid);
  return {
    repaid: round2(repaid),
    outstanding: round2(Math.max(0, loan.totalRepayment - repaid)),
    monthsPaid,
    monthsLeft: Math.max(0, loan.numberOfRepayments - monthsPaid),
    monthsTotal: loan.numberOfRepayments,
    share: loan.totalRepayment > 0 ? repaid / loan.totalRepayment : 0,
  };
}

export interface PaymentCoverage {
  amount: number;
  monthsCovered: number;
  outstandingAfter: number;
  monthsLeftAfter: number;
  clearsLoan: boolean;
  tooMuch: boolean;
}

/** What paying `amount` now does to the loan. */
export function coverageOf(
  loan: LoanTerms,
  repaid: number,
  amount: number,
): PaymentCoverage {
  const outstanding = Math.max(0, loan.totalRepayment - repaid);
  const tooMuch = amount > outstanding + 0.005;
  const after = Math.min(repaid + Math.max(0, amount), loan.totalRepayment);
  return {
    amount,
    monthsCovered: monthsAt(loan, after) - monthsAt(loan, repaid),
    outstandingAfter: round2(Math.max(0, loan.totalRepayment - after)),
    monthsLeftAfter: Math.max(
      0,
      loan.numberOfRepayments - monthsAt(loan, after),
    ),
    clearsLoan: after >= loan.totalRepayment - 0.005,
    tooMuch,
  };
}

/** What takes the loan from `repaid` to the end of installment k (quick-pick amounts). */
export function amountToClear(
  loan: LoanTerms,
  repaid: number,
  k: number,
): number {
  return round2(
    Math.max(
      0,
      cumulativeAt(loan, Math.min(k, loan.numberOfRepayments)) - repaid,
    ),
  );
}
