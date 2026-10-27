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
  "Support",
] as const;
export type AuditModule = (typeof AUDIT_MODULES)[number];

export const AUDIT_ACTIONS = [
  "Login",
  "Logout",
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
