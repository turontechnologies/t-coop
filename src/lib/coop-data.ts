import { LOAN_TYPES } from "@/lib/loans-data";
import { SAVINGS_TYPES } from "@/lib/savings-data";

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
}

export type CoopSavingsStatus = "Success" | "Pending" | "Failed";

export interface CoopSavingsRecord {
  id: string;
  memberId: string;
  memberName: string;
  savingsType: string;
  amount: number;
  balanceAfter: number;
  method: "Paystack" | "Manual Upload";
  transactionId: string;
  date: string;
  status: CoopSavingsStatus;
  /** Base64 data URL of an uploaded teller/receipt image, when recorded that way. */
  receiptUrl?: string;
}

export type SavingsRequestType = "Deposit" | "Withdrawal";
export type SavingsRequestStatus = "Pending" | "Approved" | "Declined";

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
}

export type CoopLoanStatus =
  "Awaiting Guarantor" | "Awaiting Admin" | "Active" | "Completed" | "Rejected";

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
  guarantorName: string;
  date: string;
  status: CoopLoanStatus;
  repaymentsMade: number;
  /** Set once the guarantor accepts — a payslip/proof upload, base64 data URL. */
  guarantorDocumentUrl?: string;
  guarantorAcceptedAt?: string;
  /** Set when the admin rejects — shown wherever this record is viewed. */
  rejectionReason?: string;
}

export interface Cooperative {
  id: string;
  name: string;
  adminName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  status: CoopStatus;
  members: CoopMember[];
  savings: CoopSavingsRecord[];
  loans: CoopLoanRecord[];
  savingsRequests: SavingsRequest[];
}

