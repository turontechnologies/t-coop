"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatedLogo } from "@/components/brand/animated-logo";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { useMinimumDuration } from "@/hooks/use-minimum-duration";
import { hasAppIntroShown } from "@/lib/app-intro";
import { getDirectoryCoop } from "@/lib/member-directory";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { useCoopStore } from "@/store/coop.store";

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
  "/subscriptions": "Subscriptions",
  "/settings": "Settings",
  "/support": "Support",
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
  if (pathname.startsWith("/subscriptions/"))
    return "Co-operative Subscription Details";
  if (pathname === "/settings/loans/new") return "New Loan Type";
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
  const cooperatives = useCoopStore((state) => state.cooperatives);

  // Admin's whole area revolves around one co-op — its currency applies
  // everywhere in their pages by default. Super admin's aggregate/dashboard
  // views default to the platform base (NGN); per-co-op super-admin screens
  // (e.g. /co-operatives/[id]/**) nest their own narrower CurrencyProvider.
  // Member's own pages use a separate personal data model with no co-op
  // link yet, so they also default to NGN — see currency-conversion.md.
  const currency =
    member?.role === "admin"
      ? (getDirectoryCoop(cooperatives)?.currency ?? "NGN")
      : "NGN";

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

  // The persisted session only carries what login returned — if a super
  // admin renews/disables this admin's co-op after they signed in, their
  // cached `subscriptionActive` would otherwise stay stale until their next
  // login. One re-fetch per dashboard visit keeps the renewal banner (and
  // whatever a super admin just changed) honest without needing a fresh
  // login. Deliberately scoped to "admin" — the only role that has a
  // subscription banner to show.
  const memberId = member?.id;
  const memberRole = member?.role;
  useEffect(() => {
    if (memberRole !== "admin" || !memberId) return;
    authService
      .me()
      .then((fresh) => {
        if (fresh) useAuthStore.getState().setMember(fresh);
      })
      .catch(() => {
        // Best-effort refresh — a failed request here shouldn't block the
        // page; the enforcement filter is the real source of truth anyway.
      });
  }, [memberId, memberRole, pathname]);

  // A dormant admin (subscription expired/never paid) can only reach /support — that's the
  // one page that still works while everything else is locked (SubscriptionGateFilter blocks
  // the writes; this redirect keeps them from even landing on a read-only page that can't do
  // anything useful for them). Renewing there flips subscriptionActive back on the very next
  // authService.me() refresh above, which naturally stops this redirect from firing again.
  useEffect(() => {
    if (
      member?.role === "admin" &&
      member.subscriptionActive === false &&
      pathname !== "/support"
    ) {
      router.replace("/support");
    }
  }, [member, pathname, router]);

  if (!showDashboard || !member) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <AnimatedLogo />
      </div>
    );
  }

  return (
    <CurrencyProvider currency={currency}>
      <DashboardShell member={member} page={getPageTitle(pathname)}>
        {children}
      </DashboardShell>
    </CurrencyProvider>
  );
}
