"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { noticeExcerpt, type Notice } from "@/types/notice";
import { formatDateLong } from "@/lib/format";

interface MemberNoticeListProps {
  notices: Notice[];
}

export function MemberNoticeList({ notices }: MemberNoticeListProps) {
  const router = useRouter();

  if (notices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
        No notices yet — announcements from your co-operative will show up here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notices.map((notice) => (
        <button
          key={notice.id}
          type="button"
          onClick={() => router.push(`/notice-board/${notice.id}`)}
          className="flex w-full flex-col gap-1.5 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
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
      ))}
    </div>
  );
}
