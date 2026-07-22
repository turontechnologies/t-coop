"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCrossTabSync } from "@/hooks/use-cross-tab-sync";
import { formatTimeAgo } from "@/lib/format";
import { isNoticeVisibleToRole, noticeExcerpt } from "@/lib/notice-data";
import { NOTICE_STORE_NAME, useNoticeStore } from "@/store/notice.store";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 6;

export function NotificationMenu() {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const notices = useNoticeStore((state) => state.notices);
  const readMarkers = useNoticeStore((state) => state.readMarkers);
  const markRead = useNoticeStore((state) => state.markRead);

  useCrossTabSync(NOTICE_STORE_NAME, () => useNoticeStore.persist.rehydrate());

  if (!member) return null;

  const visibleNotices = notices
    .filter((notice) => isNoticeVisibleToRole(notice, member.role))
    .sort((a, b) => b.sendAt.localeCompare(a.sendAt));
  const unreadCount = visibleNotices.filter(
    (notice) => !readMarkers[`${member.id}:${notice.id}`],
  ).length;

  const markAllAsRead = () => {
    visibleNotices.forEach((notice) => markRead(member.id, notice.id));
  };

  const openNotice = (noticeId: string) => {
    markRead(member.id, noticeId);
    router.push(`/notice-board/${noticeId}`);
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
        {visibleNotices.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notices yet.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {visibleNotices.slice(0, MAX_VISIBLE).map((notice) => {
              const isUnread = !readMarkers[`${member.id}:${notice.id}`];
              return (
                <li key={notice.id}>
                  <button
                    type="button"
                    onClick={() => openNotice(notice.id)}
                    className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        isUnread ? "bg-primary" : "bg-transparent",
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {notice.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {noticeExcerpt(notice.message, 70)}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground/70">
                        {formatTimeAgo(notice.sendAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <DropdownMenuSeparator className="mx-0" />
        <button
          type="button"
          onClick={() => router.push("/notice-board")}
          className="block w-full px-3 py-2.5 text-center text-xs font-medium text-primary hover:underline"
        >
          View all notices
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
