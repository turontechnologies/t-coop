"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layouts/dashboard-topbar";
import { DashboardBreadcrumb } from "@/components/layouts/dashboard-breadcrumb";
import { RouteTransition } from "@/components/brand/route-transition";
import { getRoleLabel } from "@/config/dashboard-nav";
import { useAuthStore } from "@/store/auth.store";
import type { AuthenticatedMember } from "@/types/auth";

interface DashboardShellProps {
  member: AuthenticatedMember;
  page: string;
  children: ReactNode;
}

export function DashboardShell({
  member,
  page,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = () => {
    setMobileOpen(false);
    setSigningOut(true);
  };

  if (signingOut) {
    return (
      <RouteTransition
        messages={["Signing you out", "Redirecting to login"]}
        onComplete={() => {
          logout();
          router.push("/login");
        }}
      />
    );
  }

  return (
    <div className="flex min-h-dvh bg-background">
      <DashboardSidebar
        role={member.role}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          member={member}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />
        <DashboardBreadcrumb
          roleLabel={getRoleLabel(member.role)}
          page={page}
        />
        <main className="flex-1 px-4 pb-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
