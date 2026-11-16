"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { getNavItems } from "@/config/dashboard-nav";

const EASE = [0.16, 1, 0.3, 1] as const;

/** One line for each console page; pages not listed (dashboard, settings) have their own hero. */
const DESCRIPTIONS: Record<string, string> = {
  "/co-operatives":
    "Every co-operative on T-Coop: members, money and subscription status.",
  "/subscriptions": "Who has paid, who is due, and renewals to record.",
  "/notice-board": "Notices and meetings you send to co-operatives.",
  "/savings": "Savings and contributions across every co-operative.",
  "/loans": "Loans across every co-operative, from request to final repayment.",
  "/support": "Questions and issues raised by co-operatives and members.",
};

/**
 * The banner at the top of each main super admin page, so every page carries the same console
 * look as the dashboard's command centre and Settings: deep green with gold, the page's icon
 * and the section it belongs to. Only on the main page of each section, not on detail pages.
 */
export function ConsolePageBanner() {
  const pathname = usePathname();
  const description = DESCRIPTIONS[pathname];
  const item = getNavItems("super_admin").find((nav) => nav.href === pathname);
  if (!description || !item) return null;
  const Icon = item.icon;

  return (
    <motion.section
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="relative mt-6 overflow-hidden rounded-3xl bg-console px-5 py-5 text-white shadow-raised sm:px-7 sm:py-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [mask-image:linear-gradient(to_right,black,transparent)] [background-size:22px_22px]"
      />
      <Icon
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -bottom-8 size-40 rotate-[-12deg] text-white/[0.06]"
      />
      <div className="relative flex items-center gap-4">
        <motion.span
          initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 340,
            damping: 22,
            delay: 0.1,
          }}
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f6dc9a] via-[#e2b65a] to-[#a8781f] text-[#1b1404] shadow-[0_8px_24px_-6px_rgb(226_182_90/0.7)]"
        >
          <Icon className="size-6" aria-hidden="true" />
        </motion.span>
        <div className="min-w-0">
          {item.section ? (
            <p className="text-[10px] font-semibold tracking-[0.22em] text-gold uppercase">
              Platform console · {item.section}
            </p>
          ) : null}
          <h2 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
            {item.label}
          </h2>
          <p className="text-sm text-white/70">{description}</p>
        </div>
      </div>
    </motion.section>
  );
}
