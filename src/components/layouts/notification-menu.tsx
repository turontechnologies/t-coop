"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { NotificationDetailModal } from "@/components/layouts/notification-detail-modal";
import { formatTimeAgo } from "@/lib/format";
import {
  useNotificationMutations,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/use-notifications";
import type { AppNotification } from "@/types/notification";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 6;

export function NotificationMenu() {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { markRead, markAllRead } = useNotificationMutations();
  const [selected, setSelected] = useState<AppNotification | null>(null);

  if (!member) return null;

  const openNotification = (notification: AppNotification) => {
    if (!notification.read) markRead.mutate(notification.id);
    setSelected(notification);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
              className="relative"
            />
          }
        >
          <Bell className="size-4.5" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between px-3 py-2.5">
            <p className="text-sm font-semibold text-foreground">
              Notifications
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark all as read
              </button>
            ) : null}
          </div>
          <DropdownMenuSeparator className="mx-0" />
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {notifications.slice(0, MAX_VISIBLE).map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(notification)}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        !notification.read ? "bg-primary" : "bg-transparent",
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {notification.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {notification.message}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground/70">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <DropdownMenuSeparator className="mx-0" />
          <button
            type="button"
            onClick={() => router.push("/notifications")}
            className="block w-full px-3 py-2.5 text-center text-xs font-medium text-primary hover:underline"
          >
            View all notifications
          </button>
        </DropdownMenuContent>
      </DropdownMenu>

      <NotificationDetailModal
        notification={selected}
        member={member}
        open={selected !== null}
        onOpenChange={(next) => {
          if (!next) setSelected(null);
        }}
      />
    </>
  );
}
