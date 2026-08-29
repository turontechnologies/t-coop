"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReplyThread } from "@/components/features/notice-board/reply-thread";
import { formatTimeAgo } from "@/lib/format";
import type { AuthenticatedMember } from "@/types/auth";
import type { AppNotification } from "@/types/notification";

interface NotificationDetailModalProps {
  notification: AppNotification | null;
  member: AuthenticatedMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** A notice board notification can be replied to right here, without leaving the modal — every
 * other notification type (subscription, member, co-operative status, etc.) is pure information,
 * so it just gets a "View" link through to wherever notification.link points. */
export function NotificationDetailModal({
  notification,
  member,
  open,
  onOpenChange,
}: NotificationDetailModalProps) {
  const router = useRouter();
  if (!notification) return null;

  const noticeId =
    notification.type === "NOTICE_BOARD" && notification.link
      ? notification.link.replace(/^\/notice-board\//, "")
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{notification.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm whitespace-pre-line text-foreground">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatTimeAgo(notification.createdAt)}
            </p>
          </div>

          {noticeId ? (
            <div className="max-h-96 overflow-y-auto border-t border-border pt-4">
              <ReplyThread noticeId={noticeId} member={member} />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {notification.link ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                router.push(notification.link as string);
              }}
            >
              {noticeId ? "Open full notice" : "View"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
