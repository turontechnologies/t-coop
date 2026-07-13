import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo-mark";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthBrandPanel } from "@/components/features/auth/auth-brand-panel";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <AuthBrandPanel />

      <div className="relative flex flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-16">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <LogoMark className="size-7" />
            <span className="text-base font-semibold text-foreground">
              T-Cooperative
            </span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
