import { LOAN_TYPES, type LoanTypeDef } from "@/lib/loans-data";
import { SAVINGS_TYPES, type SavingsTypeDef } from "@/lib/savings-data";

export type SettingStatus = "Active" | "Inactive";

export interface CoopSavingsTypeSetting {
  id: string;
  name: string;
  min: number;
  max: number;
  approvalGroup: string[];
  status: SettingStatus;
}

/**
 * Seeded from the real, app-wide SAVINGS_TYPES catalog so this starts
 * consistent with what members and admins already see everywhere else —
 * editing here doesn't yet write back to that shared catalog (same
 * "illustrative settings, honestly flagged" pattern as the super admin's
 * Fees & Charges), so nothing else in the app changes as a result of
 * edits made on this screen.
 */
export const INITIAL_SAVINGS_TYPE_SETTINGS: CoopSavingsTypeSetting[] =
  SAVINGS_TYPES.map((type, index) => ({
    id: `sav-type-${index + 1}`,
    name: type.name,
    min: type.min,
    max: type.max,
    approvalGroup: ["Karim Adeyemi"],
    status: "Active",
  }));

/**
 * Converts an admin-managed savings type into the shape the member/admin
 * "Add Savings"/"Withdraw" pickers already know how to consume — so a
 * savings type an admin creates here shows up there immediately, with no
 * separate catalog to keep in sync.
 */
export function toSavingsTypeDef(
  setting: CoopSavingsTypeSetting,
): SavingsTypeDef {
  return { name: setting.name, min: setting.min, max: setting.max };
}

export function activeSavingsTypeDefs(
  settings: CoopSavingsTypeSetting[],
): SavingsTypeDef[] {
  return settings
    .filter((setting) => setting.status === "Active")
    .map(toSavingsTypeDef);
}

export type RepaymentInterval = "Weekly" | "Monthly" | "Quarterly";
export type InterestType = "Percentage" | "Fixed";

export interface CoopLoanTypeSetting {
  id: string;
  name: string;
  eligibilityPercent: number;
  durationMonths: number;
  maxAmount: number;
  repaymentInterval: RepaymentInterval;
  numberOfInstallments: number;
  interestType: InterestType;
  interestAmount: number;
  approver1: string;
  approver2: string;
  loanTerms: string;
  guarantorTerms: string;
  status: SettingStatus;
}

export function computeInstallments(
  durationMonths: number,
  interval: RepaymentInterval,
): number {
  if (interval === "Weekly") return Math.max(1, durationMonths * 4);
  if (interval === "Quarterly")
    return Math.max(1, Math.ceil(durationMonths / 3));
  return Math.max(1, durationMonths);
}

export const INITIAL_LOAN_TYPE_SETTINGS: CoopLoanTypeSetting[] = LOAN_TYPES.map(
  (type, index) => ({
    id: `loan-type-${index + 1}`,
    name: type.name,
    eligibilityPercent: type.eligibilityPercent,
    durationMonths: type.durationMonths,
    maxAmount: type.maxAmount,
    repaymentInterval: "Monthly",
    numberOfInstallments: computeInstallments(type.durationMonths, "Monthly"),
    interestType: "Percentage",
    interestAmount: type.interestRate,
    approver1: "Karim Adeyemi",
    approver2: "",
    loanTerms: "Valid ID, proof of income",
    guarantorTerms: "Valid ID, employment letter",
    status: "Active",
  }),
);

/**
 * Converts an admin-managed loan type into the shape the loan
 * calculator (`computeEligibleAmount`/`computeLoanTerms`) already
 * understands — so a loan type an admin creates here becomes selectable
 * in "Take a Loan" immediately. `interestAmount` is used as the flat
 * percentage rate regardless of `interestType`, since the calculator
 * only supports percentage-of-principal interest — a "Fixed" type is
 * therefore an approximation, same honest-mock tradeoff as elsewhere in
 * this admin-settings screen.
 */
export function toLoanTypeDef(setting: CoopLoanTypeSetting): LoanTypeDef {
  return {
    name: setting.name,
    interestRate: setting.interestAmount,
    maxAmount: setting.maxAmount,
    durationMonths: setting.durationMonths,
    eligibilityPercent: setting.eligibilityPercent,
  };
}

export function activeLoanTypeDefs(
  settings: CoopLoanTypeSetting[],
): LoanTypeDef[] {
  return settings
    .filter((setting) => setting.status === "Active")
    .map(toLoanTypeDef);
}

export interface CooperativeSettings {
  name: string;
  address: string;
  contactPerson: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  presidentName: string;
  presidentContact: string;
  chairmanName: string;
  chairmanContact: string;
}

export const INITIAL_COOPERATIVE_SETTINGS: CooperativeSettings = {
  name: "",
  address: "",
  contactPerson: "",
  website: "",
  contactEmail: "",
  contactPhone: "",
  presidentName: "",
  presidentContact: "",
  chairmanName: "",
  chairmanContact: "",
};

export interface CoopBankAccountSettings {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export const INITIAL_COOP_BANK_ACCOUNT: CoopBankAccountSettings = {
  bankCode: "",
  accountNumber: "",
  accountName: "",
};

/**
 * Real, functional co-op-level fee — a percentage taken off every member
 * withdrawal from this co-op, stacked with the platform's own withdrawal
 * fee (`FeeSettings.withdrawalFeePercent`, set by super admin). Locked in
 * on the request at the moment a member submits it.
 */
export const INITIAL_WITHDRAWAL_FEE_PERCENT = 1;
