export type ChargeType = "Fixed" | "Percentage";

export interface FeeSettings {
  savingsChargeType: ChargeType;
  savingsChargeAmount: number;
  loansChargeType: ChargeType;
  loansChargeAmount: number;
}

export const INITIAL_FEE_SETTINGS: FeeSettings = {
  savingsChargeType: "Percentage",
  savingsChargeAmount: 0.25,
  loansChargeType: "Percentage",
  loansChargeAmount: 1,
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

export type PlatformUserStatus = "Active" | "Inactive";

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

export interface ActivityLogEntry {
  id: string;
  activity: string;
  activityBy: string;
  role: string;
  date: string;
}

export const INITIAL_ACTIVITY_LOG: ActivityLogEntry[] = [
  {
    id: "log-1",
    activity: "User login",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    date: "2026-08-05",
  },
  {
    id: "log-2",
    activity: "Co-operative created",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    date: "2026-08-04",
  },
  {
    id: "log-3",
    activity: "Subscription payment recorded",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    date: "2026-08-03",
  },
  {
    id: "log-4",
    activity: "User login",
    activityBy: "Jonathan Edward",
    role: "Support",
    date: "2026-08-02",
  },
  {
    id: "log-5",
    activity: "Co-operative disabled",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    date: "2026-08-01",
  },
  {
    id: "log-6",
    activity: "User login",
    activityBy: "Jonathan Edward",
    role: "Support",
    date: "2026-07-30",
  },
  {
    id: "log-7",
    activity: "Role created",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    date: "2026-07-28",
  },
];
