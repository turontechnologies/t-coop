"use client";

import { useState, type ReactNode } from "react";
import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layouts/dashboard-topbar";
import { DashboardBreadcrumb } from "@/components/layouts/dashboard-breadcrumb";
import { getRoleLabel } from "@/config/dashboard-nav";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background">
      <DashboardSidebar
        role={member.role}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          member={member}
          onMenuClick={() => setMobileOpen(true)}
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