export const INITIAL_COOPERATIVES: Cooperative[] = [
  {
    id: "COOP-0001",
    name: "Turon Co-operatives",
    adminName: "Karim Adeyemi",
    contactEmail: "karim.adeyemi@turon.coop",
    contactPhone: "090-228-27263",
    address: "14 Marina Road",
    country: "Nigeria",
    state: "Lagos State",
    city: "Lagos Island",
    status: "Active",
    members: [
      {
        id: "MEM-0988-1",
        firstName: "Jonathan",
        lastName: "Newman",
        email: "jonathan.newman@turon.coop",
        role: "Member",
        status: "Active",
        guarantor: "Karim Adeyemi",
        country: "Nigeria",
        state: "Lagos State",
        city: "Ikeja",
        bankCode: "999992",
        accountNumber: "8135013995",
        accountName: "SAMUEL PRECIOUS ADEDARA",
      },
      {
        id: "MEM-0988-2",
        firstName: "Amaka",
        lastName: "Chukwu",
        email: "amaka.chukwu@turon.coop",
        role: "Member",
        status: "Active",
        guarantor: "Jonathan Newman",
        country: "Nigeria",
        state: "Lagos State",
        city: "Eti-Osa",
        bankCode: "999992",
        accountNumber: "8135013995",
        accountName: "SAMUEL PRECIOUS ADEDARA",
      },
      {
        id: "MEM-0988-3",
        firstName: "Segun",
        lastName: "Ojo",
        email: "segun.ojo@turon.coop",
        role: "Admin",
        status: "Active",
        guarantor: "Karim Adeyemi",
        country: "Nigeria",
        state: "Lagos State",
        city: "Surulere",
        bankCode: "999992",
        accountNumber: "8135013995",
        accountName: "SAMUEL PRECIOUS ADEDARA",
      },
      {
        id: "MEM-0988-4",
        firstName: "Halima",
        lastName: "Bello",
        email: "halima.bello@turon.coop",
        role: "Member",
        status: "Inactive",
        guarantor: "Amaka Chukwu",
        country: "Nigeria",
        state: "Lagos State",
        city: "Lagos Mainland",
        bankCode: "999992",
        accountNumber: "8135013995",
        accountName: "SAMUEL PRECIOUS ADEDARA",
      },
    ],
    savings: [
      {
        id: "coop-sav-1",
        memberId: "MEM-0988-1",
        memberName: "Jonathan Newman",
        savingsType: "Basic Savings",
        amount: 90_000,
        balanceAfter: 90_000,
        method: "Manual Upload",
        transactionId: "TR191827623466",
        date: "2025-07-09",
        status: "Success",
      },
      {
        id: "coop-sav-2",
        memberId: "MEM-0988-2",
        memberName: "Amaka Chukwu",
        savingsType: "Basic Savings",
        amount: 85_000,
        balanceAfter: 85_000,
        method: "Manual Upload",
        transactionId: "TR191827623467",
        date: "2025-07-10",
        status: "Success",
      },
      {
        id: "coop-sav-3",
        memberId: "MEM-0988-3",
        memberName: "Segun Ojo",
        savingsType: "Advanced Savings",
        amount: 75_000,
        balanceAfter: 75_000,
        method: "Manual Upload",
        transactionId: "TR191827623468",
        date: "2025-08-01",
        status: "Success",
      },
      {
        id: "coop-sav-4",
        memberId: "MEM-0988-1",
        memberName: "Jonathan Newman",
        savingsType: "Premium Savings",
        amount: 650_000,
        balanceAfter: 650_000,
        method: "Manual Upload",
        transactionId: "TR191827623469",
        date: "2025-08-14",
        status: "Success",
      },
      {
        id: "coop-sav-5",
        memberId: "MEM-0988-4",
        memberName: "Halima Bello",
        savingsType: "Basic Savings",
        amount: 60_000,
        balanceAfter: 60_000,
        method: "Manual Upload",
        transactionId: "TR191827623470",
        date: "2025-09-02",
        status: "Pending",
      },
    ],
    loans: [
      {
        id: "coop-loan-1",
        memberId: "MEM-0988-1",
        memberName: "Jonathan Newman",
        loanType: "Business Loan",
        amount: 300_000,
        interestRate: 10,
        durationMonths: 12,
        numberOfRepayments: 12,
        monthlyRepayment: (300_000 + 300_000 * 0.1) / 12,
        totalRepayment: 300_000 + 300_000 * 0.1,
        guarantorName: "Karim Adeyemi",
        date: "2025-08-01",
        status: "Active",
        repaymentsMade: 3,
      },
      {
        id: "coop-loan-2",
        memberId: "MEM-0988-2",
        memberName: "Amaka Chukwu",
        loanType: "Emergency Loan",
        amount: 45_000,
        interestRate: 5,
        durationMonths: 3,
        numberOfRepayments: 3,
        monthlyRepayment: (45_000 + 45_000 * 0.05) / 3,
        totalRepayment: 45_000 + 45_000 * 0.05,
        guarantorName: "Jonathan Newman",
        date: "2025-05-01",
        status: "Completed",
        repaymentsMade: 3,
      },
      {
        id: "coop-loan-3",
        memberId: "MEM-0988-3",
        memberName: "Segun Ojo",
        loanType: "Education Loan",
        amount: 180_000,
        interestRate: 7,
        durationMonths: 6,
        numberOfRepayments: 6,
        monthlyRepayment: (180_000 + 180_000 * 0.07) / 6,
        totalRepayment: 180_000 + 180_000 * 0.07,
        guarantorName: "Karim Adeyemi",
        date: "2026-06-15",
        status: "Awaiting Admin",
        repaymentsMade: 0,
        guarantorAcceptedAt: "2026-06-20T10:00:00.000Z",
      },
      {
        id: "coop-loan-5",
        memberId: "MEM-0988-4",
        memberName: "Halima Bello",
        loanType: "Emergency Loan",
        amount: 35_000,
        interestRate: 5,
        durationMonths: 3,
        numberOfRepayments: 3,
        monthlyRepayment: (35_000 + 35_000 * 0.05) / 3,
        totalRepayment: 35_000 + 35_000 * 0.05,
        guarantorName: "Amaka Chukwu",
        date: "2026-07-15",
        status: "Awaiting Guarantor",
        repaymentsMade: 0,
      },
    ],
    savingsRequests: [
      {
        id: "coop-sav-req-1",
        memberId: "MEM-0988-2",
        memberName: "Amaka Chukwu",
        type: "Deposit",
        savingsType: "Basic Savings",
        amount: 40_000,
        note: "Salary contribution for July",
        status: "Pending",
        requestedAt: "2026-07-18T09:20:00.000Z",
      },
      {
        id: "coop-sav-req-2",
        memberId: "MEM-0988-1",
        memberName: "Jonathan Newman",
        type: "Withdrawal",
        savingsType: "Premium Savings",
        amount: 100_000,
        note: "Emergency medical expense",
        status: "Pending",
        requestedAt: "2026-07-19T14:05:00.000Z",
      },
      {
        id: "coop-sav-req-3",
        memberId: "MEM-0988-3",
        memberName: "Segun Ojo",
        type: "Deposit",
        savingsType: "Advanced Savings",
        amount: 25_000,
        status: "Approved",
        requestedAt: "2026-07-10T11:00:00.000Z",
        resolvedAt: "2026-07-11T08:30:00.000Z",
      },
    ],
  },
  {
    id: "COOP-0002",
    name: "Harbor Light Co-operative",
    adminName: "Ifeoma Nwachukwu",
    contactEmail: "ifeoma.n@harborlight.coop",
    contactPhone: "081-345-90211",
    address: "22 Aba Road, GRA Phase 2",
    country: "Nigeria",
    state: "Rivers State",
    city: "Port Harcourt",
    status: "Active",
    members: [
      {
        id: "MEM-0442-1",
        firstName: "Yemi",
        lastName: "Alade",
        email: "yemi.alade@harborlight.coop",
        role: "Admin",
        status: "Active",
        guarantor: "Ifeoma Nwachukwu",
        country: "Nigeria",
        state: "Rivers State",
        city: "Port Harcourt",
        bankCode: "999992",
        accountNumber: "8135013995",
        accountName: "SAMUEL PRECIOUS ADEDARA",
      },
      {
        id: "MEM-0442-2",
        firstName: "Chuka",
        lastName: "Obi",
        email: "chuka.obi@harborlight.coop",
        role: "Member",
        status: "Active",
        guarantor: "Yemi Alade",
        country: "Nigeria",
        state: "Rivers State",
        city: "Obio/Akpor",
        bankCode: "999992",
        accountNumber: "8135013995",
        accountName: "SAMUEL PRECIOUS ADEDARA",
      },
    ],
    savings: [
      {
        id: "coop-sav-6",
        memberId: "MEM-0442-1",
        memberName: "Yemi Alade",
        savingsType: "Basic Savings",
        amount: 55_000,
        balanceAfter: 55_000,
        method: "Manual Upload",
        transactionId: "TR191827623471",
        date: "2025-09-20",
        status: "Success",
      },
      {
        id: "coop-sav-7",
        memberId: "MEM-0442-2",
        memberName: "Chuka Obi",
        savingsType: "Advanced Savings",
        amount: 95_000,
        balanceAfter: 95_000,
        method: "Manual Upload",
        transactionId: "TR191827623472",
        date: "2025-10-03",
        status: "Success",
      },
    ],
    loans: [
      {
        id: "coop-loan-4",
        memberId: "MEM-0442-2",
        memberName: "Chuka Obi",
        loanType: "Emergency Loan",
        amount: 30_000,
        interestRate: 5,
        durationMonths: 3,
        numberOfRepayments: 3,
        monthlyRepayment: (30_000 + 30_000 * 0.05) / 3,
        totalRepayment: 30_000 + 30_000 * 0.05,
        guarantorName: "Yemi Alade",
        date: "2026-05-01",
        status: "Active",
        repaymentsMade: 1,
      },
    ],
    savingsRequests: [],
  },
  {
    id: "COOP-0003",
    name: "Northbridge Workers' Union",
    adminName: "Patience Uzo",
    contactEmail: "patience.uzo@northbridge.coop",
    contactPhone: "070-556-40912",
    address: "9 Ahmadu Bello Way",
    country: "Nigeria",
    state: "Kaduna State",
    city: "Kaduna North",
    status: "Disabled",
    members: [
      {
        id: "MEM-0117-1",
        firstName: "Patience",
        lastName: "Uzo",
        email: "patience.uzo@northbridge.coop",
        role: "Admin",
        status: "Inactive",
        guarantor: "Board of Trustees",
        country: "Nigeria",
        state: "Kaduna State",
        city: "Kaduna North",
        bankCode: "999992",
        accountNumber: "8135013995",
        accountName: "SAMUEL PRECIOUS ADEDARA",
      },
    ],
    savings: [],
    loans: [],
    savingsRequests: [],
  },
];

