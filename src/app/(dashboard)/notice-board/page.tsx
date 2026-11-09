"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  CoopAttendanceHistory,
  MyAttendanceHistory,
} from "@/components/features/notice-board/attendance-history";
import { MemberNoticeList } from "@/components/features/notice-board/member-notice-list";
import { NoticeListTable } from "@/components/features/notice-board/notice-list-table";
import { useCooperatives } from "@/hooks/use-cooperatives";
import { useNotices } from "@/hooks/use-notices";
import { useModuleAccess } from "@/hooks/use-permission";
import { useAuthStore } from "@/store/auth.store";

type NoticeBoardTab = "notices" | "attendance" | "my-attendance";

export default function NoticeBoardPage() {
  const member = useAuthStore((state) => state.member);
  const noticeBoardAccess = useModuleAccess("Notice Board");
  const {
    data: notices = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useNotices();
  const { data: cooperatives = [] } = useCooperatives();
  const [tab, setTab] = useState<NoticeBoardTab>("notices");

  if (!member) return null;

  const isSuperAdmin = member.role === "super_admin";
  const isRoleRestrictedStaff =
    member.role === "member" && member.permissionModules != null;
  // Officers: the co-op admin, or a member holding a co-op role (permissionModules set).
  const isCoopOfficer =
    member.role === "admin" ||
    (isRoleRestrictedStaff && noticeBoardAccess !== null);
  const canCreateNotice =
    (member.role !== "member" || isRoleRestrictedStaff) &&
    noticeBoardAccess === "write";
  const coopId = member.cooperativeId ?? member.id;

  const noticeList = (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => refetch()}
      isRetrying={isRefetching}
      errorTitle="Couldn't load the notice board"
    >
      {member.role === "member" && !isRoleRestrictedStaff ? (
        <MemberNoticeList notices={notices} />
      ) : (
        <NoticeListTable notices={notices} cooperatives={cooperatives} />
      )}
    </QueryBoundary>
  );

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Notice Board</h2>
        {canCreateNotice && tab === "notices" ? (
          <Button
            nativeButton={false}
            render={<Link href="/notice-board/new" />}
          >
            <Plus className="size-4" aria-hidden="true" />
            Create Notice
          </Button>
        ) : null}
      </div>

      {isSuperAdmin ? (
        noticeList
      ) : (
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as NoticeBoardTab)}
        >
          <TabsList>
            <TabsTab value="notices">Notices</TabsTab>
            {isCoopOfficer ? (
              <TabsTab value="attendance">Members Attendance</TabsTab>
            ) : null}
            <TabsTab value="my-attendance">My Attendance</TabsTab>
            <TabsIndicator />
          </TabsList>

          <TabsPanel value="notices" className="pt-4">
            {noticeList}
          </TabsPanel>

          {isCoopOfficer ? (
            <TabsPanel value="attendance" className="pt-4">
              <Card>
                <CardContent>
                  <CoopAttendanceHistory coopId={coopId} />
                </CardContent>
              </Card>
            </TabsPanel>
          ) : null}

          <TabsPanel value="my-attendance" className="pt-4">
            <Card>
              <CardContent>
                <MyAttendanceHistory />
              </CardContent>
            </Card>
          </TabsPanel>
        </Tabs>
      )}
    </div>
  );
}
