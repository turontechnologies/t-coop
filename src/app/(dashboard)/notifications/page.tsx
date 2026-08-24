"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { formatTimeAgo } from "@/lib/format";
import {
  useNotificationMutations,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/use-notifications";
import type { AppNotification } from "@/types/notification";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const router = useRouter();
  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { markRead, markAllRead } = useNotificationMutations();

  const open = (notification: AppNotification) => {
    if (!notification.read) markRead.mutate(notification.id);
    if (notification.link) router.push(notification.link);
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        {unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            Mark all as read
          </Button>
        ) : null}
      </div>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
        errorTitle="Couldn't load your notifications"
      >
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <Bell className="size-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">
                You&apos;re all caught up
              </p>
              <p className="text-sm text-muted-foreground">
                Nothing here yet — you&apos;ll see subscription, member, and
                notice board updates as they happen.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => open(notification)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-4 text-left hover:bg-muted/50",
                        !notification.read && "bg-primary/[0.03]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          !notification.read ? "bg-primary" : "bg-transparent",
                        )}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-foreground">
                            {notification.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">
                          {notification.message}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </QueryBoundary>
    </div>
  );
}
