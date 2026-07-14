import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CreditCard,
  LayoutGrid,
  Landmark,
  LifeBuoy,
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
};

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  super_admin: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Co-operatives", icon: Building2 },
    { label: "Savings & Contributions", icon: PiggyBank },
    { label: "Loans", icon: Landmark },
    { label: "Subscriptions", icon: CreditCard },
    { label: "Support", icon: LifeBuoy },
    { label: "Settings", icon: Settings },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Members Directory", icon: Users },
    { label: "Savings & Contributions", icon: PiggyBank },
    { label: "Loans", icon: Landmark },
    { label: "Support", icon: LifeBuoy },
    { label: "Settings", icon: Settings },
  ],
  member: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "My Profile", icon: User },
    { label: "Savings & Contributions", icon: PiggyBank },
    { label: "Loans", icon: Landmark },
    { label: "Support", icon: LifeBuoy },
    { label: "Settings", icon: Settings },
  ],
};

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABEL[role];
}

export function getNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS[role];
}
