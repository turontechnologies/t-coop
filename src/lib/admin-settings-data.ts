import { LOAN_TYPES } from "@/lib/loans-data";
import { SAVINGS_TYPES } from "@/lib/savings-data";

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

export type RepaymentInterval = "Weekly" | "Monthly" | "Quarterly";
export type InterestType = "Percentage" | "Fixed";

export interface CoopLoanTypeSetting {
  id: string;
  name: string;
  eligibilityPercent: number;
  durationMonths: number;
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
