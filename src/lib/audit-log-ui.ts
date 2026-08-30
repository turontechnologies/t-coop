import {
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Info,
  KeyRound,
  Landmark,
  LifeBuoy,
  LogOut,
  Megaphone,
  Pencil,
  PiggyBank,
  Plus,
  Settings as SettingsIcon,
  Trash2,
  TriangleAlert,
  UserCog,
  Users,
  Wallet,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  AuditAction,
  AuditModule,
  AuditStatus,
} from "@/lib/audit-log-data";

export const MODULE_ICONS: Record<AuditModule, LucideIcon> = {
  Authentication: KeyRound,
  "Co-operatives": Building2,
  Members: Users,
  Savings: PiggyBank,
  Loans: Landmark,
  Subscriptions: CreditCard,
  Notices: Megaphone,
  Settings: SettingsIcon,
  Users: UserCog,
  Support: LifeBuoy,
};

export const ACTION_ICONS: Record<AuditAction, LucideIcon> = {
  Login: KeyRound,
  Logout: LogOut,
  Create: Plus,
  Update: Pencil,
  Delete: Trash2,
  Approve: Check,
  Decline: X,
  Payment: Wallet,
};

export const STATUS_STYLES: Record<
  AuditStatus,
  { icon: LucideIcon; badgeClassName: string; bannerClassName: string }
> = {
  Success: {
    icon: CheckCircle2,
    badgeClassName: "bg-success/15 text-success",
    bannerClassName: "bg-success/10 text-success ring-success/20",
  },
  Info: {
    icon: Info,
    badgeClassName: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
    bannerClassName:
      "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-300",
  },
  Warning: {
    icon: TriangleAlert,
    badgeClassName: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    bannerClassName:
      "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-300",
  },
  Failed: {
    icon: XCircle,
    badgeClassName: "bg-destructive/15 text-destructive",
    bannerClassName: "bg-destructive/10 text-destructive ring-destructive/20",
  },
};

export const STATUS_MESSAGE: Record<AuditStatus, string> = {
  Success: "The activity was completed successfully.",
  Info: "An informational event — nothing requires action.",
  Warning: "Completed, but flagged for review.",
  Failed: "The activity did not complete.",
};

// The `AuditModule`/`AuditAction`/`AuditStatus` types are compile-time
// narrowing only — an entry from the real backend is just `string` at
// runtime, and historical rows (or a future backend change) can carry a
// value with no icon mapping. Plain object indexing (`MODULE_ICONS[x]`)
// then returns `undefined`, which React throws on trying to render as a
// component and takes the whole tab down with it. These fall back to a
// neutral icon/style instead of crashing.
const FALLBACK_STATUS_STYLE = {
  icon: HelpCircle,
  badgeClassName: "bg-muted text-muted-foreground",
  bannerClassName: "bg-muted text-muted-foreground ring-border",
};

export function getModuleIcon(module: string): LucideIcon {
  return MODULE_ICONS[module as AuditModule] ?? HelpCircle;
}

export function getActionIcon(action: string): LucideIcon {
  return ACTION_ICONS[action as AuditAction] ?? HelpCircle;
}

export function getStatusStyle(status: string) {
  return STATUS_STYLES[status as AuditStatus] ?? FALLBACK_STATUS_STYLE;
}

export function getStatusMessage(status: string): string {
  return STATUS_MESSAGE[status as AuditStatus] ?? "Unrecognized status.";
}
