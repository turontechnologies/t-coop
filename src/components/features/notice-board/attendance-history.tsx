"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  MonitorSmartphone,
  Search,
  Upload,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/table-pagination";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import { Button } from "@/components/ui/button";
import {
  AttendanceImportDialog,
  type ImportableMeeting,
} from "@/components/features/notice-board/attendance-import-dialog";
import { useCoopAttendance, useMyAttendance } from "@/hooks/use-notices";
import { formatMeetingWhen, meetingDay, responseLabel } from "@/lib/meeting";
import { formatTimeLabel } from "@/components/ui/time-picker";
import { formatDateLong, getInitials } from "@/lib/format";
import type { ExportColumn } from "@/lib/table-export";
import { cn } from "@/lib/utils";
import {
  ATTENDANCE_LABELS,
  type MeetingAttendanceHistoryItem,
} from "@/types/notice";

const EASE = [0.16, 1, 0.3, 1] as const;
const PAGE_SIZES = [10, 25, 50];

/* ─────────────────────────────── Counting ─────────────────────────────── */

/**
 * One place for how attendance is counted, so every view agrees:
 * - only meetings that have started count;
 * - present is split into in person and online;
 * - absent includes apologies, which are also counted on their own;
 * - rate = present ÷ marked, so meetings nobody has marked yet don't pull it down.
 */
interface Totals {
  total: number;
  inPerson: number;
  online: number;
  absent: number;
  apologies: number;
  unmarked: number;
  rate: number | null;
}

function tally(items: MeetingAttendanceHistoryItem[]): Totals {
  const t = {
    total: items.length,
    inPerson: 0,
    online: 0,
    absent: 0,
    apologies: 0,
  };
  for (const item of items) {
    if (item.attendance === "Present") t.inPerson++;
    else if (item.attendance === "PresentOnline") t.online++;
    else if (item.attendance === "Absent") {
      t.absent++;
      if (item.response === "NotAttending") t.apologies++;
    }
  }
  const present = t.inPerson + t.online;
  const marked = present + t.absent;
  return {
    ...t,
    unmarked: t.total - marked,
    rate: marked ? Math.round((present / marked) * 100) : null,
  };
}

const rateLabel = (rate: number | null) => (rate === null ? "—" : `${rate}%`);
const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** What someone's attendance at one meeting reads as. */
function outcomeOf(item: MeetingAttendanceHistoryItem): {
  label: string;
  tone: string;
} | null {
  if (item.attendance === "Present")
    return { label: "In person", tone: TONES.green };
  if (item.attendance === "PresentOnline")
    return { label: "Online", tone: TONES.blue };
  if (item.attendance === "Absent")
    return item.response === "NotAttending"
      ? { label: "Apologies", tone: TONES.amber }
      : { label: "Absent", tone: TONES.red };
  if (item.awaitingApproval)
    return { label: "Awaiting approval", tone: TONES.amber };
  return null;
}

const TONES = {
  green:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  blue: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  red: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
};

const byNewest = (
  a: { meetingDate: string | null; meetingTime: string | null },
  b: { meetingDate: string | null; meetingTime: string | null },
) =>
  `${b.meetingDate ?? ""}${b.meetingTime ?? ""}`.localeCompare(
    `${a.meetingDate ?? ""}${a.meetingTime ?? ""}`,
  );

function usePaged<T>(rows: T[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, totalPages);
  return {
    rows: rows.slice((current - 1) * pageSize, current * pageSize),
    pagination:
      rows.length > PAGE_SIZES[0] ? (
        <TablePagination
          page={current}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZES}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      ) : null,
  };
}

/* ─────────────────────────────── My attendance ─────────────────────────────── */

