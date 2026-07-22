"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberNoticeList } from "@/components/features/notice-board/member-notice-list";
import { NoticeListTable } from "@/components/features/notice-board/notice-list-table";
import { isNoticeVisibleToRole } from "@/lib/notice-data";
import { NOTICE_STORE_NAME, useNoticeStore } from "@/store/notice.store";
import { useCrossTabSync } from "@/hooks/use-cross-tab-sync";
import { useAuthStore } from "@/store/auth.store";

export default function NoticeBoardPage() {
  const member = useAuthStore((state) => state.member);
  const notices = useNoticeStore((state) => state.notices);

  useCrossTabSync(NOTICE_STORE_NAME, () => useNoticeStore.persist.rehydrate());

  if (!member) return null;

  if (member.role === "member") {
    const visibleNotices = notices
      .filter((notice) => isNoticeVisibleToRole(notice, member.role))
      .sort((a, b) => b.sendAt.localeCompare(a.sendAt));

    return (
      <div className="space-y-6 pt-6">
        <h2 className="text-sm font-semibold text-foreground">Notice Board</h2>
        <MemberNoticeList notices={visibleNotices} memberId={member.id} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Notice Board</h2>
        <Button nativeButton={false} render={<Link href="/notice-board/new" />}>
          <Plus className="size-4" aria-hidden="true" />
          Create Notice
        </Button>
      </div>

      <NoticeListTable notices={notices} />
    </div>
  );
}
