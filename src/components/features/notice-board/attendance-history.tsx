"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  MonitorSmartphone,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import { useCoopAttendance, useMyAttendance } from "@/hooks/use-notices";
import {
  attendanceBadgeClass,
  formatMeetingWhen,
  meetingDay,
  responseBadgeClass,
  responseLabel,
} from "@/lib/meeting";
import { formatTimeLabel } from "@/components/ui/time-picker";
import { getInitials } from "@/lib/format";
import type { ExportColumn } from "@/lib/table-export";
import { cn } from "@/lib/utils";
import {
  ATTENDANCE_LABELS,
  type MeetingAttendanceHistoryItem,
} from "@/types/notice";

const EASE = [0.16, 1, 0.3, 1] as const;

const EXPORT_COLUMNS: ExportColumn<MeetingAttendanceHistoryItem>[] = [
  { header: "Meeting", accessor: (row) => row.title },
  { header: "Date", accessor: (row) => row.meetingDate ?? "" },
  { header: "Time", accessor: (row) => row.meetingTime ?? "" },
  { header: "Membership ID", accessor: (row) => row.memberId },
  { header: "Member", accessor: (row) => row.memberName },
  { header: "Said", accessor: (row) => responseLabel(row.response) },
  {
    header: "Attendance",
    accessor: (row) =>
      row.attendance ? ATTENDANCE_LABELS[row.attendance] : "Not marked",
  },
  {
    header: "Note / reason",
    accessor: (row) => row.attendanceNote ?? row.responseReason ?? "",
  },
];

interface Totals {
  meetings: number;
  inPerson: number;
  online: number;
  absent: number;
  unmarked: number;
  apologies: number;
  /** Present (in person + online) out of everyone marked; null when nothing's marked yet. */
  rate: number | null;
}

function totalsOf(items: MeetingAttendanceHistoryItem[]): Totals {
  let inPerson = 0,
    online = 0,
    absent = 0,
    apologies = 0;
  for (const item of items) {
    if (item.attendance === "Present") inPerson++;
    else if (item.attendance === "PresentOnline") online++;
    else if (item.attendance === "Absent") absent++;
    if (item.response === "NotAttending") apologies++;
  }
  const marked = inPerson + online + absent;
  return {
    meetings: items.length,
    inPerson,
    online,
    absent,
    unmarked: items.length - marked,
    apologies,
    rate:
      marked === 0 ? null : Math.round(((inPerson + online) / marked) * 100),
  };
}

const rateLabel = (rate: number | null) => (rate === null ? "—" : `${rate}%`);

/* ─────────────────────────────── My attendance ─────────────────────────────── */

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
      <div className="space-y-6">
        <StatTiles totals={totalsOf(data)} />
        <Timeline items={data} />
      </div>
    </QueryBoundary>
  );
}

/* ───────────────────────────── Members attendance ──────────────────────────── */

type View = "meetings" | "members";

