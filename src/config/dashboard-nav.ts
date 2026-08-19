import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CreditCard,
  LayoutGrid,
  Landmark,
  LifeBuoy,
  Megaphone,
  PiggyBank,
  Settings,
  User,
  Users,
} from "lucide-react";
import type { UserRole } from "@/types/auth";

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
}

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super Administrator",
  admin: "Administrator",
  member: "Member",
  // Platform staff can be assigned any custom PlatformRole name (Support, Billing, …) — this
  // breadcrumb has no access to that name from a bare UserRole, so it stays generic.
  support: "Platform Staff",
};

/** Every nav item's `label` matches a PERMISSION_MODULES string exactly (see
 * src/lib/settings-data.ts) — `support`'s list below is the full canonical set, filtered down
 * to whatever the signed-in staff member's assigned PlatformRole actually grants (see
 * getNavItems). Every other role's list is fixed, unaffected by permissions. */
const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  super_admin: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Co-operatives", href: "/co-operatives", icon: Building2 },
    { label: "Notice Board", href: "/notice-board", icon: Megaphone },
    { label: "Savings & Contributions", href: "/savings", icon: PiggyBank },
    { label: "Loans", href: "/loans", icon: Landmark },
    { label: "Subscriptions", href: "/subscriptions", icon: CreditCard },
    { label: "Support", icon: LifeBuoy },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Members Directory", href: "/members", icon: Users },
    { label: "Notice Board", href: "/notice-board", icon: Megaphone },
    { label: "Savings & Contributions", href: "/savings", icon: PiggyBank },
    { label: "Loans", href: "/loans", icon: Landmark },
    { label: "Support", href: "/support", icon: LifeBuoy },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  member: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "My Profile", href: "/profile", icon: User },
    { label: "Notice Board", href: "/notice-board", icon: Megaphone },
    { label: "Savings & Contributions", href: "/savings", icon: PiggyBank },
    { label: "Loans", href: "/loans", icon: Landmark },
    { label: "Support", icon: LifeBuoy },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
  support: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Co-operatives", href: "/co-operatives", icon: Building2 },
    { label: "Notice Board", href: "/notice-board", icon: Megaphone },
    { label: "Savings & Contributions", href: "/savings", icon: PiggyBank },
    { label: "Loans", href: "/loans", icon: Landmark },
    { label: "Subscriptions", href: "/subscriptions", icon: CreditCard },
    { label: "Members Directory", href: "/members", icon: Users },
    { label: "Support", icon: LifeBuoy },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABEL[role];
}

/** `permissionModules` only matters for role "support" — every other role's nav is fixed,
 * ignoring whatever's passed. Null/undefined for a support user (shouldn't normally happen —
 * every real invite carries a role) means "no modules," not "all modules." */
export function getNavItems(
  role: UserRole,
  permissionModules?: string[] | null,
): NavItem[] {
  const items = NAV_ITEMS[role];
  if (role !== "support") return items;
  const allowed = new Set(permissionModules ?? []);
  return items.filter((item) => allowed.has(item.label));
}
