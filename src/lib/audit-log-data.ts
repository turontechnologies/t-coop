export interface AuditLogEntry {
  id: string;
  activity: string;
  activityBy: string;
  role: string;
  /** ISO datetime — real timestamp, not just a date, since this is meant to be a genuine audit trail. */
  date: string;
  /** Best-effort IP-based location ("Lagos, Lagos State, Nigeria"), "Locating…" while resolving, or "Unknown" if it failed. */
  location: string;
}

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "log-1",
    activity: "User login",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    date: "2026-08-05T08:02:00.000Z",
    location: "Lagos, Lagos State, Nigeria",
  },
  {
    id: "log-2",
    activity: "Co-operative created",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    date: "2026-08-04T14:30:00.000Z",
    location: "Lagos, Lagos State, Nigeria",
  },
  {
    id: "log-3",
    activity: "Subscription payment recorded for Turon Co-operatives",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    date: "2026-08-03T11:15:00.000Z",
    location: "Lagos, Lagos State, Nigeria",
  },
  {
    id: "log-4",
    activity: "User login",
    activityBy: "Jonathan Edward",
    role: "Support",
    date: "2026-08-02T09:47:00.000Z",
    location: "Abuja, FCT, Nigeria",
  },
  {
    id: "log-5",
    activity: "Co-operative disabled",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    date: "2026-08-01T16:20:00.000Z",
    location: "Lagos, Lagos State, Nigeria",
  },
  {
    id: "log-6",
    activity: "User login",
    activityBy: "Jonathan Edward",
    role: "Support",
    date: "2026-07-30T09:12:00.000Z",
    location: "Abuja, FCT, Nigeria",
  },
  {
    id: "log-7",
    activity: "Role created: Support",
    activityBy: "Falola Mayowa",
    role: "Super Administrator",
    date: "2026-07-28T13:05:00.000Z",
    location: "Lagos, Lagos State, Nigeria",
  },
];