/** Every member's attendance in the co-op — officers only — by meeting or by member. */
export function CoopAttendanceHistory({ coopId }: { coopId: string }) {
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCoopAttendance(coopId);
  const [view, setView] = useState<View>("meetings");
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const query = search.trim().toLowerCase();

  const meetings = useMemo(() => {
    const byNotice = new Map<
      string,
      {
        noticeId: string;
        title: string;
        meetingDate: string | null;
        meetingTime: string | null;
        items: MeetingAttendanceHistoryItem[];
      }
    >();
    for (const item of data) {
      const meeting = byNotice.get(item.noticeId) ?? {
        noticeId: item.noticeId,
        title: item.title,
        meetingDate: item.meetingDate,
        meetingTime: item.meetingTime,
        items: [],
      };
      meeting.items.push(item);
      byNotice.set(item.noticeId, meeting);
    }
    return [...byNotice.values()]
      .filter((m) => !query || m.title.toLowerCase().includes(query))
      .sort((a, b) =>
        `${b.meetingDate ?? ""}${b.meetingTime ?? ""}`.localeCompare(
          `${a.meetingDate ?? ""}${a.meetingTime ?? ""}`,
        ),
      );
  }, [data, query]);

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
    return [...byMember.values()]
      .filter(
        (row) =>
          !query ||
          row.memberName.toLowerCase().includes(query) ||
          row.memberId.toLowerCase().includes(query),
      )
      .sort((a, b) => a.memberName.localeCompare(b.memberName));
  }, [data, query]);

  const selected = selectedMember
    ? {
        memberId: selectedMember,
        memberName:
          data.find((i) => i.memberId === selectedMember)?.memberName ??
          selectedMember,
        items: data.filter((i) => i.memberId === selectedMember),
      }
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
      <AnimatePresence mode="wait" initial={false}>
        {selected ? (
          <motion.div
            key={`member-${selected.memberId}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedMember(null)}
                  aria-label="Back to all members"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </Button>
                <Avatar name={selected.memberName} size="lg" />
                <div>
                  <p className="text-base font-semibold text-foreground">
                    {selected.memberName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selected.memberId}
                  </p>
                </div>
              </div>
              <ExportImportMenu
                rows={selected.items}
                columns={EXPORT_COLUMNS}
                filenamePrefix={`attendance-${selected.memberId}`}
                exportTitle={`Attendance — ${selected.memberName}`}
              />
            </div>
            <StatTiles totals={totalsOf(selected.items)} />
            <Timeline items={selected.items} />
          </motion.div>
        ) : (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="space-y-6"
          >
            <StatTiles
              totals={totalsOf(data)}
              meetingCount={new Set(data.map((item) => item.noticeId)).size}
            />

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-xl bg-muted p-1" role="tablist">
                {(
                  [
                    { value: "meetings", label: "By meeting" },
                    { value: "members", label: "By member" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={view === option.value}
                    onClick={() => setView(option.value)}
                    className={cn(
                      "relative rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                      view === option.value
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {view === option.value ? (
                      <motion.span
                        layoutId="attendance-history-view"
                        className="absolute inset-0 rounded-lg bg-card shadow-card ring-1 ring-border/60"
                        transition={{ duration: 0.3, ease: EASE }}
                      />
                    ) : null}
                    <span className="relative">{option.label}</span>
                  </button>
                ))}
              </div>
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={
                    view === "meetings" ? "Search meetings" : "Search members"
                  }
                  className="pl-9"
                  aria-label="Search"
                />
              </div>
              <div className="ml-auto">
                <ExportImportMenu
                  rows={data}
                  columns={EXPORT_COLUMNS}
                  filenamePrefix="attendance-history"
                  exportTitle="Attendance history"
                />
              </div>
            </div>

            {data.length === 0 ? (
              <EmptyState text="No attendance yet — it starts with the first meeting notice you send." />
            ) : view === "meetings" ? (
              meetings.length === 0 ? (
                <EmptyState text="No meetings match that search." />
              ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {meetings.map((meeting, index) => (
                    <MeetingCard
                      key={meeting.noticeId}
                      index={index}
                      {...meeting}
                    />
                  ))}
                </div>
              )
            ) : members.length === 0 ? (
              <EmptyState text="No members match that search." />
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
                {members.map((row, index) => (
                  <MemberRow
                    key={row.memberId}
                    index={index}
                    {...row}
                    onOpen={() => setSelectedMember(row.memberId)}
                  />
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </QueryBoundary>
  );
}

/* ──────────────────────────────── Building blocks ─────────────────────────────── */

/** `meetingCount` overrides the meetings tile when the rows span several members (the
 * officers' overview, where one meeting has a row per member). */
function StatTiles({
  totals,
  meetingCount,
}: {
  totals: Totals;
  meetingCount?: number;
}) {
  const tiles = [
    {
      label: "Meetings",
      value: String(meetingCount ?? totals.meetings),
      icon: CalendarDays,
      tone: "bg-primary/10 text-primary dark:text-emerald-300",
    },
    {
      label: "In person",
      value: String(totals.inPerson),
      icon: UserCheck,
      tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Online",
      value: String(totals.online),
      icon: MonitorSmartphone,
      tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    },
    {
      label: "Absent",
      value: String(totals.absent),
      icon: UserX,
      tone: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {tiles.map((tile, index) => (
        <motion.div
          key={tile.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.04, ease: EASE }}
          className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card"
        >
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              tile.tone,
            )}
          >
            <tile.icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {tile.label}
            </p>
            <p className="text-xl font-semibold tracking-tight text-foreground tabular-nums">
              {tile.value}
            </p>
          </div>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16, ease: EASE }}
        className="col-span-2 flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-card lg:col-span-1"
      >
        <RateRing rate={totals.rate} />
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            Attendance rate
          </p>
          <p className="text-xs text-muted-foreground">
            {totals.apologies}{" "}
            {totals.apologies === 1 ? "apology" : "apologies"} ·{" "}
            {totals.unmarked} not marked
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/** A circular gauge for the attendance rate. */
function RateRing({ rate, size = 56 }: { rate: number | null; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = rate ?? 0;
  const tone =
    rate === null
      ? "stroke-muted-foreground/30"
      : value >= 75
        ? "stroke-emerald-500"
        : value >= 50
          ? "stroke-amber-500"
          : "stroke-rose-500";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="5"
          className="stroke-muted"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className={tone}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
          transition={{ duration: 0.9, ease: EASE }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground tabular-nums">
        {rateLabel(rate)}
      </span>
    </div>
  );
}

/** In person / online / absent / not marked as one bar. */
function StackedBar({ totals }: { totals: Totals }) {
  const total = Math.max(totals.meetings, 1);
  const parts = [
    { value: totals.inPerson, className: "bg-emerald-500" },
    { value: totals.online, className: "bg-sky-500" },
    { value: totals.absent, className: "bg-rose-500" },
  ];
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      {parts.map((part, index) => (
        <motion.div
          key={index}
          className={part.className}
          initial={{ width: 0 }}
          animate={{ width: `${(part.value / total) * 100}%` }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
        />
      ))}
    </div>
  );
}

function MeetingCard({
  index,
  noticeId,
  title,
  meetingDate,
  meetingTime,
  items,
}: {
  index: number;
  noticeId: string;
  title: string;
  meetingDate: string | null;
  meetingTime: string | null;
  items: MeetingAttendanceHistoryItem[];
}) {
  const totals = totalsOf(items);
  const day = meetingDate ? meetingDay(meetingDate) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index, 8) * 0.04,
        ease: EASE,
      }}
    >
      <Link
        href={`/notice-board/${noticeId}`}
        className="group flex gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-raised"
      >
        <DateBlock day={day} />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {title}
              </p>
              <p className="text-xs text-muted-foreground">
                {meetingTime ? formatTimeLabel(meetingTime) : "—"} ·{" "}
                {totals.meetings} invited
              </p>
            </div>
            <RateRing rate={totals.rate} size={44} />
          </div>
          <StackedBar totals={totals} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <Legend
              dot="bg-emerald-500"
              label="In person"
              value={totals.inPerson}
            />
            <Legend dot="bg-sky-500" label="Online" value={totals.online} />
            <Legend dot="bg-rose-500" label="Absent" value={totals.absent} />
            <Legend
              dot="bg-muted-foreground/40"
              label="Not marked"
              value={totals.unmarked}
            />
          </div>
        </div>
        <ChevronRight
          className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </motion.div>
  );
}

function MemberRow({
  index,
  memberId,
  memberName,
  items,
  onOpen,
}: {
  index: number;
  memberId: string;
  memberName: string;
  items: MeetingAttendanceHistoryItem[];
  onOpen: () => void;
}) {
  const totals = totalsOf(items);
  return (
    <motion.li
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: Math.min(index, 12) * 0.025 }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
      >
        <Avatar name={memberName} />
        <div className="w-40 min-w-0 shrink-0 sm:w-52">
          <p className="truncate text-sm font-medium text-foreground">
            {memberName}
          </p>
          <p className="text-xs text-muted-foreground">
            {memberId} · {totals.meetings}{" "}
            {totals.meetings === 1 ? "meeting" : "meetings"}
          </p>
        </div>
        <div className="hidden min-w-0 flex-1 space-y-1.5 md:block">
          <StackedBar totals={totals} />
          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            <span>{totals.inPerson} in person</span>
            <span>{totals.online} online</span>
            <span>{totals.absent} absent</span>
            {totals.apologies > 0 ? (
              <span>{totals.apologies} apologies</span>
            ) : null}
          </div>
        </div>
        <span className="ml-auto text-sm font-semibold text-foreground tabular-nums">
          {rateLabel(totals.rate)}
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </button>
    </motion.li>
  );
}

/** One member's meetings, newest first, as a vertical timeline. */
function Timeline({ items }: { items: MeetingAttendanceHistoryItem[] }) {
  if (items.length === 0) return <EmptyState text="No meetings yet." />;
  const sorted = [...items].sort((a, b) =>
    `${b.meetingDate ?? ""}${b.meetingTime ?? ""}`.localeCompare(
      `${a.meetingDate ?? ""}${a.meetingTime ?? ""}`,
    ),
  );
  return (
    <ol className="relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[1.85rem] before:w-px before:bg-border">
      {sorted.map((item, index) => {
        const day = item.meetingDate ? meetingDay(item.meetingDate) : null;
        const note = item.attendanceNote ?? item.responseReason;
        return (
          <motion.li
            key={`${item.noticeId}-${item.memberId}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: Math.min(index, 10) * 0.04,
              ease: EASE,
            }}
            className="relative flex gap-4"
          >
            <DateBlock day={day} />
            <Link
              href={`/notice-board/${item.noticeId}`}
              className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-card transition-shadow hover:shadow-raised"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatMeetingWhen(item.meetingDate, item.meetingTime)}
                </p>
                {note ? (
                  <p className="pt-1 text-xs text-muted-foreground">“{note}”</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    responseBadgeClass(item.response),
                  )}
                >
                  Said: {responseLabel(item.response)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    attendanceBadgeClass(item.attendance),
                  )}
                >
                  {item.attendance
                    ? ATTENDANCE_LABELS[item.attendance]
                    : "Not marked"}
                </span>
              </div>
            </Link>
          </motion.li>
        );
      })}
    </ol>
  );
}

function DateBlock({ day }: { day: Date | null }) {
  return (
    <div className="relative z-10 flex size-[3.7rem] shrink-0 flex-col items-center justify-center rounded-2xl border border-border/70 bg-card shadow-card">
      {day ? (
        <>
          <span className="text-[0.65rem] font-semibold tracking-wider text-primary uppercase dark:text-emerald-300">
            {day.toLocaleString("en-NG", { month: "short" })}
          </span>
          <span className="text-lg leading-none font-semibold text-foreground">
            {day.getDate()}
          </span>
          <span className="text-[0.6rem] text-muted-foreground">
            {day.getFullYear()}
          </span>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  );
}

function Legend({
  dot,
  label,
  value,
}: {
  dot: string;
  label: string;
  value: number;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("size-2 rounded-full", dot)} aria-hidden="true" />
      {label}
      <span className="font-semibold text-foreground tabular-nums">
        {value}
      </span>
    </span>
  );
}

function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary dark:text-emerald-300",
        size === "lg" ? "size-12 text-sm" : "size-10 text-xs",
      )}
    >
      {getInitials(name)}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
