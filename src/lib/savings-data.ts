export interface SavingsTypeDef {
  name: string;
  min: number;
  max: number;
}

export const SAVINGS_TYPES: SavingsTypeDef[] = [
  { name: "Basic Savings", min: 5_000, max: 10_000 },
  { name: "Advanced Savings", min: 50_000, max: 100_000 },
  { name: "Premium Savings", min: 500_000, max: 1_000_000 },
];

export function findSavingsTypeRange(name: string): SavingsTypeDef | undefined {
  return SAVINGS_TYPES.find((type) => type.name === name);
}

export type SavingsStatus = "Success" | "Pending" | "Failed";

export interface SavingsRecord {
  id: string;
  memberId: string;
  memberName: string;
  savingsType: string;
  amount: number;
  balanceAfter: number;
  method: "Paystack" | "Manual Upload";
  transactionId: string;
  date: string;
  status: SavingsStatus;
}

export const INITIAL_SAVINGS_RECORDS: SavingsRecord[] = [
  {
    id: "sav-1",
    memberId: "MB-0001",
    memberName: "Tunde Bakare",
    savingsType: "Basic Savings",
    amount: 85_000,
    balanceAfter: 55_000,
    method: "Manual Upload",
    transactionId: "AI191827623466",
    date: "2025-07-09",
    status: "Success",
  },
  {
    id: "sav-2",
    memberId: "MB-0001",
    memberName: "Tunde Bakare",
    savingsType: "Advanced Savings",
    amount: 85_000,
    balanceAfter: 140_000,
    method: "Manual Upload",
    transactionId: "AI191827623467",
    date: "2025-07-09",
    status: "Success",
  },
  {
    id: "sav-3",
    memberId: "MB-0001",
    memberName: "Tunde Bakare",
    savingsType: "Premium Savings",
    amount: 85_000,
    balanceAfter: 225_000,
    method: "Manual Upload",
    transactionId: "AI191827623468",
    date: "2025-07-09",
    status: "Success",
  },
  {
    id: "sav-4",
    memberId: "MB-0001",
    memberName: "Tunde Bakare",
    savingsType: "Premium Savings",
    amount: 85_000,
    balanceAfter: 310_000,
    method: "Manual Upload",
    transactionId: "AI191827623469",
    date: "2025-07-09",
    status: "Success",
  },
  {
    id: "sav-5",
    memberId: "MB-0001",
    memberName: "Tunde Bakare",
    savingsType: "Premium Savings",
    amount: 85_000,
    balanceAfter: 395_000,
    method: "Manual Upload",
    transactionId: "AI191827623470",
    date: "2025-07-09",
    status: "Success",
  },
  {
    id: "sav-6",
    memberId: "AD-0001",
    memberName: "Chidinma Eze",
    savingsType: "Basic Savings",
    amount: 120_000,
    balanceAfter: 120_000,
    method: "Manual Upload",
    transactionId: "AI191827623471",
    date: "2025-06-18",
    status: "Success",
  },
];
