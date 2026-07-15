import type { ReactNode } from "react";
import { CenteredAuthLayout } from "@/components/layouts/centered-auth-layout";

export default function PasswordRecoveryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <CenteredAuthLayout>{children}</CenteredAuthLayout>;
}
