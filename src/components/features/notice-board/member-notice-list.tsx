"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { noticeExcerpt, type Notice } from "@/lib/notice-data";
import { formatDateLong } from "@/lib/format";
import { useNoticeStore } from "@/store/notice.store";
import { cn } from "@/lib/utils";

interface MemberNoticeListProps {
  notices: Notice[];
  memberId: string;
}

export function MemberNoticeList({ notices, memberId }: MemberNoticeListProps) {
  const router = useRouter();
  const readMarkers = useNoticeStore((state) => state.readMarkers);

  if (notices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
        No notices yet — announcements from your co-operative will show up here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notices.map((notice) => {
        const isUnread = !readMarkers[`${memberId}:${notice.id}`];
        return (
          <button
            key={notice.id}
            type="button"
            onClick={() => router.push(`/notice-board/${notice.id}`)}
            className={cn(
              "flex w-full flex-col gap-1.5 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50",
              isUnread && "border-primary/30 bg-primary/5",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isUnread ? (
                  <span
                    className="size-2 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="text-sm font-semibold text-foreground">
                  {notice.title}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {notice.type}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDateLong(new Date(notice.sendAt))}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {noticeExcerpt(notice.message, 140)}
            </p>
            <p className="text-xs text-muted-foreground">
              From {notice.createdByName}
            </p>
          </button>
        );
      })}
    </div>
  );
}
