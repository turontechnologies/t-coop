"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardList,
  Loader2,
  MonitorSmartphone,
  Search,
  StickyNote,
  UserCheck,
  UserX,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { useMarkAttendance, useMeetingRegister } from "@/hooks/use-notices";
import { formatTimeLabel } from "@/components/ui/time-picker";
import { responseBadgeClass, responseLabel } from "@/lib/meeting";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  MeetingAttendanceEntry,
  MeetingAttendanceMark,
  MeetingRegister,
} from "@/types/notice";

interface Draft {
  attendance: MeetingAttendanceMark | null;
  note: string;
}

type Filter = "all" | "unmarked" | MeetingAttendanceMark;

const MARKS: {
  value: MeetingAttendanceMark;
  label: string;
  icon: typeof UserCheck;
  active: string;
}[] = [
  {
    value: "Present",
    label: "In person",
    icon: UserCheck,
    active: "text-emerald-700 dark:text-emerald-300",
  },
  {
    value: "PresentOnline",
    label: "Online",
    icon: MonitorSmartphone,
    active: "text-sky-700 dark:text-sky-300",
  },
  {
    value: "Absent",
    label: "Absent",
    icon: UserX,
    active: "text-rose-700 dark:text-rose-300",
  },
];

const PILL_BG: Record<MeetingAttendanceMark, string> = {
  Present: "bg-emerald-100 dark:bg-emerald-500/20",
  PresentOnline: "bg-sky-100 dark:bg-sky-500/20",
  Absent: "bg-rose-100 dark:bg-rose-500/20",
};

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The meeting's attendance sheet, for officers. Everyone the notice reached is listed with what
 * they said beforehand; the officer marks each one present in person, present online, or absent.
 * A "not attending" answer arrives already marked absent with the member's reason. Marking is
 * open from the meeting's start until its scheduled duration ends.
 */
export function MeetingRegisterCard({ noticeId }: { noticeId: string }) {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    dataUpdatedAt,
  } = useMeetingRegister(noticeId);

  return (
    <Card>
      <CardContent className="space-y-5">
        <QueryBoundary
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
          errorTitle="Couldn't load the attendance"
        >
          {data ? (
            <RegisterBody
              key={dataUpdatedAt}
              noticeId={noticeId}
              register={data}
            />
          ) : null}
        </QueryBoundary>
      </CardContent>
    </Card>
  );
}

