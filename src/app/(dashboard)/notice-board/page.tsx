"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { MemberNoticeList } from "@/components/features/notice-board/member-notice-list";
import { NoticeListTable } from "@/components/features/notice-board/notice-list-table";
import { useCooperatives } from "@/hooks/use-cooperatives";
import { useNotices } from "@/hooks/use-notices";
import { useAuthStore } from "@/store/auth.store";

export default function NoticeBoardPage() {
  const member = useAuthStore((state) => state.member);
  const { data: notices = [], isLoading, isError, error, refetch, isRefetching } =
    useNotices();
  const { data: cooperatives = [] } = useCooperatives();

  if (!member) return null;

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Notice Board</h2>
        {member.role !== "member" ? (
          <Button nativeButton={false} render={<Link href="/notice-board/new" />}>
            <Plus className="size-4" aria-hidden="true" />
            Create Notice
          </Button>
        ) : null}
      </div>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
        errorTitle="Couldn't load the notice board"
      >
        {member.role === "member" ? (
          <MemberNoticeList notices={notices} />
        ) : (
          <NoticeListTable notices={notices} cooperatives={cooperatives} />
        )}
      </QueryBoundary>
    </div>
  );
}
