"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Crown, LogOut, X } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getNavItems } from "@/config/dashboard-nav";
import { useCooperativeBranding } from "@/hooks/use-cooperative";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

interface DashboardSidebarProps {
  role: UserRole;
  /** Null for super_admin/support — see useCooperativeBranding. */
  cooperativeId?: string | null;
  /** Only meaningful for role "support" — see getNavItems. */
  permissionModules?: string[] | null;
  /** Who's signed in — shown in the account card at the bottom. */
  memberName: string;
  roleLabel: string;
  avatarUrl?: string | null;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onLogout: () => void;
}

export function DashboardSidebar({
  role,
  cooperativeId,
  permissionModules,
  memberName,
  roleLabel,
  avatarUrl,
  mobileOpen,
  onMobileClose,
  onLogout,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(role, permissionModules);
  const showCoopBranding = role === "admin" || role === "member";
  // The super admin works in its own "platform console": a midnight sidebar with gold accents
  // and grouped sections, so it never looks like a co-operative's workspace.
  const isConsole = role === "super_admin";
  const { data: branding } = useCooperativeBranding(
    showCoopBranding ? cooperativeId : null,
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-68 shrink-0 flex-col text-sidebar-foreground transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          isConsole
            ? "bg-[#0a0f1f] bg-[radial-gradient(90%_45%_at_0%_0%,rgb(245_158_11/0.16),transparent_60%),radial-gradient(80%_50%_at_100%_100%,rgb(99_102_241/0.22),transparent_60%)] text-white"
            : "bg-sidebar bg-[radial-gradient(120%_60%_at_0%_0%,rgb(255_255_255/0.07),transparent_60%)]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Identity: the co-op this workspace belongs to (or the platform logo). */}
        <div className="flex items-center justify-between gap-2 px-5 pt-6 pb-5">
          {isConsole ? (
            <div className="min-w-0 space-y-2">
              <Logo className="h-7 w-auto" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-amber-950 uppercase shadow-[0_0_20px_-4px_rgb(245_158_11/0.7)]">
                <Crown className="size-3" aria-hidden="true" />
                Platform console
              </span>
            </div>
          ) : showCoopBranding && branding ? (
            <div className="flex min-w-0 items-center gap-3">
              {branding.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary Cloudinary URL
                <img
                  src={branding.logoUrl}
                  alt={branding.name}
                  className="size-10 shrink-0 rounded-xl bg-white object-cover ring-1 ring-white/20"
                />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <Building2 className="size-5" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {branding.name}
                </p>
                <p className="text-xs text-white/55">Co-operative</p>
              </div>
            </div>
          ) : (
            <Logo className="h-7 w-auto" />
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-white hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onMobileClose}
            aria-label="Close menu"
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 pb-4"
          aria-label="Main navigation"
        >
          {isConsole ? null : (
            <p className="px-3 pb-2 text-[0.7rem] font-semibold tracking-wider text-white/45 uppercase">
              Menu
            </p>
          )}
          <ul className="space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive =
                !!item.href &&
                (pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(`${item.href}/`)));
              const className = isConsole
                ? cn(
                    "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/70 transition-all hover:bg-white/[0.07] hover:text-white",
                    isActive &&
                      "bg-gradient-to-r from-amber-300 to-amber-500 font-semibold text-amber-950 shadow-[0_8px_24px_-8px_rgb(245_158_11/0.65)] hover:bg-transparent hover:text-amber-950",
                  )
                : cn(
                    "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white",
                    isActive &&
                      "bg-white font-semibold text-primary shadow-[0_6px_16px_-6px_rgb(0_0_0/0.35)] hover:bg-white hover:text-primary dark:bg-sidebar-primary dark:text-sidebar-primary-foreground",
                  );
              const content = (
                <>
                  <Icon
                    className={cn(
                      "size-[1.15rem] shrink-0 transition-colors",
                      isConsole
                        ? isActive
                          ? "text-amber-950"
                          : "text-white/50 group-hover:text-amber-300"
                        : isActive
                          ? "text-primary dark:text-sidebar-primary-foreground"
                          : "text-white/60 group-hover:text-white",
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.label}</span>
                </>
              );
              const sectionStart =
                isConsole &&
                item.section &&
                item.section !== navItems[index - 1]?.section;

              return (
                <li key={item.label}>
                  {sectionStart ? (
                    <p
                      className={cn(
                        "px-3 pb-1.5 text-[0.68rem] font-semibold tracking-[0.14em] text-white/35 uppercase",
                        index > 0 && "pt-4",
                      )}
                    >
                      {item.section}
                    </p>
                  ) : null}
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={onMobileClose}
                      aria-current={isActive ? "page" : undefined}
                      className={className}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        toast.info(`${item.label} is coming soon`, {
                          description: "This section isn't wired up yet.",
                        })
                      }
                      className={className}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Who's signed in, and the way out. */}
        <div className="border-t border-white/10 p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl p-2.5",
              isConsole
                ? "bg-white/[0.05] ring-1 ring-amber-400/20"
                : "bg-white/[0.06]",
            )}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={memberName}
                width={36}
                height={36}
                className="size-9 shrink-0 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-primary">
                {getInitials(memberName)}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {memberName}
              </p>
              <p
                className={cn(
                  "flex items-center gap-1 truncate text-xs",
                  isConsole ? "text-amber-300/90" : "text-white/55",
                )}
              >
                {isConsole ? (
                  <Crown className="size-3 shrink-0" aria-hidden="true" />
                ) : null}
                {roleLabel}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onLogout}
              className="text-white/70 hover:bg-white/10 hover:text-white"
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
