import type { InterestType } from "@/types/coop-loans";

/** "TimesTwo": borrow up to half your savings (your savings must be at least twice the loan) —
 * needs a guarantor. "Within": borrow from your own savings, up to your savings — no guarantor;
 * the payout comes out of your savings and repaid principal goes back in. Mirrors the backend's
 * LoanEligibility. */
export type LoanMode = "TimesTwo" | "Within";

export const LOAN_MODES: {
  value: LoanMode;
  label: string;
  description: string;
}[] = [
  {
    value: "TimesTwo",
    label: "Times two",
    description:
      "Borrow up to half of your savings — your savings must be at least twice the loan. Needs a guarantor.",
  },
  {
    value: "Within",
    label: "Within",
    description:
      "Borrow from your own savings, up to what you've saved. No guarantor. The loan comes out of your savings and your repayments go back into them.",
  },
];

export function loanModeLabel(
  mode: LoanMode | string | null | undefined,
): string {
  return mode === "Within" ? "Within" : "Times two";
}

export interface LoanTypeDef {
  name: string;
  interestType: InterestType;
  /** A percentage for "Percentage", a flat amount for "Fixed", ignored for "NoInterest". */
  interestRate: number;
  maxAmount: number;
  durationMonths: number;
}

/** The most a member can borrow on this type in this mode — capped by the type's maximum. */
export function computeEligibleAmount(
  totalSavings: number,
  loanType: LoanTypeDef,
  mode: LoanMode,
): number {
  const savings = Math.max(totalSavings, 0);
  const byMode = mode === "Within" ? savings : savings / 2;
  return Math.floor(Math.min(byMode, loanType.maxAmount) * 100) / 100;
}

/** Total interest for the whole loan, by the loan type's interest type. */
export function computeInterest(loanType: LoanTypeDef, amount: number): number {
  if (loanType.interestType === "NoInterest") return 0;
  if (loanType.interestType === "Fixed") return loanType.interestRate;
  return Math.round(amount * loanType.interestRate) / 100;
}

/** "5% interest", "₦2,000 interest", or "No interest" — for a loan type's summary line. */
export function describeInterest(
  loanType: LoanTypeDef,
  formatAmount: (value: number) => string,
): string {
  if (loanType.interestType === "NoInterest") return "No interest";
  if (loanType.interestType === "Fixed")
    return `${formatAmount(loanType.interestRate)} interest`;
  return `${loanType.interestRate}% interest`;
}

export interface LoanTerms {
  totalInterest: number;
  durationMonths: number;
  numberOfRepayments: number;
  monthlyRepayment: number;
  totalRepayment: number;
}

export function computeLoanTerms(
  loanType: LoanTypeDef,
  amount: number,
): LoanTerms {
  const totalInterest = computeInterest(loanType, amount);
  const totalRepayment = amount + totalInterest;
  const numberOfRepayments = loanType.durationMonths;
  return {
    totalInterest,
    durationMonths: loanType.durationMonths,
    numberOfRepayments,
    monthlyRepayment: totalRepayment / numberOfRepayments,
    totalRepayment,
  };
}

export type RepaymentStatus = "Paid" | "Upcoming" | "Overdue" | "Pending";

export interface RepaymentScheduleItem {
  installment: number;
  amount: number;
  interest: number;
  totalAmount: number;
  dueDate: string;
  status: RepaymentStatus;
}

/** Shared shape between the personal LoanRecord and the coop-scoped CoopLoanRecord. */
interface RepaymentSourceLoan {
  amount: number;
  numberOfRepayments: number;
  totalRepayment: number;
  date: string;
  status: string;
  repaymentsMade: number;
}

export function generateRepaymentSchedule(
  loan: RepaymentSourceLoan,
): RepaymentScheduleItem[] {
  const principalPerInstallment = loan.amount / loan.numberOfRepayments;
  const interestPerInstallment =
    (loan.totalRepayment - loan.amount) / loan.numberOfRepayments;
  const startDate = new Date(loan.date);
  const now = Date.now();

  return Array.from({ length: loan.numberOfRepayments }, (_, index) => {
    const installment = index + 1;
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + installment);

    let status: RepaymentStatus;
    if (loan.status.startsWith("Awaiting") || loan.status === "Rejected") {
      status = "Pending";
    } else if (installment <= loan.repaymentsMade) {
      status = "Paid";
    } else {
      status = dueDate.getTime() < now ? "Overdue" : "Upcoming";
    }

    return {
      installment,
      amount: principalPerInstallment,
      interest: interestPerInstallment,
      totalAmount: principalPerInstallment + interestPerInstallment,
      dueDate: dueDate.toISOString().slice(0, 10),
      status,
    };
  });
}
