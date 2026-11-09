"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { useCoopAttendance, useMyAttendance } from "@/hooks/use-notices";
import {
  attendanceBadgeClass,
  formatMeetingWhen,
  responseBadgeClass,
  responseLabel,
} from "@/lib/meeting";
import type { MeetingAttendanceHistoryItem } from "@/types/notice";

/** The signed-in member's own attendance across every meeting they were invited to. */
export function MyAttendanceHistory() {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useMyAttendance();
  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => refetch()}
      isRetrying={isRefetching}
      errorTitle="Couldn't load your attendance"
    >
      <div className="space-y-4">
        <Totals items={data} />
        <HistoryTable items={data} showMember={false} />
      </div>
    </QueryBoundary>
  );
}

/** Every member's attendance in the co-op — officers only. Pick a member to see just theirs. */
export function CoopAttendanceHistory({ coopId }: { coopId: string }) {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCoopAttendance(coopId);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const members = useMemo(() => {
    const byMember = new Map<
      string,
      {
        memberId: string;
        memberName: string;
        items: MeetingAttendanceHistoryItem[];
      }
    >();
    for (const item of data) {
      const row = byMember.get(item.memberId) ?? {
        memberId: item.memberId,
        memberName: item.memberName,
        items: [],
      };
      row.items.push(item);
      byMember.set(item.memberId, row);
    }
    const query = search.trim().toLowerCase();
    return [...byMember.values()]
      .filter(
        (row) =>
          !query ||
          row.memberName.toLowerCase().includes(query) ||
          row.memberId.toLowerCase().includes(query),
      )
      .sort((a, b) => a.memberName.localeCompare(b.memberName));
  }, [data, search]);

  const selectedRow = selected
    ? (members.find((row) => row.memberId === selected) ?? {
        memberId: selected,
        memberName: selected,
        items: data.filter((i) => i.memberId === selected),
      })
    : null;

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => refetch()}
      isRetrying={isRefetching}
      errorTitle="Couldn't load attendance"
    >
      {selectedRow ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">
                {selectedRow.memberName}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedRow.memberId}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected(null)}
            >
              <X className="size-3.5" aria-hidden="true" />
              All members
            </Button>
          </div>
          <Totals items={selectedRow.items} />
          <HistoryTable items={selectedRow.items} showMember={false} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search members"
              className="h-10 pl-9"
              aria-label="Search members"
            />
          </div>

          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attendance yet — it starts with the first meeting notice you
              send.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Member
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Meetings
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Present
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Absent
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Apologies
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Attendance rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((row) => {
                      const t = totalsOf(row.items);
                      return (
                        <tr
                          key={row.memberId}
                          onClick={() => setSelected(row.memberId)}
                          className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-foreground">
                              {row.memberName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {row.memberId}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {t.meetings}
                          </td>
                          <td className="px-4 py-3 text-success">
                            {t.present}
                          </td>
                          <td className="px-4 py-3 text-destructive">
                            {t.absent}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {t.apologies}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {t.rateLabel}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <MobileRecordList>
                {members.map((row) => {
                  const t = totalsOf(row.items);
                  return (
                    <MobileRecordCard
                      key={row.memberId}
                      title={row.memberName}
                      onClick={() => setSelected(row.memberId)}
                      fields={[
                        { label: "Membership ID", value: row.memberId },
                        { label: "Meetings", value: t.meetings },
                        { label: "Present", value: t.present },
                        { label: "Absent", value: t.absent },
                        { label: "Apologies", value: t.apologies },
                        { label: "Attendance rate", value: t.rateLabel },
                      ]}
                    />
                  );
                })}
              </MobileRecordList>
            </>
          )}
        </div>
      )}
    </QueryBoundary>
  );
}

function totalsOf(items: MeetingAttendanceHistoryItem[]) {
  const present = items.filter((i) => i.attendance === "Present").length;
  const absent = items.filter((i) => i.attendance === "Absent").length;
  const apologies = items.filter((i) => i.response === "NotAttending").length;
  const marked = present + absent;
  return {
    meetings: items.length,
    present,
    absent,
    apologies,
    rateLabel: marked === 0 ? "—" : `${Math.round((present / marked) * 100)}%`,
  };
}

function Totals({ items }: { items: MeetingAttendanceHistoryItem[] }) {
  const t = totalsOf(items);
  const stats = [
    { label: "Meetings", value: t.meetings },
    { label: "Present", value: t.present },
    { label: "Absent", value: t.absent },
    { label: "Apologies", value: t.apologies },
    { label: "Attendance rate", value: t.rateLabel },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border px-3 py-2.5"
        >
          <p className="text-xs text-muted-foreground">{stat.label}</p>
          <p className="text-lg font-semibold text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

function HistoryTable({
  items,
  showMember,
}: {
  items: MeetingAttendanceHistoryItem[];
  showMember: boolean;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No meetings yet.</p>;
  }
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Meeting
              </th>
              {showMember ? (
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Member
                </th>
              ) : null}
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Response
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Attendance
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Note / reason
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={`${item.noticeId}-${item.memberId}`}
                className="border-b border-border last:border-0 align-top"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/notice-board/${item.noticeId}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {formatMeetingWhen(item.meetingDate, item.meetingTime)}
                  </p>
                </td>
                {showMember ? (
                  <td className="px-4 py-3 text-foreground">
                    {item.memberName}
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <Badge
                    variant="secondary"
                    className={responseBadgeClass(item.response)}
                  >
                    {responseLabel(item.response)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="secondary"
                    className={attendanceBadgeClass(item.attendance)}
                  >
                    {item.attendance ?? "Not marked"}
                  </Badge>
                </td>
                <td className="max-w-xs px-4 py-3 text-muted-foreground">
                  {item.attendanceNote ?? item.responseReason ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <MobileRecordList>
        {items.map((item) => (
          <MobileRecordCard
            key={`${item.noticeId}-${item.memberId}`}
            title={item.title}
            badge={
              <Badge
                variant="secondary"
                className={attendanceBadgeClass(item.attendance)}
              >
                {item.attendance ?? "Not marked"}
              </Badge>
            }
            fields={[
              {
                label: "When",
                value: formatMeetingWhen(item.meetingDate, item.meetingTime),
              },
              ...(showMember
                ? [{ label: "Member", value: item.memberName }]
                : []),
              { label: "Response", value: responseLabel(item.response) },
              {
                label: "Note / reason",
                value: item.attendanceNote ?? item.responseReason ?? "—",
              },
            ]}
          />
        ))}
      </MobileRecordList>
    </>
  );
}