export function findCooperative(
  cooperatives: Cooperative[],
  id: string,
): Cooperative | undefined {
  return cooperatives.find((coop) => coop.id === id);
}

export function findCoopMember(
  coop: Cooperative | undefined,
  memberId: string,
): CoopMember | undefined {
  return coop?.members.find((member) => member.id === memberId);
}

export function coopMemberFullName(member: CoopMember): string {
  return `${member.firstName} ${member.lastName}`;
}

export function coopSavingsTotal(coop: Cooperative): number {
  return coop.savings.reduce((sum, record) => sum + record.amount, 0);
}

/** A member's running balance for one savings type, before a new record is added. */
export function coopMemberSavingsBalance(
  coop: Cooperative,
  memberId: string,
  savingsType: string,
): number {
  return coop.savings
    .filter(
      (record) =>
        record.memberId === memberId && record.savingsType === savingsType,
    )
    .reduce((sum, record) => sum + record.amount, 0);
}

export function coopLoansTotal(coop: Cooperative): number {
  return coop.loans.reduce((sum, record) => sum + record.amount, 0);
}

export function coopLoanStatusBadgeVariant(
  status: CoopLoanStatus,
): "secondary" | "outline" | "destructive" {
  if (status === "Active" || status === "Completed") return "secondary";
  if (status === "Awaiting Guarantor" || status === "Awaiting Admin")
    return "outline";
  return "destructive";
}

