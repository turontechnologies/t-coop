"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, X } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/brand/logo-mark";
import { Button } from "@/components/ui/button";
import { getNavItems } from "@/config/dashboard-nav";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

interface DashboardSidebarProps {
  role: UserRole;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function DashboardSidebar({
  role,
  mobileOpen,
  onMobileClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const navItems = getNavItems(role);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
              <LogoMark className="size-5 text-white" />
            </span>
            <span className="text-base font-semibold">T-Cooperative</span>
          </div>
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

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = !!item.href && pathname === item.href;

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white",
                    isActive && "bg-white/15 text-white",
                  )}
                >
                  <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={() =>
                  toast.info(`${item.label} is coming soon`, {
                    description: "This section isn't wired up yet.",
                  })
                }
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4.5 shrink-0" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
