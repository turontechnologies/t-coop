"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatedLogo } from "@/components/brand/animated-logo";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { useMinimumDuration } from "@/hooks/use-minimum-duration";
import { hasAppIntroShown } from "@/lib/app-intro";
import { useAuthStore } from "@/store/auth.store";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/profile": "My Profile",
  "/savings": "Savings & Contributions",
  "/loans": "Loans",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/savings/")) return "Savings Details";
  if (pathname.startsWith("/loans/")) return "Loan Details";
  return "Dashboard";
}

export default function DashboardRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const member = useAuthStore((state) => state.member);

  // Evaluated once per mount: a fresh page load/reload always resets this,
  // so a direct or reloaded visit gets the full branded intro. Arriving via
  // an already-animated transition (e.g. straight from login) skips it.
  const [needsFullIntro] = useState(() => !hasAppIntroShown());
  const showDashboard = useMinimumDuration(
    hasHydrated && !!member,
    needsFullIntro ? 5000 : 300,
  );

  useEffect(() => {
    if (hasHydrated && !member) {
      router.replace("/login");
    }
  }, [hasHydrated, member, router]);

  if (!showDashboard || !member) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <AnimatedLogo />
      </div>
    );
  }

  return (
    <DashboardShell member={member} page={getPageTitle(pathname)}>
      {children}
    </DashboardShell>
  );
}
