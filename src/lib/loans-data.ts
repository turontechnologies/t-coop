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

export function findLoanType(name: string): LoanTypeDef | undefined {
  return LOAN_TYPES.find((type) => type.name === name);
}

export const GUARANTORS = [
  "Tunde Bakare",
  "Chidinma Eze",
  "Ngozi Okafor",
  "Ibrahim Musa",
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

export type LoanStatus =
  "Active" | "Awaiting Approval" | "Completed" | "Rejected";

export interface LoanRecord {
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
  guarantorName: string;
  date: string;
  status: LoanStatus;
  repaymentsMade: number;
}

export const INITIAL_LOAN_RECORDS: LoanRecord[] = [
  {
    id: "loan-1",
    memberId: "MB-0001",
    memberName: "Tunde Bakare",
    loanType: "Business Loan",
    amount: 300_000,
    interestRate: 10,
    durationMonths: 12,
    numberOfRepayments: 12,
    monthlyRepayment: (300_000 + 300_000 * 0.1) / 12,
    totalRepayment: 300_000 + 300_000 * 0.1,
    guarantorName: "Chidinma Eze",
    date: "2025-09-01",
    status: "Active",
    repaymentsMade: 4,
  },
  {
    id: "loan-2",
    memberId: "MB-0001",
    memberName: "Tunde Bakare",
    loanType: "Emergency Loan",
    amount: 40_000,
    interestRate: 5,
    durationMonths: 3,
    numberOfRepayments: 3,
    monthlyRepayment: (40_000 + 40_000 * 0.05) / 3,
    totalRepayment: 40_000 + 40_000 * 0.05,
    guarantorName: "Ngozi Okafor",
    date: "2025-03-01",
    status: "Completed",
    repaymentsMade: 3,
  },
  {
    id: "loan-3",
    memberId: "MB-0001",
    memberName: "Tunde Bakare",
    loanType: "Education Loan",
    amount: 150_000,
    interestRate: 7,
    durationMonths: 6,
    numberOfRepayments: 6,
    monthlyRepayment: (150_000 + 150_000 * 0.07) / 6,
    totalRepayment: 150_000 + 150_000 * 0.07,
    guarantorName: "Ibrahim Musa",
    date: "2026-07-01",
    status: "Awaiting Approval",
    repaymentsMade: 0,
  },
  {
    id: "loan-4",
    memberId: "AD-0001",
    memberName: "Chidinma Eze",
    loanType: "Emergency Loan",
    amount: 30_000,
    interestRate: 5,
    durationMonths: 3,
    numberOfRepayments: 3,
    monthlyRepayment: (30_000 + 30_000 * 0.05) / 3,
    totalRepayment: 30_000 + 30_000 * 0.05,
    guarantorName: "Tunde Bakare",
    date: "2026-06-01",
    status: "Active",
    repaymentsMade: 1,
  },
];

export type RepaymentStatus = "Paid" | "Upcoming" | "Overdue" | "Pending";

export interface RepaymentScheduleItem {
  installment: number;
  amount: number;
  interest: number;
  totalAmount: number;
  dueDate: string;
  status: RepaymentStatus;
}

export function generateRepaymentSchedule(
  loan: LoanRecord,
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
    if (loan.status === "Awaiting Approval" || loan.status === "Rejected") {
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

export function generateLoanTransactions(loan: LoanRecord): LoanTransaction[] {
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
