"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthModeSwitchProps {
  active: "login" | "register";
}

const OPTIONS = [
  { mode: "login", label: "Login", href: "/login", icon: LogIn },
  { mode: "register", label: "Register", href: "/register", icon: UserPlus },
] as const;

export function AuthModeSwitch({ active }: AuthModeSwitchProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex w-full max-w-sm rounded-full bg-muted p-1"
      role="tablist"
      aria-label="Switch between login and register"
    >
      {OPTIONS.map(({ mode, label, href, icon: Icon }) => {
        const isActive = mode === active;
        return (
          <Link
            key={mode}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="auth-mode-highlight"
                className="absolute inset-0 rounded-full bg-card shadow-sm ring-1 ring-foreground/10"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            ) : null}
            <Icon className="relative z-10 size-3.5" aria-hidden="true" />
            <span className="relative z-10">{label}</span>
          </Link>
        );
      })}
    </motion.div>
  );
}
