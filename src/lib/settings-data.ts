export type ChargeType = "Fixed" | "Percentage";

export interface FeeSettings {
  savingsChargeType: ChargeType;
  savingsChargeAmount: number;
  loansChargeType: ChargeType;
  loansChargeAmount: number;
  /**
   * Real, functional platform fee — taken off every member withdrawal (see
   * documentation/savings-page.md), fixed or a percentage per
   * withdrawalFeeType. Unlike the charges above, this one actually affects
   * what a member receives; combined with the co-op admin's own withdrawal
   * fee at withdrawal time.
   */
  withdrawalFeeType: ChargeType;
  withdrawalFeeAmount: number;
  /** Platform's % of every loan application fee (default for new co-ops). */
  loanApplicationFeePercent: number;
  /** Days a co-op keeps working after its subscription expires. */
  subscriptionGraceDays: number;
}

/** The platform's fees from one co-operative, set by the super admin. */
export interface CoopPlatformFees {
  cooperativeId: string;
  cooperativeName: string;
  status: string;
  savingsChargeType: ChargeType;
  savingsChargeAmount: number;
  loansChargeType: ChargeType;
  loansChargeAmount: number;
  withdrawalFeeType: ChargeType;
  withdrawalFeeAmount: number;
  loanApplicationFeePercent: number;
}

export type EarningSource =
  "SavingsCharge" | "LoanCharge" | "WithdrawalFee" | "LoanApplicationFee";

export const EARNING_SOURCE_LABELS: Record<EarningSource, string> = {
  SavingsCharge: "Savings charge",
  LoanCharge: "Loan charge",
  WithdrawalFee: "Withdrawal fee",
  LoanApplicationFee: "Loan application fee",
};

export interface CoopEarnings {
  cooperativeId: string;
  cooperativeName: string;
  total: number;
  count: number;
  bySource: Record<EarningSource, number>;
}

export interface EarningsSummary {
  from: string;
  to: string;
  total: number;
  bySource: Record<EarningSource, number>;
  cooperatives: CoopEarnings[];
}

export interface EarningEntry {
  id: string;
  source: EarningSource;
  memberId: string | null;
  memberName: string | null;
  baseAmount: number;
  amount: number;
  reference: string;
  createdAt: string;
}

export interface CollectionAccountSettings {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface IntegrationSettings {
  paystackEnabled: boolean;
  paystackPublicKey: string;
  paystackSecretKey: string;
  paystackWebhookSecret: string;
  flutterwaveEnabled: boolean;
  flutterwavePublicKey: string;
  flutterwaveSecretKey: string;
  flutterwaveEncryptionKey: string;
  opayEnabled: boolean;
  opayPublicKey: string;
  opaySecretKey: string;
  opayMerchantId: string;
  smsEnabled: boolean;
  smsApiKey: string;
  smsSenderId: string;
}

export const PERMISSION_MODULES = [
  "Dashboard",
  "Co-operatives",
  "Savings & Contributions",
  "Loans",
  "Subscriptions",
  "Members Directory",
  "Notice Board",
  "Support",
  "Settings",
] as const;

/** Same idea as PERMISSION_MODULES but for a CoopRole (admin's own Settings -> User Management
 * -> Roles) — matches admin's own nav labels exactly (see NAV_ITEMS.admin in dashboard-nav.ts),
 * since a co-op-scoped staff member's nav is filtered against that list. */
export const COOP_PERMISSION_MODULES = [
  "Dashboard",
  "Members Directory",
  "Notice Board",
  "Savings & Contributions",
  "Loans",
  "Reports",
  "Support",
  "Settings",
] as const;

/** "Invited" — a super admin invited them by email but they haven't accepted yet, so they
 * can't log in. */
export type PlatformUserStatus = "Active" | "Inactive" | "Invited";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  dateAdded: string;
  status: PlatformUserStatus;
}

export type PlatformRoleStatus = "Active" | "Inactive";

export interface PlatformRole {
  id: string;
  name: string;
  permissions: string[];
  dateAdded: string;
  status: PlatformRoleStatus;
}
