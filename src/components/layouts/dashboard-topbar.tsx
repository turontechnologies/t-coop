"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, LogOut, Menu, User } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-30 flex h-18 items-center justify-between gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
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
          <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
            {title}
          </h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {cooperativeName ? `${cooperativeName} · ` : ""}
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
