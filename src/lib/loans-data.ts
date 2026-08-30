export interface LoanTypeDef {
  name: string;
  interestRate: number;
  maxAmount: number;
  durationMonths: number;
  /** Eligible amount = min(maxAmount, totalSavings * eligibilityPercent / 100). */
  eligibilityPercent: number;
}

export const LOAN_TYPES: LoanTypeDef[] = [
  {
    name: "Emergency Loan",
    interestRate: 5,
    maxAmount: 50_000,
    durationMonths: 3,
    eligibilityPercent: 300,
  },
  {
    name: "Education Loan",
    interestRate: 7,
    maxAmount: 200_000,
    durationMonths: 6,
    eligibilityPercent: 200,
  },
  {
    name: "Business Loan",
    interestRate: 10,
    maxAmount: 500_000,
    durationMonths: 12,
    eligibilityPercent: 100,
  },
];

export function computeEligibleAmount(
  totalSavings: number,
  loanType: LoanTypeDef,
): number {
  return Math.min(
    loanType.maxAmount,
    Math.max(totalSavings * (loanType.eligibilityPercent / 100), 10_000),
  );
}

export interface LoanTerms {
  interestRate: number;
  durationMonths: number;
  numberOfRepayments: number;
  monthlyRepayment: number;
  totalRepayment: number;
}

export function computeLoanTerms(
  loanType: LoanTypeDef,
  amount: number,
): LoanTerms {
  const totalInterest = amount * (loanType.interestRate / 100);
  const totalRepayment = amount + totalInterest;
  const numberOfRepayments = loanType.durationMonths;
  return {
    interestRate: loanType.interestRate,
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

export interface LoanTransaction {
  transactionId: string;
  installment: number;
  amount: number;
  date: string;
  method: "Wallet Deduction";
  status: "Success";
}

export function generateLoanTransactions(
  loan: RepaymentSourceLoan & { id: string },
): LoanTransaction[] {
  return generateRepaymentSchedule(loan)
    .filter((item) => item.status === "Paid")
    .map((item) => ({
      transactionId: `${loan.id.toUpperCase()}-TXN-${String(item.installment).padStart(2, "0")}`,
      installment: item.installment,
      amount: item.totalAmount,
      date: item.dueDate,
      method: "Wallet Deduction",
      status: "Success",
    }));
}