const MY_COLUMNS: ExportColumn<MeetingAttendanceHistoryItem>[] = [
  { header: "Meeting", accessor: (row) => row.title },
  { header: "Date", accessor: (row) => row.meetingDate ?? "" },
  { header: "Time", accessor: (row) => row.meetingTime ?? "" },
  { header: "Venue", accessor: (row) => row.meetingVenue ?? "" },
  { header: "Said beforehand", accessor: (row) => responseLabel(row.response) },
  {
    header: "Attendance",
    accessor: (row) => outcomeOf(row)?.label ?? "Not marked",
  },
];

/** The signed-in member's own attendance at every meeting they were invited to. */
export function MyAttendanceHistory() {
  const router = useRouter();
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useMyAttendance();
  const held = useMemo(
    () => data.filter((item) => item.held).sort(byNewest),
    [data],
  );
  const { rows, pagination } = usePaged(held);

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => refetch()}
      isRetrying={isRefetching}
      errorTitle="Couldn't load your attendance"
    >
      <div className="space-y-5">
        <SummaryCards totals={tally(held)} meetings={held.length} />
        <div className="flex justify-end">
          <ExportImportMenu
            rows={held}
            columns={MY_COLUMNS}
            filenamePrefix="my-attendance"
            exportTitle="My attendance"
          />
        </div>
        <DataTable
          head={["Meeting", "Date", "Venue", "Attendance"]}
          empty={{
            title: "No meetings yet",
            text: "Your attendance shows here after your first meeting.",
          }}
          isEmpty={held.length === 0}
        >
          {rows.map((item, index) => (
            <ClickableRow
              key={item.noticeId}
              index={index}
              onClick={() => router.push(`/notice-board/${item.noticeId}`)}
            >
              <td className="px-5 py-4 font-semibold text-foreground">
                {item.title}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                {formatMeetingWhen(item.meetingDate, item.meetingTime)}
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {item.meetingVenue ?? "—"}
              </td>
              <td className="px-5 py-4 whitespace-nowrap">
                <Outcome item={item} />
              </td>
            </ClickableRow>
          ))}
        </DataTable>
        {pagination}
      </div>
    </QueryBoundary>
  );
}

/* ───────────────────────────── Members attendance ──────────────────────────── */

type View = "meeting" | "member";

interface MeetingGroup {
  noticeId: string;
  title: string;
  meetingDate: string | null;
  meetingTime: string | null;
  items: MeetingAttendanceHistoryItem[];
  totals: Totals;
}

interface MemberGroup {
  memberId: string;
  memberName: string;
  items: MeetingAttendanceHistoryItem[];
  totals: Totals;
}

const MEETING_COLUMNS: ExportColumn<MeetingGroup>[] = [
  { header: "Date", accessor: (m) => m.meetingDate ?? "" },
  { header: "Time", accessor: (m) => m.meetingTime ?? "" },
  { header: "Meeting", accessor: (m) => m.title },
  { header: "Invited", accessor: (m) => String(m.totals.total) },
  { header: "In person", accessor: (m) => String(m.totals.inPerson) },
  { header: "Online", accessor: (m) => String(m.totals.online) },
  { header: "Absent", accessor: (m) => String(m.totals.absent) },
  { header: "Apologies", accessor: (m) => String(m.totals.apologies) },
  { header: "Not marked", accessor: (m) => String(m.totals.unmarked) },
  { header: "Rate", accessor: (m) => rateLabel(m.totals.rate) },
];

const MEMBER_COLUMNS: ExportColumn<MemberGroup>[] = [
  { header: "Membership ID", accessor: (m) => m.memberId },
  { header: "Name", accessor: (m) => m.memberName },
  { header: "Meetings", accessor: (m) => String(m.totals.total) },
  { header: "In person", accessor: (m) => String(m.totals.inPerson) },
  { header: "Online", accessor: (m) => String(m.totals.online) },
  { header: "Absent", accessor: (m) => String(m.totals.absent) },
  { header: "Apologies", accessor: (m) => String(m.totals.apologies) },
  { header: "Not marked", accessor: (m) => String(m.totals.unmarked) },
  { header: "Rate", accessor: (m) => rateLabel(m.totals.rate) },
];

