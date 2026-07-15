import type { ReactNode } from "react";
import { AppLaunchGate } from "@/components/brand/app-launch-gate";
import { CenteredAuthLayout } from "@/components/layouts/centered-auth-layout";

export default function PasswordRecoveryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppLaunchGate>
      <CenteredAuthLayout>{children}</CenteredAuthLayout>
    </AppLaunchGate>
  );
}
