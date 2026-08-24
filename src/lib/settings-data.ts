export type ChargeType = "Fixed" | "Percentage";

export interface FeeSettings {
  savingsChargeType: ChargeType;
  savingsChargeAmount: number;
  loansChargeType: ChargeType;
  loansChargeAmount: number;
  /**
   * Real, functional platform fee — a percentage taken off every member
   * withdrawal (see documentation/savings-page.md). Unlike the charges
   * above, this one actually affects what a member receives; combined
   * with the co-op admin's own withdrawal fee at withdrawal time.
   */
  withdrawalFeePercent: number;
}

export const INITIAL_FEE_SETTINGS: FeeSettings = {
  savingsChargeType: "Percentage",
  savingsChargeAmount: 0.25,
  loansChargeType: "Percentage",
  loansChargeAmount: 1,
  withdrawalFeePercent: 1,
};

export interface CollectionAccountSettings {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export const INITIAL_COLLECTION_ACCOUNT: CollectionAccountSettings = {
  bankCode: "",
  accountNumber: "",
  accountName: "",
};

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

export const INITIAL_INTEGRATIONS: IntegrationSettings = {
  paystackEnabled: true,
  paystackPublicKey: "",
  paystackSecretKey: "",
  paystackWebhookSecret: "",
  flutterwaveEnabled: false,
  flutterwavePublicKey: "",
  flutterwaveSecretKey: "",
  flutterwaveEncryptionKey: "",
  opayEnabled: false,
  opayPublicKey: "",
  opaySecretKey: "",
  opayMerchantId: "",
  smsEnabled: false,
  smsApiKey: "",
  smsSenderId: "",
};

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

/** "Invited" is a real backend state now — a super admin invited them by email but they
 * haven't accepted yet, so they can't log in. Never produced by the mock. */
export type PlatformUserStatus = "Active" | "Inactive" | "Invited";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
  dateAdded: string;
  status: PlatformUserStatus;
}

export const INITIAL_PLATFORM_USERS: PlatformUser[] = [
  {
    id: "usr-1",
    name: "Jonathan Edward",
    email: "jonathan@gmail.com",
    role: "Support",
    dateAdded: "2026-06-09",
    status: "Active",
  },
  {
    id: "usr-2",
    name: "Amaka Chukwu",
    email: "amaka.chukwu@t-coop.com",
    role: "Support",
    dateAdded: "2026-06-12",
    status: "Active",
  },
  {
    id: "usr-3",
    name: "Segun Ojo",
    email: "segun.ojo@t-coop.com",
    role: "Support",
    dateAdded: "2026-07-01",
    status: "Active",
  },
];

export type PlatformRoleStatus = "Active" | "Inactive";

export interface PlatformRole {
  id: string;
  name: string;
  permissions: string[];
  dateAdded: string;
  status: PlatformRoleStatus;
}

export const INITIAL_PLATFORM_ROLES: PlatformRole[] = [
  {
    id: "role-1",
    name: "Support",
    permissions: [...PERMISSION_MODULES],
    dateAdded: "2026-06-09",
    status: "Active",
  },
];