/** Everyone's attendance in the co-op, for officers, by meeting or by member. */
export function CoopAttendanceHistory({ coopId }: { coopId: string }) {
  const router = useRouter();
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCoopAttendance(coopId);
  const [view, setView] = useState<View>("meeting");
  const [search, setSearch] = useState("");
  const [openMember, setOpenMember] = useState<MemberGroup | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  // Every meeting can be imported into, at any time — held or not.
  const importable = useMemo(() => {
    const seen = new Map<
      string,
      ImportableMeeting & { meetingTime: string | null }
    >();
    for (const item of data)
      if (!seen.has(item.noticeId))
        seen.set(item.noticeId, {
          noticeId: item.noticeId,
          title: item.title,
          meetingDate: item.meetingDate,
          meetingTime: item.meetingTime,
        });
    return [...seen.values()].sort(byNewest);
  }, [data]);

  const held = useMemo(() => data.filter((item) => item.held), [data]);
  const query = search.trim().toLowerCase();

  const meetings = useMemo(() => {
    const groups = new Map<string, MeetingAttendanceHistoryItem[]>();
    for (const item of held)
      groups.set(item.noticeId, [...(groups.get(item.noticeId) ?? []), item]);
    return [...groups.values()]
      .map((items): MeetingGroup => ({
        noticeId: items[0].noticeId,
        title: items[0].title,
        meetingDate: items[0].meetingDate,
        meetingTime: items[0].meetingTime,
        items,
        totals: tally(items),
      }))
      .sort(byNewest);
  }, [held]);

  const members = useMemo(() => {
    const groups = new Map<string, MeetingAttendanceHistoryItem[]>();
    for (const item of held)
      groups.set(item.memberId, [...(groups.get(item.memberId) ?? []), item]);
    return [...groups.values()]
      .map((items): MemberGroup => ({
        memberId: items[0].memberId,
        memberName: items[0].memberName,
        items: [...items].sort(byNewest),
        totals: tally(items),
      }))
      .sort((a, b) => a.memberName.localeCompare(b.memberName));
  }, [held]);

  const shownMeetings = meetings.filter(
    (m) => !query || m.title.toLowerCase().includes(query),
  );
  const shownMembers = members.filter(
    (m) =>
      !query ||
      m.memberName.toLowerCase().includes(query) ||
      m.memberId.toLowerCase().includes(query),
  );
  const meetingPage = usePaged(shownMeetings);
  const memberPage = usePaged(shownMembers);

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => refetch()}
      isRetrying={isRefetching}
      errorTitle="Couldn't load attendance"
    >
      <div className="space-y-6">
        <SummaryCards totals={tally(held)} meetings={meetings.length} />

        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="inline-flex gap-1 rounded-xl border border-border bg-muted/60 p-1"
            role="radiogroup"
            aria-label="Group by"
          >
            {(
              [
                ["meeting", "By meeting"],
                ["member", "By member"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={view === value}
                onClick={() => {
                  setView(value);
                  setSearch("");
                }}
                className={cn(
                  "relative h-9 rounded-[0.6rem] px-4 text-sm font-semibold transition-colors",
                  view === value
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {view === value ? (
                  <motion.span
                    layoutId="attendance-group-by"
                    className="absolute inset-0 rounded-[0.6rem] bg-card shadow-card"
                    transition={{ duration: 0.3, ease: EASE }}
                  />
                ) : null}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
          <div className="relative min-w-52 flex-1 sm:max-w-80">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                view === "meeting" ? "Search meetings" : "Search members"
              }
              className="pl-10"
              aria-label="Search"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={importable.length === 0}
              onClick={() => setImportOpen(true)}
            >
              <Upload className="size-3.5" aria-hidden="true" />
              Import attendance
            </Button>
            {view === "meeting" ? (
              <ExportImportMenu
                rows={shownMeetings}
                columns={MEETING_COLUMNS}
                filenamePrefix="attendance-by-meeting"
                exportTitle="Attendance by meeting"
              />
            ) : (
              <ExportImportMenu
                rows={shownMembers}
                columns={MEMBER_COLUMNS}
                filenamePrefix="attendance-by-member"
                exportTitle="Attendance by member"
              />
            )}
          </div>
        </div>

        {view === "meeting" ? (
          <>
            <DataTable
              head={["Date", "Meeting", "Breakdown", "Rate", ""]}
              isEmpty={shownMeetings.length === 0}
              empty={
                meetings.length === 0
                  ? {
                      title: "No meetings held yet",
                      text: "Meetings show here once they've started.",
                    }
                  : {
                      title: "No meetings found",
                      text: "Try a different search.",
                    }
              }
            >
              {meetingPage.rows.map((m, index) => (
                <ClickableRow
                  key={m.noticeId}
                  index={index}
                  onClick={() => router.push(`/notice-board/${m.noticeId}`)}
                >
                  <td className="w-24 py-3 pr-2 pl-5">
                    <DateBlock date={m.meetingDate} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[0.95rem] font-semibold text-foreground">
                      {m.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {m.meetingTime ? formatTimeLabel(m.meetingTime) : "—"} ·{" "}
                      {m.totals.total} invited
                    </p>
                  </td>
                  <td className="min-w-64 px-4 py-3">
                    <div className="grid gap-2.5">
                      <StackedBar totals={m.totals} />
                      <Legend totals={m.totals} />
                    </div>
                  </td>
                  <td className="w-20 px-4 py-3">
                    <RateRing rate={m.totals.rate} size={48} />
                  </td>
                  <td className="w-10 pr-5">
                    <ChevronRight
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </td>
                </ClickableRow>
              ))}
            </DataTable>
            {meetingPage.pagination}
          </>
        ) : (
          <>
            <DataTable
              head={["Member", "Breakdown", "Rate", ""]}
              isEmpty={shownMembers.length === 0}
              empty={{
                title: "No members found",
                text:
                  members.length === 0
                    ? "Members show here once a meeting has started."
                    : "Try a different search.",
              }}
            >
              {memberPage.rows.map((m, index) => (
                <ClickableRow
                  key={m.memberId}
                  index={index}
                  onClick={() => setOpenMember(m)}
                >
                  <td className="py-3 pr-4 pl-5">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.memberName} />
                      <div className="min-w-0">
                        <p className="text-[0.95rem] font-semibold text-foreground">
                          {m.memberName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {m.memberId} ·{" "}
                          {plural(m.totals.total, "meeting", "meetings")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="min-w-64 px-4 py-3">
                    <div className="grid gap-2.5">
                      <StackedBar totals={m.totals} />
                      <PlainLegend totals={m.totals} />
                    </div>
                  </td>
                  <td className="w-20 px-4 py-3 text-right text-base font-bold text-foreground tabular-nums">
                    {rateLabel(m.totals.rate)}
                  </td>
                  <td className="w-10 pr-5">
                    <ChevronRight
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </td>
                </ClickableRow>
              ))}
            </DataTable>
            {memberPage.pagination}
          </>
        )}
      </div>

      <AttendanceImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        meetings={importable}
      />

      <Dialog
        open={openMember !== null}
        onOpenChange={(open) => (!open ? setOpenMember(null) : null)}
      >
        <DialogContent className="sm:max-w-3xl">
          {openMember ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Avatar name={openMember.memberName} />
                  <div>
                    <DialogTitle>{openMember.memberName}</DialogTitle>
                    <DialogDescription>
                      {openMember.memberId} ·{" "}
                      {plural(openMember.totals.total, "meeting", "meetings")} ·{" "}
                      {rateLabel(openMember.totals.rate)} attendance
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-2.5">
                <StackedBar totals={openMember.totals} />
                <PlainLegend totals={openMember.totals} />
              </div>
              <DataTable
                head={["Meeting", "Date", "Attendance"]}
                isEmpty={openMember.items.length === 0}
                empty={{ title: "No meetings yet", text: "" }}
              >
                {openMember.items.map((item, index) => (
                  <ClickableRow
                    key={item.noticeId}
                    index={index}
                    onClick={() => {
                      setOpenMember(null);
                      router.push(`/notice-board/${item.noticeId}`);
                    }}
                  >
                    <td className="px-5 py-3.5 font-semibold text-foreground">
                      {item.title}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                      {item.meetingDate
                        ? formatDateLong(meetingDay(item.meetingDate))
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <Outcome item={item} />
                    </td>
                  </ClickableRow>
                ))}
              </DataTable>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </QueryBoundary>
  );
}

/* ──────────────────────────────── Building blocks ─────────────────────────────── */

function SummaryCards({
  totals,
  meetings,
}: {
  totals: Totals;
  meetings: number;
}) {
  const cards = [
    {
      label: "Meetings",
      value: meetings,
      icon: CalendarDays,
      chip: "bg-muted text-foreground",
    },
    {
      label: "In person",
      value: totals.inPerson,
      icon: UserCheck,
      chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      label: "Online",
      value: totals.online,
      icon: MonitorSmartphone,
      chip: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    },
    {
      label: "Absent",
      value: totals.absent,
      icon: UserX,
      chip: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4 2xl:grid-cols-[repeat(4,minmax(0,1fr))_minmax(0,1.3fr)]">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.04, ease: EASE }}
          className="flex min-w-0 items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5"
        >
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full sm:size-[2.875rem]",
              card.chip,
            )}
          >
            <card.icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              {card.label}
            </p>
            <p className="text-2xl leading-tight font-bold tracking-tight text-foreground tabular-nums">
              {card.value}
            </p>
          </div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16, ease: EASE }}
        className="col-span-2 flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-3.5 shadow-card md:col-span-4 2xl:col-span-1"
      >
        <RateRing rate={totals.rate} size={64} />
        <div className="min-w-0">
          <p className="text-base font-semibold whitespace-nowrap text-foreground">
            Attendance rate
          </p>
          <p className="text-sm text-muted-foreground">
            {plural(totals.apologies, "apology", "apologies")} ·{" "}
            {totals.unmarked} not marked
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function RateRing({ rate, size }: { rate: number | null; size: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const tone =
    rate === null
      ? "stroke-border"
      : rate >= 75
        ? "stroke-emerald-500"
        : rate >= 50
          ? "stroke-amber-500"
          : "stroke-rose-500";
  return (
    <svg
      viewBox="0 0 72 72"
      width={size}
      height={size}
      className="shrink-0"
      role="img"
      aria-label={rate === null ? "Not marked yet" : `${rate}% attendance`}
    >
      <circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        strokeWidth="7"
        className="stroke-muted"
      />
      <motion.circle
        cx="36"
        cy="36"
        r={radius}
        fill="none"
        strokeWidth="7"
        strokeLinecap="round"
        className={tone}
        transform="rotate(-90 36 36)"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{
          strokeDashoffset: circumference * (1 - (rate ?? 0) / 100),
        }}
        transition={{ duration: 0.9, ease: EASE }}
      />
      <text
        x="36"
        y="41"
        textAnchor="middle"
        className="fill-foreground text-[15px] font-bold"
      >
        {rateLabel(rate)}
      </text>
    </svg>
  );
}

function StackedBar({ totals }: { totals: Totals }) {
  const pct = (n: number) => (totals.total ? (n / totals.total) * 100 : 0);
  return (
    <div
      className="flex h-2 overflow-hidden rounded-full bg-muted"
      role="img"
      aria-label={`${totals.inPerson} in person, ${totals.online} online, ${totals.absent} absent, ${totals.unmarked} not marked`}
    >
      {(
        [
          [totals.inPerson, "bg-emerald-500"],
          [totals.online, "bg-sky-500"],
          [totals.absent, "bg-rose-500"],
        ] as const
      ).map(([value, color], index) => (
        <motion.span
          key={index}
          className={color}
          initial={{ width: 0 }}
          animate={{ width: `${pct(value)}%` }}
          transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
        />
      ))}
    </div>
  );
}

function Legend({ totals }: { totals: Totals }) {
  const items = [
    ["bg-emerald-500", "In person", totals.inPerson],
    ["bg-sky-500", "Online", totals.online],
    ["bg-rose-500", "Absent", totals.absent],
    ["bg-border", "Not marked", totals.unmarked],
  ] as const;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {items.map(([dot, label, value]) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 whitespace-nowrap"
        >
          <span className={cn("size-2 rounded-full", dot)} aria-hidden="true" />
          {label}
          <span className="font-semibold text-foreground tabular-nums">
            {value}
          </span>
        </span>
      ))}
    </div>
  );
}

function PlainLegend({ totals }: { totals: Totals }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm whitespace-nowrap text-muted-foreground">
      <span>{totals.inPerson} in person</span>
      <span>{totals.online} online</span>
      <span>{totals.absent} absent</span>
      {totals.apologies ? (
        <span>{plural(totals.apologies, "apology", "apologies")}</span>
      ) : null}
      {totals.unmarked ? <span>{totals.unmarked} not marked</span> : null}
    </div>
  );
}

function Outcome({ item }: { item: MeetingAttendanceHistoryItem }) {
  const outcome = outcomeOf(item);
  if (!outcome)
    return <span className="text-muted-foreground/70">Not marked</span>;
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center rounded-full px-2.5 text-sm font-semibold",
        outcome.tone,
      )}
      title={
        item.attendance
          ? `${ATTENDANCE_LABELS[item.attendance]}${item.attendanceNote ? ` — ${item.attendanceNote}` : ""}`
          : undefined
      }
    >
      {outcome.label}
    </span>
  );
}