interface CoopSavingsTypeSummary {
  name: string;
  min: number;
  max: number;
  earnings: number;
  total: number;
}

/** "Earnings" is an illustrative dividend figure (2% of total), not a real accrual engine. */
const SAVINGS_EARNINGS_RATE = 0.02;

export function coopSavingsBySummaryType(
  coop: Cooperative,
): CoopSavingsTypeSummary[] {
  return SAVINGS_TYPES.map((type) => {
    const total = coop.savings
      .filter((record) => record.savingsType === type.name)
      .reduce((sum, record) => sum + record.amount, 0);
    return {
      name: type.name,
      min: type.min,
      max: type.max,
      earnings: total * SAVINGS_EARNINGS_RATE,
      total,
    };
  });
}

interface CoopLoanTypeSummary {
  name: string;
  eligibilityPercent: number;
  durationMonths: number;
  numberOfRepayments: number;
  interestRate: number;
  earnings: number;
}

export function coopLoansBySummaryType(
  coop: Cooperative,
): CoopLoanTypeSummary[] {
  return LOAN_TYPES.map((type) => {
    const forType = coop.loans.filter(
      (record) => record.loanType === type.name && record.status !== "Rejected",
    );
    const earnings = forType.reduce(
      (sum, record) => sum + (record.totalRepayment - record.amount),
      0,
    );
    return {
      name: type.name,
      eligibilityPercent: type.eligibilityPercent,
      durationMonths: type.durationMonths,
      numberOfRepayments: type.durationMonths,
      interestRate: type.interestRate,
      earnings,
    };
  });
}
