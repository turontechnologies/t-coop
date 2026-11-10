"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthBrandPanel } from "@/components/features/auth/auth-brand-panel";

interface AuthLayoutProps {
  children: ReactNode;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <AuthBrandPanel />
      </motion.div>

      <div className="relative flex flex-col overflow-hidden bg-background px-5 py-6 sm:px-10 sm:py-8 lg:px-16">
        {/* soft dotted texture + glow behind the form */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,color-mix(in_oklch,var(--foreground)_9%,transparent)_1px,transparent_0)] [background-size:22px_22px] [mask-image:radial-gradient(70%_60%_at_50%_45%,black,transparent)]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute top-1/2 left-1/2 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-between">
          <div className="rounded-xl bg-sidebar px-3 py-2 shadow-card lg:hidden">
            <Logo className="h-6 w-auto" />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
            className="w-full max-w-md rounded-3xl bg-card/90 p-7 shadow-raised ring-1 ring-border/70 backdrop-blur sm:p-9"
          >
            {children}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-6 text-center text-xs text-muted-foreground"
          >
            Secured with encrypted sessions and one-time passcodes.
          </motion.p>
        </div>
      </div>
    </div>
  );
}
