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
  "/co-operatives": "Co-operatives",
  "/co-operatives/new": "Add New Co-operative",
  "/members": "Members Directory",
  "/members/new": "Add New Member",
  "/notice-board": "Notice Board",
  "/notice-board/new": "Create Notice",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/savings/record/")) return "Savings Details";
  if (pathname.startsWith("/savings/type/")) return "Savings Record";
  if (pathname.startsWith("/savings/")) return "Savings Details";
  if (pathname.startsWith("/loans/record/")) return "Loan Details";
  if (pathname.startsWith("/loans/type/")) return "Loan Record";
  if (pathname.startsWith("/loans/request/")) return "Loan Request";
  if (pathname.startsWith("/loans/")) return "Loan Details";
  if (pathname.startsWith("/members/")) return "Member Details";
  if (pathname.startsWith("/notice-board/")) return "Notice Details";
  if (/^\/co-operatives\/[^/]+\/members\//.test(pathname))
    return "Member Details";
  if (/^\/co-operatives\/[^/]+\/savings\/record\//.test(pathname))
    return "Savings Details";
  if (/^\/co-operatives\/[^/]+\/savings\//.test(pathname))
    return "Savings Record";
  if (/^\/co-operatives\/[^/]+\/loans\/record\//.test(pathname))
    return "Loan Details";
  if (/^\/co-operatives\/[^/]+\/loans\//.test(pathname)) return "Loan Record";
  if (pathname.startsWith("/co-operatives/")) return "Co-operative Details";
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
