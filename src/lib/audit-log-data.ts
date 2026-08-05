export const AUDIT_MODULES = [
  "Authentication",
  "Co-operatives",
  "Members",
  "Savings",
  "Loans",
  "Subscriptions",
  "Notices",
  "Settings",
  "Users",
] as const;
export type AuditModule = (typeof AUDIT_MODULES)[number];

export const AUDIT_ACTIONS = [
  "Login",
  "Create",
  "Update",
  "Delete",
  "Approve",
  "Decline",
  "Payment",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditStatus = "Success" | "Info" | "Warning" | "Failed";

export interface AuditLogEntry {
  id: string;
  /** ISO datetime — real timestamp, not just a date, since this is meant to be a genuine audit trail. */
  date: string;
  activityBy: string;
  role: string;
  module: AuditModule;
  action: AuditAction;
  /** The specific thing acted on — a name, file, or record label, not a sentence. */
  resource: string;
  status: AuditStatus;
  /** Best-effort IP-based location ("Lagos, Lagos, Nigeria"), "Locating…" while resolving, or "Unknown" if it failed. */
  location: string;
  /** The public IP the location was resolved from, same lifecycle as `location`. */
  ipAddress: string;
}

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "log-1",
    date: "2026-08-05T08:02:00.000Z",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    module: "Authentication",
    action: "Login",
    resource: "mayor@gmail.com",
    status: "Success",
    location: "Lagos, Lagos, Nigeria",
    ipAddress: "102.216.200.114",
  },
  {
    id: "log-2",
    date: "2026-08-04T14:30:00.000Z",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    module: "Co-operatives",
    action: "Create",
    resource: "Turon Co-operatives",
    status: "Success",
    location: "Lagos, Lagos, Nigeria",
    ipAddress: "102.216.200.114",
  },
  {
    id: "log-3",
    date: "2026-08-03T11:15:00.000Z",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    module: "Subscriptions",
    action: "Payment",
    resource: "Turon Co-operatives",
    status: "Success",
    location: "Lagos, Lagos, Nigeria",
    ipAddress: "102.216.200.114",
  },
  {
    id: "log-4",
    date: "2026-08-02T09:47:00.000Z",
    activityBy: "Jonathan Edward",
    role: "Support",
    module: "Authentication",
    action: "Login",
    resource: "jonathan@gmail.com",
    status: "Success",
    location: "Abuja, FCT, Nigeria",
    ipAddress: "105.112.30.44",
  },
  {
    id: "log-5",
    date: "2026-08-01T16:20:00.000Z",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    module: "Co-operatives",
    action: "Update",
    resource: "Northbridge Workers' Union",
    status: "Warning",
    location: "Lagos, Lagos, Nigeria",
    ipAddress: "102.216.200.114",
  },
  {
    id: "log-6",
    date: "2026-07-30T09:12:00.000Z",
    activityBy: "Jonathan Edward",
    role: "Support",
    module: "Authentication",
    action: "Login",
    resource: "jonathan@gmail.com",
    status: "Success",
    location: "Abuja, FCT, Nigeria",
    ipAddress: "105.112.30.44",
  },
  {
    id: "log-7",
    date: "2026-07-28T13:05:00.000Z",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    module: "Users",
    action: "Create",
    resource: "Support",
    status: "Success",
    location: "Lagos, Lagos, Nigeria",
    ipAddress: "102.216.200.114",
  },
];
