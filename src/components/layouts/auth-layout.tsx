import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthBrandPanel } from "@/components/features/auth/auth-brand-panel";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  formClassName?: string;
}

export function AuthLayout({ children, formClassName }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <AuthBrandPanel />

      <div className="relative flex flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-16">
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-sidebar px-2.5 py-1.5 lg:hidden">
            <Logo className="h-6 w-auto" />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className={cn("w-full max-w-sm", formClassName)}>{children}</div>
        </div>
      </div>
    </div>
  );
}
