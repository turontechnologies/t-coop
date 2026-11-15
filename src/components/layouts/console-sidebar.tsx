"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Crown, LogOut, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/features/settings/payment-ui";
import { getNavItems } from "@/config/dashboard-nav";
import {
  useCoopPlatformFees,
  usePlatformEarnings,
} from "@/hooks/use-platform-earnings";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ConsoleSidebarProps {
  memberName: string;
  roleLabel: string;
  avatarUrl?: string | null;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onLogout: () => void;
}

function isoDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * The super admin's sidebar: the platform console. Midnight navy with gold, grouped sections,
 * a sliding gold marker on the current page, and this month's earnings at a glance.
 */
export function ConsoleSidebar({
  memberName,
  roleLabel,
  avatarUrl,
  mobileOpen,
  onMobileClose,
  onLogout,
}: ConsoleSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems("super_admin");
  const now = new Date();
  const earnings = usePlatformEarnings(
    isoDay(new Date(now.getFullYear(), now.getMonth(), 1)),
    isoDay(now),
  ).data;
  const coops = useCoopPlatformFees().data;

  return (
    <>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-[#011510]/70 backdrop-blur-sm lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col overflow-hidden bg-console-sidebar text-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Atmosphere: gold glow top-left, emerald bottom-right, a fine grain of dots. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-24 size-80 rounded-full bg-[#e2b65a]/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -bottom-40 size-96 rounded-full bg-emerald-400/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:18px_18px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#e2b65a]/40 to-transparent"
        />

        <div className="relative flex items-start justify-between gap-2 px-5 pt-6 pb-5">
          <div className="min-w-0 space-y-3">
            <Logo className="h-7 w-auto" priority />
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-[#f6dc9a] via-[#e2b65a] to-[#a8781f] shadow-[0_0_18px_-2px_rgb(226_182_90/0.8)]">
                <Crown className="size-3.5 text-[#1b1404]" aria-hidden="true" />
              </span>
              <span className="text-[11px] font-semibold tracking-[0.22em] text-gold uppercase">
                Platform console
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </Button>
        </div>

        <Link
          href="/settings#payment"
          onClick={onMobileClose}
          className="group relative mx-4 mb-4 overflow-hidden rounded-2xl border border-[#e2b65a]/25 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-3.5 backdrop-blur-sm transition-colors hover:border-[#e2b65a]/50"
        >
          <div
            aria-hidden="true"
            className="absolute -top-8 -right-8 size-24 rounded-full bg-[#e2b65a]/20 blur-2xl transition-opacity group-hover:opacity-100"
          />
          <div className="relative flex items-center justify-between">
            <p className="text-[11px] font-medium tracking-wide text-white/55 uppercase">
              Earned this month
            </p>
            <ArrowUpRight
              className="size-3.5 text-white/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
              aria-hidden="true"
            />
          </div>
          <p className="relative mt-1 text-xl font-bold tracking-tight text-white">
            {earnings ? <AnimatedNumber value={earnings.total} /> : "—"}
          </p>
          <p className="relative text-[11px] text-white/45">
            {coops ? `Across ${coops.length} co-operatives` : "Loading…"}
          </p>
        </Link>

        <nav
          className="relative flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:rgb(226_182_90/0.3)_transparent]"
          aria-label="Main navigation"
        >
          <ul className="space-y-0.5">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive =
                !!item.href &&
                (pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(`${item.href}/`)));
              const sectionStart =
                item.section && item.section !== navItems[index - 1]?.section;

              return (
                <li key={item.label}>
                  {sectionStart ? (
                    <p
                      className={cn(
                        "flex items-center gap-2 px-3 pb-2 text-[10px] font-semibold tracking-[0.2em] text-[#e2b65a]/60 uppercase",
                        index > 0 && "pt-5",
                      )}
                    >
                      <span className="h-px w-3 bg-[#e2b65a]/40" />
                      {item.section}
                    </p>
                  ) : null}
                  <Link
                    href={item.href ?? "#"}
                    onClick={onMobileClose}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "text-white"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white",
                    )}
                  >
                    {isActive ? (
                      <motion.span
                        layoutId="console-nav-active"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 38,
                        }}
                        className="absolute inset-0 rounded-xl border border-[#e2b65a]/25 bg-gradient-to-r from-[#e2b65a]/20 via-[#e2b65a]/[0.07] to-transparent"
                      >
                        <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-gradient-to-b from-[#f6dc9a] to-[#c9932c] shadow-[0_0_12px_rgb(226_182_90/0.9)]" />
                      </motion.span>
                    ) : null}
                    <span
                      className={cn(
                        "relative flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-br from-[#f6dc9a] to-[#c9932c] text-[#1b1404] shadow-[0_4px_14px_-4px_rgb(226_182_90/0.8)]"
                          : "bg-white/[0.04] text-white/55 ring-1 ring-white/[0.06] group-hover:text-gold group-hover:ring-[#e2b65a]/30",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="relative truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="relative border-t border-[#e2b65a]/15 p-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5 ring-1 ring-white/[0.06]">
            <span className="relative shrink-0 rounded-full bg-gradient-to-br from-[#f6dc9a] to-[#a8781f] p-[2px]">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={memberName}
                  width={36}
                  height={36}
                  className="size-9 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-9 items-center justify-center rounded-full bg-[#012a1f] text-xs font-semibold text-gold">
                  {getInitials(memberName)}
                </span>
              )}
              <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-[#012a1f] bg-emerald-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {memberName}
              </p>
              <p className="flex items-center gap-1 truncate text-[11px] text-gold">
                <Crown className="size-3 shrink-0" aria-hidden="true" />
                {roleLabel}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onLogout}
              className="text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
