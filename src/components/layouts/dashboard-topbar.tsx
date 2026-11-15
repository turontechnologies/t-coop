"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, Crown, LogOut, Menu, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NotificationMenu } from "@/components/layouts/notification-menu";
import { formatTodayLong, getInitials } from "@/lib/format";
import { getRoleLabel } from "@/config/dashboard-nav";
import type { AuthenticatedMember } from "@/types/auth";

interface DashboardTopbarProps {
  member: AuthenticatedMember;
  /** The current page's name — the big title on the left. */
  title: string;
  /** The signed-in member's co-op, shown under the title. */
  cooperativeName?: string | null;
  onMenuClick: () => void;
  onLogout: () => void;
}

export function DashboardTopbar({
  member,
  title,
  cooperativeName,
  onMenuClick,
  onLogout,
}: DashboardTopbarProps) {
  const router = useRouter();
  const isConsole = member.role === "super_admin";

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-18 items-center justify-between gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8",
        // A thin gold line marks every super admin page as the platform console.
        isConsole &&
          "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-amber-400/0 after:via-amber-400/70 after:to-indigo-500/0",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-4.5" />
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
              {title}
            </h1>
            {isConsole ? (
              <span className="hidden shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-950 uppercase sm:inline-flex">
                <Crown className="size-3" aria-hidden="true" />
                Super admin
              </span>
            ) : null}
          </div>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {isConsole
              ? "Whole platform · "
              : cooperativeName
                ? `${cooperativeName} · `
                : ""}
            {formatTodayLong()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationMenu />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 outline-none hover:bg-muted focus-visible:bg-muted"
              />
            }
          >
            {member.avatarUrl ? (
              <Image
                src={member.avatarUrl}
                alt={member.name}
                width={32}
                height={32}
                className="size-8 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {getInitials(member.name)}
              </span>
            )}
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium text-foreground">
                {member.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {getRoleLabel(member.role, member.roleName)}
              </span>
            </span>
            <ChevronDown
              className="hidden size-4 text-muted-foreground sm:block"
              aria-hidden="true"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-1.5 py-1.5">
              <p className="text-sm font-medium text-foreground">
                {member.name}
              </p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
              <p className="text-xs text-muted-foreground">
                {getRoleLabel(member.role, member.roleName)}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                router.push(
                  member.role === "super_admin" ? "/settings" : "/profile",
                )
              }
            >
              <User className="size-4" aria-hidden="true" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
