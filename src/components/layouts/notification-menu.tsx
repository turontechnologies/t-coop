"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { INITIAL_NOTIFICATIONS } from "@/lib/notifications-data";
import { cn } from "@/lib/utils";

export function NotificationMenu() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  };

  return (
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
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-medium text-primary hover:underline"
            >
              Mark all as read
            </button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="mx-0" />
        <ul className="max-h-80 overflow-y-auto py-1">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                onClick={() => markAsRead(notification.id)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted"
              >
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    notification.read ? "bg-transparent" : "bg-primary",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {notification.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {notification.description}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground/70">
                    {notification.time}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
