import type { InterestType } from "@/types/coop-loans";

/** "TimesTwo": borrow up to twice your savings — needs at least two guarantors. "Within": borrow from your own savings, up to your savings — no guarantor;
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
      "Borrow up to twice your savings (₦100 saved → up to ₦200). Needs at least two guarantors.",
  },
  {
    value: "Within",
    label: "Within",
    description:
      "Borrow from your own savings, up to what you've saved. No guarantor. The loan comes out of your savings and your repayments go back into them.",
  },
];

const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

/**
 * The name of the borrow-a-multiple mode, from the co-op's savings multiple: 2 → "Times two",
 * 3 → "Times three", 2.5 → "Times 2.5". The stored mode stays "TimesTwo" whatever the multiple.
 */
export function timesLabel(multiplier: number | null | undefined = 2): string {
  const n = multiplier && multiplier > 0 ? multiplier : 2;
  const word = Number.isInteger(n) && n <= 10 ? NUMBER_WORDS[n] : String(n);
  return `Times ${word}`;
}

export function loanModeLabel(
  mode: LoanMode | string | null | undefined,
  /** The co-op's savings multiple; see {@link timesLabel}. */
  multiplier?: number | null,
): string {
  return mode === "Within" ? "Within" : timesLabel(multiplier);
}

export interface LoanTypeDef {
  name: string;
  interestType: InterestType;
  /** A percentage for "Percentage", a flat amount for "Fixed", ignored for "NoInterest". */
  interestRate: number;
  maxAmount: number;
  durationMonths: number;
}

/** The co-op's own loan rules (Settings -> Loans). Defaults: 2x savings, Within up to 100%. */
export interface LoanRules {
  savingsMultiplier: number;
  withinPercent: number;
}

/** The most a member can borrow on this type in this mode — capped by the type's maximum. */
export function computeEligibleAmount(
  totalSavings: number,
  loanType: LoanTypeDef,
  mode: LoanMode,
  rules: LoanRules = { savingsMultiplier: 2, withinPercent: 100 },
): number {
  const savings = Math.max(totalSavings, 0);
  const byMode =
    mode === "Within"
      ? (savings * rules.withinPercent) / 100
      : savings * rules.savingsMultiplier;
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

/** Terms for an amount over `months` (the borrower's choice, at most the type's maximum). */
export function computeLoanTerms(
  loanType: LoanTypeDef,
  amount: number,
  months: number = loanType.durationMonths,
): LoanTerms {
  const totalInterest = computeInterest(loanType, amount);
  const totalRepayment = amount + totalInterest;
  const numberOfRepayments = Math.max(1, months);
  return {
    totalInterest,
    durationMonths: numberOfRepayments,
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