function RegisterBody({
  noticeId,
  register,
}: {
  noticeId: string;
  register: MeetingRegister;
}) {
  const mark = useMarkAttendance(noticeId);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(timer);
  }, []);
  const canMark =
    register.canMarkAttendance &&
    !!register.attendanceEndsAt &&
    Date.parse(register.attendanceEndsAt) > now;

  const initialDrafts = () =>
    Object.fromEntries(
      register.entries.map((entry) => [
        entry.memberId,
        { attendance: entry.attendance, note: entry.attendanceNote ?? "" },
      ]),
    ) as Record<string, Draft>;
  const [drafts, setDrafts] = useState<Record<string, Draft>>(initialDrafts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());

  const changed = register.entries.filter((entry) => {
    const draft = drafts[entry.memberId];
    return (
      draft.attendance !== entry.attendance ||
      draft.note.trim() !== (entry.attendanceNote ?? "")
    );
  });

  // Live counts from the sheet as it's being filled in, not just what's saved.
  const counts = useMemo(() => {
    const result = { Present: 0, PresentOnline: 0, Absent: 0, unmarked: 0 };
    for (const entry of register.entries) {
      const value = drafts[entry.memberId]?.attendance;
      if (value) result[value] += 1;
      else result.unmarked += 1;
    }
    return result;
  }, [drafts, register.entries]);
  const total = register.entries.length;
  const markedCount = total - counts.unmarked;

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return register.entries.filter((entry) => {
      const value = drafts[entry.memberId]?.attendance ?? null;
      const matchesFilter =
        filter === "all" ||
        (filter === "unmarked" ? value === null : value === filter);
      const matchesSearch =
        !query ||
        entry.memberName.toLowerCase().includes(query) ||
        entry.memberId.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [register.entries, drafts, filter, search]);

  const update = (memberId: string, patch: Partial<Draft>) =>
    setDrafts((current) => ({
      ...current,
      [memberId]: { ...current[memberId], ...patch },
    }));

  // "Mark as they said": in person → In person, online → Online, apology → Absent.
  const fromResponses = register.entries.filter(
    (entry) => entry.response && drafts[entry.memberId]?.attendance === null,
  );
  const applyResponses = () => {
    setDrafts((current) => {
      const next = { ...current };
      for (const entry of fromResponses) {
        const value: MeetingAttendanceMark =
          entry.response === "Physical"
            ? "Present"
            : entry.response === "Online"
              ? "PresentOnline"
              : "Absent";
        next[entry.memberId] = { ...next[entry.memberId], attendance: value };
      }
      return next;
    });
    toast.success(
      `Marked ${fromResponses.length} ${fromResponses.length === 1 ? "member" : "members"} as they said`,
    );
  };

  const handleSave = async () => {
    try {
      await mark.mutateAsync(
        changed.map((entry) => ({
          memberId: entry.memberId,
          attendance: drafts[entry.memberId].attendance,
          note: drafts[entry.memberId].note.trim() || null,
        })),
      );
      toast.success("Attendance saved");
    } catch (error) {
      toast.error("Couldn't save the attendance", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const { summary } = register;
  const closesAt = register.attendanceEndsAt
    ? new Date(register.attendanceEndsAt)
    : null;
  const closesLabel = closesAt
    ? formatTimeLabel(
        `${String(closesAt.getHours()).padStart(2, "0")}:${String(closesAt.getMinutes()).padStart(2, "0")}`,
      )
    : null;

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "Everyone", count: total },
    { value: "unmarked", label: "Not marked", count: counts.unmarked },
    { value: "Present", label: "In person", count: counts.Present },
    { value: "PresentOnline", label: "Online", count: counts.PresentOnline },
    { value: "Absent", label: "Absent", count: counts.Absent },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-emerald-300">
            <ClipboardList className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              Attendance
            </h3>
            <p className="text-sm text-muted-foreground">
              {register.meetingDurationMinutes}-minute meeting · {total} invited
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
            canMark
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-muted text-muted-foreground",
          )}
        >
          <span className="relative flex size-2">
            {canMark ? (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            ) : null}
            <span
              className={cn(
                "relative inline-flex size-2 rounded-full",
                canMark ? "bg-emerald-500" : "bg-muted-foreground/50",
              )}
            />
          </span>
          {canMark
            ? `Open${closesLabel ? ` — closes ${closesLabel}` : ""}`
            : "Closed — opens when the meeting starts, for its duration"}
        </span>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TotalTile
          icon={UserCheck}
          label="Present in person"
          value={counts.Present}
          tone="bg-emerald-50 text-emerald-700 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
        />
        <TotalTile
          icon={MonitorSmartphone}
          label="Present online"
          value={counts.PresentOnline}
          tone="bg-sky-50 text-sky-700 ring-sky-200/70 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20"
        />
        <TotalTile
          icon={UserX}
          label="Absent"
          value={counts.Absent}
          tone="bg-rose-50 text-rose-700 ring-rose-200/70 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20"
        />
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">
            {markedCount} of {total} marked
          </span>
          <span className="text-muted-foreground">
            Said beforehand: {summary.physical} in person · {summary.online}{" "}
            online · {summary.notAttending} apologies · {summary.noResponse} no
            reply
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          {(["Present", "PresentOnline", "Absent"] as const).map((value) => (
            <motion.div
              key={value}
              className={cn(
                value === "Present" && "bg-emerald-500",
                value === "PresentOnline" && "bg-sky-500",
                value === "Absent" && "bg-rose-500",
              )}
              initial={false}
              animate={{
                width: total ? `${(counts[value] / total) * 100}%` : "0%",
              }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search members"
              className="pl-9"
              aria-label="Search members"
            />
          </div>
          <Button
            variant="outline"
            onClick={applyResponses}
            disabled={!canMark || fromResponses.length === 0}
            title="Mark everyone who answered: in person → In person, online → Online, apology → Absent"
          >
            <Wand2 className="size-4" aria-hidden="true" />
            Mark as they said
            {fromResponses.length > 0 ? ` (${fromResponses.length})` : ""}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist">
          {filters.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={filter === option.value}
              onClick={() => setFilter(option.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === option.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {option.label}
              <span
                className={cn(
                  "rounded-full px-1.5 tabular-nums",
                  filter === option.value ? "bg-white/20" : "bg-muted",
                )}
              >
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Members */}
      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Nobody is on this meeting&apos;s list — it wasn&apos;t addressed to
          any active members.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          <AnimatePresence initial={false}>
            {visible.map((entry) => (
              <motion.li
                key={entry.memberId}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="bg-card"
              >
                <MemberRow
                  entry={entry}
                  draft={drafts[entry.memberId]}
                  disabled={!canMark || mark.isPending}
                  noteOpen={
                    openNotes.has(entry.memberId) ||
                    !!drafts[entry.memberId].note
                  }
                  onOpenNote={() =>
                    setOpenNotes((current) =>
                      new Set(current).add(entry.memberId),
                    )
                  }
                  onChange={(patch) => update(entry.memberId, patch)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
          {visible.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              No one matches this filter.
            </li>
          ) : null}
        </ul>
      )}

      {/* Save bar: slides up once there's something to save. */}
      <AnimatePresence>
        {changed.length > 0 ? (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-raised backdrop-blur"
          >
            <p className="text-sm text-foreground">
              <span className="font-semibold">{changed.length}</span> unsaved{" "}
              {changed.length === 1 ? "change" : "changes"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setDrafts(initialDrafts())}
                disabled={mark.isPending}
              >
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={!canMark || mark.isPending}
              >
                {mark.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Save attendance
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MemberRow({
  entry,
  draft,
  disabled,
  noteOpen,
  onOpenNote,
  onChange,
}: {
  entry: MeetingAttendanceEntry;
  draft: Draft;
  disabled: boolean;
  noteOpen: boolean;
  onOpenNote: () => void;
  onChange: (patch: Partial<Draft>) => void;
}) {
  return (
    <div className="space-y-3 px-4 py-3.5 transition-colors hover:bg-muted/30">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary dark:text-emerald-300">
          {getInitials(entry.memberName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {entry.memberName}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-xs text-muted-foreground">
              {entry.memberId}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
                responseBadgeClass(entry.response),
              )}
            >
              Said: {responseLabel(entry.response)}
            </span>
          </div>
        </div>

        <AttendanceSwitch
          value={draft.attendance}
          disabled={disabled}
          id={entry.memberId}
          label={entry.memberName}
          onChange={(attendance) => onChange({ attendance })}
        />
      </div>

      {entry.responseReason ? (
        <p className="ml-13 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Reason: {entry.responseReason}
        </p>
      ) : null}

      {noteOpen ? (
        <div className="ml-13 space-y-1">
          <Input
            value={draft.note}
            onChange={(event) => onChange({ note: event.target.value })}
            maxLength={500}
            placeholder="Note (optional)"
            disabled={disabled}
            aria-label={`Note for ${entry.memberName}`}
          />
          {entry.attendanceAuto ? (
            <p className="text-xs text-muted-foreground">From their apology</p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenNote}
          disabled={disabled}
          className="ml-13 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <StickyNote className="size-3.5" aria-hidden="true" />
          Add a note
        </button>
      )}
    </div>
  );
}

/** In person / Online / Absent — a segmented switch with a sliding highlight. Tapping the
 * selected option again clears it. */
function AttendanceSwitch({
  value,
  disabled,
  id,
  label,
  onChange,
}: {
  value: MeetingAttendanceMark | null;
  disabled: boolean;
  id: string;
  label: string;
  onChange: (value: MeetingAttendanceMark | null) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={`Attendance for ${label}`}
      className="flex w-full rounded-xl bg-muted p-1 sm:w-auto"
    >
      {MARKS.map((option) => {
        const active = value === option.value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(active ? null : option.value)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none",
              active
                ? option.active
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId={`attendance-pill-${id}`}
                className={cn(
                  "absolute inset-0 rounded-lg shadow-card",
                  PILL_BG[option.value],
                )}
                transition={{ duration: 0.3, ease: EASE }}
              />
            ) : null}
            <Icon className="relative size-3.5" aria-hidden="true" />
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TotalTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UserCheck;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl px-4 py-3.5 ring-1",
        tone,
      )}
    >
      <div>
        <p className="text-xs font-medium opacity-80">{label}</p>
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="text-2xl font-semibold tracking-tight tabular-nums"
        >
          {value}
        </motion.p>
      </div>
      <Icon className="size-6 opacity-70" aria-hidden="true" />
    </div>
  );
}
