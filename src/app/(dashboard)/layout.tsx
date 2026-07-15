"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AnimatedLogo } from "@/components/brand/animated-logo";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { useMinimumDuration } from "@/hooks/use-minimum-duration";
import { useAuthStore } from "@/store/auth.store";

export default function DashboardRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const member = useAuthStore((state) => state.member);
  const showDashboard = useMinimumDuration(hasHydrated && !!member, 1600);

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
    <DashboardShell member={member} page="Dashboard">
      {children}
    </DashboardShell>
  );
}
