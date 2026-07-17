import type { ReactNode } from "react";
import { AppLaunchGate } from "@/components/brand/app-launch-gate";
import { AuthLayout } from "@/components/layouts/auth-layout";

export default function AuthRouteLayout({ children }: { children: ReactNode }) {
  return (
    <AppLaunchGate>
      <AuthLayout>{children}</AuthLayout>
    </AppLaunchGate>
  );
}
