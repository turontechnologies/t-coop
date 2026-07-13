"use client";

import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const HIGHLIGHTS = [
  {
    icon: Users,
    label: "9 co-operatives, 900+ members",
    description: "Every society on one ledger.",
  },
  {
    icon: TrendingUp,
    label: "Real-time savings & loans",
    description: "Live activity across your network.",
  },
  {
    icon: ShieldCheck,
    label: "Bank-grade security",
    description: "OTP verification on every session.",
  },
];

export function AuthBrandPanel() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#00654A_0%,#00543D_45%,#003224_100%)] px-12 py-12 text-white lg:flex">
      <BackgroundDecoration />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative"
      >
        <Logo priority className="h-9 w-auto" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        className="relative max-w-md space-y-8"
      >
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wider text-white/60">
            T-Cooperative Platform
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-balance">
            The operating system for your co-operative.
          </h1>
          <p className="text-base leading-relaxed text-white/70">
            Savings, contributions, loans, and dividends — managed with the
            precision your members expect.
          </p>
        </div>

        <ul className="space-y-4">
          {HIGHLIGHTS.map(({ icon: Icon, label, description }, index) => (
            <motion.li
              key={label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.25 + index * 0.1,
                ease: "easeOut",
              }}
              className="flex items-start gap-3"
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                <Icon className="size-4.5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-sm text-white/60">{description}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative text-sm text-white/50"
      >
        © {new Date().getFullYear()} T-Cooperative. All rights reserved.
      </motion.p>
    </div>
  );
}

function BackgroundDecoration() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute -top-24 -right-24 size-96 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 size-80 rounded-full bg-emerald-300/10 blur-3xl" />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="white"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}
