"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthBrandPanel } from "@/components/features/auth/auth-brand-panel";
import { AuthModeSwitch } from "@/components/features/auth/auth-mode-switch";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
  formClassName?: string;
  reversed?: boolean;
}

export function AuthLayout({
  children,
  formClassName,
  reversed = false,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: reversed ? 48 : -48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(reversed && "lg:order-2")}
      >
        <AuthBrandPanel />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: reversed ? -48 : 48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative flex flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-16",
          reversed && "lg:order-1",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="rounded-lg bg-sidebar px-2.5 py-1.5 lg:hidden">
            <Logo className="h-6 w-auto" />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10">
          <AuthModeSwitch active={reversed ? "register" : "login"} />
          <div className={cn("w-full max-w-sm", formClassName)}>{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