function DateBlock({ date }: { date: string | null }) {
  const day = date ? meetingDay(date) : null;
  return (
    <span className="inline-grid w-[60px] justify-items-center rounded-xl border border-border bg-card py-1.5 leading-tight">
      {day ? (
        <>
          <span className="text-xs font-bold tracking-wide text-primary uppercase dark:text-emerald-300">
            {day.toLocaleString("en-US", { month: "short" })}
          </span>
          <span className="text-xl font-bold text-foreground">
            {day.getDate()}
          </span>
          <span className="text-xs text-muted-foreground">
            {day.getFullYear()}
          </span>
        </>
      ) : (
        <span className="py-2 text-xs text-muted-foreground">—</span>
      )}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:text-emerald-300">
      {getInitials(name)}
    </span>
  );
}

function DataTable({
  head,
  isEmpty,
  empty,
  children,
}: {
  head: string[];
  isEmpty: boolean;
  empty: { title: string; text: string };
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50 text-left">
            {head.map((label, index) => (
              <th
                key={index}
                className={cn(
                  "h-12 border-b border-border px-4 text-xs font-bold tracking-wider whitespace-nowrap text-muted-foreground uppercase",
                  index === 0 && "pl-5",
                  index === head.length - 1 && "pr-5",
                )}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isEmpty ? (
            <tr>
              <td
                colSpan={head.length}
                className="px-6 py-14 text-center text-muted-foreground"
              >
                <span className="block text-base font-semibold text-foreground">
                  {empty.title}
                </span>
                {empty.text}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

function ClickableRow({
  index,
  onClick,
  children,
}: {
  index: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, delay: Math.min(index, 10) * 0.02 }}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter") onClick();
      }}
      tabIndex={0}
      className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
    >
      {children}
    </motion.tr>
  );
}
