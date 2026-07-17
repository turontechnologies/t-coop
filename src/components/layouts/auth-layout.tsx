"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthBrandPanel } from "@/components/features/auth/auth-brand-panel";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <AuthBrandPanel />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-16"
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
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
