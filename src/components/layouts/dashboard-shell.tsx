"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { ConsolePageBanner } from "@/components/layouts/console-page-banner";
import { ConsoleSidebar } from "@/components/layouts/console-sidebar";
import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layouts/dashboard-topbar";
import { RouteTransition } from "@/components/brand/route-transition";
import { getRoleLabel } from "@/config/dashboard-nav";
import { useCooperativeBranding } from "@/hooks/use-cooperative";
import { formatDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth.service";
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
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const showCoopBranding = member.role === "admin" || member.role === "member";
  const { data: branding } = useCooperativeBranding(
    showCoopBranding ? member.cooperativeId : null,
  );

  // The super admin gets the platform console palette everywhere (see globals.css). It's set on
  // <html> so dialogs and menus rendered outside this tree pick it up too.
  const isConsole = member.role === "super_admin";
  useEffect(() => {
    const root = document.documentElement;
    if (isConsole) root.setAttribute("data-console", "");
    else root.removeAttribute("data-console");
    return () => root.removeAttribute("data-console");
  }, [isConsole]);

  const handleLogout = () => {
    setMobileOpen(false);
    setSigningOut(true);
  };

  if (signingOut) {
    return (
      <RouteTransition
        messages={["Signing you out", "Redirecting to login"]}
        onComplete={() => {
          void authService.logout();
          logout();
          queryClient.clear();
          router.push("/login");
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-dvh bg-background",
        // A soft gold light falling across the top of every console page.
        isConsole &&
          "bg-[radial-gradient(55%_35%_at_75%_0%,rgb(212_162_58/0.10),transparent_70%)] dark:bg-[radial-gradient(55%_35%_at_75%_0%,rgb(226_182_90/0.07),transparent_70%)]",
      )}
    >
      {isConsole ? (
        <ConsoleSidebar
          memberName={member.name}
          roleLabel={getRoleLabel(member.role, member.roleName)}
          avatarUrl={member.avatarUrl}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      ) : (
        <DashboardSidebar
          role={member.role}
          cooperativeId={member.cooperativeId}
          permissionModules={member.permissionModules}
          memberName={member.name}
          roleLabel={getRoleLabel(member.role, member.roleName)}
          avatarUrl={member.avatarUrl}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          member={member}
          title={page}
          cooperativeName={branding?.name}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />
        {member.role === "admin" && member.subscriptionActive === false ? (
          <div className="mx-4 mt-5 flex items-start gap-3 rounded-xl sm:mx-6 lg:mx-8 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:px-5">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              <span className="font-semibold">
                Your subscription has expired.
              </span>{" "}
              {member.subscriptionExpiresAt
                ? `It lapsed on ${formatDateLong(new Date(member.subscriptionExpiresAt))}. `
                : ""}
              Every action is blocked until your super admin records your
              renewal — contact Turon Technologies to renew.
            </p>
          </div>
        ) : null}
        <main className="w-full flex-1 animate-fade-in px-4 pb-12 sm:px-6 lg:px-8">
          {isConsole ? <ConsolePageBanner /> : null}
          {children}
        </main>
      </div>
    </div>
  );
}
