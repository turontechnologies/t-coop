"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppLaunchGate } from "@/components/brand/app-launch-gate";
import { AuthLayout } from "@/components/layouts/auth-layout";

export default function AuthRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRegister = pathname.startsWith("/register");

  return (
    <AppLaunchGate>
      <AuthLayout
        formClassName={isRegister ? "max-w-md" : undefined}
        reversed={isRegister}
      >
        {children}
      </AuthLayout>
    </AppLaunchGate>
  );
}
