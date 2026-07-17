"use client";

import { useRouter } from "next/navigation";
import { CalendarDays, ChevronDown, LogOut, Menu, User } from "lucide-react";
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
import type { AuthenticatedMember } from "@/types/auth";

interface DashboardTopbarProps {
  member: AuthenticatedMember;
  onMenuClick: () => void;
  onLogout: () => void;
}

export function DashboardTopbar({
  member,
  onMenuClick,
  onLogout,
}: DashboardTopbarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="size-4.5" />
        </Button>
        <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
          <CalendarDays className="size-4" aria-hidden="true" />
          <span>
            Today&apos;s Date:{" "}
            <span className="font-medium text-foreground">
              {formatTodayLong()}
            </span>
          </span>
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
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {getInitials(member.name)}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-medium text-foreground">
                {member.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {member.email}
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
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
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
