"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ClipboardList,
  FileText,
  Loader2,
  MonitorSmartphone,
  Search,
  UserCheck,
  UserX,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  ExportImportMenu,
  type ImportConfig,
  type ImportResult,
} from "@/components/features/shared/export-import-menu";
import {
  downloadAttendanceTemplate,
  parseAttendanceFile,
  type ImportedAttendanceRow,
} from "@/lib/attendance-import";
import type { ExportColumn } from "@/lib/table-export";
import {
  useApproveCheckIns,
  useMarkAttendance,
  useMeetingRegister,
} from "@/hooks/use-notices";
import {
  formatClock,
  meetingPhase,
  responseLabel,
  useNow,
  type MeetingPhase,
} from "@/lib/meeting";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ATTENDANCE_LABELS,
  CHECK_IN_LABELS,
  type MeetingAttendanceEntry,
  type MeetingAttendanceMark,
  type MeetingRegister,
} from "@/types/notice";

const EASE = [0.16, 1, 0.3, 1] as const;

type Bucket = "inPerson" | "online" | "absent" | "unmarked";
type Filter = "all" | "awaiting" | Bucket;

const bucketOf = (entry: MeetingAttendanceEntry): Bucket =>
  entry.attendance === "Present"
    ? "inPerson"
    : entry.attendance === "PresentOnline"
      ? "online"
      : entry.attendance === "Absent"
        ? "absent"
        : "unmarked";

const matches = (entry: MeetingAttendanceEntry, filter: Filter) =>
  filter === "all" ||
  (filter === "awaiting" ? entry.awaitingApproval : bucketOf(entry) === filter);

const MARKS: {
  value: MeetingAttendanceMark;
  label: string;
  icon: typeof UserCheck;
  pressed: string;
}[] = [
  {
    value: "Present",
    label: "In person",
    icon: UserCheck,
    pressed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  {
    value: "PresentOnline",
    label: "Online",
    icon: MonitorSmartphone,
    pressed: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  },
  {
    value: "Absent",
    label: "Absent",
    icon: UserX,
    pressed: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  },
];

/**
 * A meeting's attendance, for officers. Members check themselves in during the meeting (until 30
 * minutes before it ends); officers approve or reject those check-ins, or mark anyone directly,
 * from the start until the end. Every change saves straight away.
 */
export function MeetingRegisterCard({ noticeId }: { noticeId: string }) {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useMeetingRegister(noticeId);

  return (
    <Card>
      <CardContent>
        <QueryBoundary
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          isRetrying={isRefetching}
          errorTitle="Couldn't load the attendance"
        >
          {data ? <RegisterBody noticeId={noticeId} register={data} /> : null}
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
  const approve = useApproveCheckIns(noticeId);
  const now = useNow(5_000);
  const phase = meetingPhase(register.window, now);
  const canMark = phase === "checkin" || phase === "approvals";
  const busy = mark.isPending || approve.isPending;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [noteFor, setNoteFor] = useState<MeetingAttendanceEntry | null>(null);
  const [noteText, setNoteText] = useState("");

  const entries = register.entries;
  const total = entries.length;
  const count = (f: Filter) => entries.filter((e) => matches(e, f)).length;
  const marked = total - count("unmarked");
  const awaiting = count("awaiting");
  const said = {
    physical: register.summary.physical,
    online: register.summary.online,
    apologies: register.summary.notAttending,
    none: register.summary.noResponse,
  };

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter(
      (e) =>
        matches(e, filter) &&
        (!query ||
          e.memberName.toLowerCase().includes(query) ||
          e.memberId.toLowerCase().includes(query)),
    );
  }, [entries, filter, search]);

  const failed = (title: string) => (error: unknown) =>
    toast.error(title, {
      description: error instanceof Error ? error.message : "Please try again.",
    });

  const saveMarks = async (
    changes: {
      entry: MeetingAttendanceEntry;
      attendance: MeetingAttendanceMark | null;
      note?: string | null;
    }[],
    success?: string,
  ) => {
    if (changes.length === 0) return;
    try {
      await mark.mutateAsync(
        changes.map(({ entry, attendance, note }) => ({
          memberId: entry.memberId,
          attendance,
          note: note === undefined ? entry.attendanceNote : note,
        })),
      );
      if (success) toast.success(success);
    } catch (error) {
      failed("Couldn't save the attendance")(error);
    }
  };

  const approveIds = async (memberIds: string[], success: string) => {
    if (memberIds.length === 0) return;
    try {
      await approve.mutateAsync(memberIds);
      toast.success(success);
    } catch (error) {
      failed("Couldn't approve the check-in")(error);
    }
  };

  /** Clicking the active option again clears that member's attendance. */
  const toggleMark = (
    entry: MeetingAttendanceEntry,
    value: MeetingAttendanceMark,
  ) =>
    saveMarks([
      {
        entry,
        attendance:
          entry.attendance === value && !entry.attendanceAuto ? null : value,
      },
    ]);

  const reject = (entry: MeetingAttendanceEntry) =>
    saveMarks(
      [{ entry, attendance: "Absent" }],
      `${entry.memberName}'s check-in wasn't approved`,
    );

  // "Mark as they said": a check-in is approved; otherwise their earlier answer is used.
  const asTheySaid = entries.filter(
    (e) =>
      e.attendance === null &&
      (e.checkInMode !== null ||
        e.response === "Physical" ||
        e.response === "Online"),
  );
  const markAsTheySaid = async () => {
    const checkedIn = asTheySaid.filter((e) => e.checkInMode !== null);
    const fromAnswers = asTheySaid.filter((e) => e.checkInMode === null);
    try {
      if (checkedIn.length)
        await approve.mutateAsync(checkedIn.map((e) => e.memberId));
      if (fromAnswers.length)
        await mark.mutateAsync(
          fromAnswers.map((e) => ({
            memberId: e.memberId,
            attendance: e.response === "Online" ? "PresentOnline" : "Present",
            note: e.attendanceNote,
          })),
        );
      toast.success(
        `Marked ${asTheySaid.length} ${asTheySaid.length === 1 ? "person" : "people"} as they said. Change anyone who didn't come.`,
      );
    } catch (error) {
      failed("Couldn't mark everyone")(error);
    }
  };

  const selectedEntries = entries.filter((e) => selected.has(e.memberId));
  const selectedAwaiting = selectedEntries.filter((e) => e.awaitingApproval);
  const clearSelection = () => setSelected(new Set());
  const bulkMark = async (value: MeetingAttendanceMark) => {
    await saveMarks(
      selectedEntries.map((entry) => ({ entry, attendance: value })),
      `${selectedEntries.length} ${selectedEntries.length === 1 ? "attendee" : "attendees"} updated`,
    );
    clearSelection();
  };
  const bulkApprove = async () => {
    await approveIds(
      selectedAwaiting.map((e) => e.memberId),
      `${selectedAwaiting.length} check-in${selectedAwaiting.length === 1 ? "" : "s"} approved`,
    );
    clearSelection();
  };

  const allVisibleSelected =
    visible.length > 0 && visible.every((e) => selected.has(e.memberId));
  const someVisibleSelected = visible.some((e) => selected.has(e.memberId));
  const toggleAll = () =>
    setSelected((current) => {
      const next = new Set(current);
      for (const e of visible) {
        if (allVisibleSelected) next.delete(e.memberId);
        else next.add(e.memberId);
      }
      return next;
    });

  const openNote = (entry: MeetingAttendanceEntry) => {
    setNoteFor(entry);
    setNoteText(entry.attendanceNote ?? "");
  };
  const saveNote = async (text: string) => {
    if (!noteFor) return;
    await saveMarks([
      {
        entry: noteFor,
        attendance: noteFor.attendance,
        note: text.trim() || null,
      },
    ]);
    setNoteFor(null);
  };

  // Excel round-trip, while attendance is open.
  const exportColumns: ExportColumn<MeetingAttendanceEntry>[] = [
    { header: "Membership ID", accessor: (row) => row.memberId },
    { header: "Member", accessor: (row) => row.memberName },
    {
      header: "Said beforehand",
      accessor: (row) => responseLabel(row.response),
    },
    {
      header: "Checked in",
      accessor: (row) =>
        row.checkInMode
          ? `${CHECK_IN_LABELS[row.checkInMode]} at ${formatClock(row.checkedInAt)}`
          : "",
    },
    {
      header: "Attendance",
      accessor: (row) =>
        row.attendance
          ? ATTENDANCE_LABELS[row.attendance]
          : row.awaitingApproval
            ? "Awaiting approval"
            : "Not marked",
    },
    {
      header: "Note",
      accessor: (row) => row.attendanceNote ?? row.responseReason ?? "",
    },
  ];
  const importConfig: ImportConfig<ImportedAttendanceRow> | undefined = canMark
    ? {
        templateStorageKey: `attendance-template-${noticeId}`,
        downloadTemplate: () => downloadAttendanceTemplate(register),
        parseFile: (file) => parseAttendanceFile(file, register),
        onImport: async (rows): Promise<ImportResult> => {
          if (rows.length === 0) return { imported: 0, errors: [] };
          try {
            await mark.mutateAsync(
              rows.map((row) => ({
                memberId: row.memberId,
                attendance: row.attendance,
                note: row.note,
              })),
            );
            return { imported: rows.length, errors: [] };
          } catch (error) {
            return {
              imported: 0,
              errors: [
                {
                  row: rows[0].rowNumber,
                  message:
                    error instanceof Error
                      ? error.message
                      : "Couldn't save the uploaded attendance",
                },
              ],
            };
          }
        },
      }
    : undefined;

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "Everyone" },
    { value: "unmarked", label: "Not marked" },
    ...(awaiting > 0
      ? [{ value: "awaiting" as Filter, label: "Awaiting approval" }]
      : []),
    { value: "inPerson", label: "In person" },
    { value: "online", label: "Online" },
    { value: "absent", label: "Absent" },
  ];
  const pct = (n: number) => (total ? (n / total) * 100 : 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex size-13 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
          <ClipboardList className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-48 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            Attendance
          </h3>
          <p className="text-sm text-muted-foreground">
            {register.meetingDurationMinutes}-minute meeting · {total} invited
          </p>
        </div>
        <StatusPill phase={phase} register={register} />
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Tile
          label="Present in person"
          value={count("inPerson")}
          icon={UserCheck}
          tone="border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
        />
        <Tile
          label="Present online"
          value={count("online")}
          icon={MonitorSmartphone}
          tone="border-sky-200/80 bg-sky-50/80 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300"
        />
        <Tile
          label="Absent"
          value={count("absent")}
          icon={UserX}
          tone="border-rose-200/80 bg-rose-50/80 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
        />
      </div>

      {/* Progress */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-sm font-semibold text-foreground">
            {marked} of {total} marked
          </span>
          {awaiting > 0 ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              {awaiting} awaiting approval
            </span>
          ) : null}
          <span className="ml-auto text-sm text-muted-foreground">
            Said beforehand: {said.physical} in person · {said.online} online ·{" "}
            {said.apologies} {said.apologies === 1 ? "apology" : "apologies"} ·{" "}
            {said.none} no reply
          </span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          {(
            [
              ["inPerson", "bg-emerald-500"],
              ["online", "bg-sky-500"],
              ["absent", "bg-rose-500"],
            ] as const
          ).map(([key, color]) => (
            <motion.div
              key={key}
              className={color}
              initial={false}
              animate={{ width: `${pct(count(key))}%` }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-52 flex-1 sm:max-w-80">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search members"
              className="pl-10"
              aria-label="Search members"
            />
          </div>
          <Button
            variant="outline"
            className="h-10"
            onClick={markAsTheySaid}
            disabled={!canMark || busy || asTheySaid.length === 0}
            title="Marks everyone not yet marked: by their check-in if they checked in, otherwise by what they said beforehand"
          >
            <Wand2 className="size-4" aria-hidden="true" />
            Mark as they said
          </Button>
          <div className="ml-auto">
            <ExportImportMenu
              rows={entries}
              columns={exportColumns}
              filenamePrefix={`attendance-${register.meetingDate ?? noticeId}`}
              exportTitle={`Attendance — ${register.title}`}
              entityLabel="attendance record"
              importConfig={importConfig}
            />
          </div>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter attendees"
        >
          {filters.map((option) => {
            const active = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(option.value)}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-full border pr-1.5 pl-3.5 text-sm font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
              >
                {option.label}
                <span
                  className={cn(
                    "grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs tabular-nums",
                    active ? "bg-white/20" : "bg-muted",
                  )}
                >
                  {count(option.value)}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence initial={false}>
          {selected.size > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="flex flex-wrap items-center gap-1.5 rounded-xl bg-primary/10 py-2 pr-2 pl-4 text-primary dark:text-emerald-300"
            >
              <span className="mr-auto text-sm font-semibold">
                {selected.size} selected
              </span>
              {MARKS.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  size="sm"
                  disabled={!canMark || busy}
                  onClick={() => bulkMark(option.value)}
                >
                  <option.icon className="size-4" aria-hidden="true" />
                  {option.label}
                </Button>
              ))}
              {selectedAwaiting.length > 0 ? (
                <Button
                  size="sm"
                  disabled={!canMark || busy}
                  onClick={bulkApprove}
                >
                  <Check className="size-4" aria-hidden="true" />
                  Approve check-ins
                </Button>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Attendees */}
      {total === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          Nobody is on this meeting&apos;s list. It wasn&apos;t addressed to any
          active members.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50 text-left">
                {canMark ? (
                  <th className="h-12 w-12 border-b border-border pl-5">
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={!allVisibleSelected && someVisibleSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select everyone shown"
                    />
                  </th>
                ) : null}
                {["Member", "Member check-in", "Attendance"].map(
                  (label, index) => (
                    <th
                      key={label}
                      className={cn(
                        "h-12 border-b border-border px-4 text-xs font-bold tracking-wider whitespace-nowrap text-muted-foreground uppercase",
                        !canMark && index === 0 && "pl-5",
                        index === 2 && "pr-5 text-right",
                      )}
                    >
                      {label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={canMark ? 4 : 3}
                    className="px-6 py-14 text-center text-muted-foreground"
                  >
                    <span className="block font-semibold text-foreground">
                      No one matches
                    </span>
                    Try another filter or search.
                  </td>
                </tr>
              ) : (
                visible.map((entry) => (
                  <AttendeeRow
                    key={entry.memberId}
                    entry={entry}
                    canMark={canMark}
                    busy={busy}
                    selected={selected.has(entry.memberId)}
                    onSelect={(on) =>
                      setSelected((current) => {
                        const next = new Set(current);
                        if (on) next.add(entry.memberId);
                        else next.delete(entry.memberId);
                        return next;
                      })
                    }
                    onMark={(value) => toggleMark(entry, value)}
                    onApprove={() =>
                      approveIds(
                        [entry.memberId],
                        `${entry.memberName}'s attendance confirmed`,
                      )
                    }
                    onReject={() => reject(entry)}
                    onNote={() => openNote(entry)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={noteFor !== null}
        onOpenChange={(open) => (!open ? setNoteFor(null) : null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Note for {noteFor?.memberName}</DialogTitle>
            <DialogDescription>
              Only officers see attendance notes.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="e.g. Left early at 3pm"
            aria-label="Note"
            disabled={!canMark}
          />
          <DialogFooter>
            {noteFor?.attendanceNote ? (
              <Button
                variant="ghost"
                className="mr-auto text-destructive hover:text-destructive"
                disabled={!canMark || busy}
                onClick={() => saveNote("")}
              >
                Remove note
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setNoteFor(null)}>
              Cancel
            </Button>
            <Button
              disabled={!canMark || busy}
              onClick={() => saveNote(noteText)}
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({
  phase,
  register,
}: {
  phase: MeetingPhase;
  register: MeetingRegister;
}) {
  const { checkInClosesAt, endsAt } = register.window;
  const config = {
    before: {
      text: "Closed — opens when the meeting starts",
      tone: "bg-muted text-muted-foreground",
      dot: "bg-muted-foreground/60",
      live: false,
    },
    checkin: {
      text: `Open — check-in closes ${formatClock(checkInClosesAt)} · approvals until ${formatClock(endsAt)}`,
      tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
      dot: "bg-emerald-500",
      live: true,
    },
    approvals: {
      text: `Check-in closed — approvals until ${formatClock(endsAt)}`,
      tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
      dot: "bg-amber-500",
      live: true,
    },
    after: {
      text: "Closed — the meeting has ended",
      tone: "bg-muted text-muted-foreground",
      dot: "bg-muted-foreground/60",
      live: false,
    },
  }[phase];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold",
        config.tone,
      )}
    >
      <span className="relative flex size-2">
        {config.live ? (
          <span
            className={cn(
              "absolute inline-flex size-full animate-ping rounded-full opacity-60",
              config.dot,
            )}
          />
        ) : null}
        <span
          className={cn("relative inline-flex size-2 rounded-full", config.dot)}
        />
      </span>
      {config.text}
    </span>
  );
}

function Tile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof UserCheck;
  tone: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border px-5 py-4",
        tone,
      )}
    >
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="text-3xl leading-tight font-bold tracking-tight tabular-nums"
        >
          {value}
        </motion.p>
      </div>
      <Icon className="size-6 opacity-80" aria-hidden="true" />
    </div>
  );
}

function SaidChip({ entry }: { entry: MeetingAttendanceEntry }) {
  const text =
    entry.response === "Physical"
      ? "Attending in person"
      : entry.response === "Online"
        ? "Attending online"
        : entry.response === "NotAttending"
          ? "Apologies"
          : "No response";
  return (
    <span
      title={entry.responseReason ?? undefined}
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        entry.response === "NotAttending"
          ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
          : entry.response
            ? "bg-primary/10 text-primary dark:text-emerald-300"
            : "bg-muted text-muted-foreground",
      )}
    >
      Said: {text}
    </span>
  );
}

function AttendeeRow({
  entry,
  canMark,
  busy,
  selected,
  onSelect,
  onMark,
  onApprove,
  onReject,
  onNote,
}: {
  entry: MeetingAttendanceEntry;
  canMark: boolean;
  busy: boolean;
  selected: boolean;
  onSelect: (on: boolean) => void;
  onMark: (value: MeetingAttendanceMark) => void;
  onApprove: () => void;
  onReject: () => void;
  onNote: () => void;
}) {
  const expected = entry.checkInMode === "Online" ? "PresentOnline" : "Present";
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors last:border-b-0 hover:bg-muted/40",
        selected && "bg-primary/5",
      )}
    >
      {canMark ? (
        <td className="w-12 py-3 pl-5 align-middle">
          <Checkbox
            checked={selected}
            onCheckedChange={(on) => onSelect(on === true)}
            aria-label={`Select ${entry.memberName}`}
          />
        </td>
      ) : null}

      <td className={cn("px-4 py-3 align-middle", !canMark && "pl-5")}>
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:text-emerald-300">
            {getInitials(entry.memberName)}
          </span>
          <div className="grid min-w-0 gap-1">
            <span className="text-[0.95rem] font-semibold text-foreground">
              {entry.memberName}
            </span>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {entry.memberId}
              <SaidChip entry={entry} />
            </div>
            <button
              type="button"
              onClick={onNote}
              className={cn(
                "inline-flex max-w-72 items-center gap-1.5 justify-self-start text-sm transition-colors hover:text-primary",
                entry.attendanceNote
                  ? "text-muted-foreground italic"
                  : "text-muted-foreground/70",
              )}
            >
              <FileText className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {entry.attendanceNote ?? (canMark ? "Add a note" : "No note")}
              </span>
            </button>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 align-middle whitespace-nowrap">
        {entry.checkInMode ? (
          <div className="grid gap-0.5">
            <span className="inline-flex items-center gap-1.5 text-foreground">
              {entry.checkInMode === "Online" ? (
                <MonitorSmartphone className="size-4" aria-hidden="true" />
              ) : (
                <UserCheck className="size-4" aria-hidden="true" />
              )}
              {CHECK_IN_LABELS[entry.checkInMode]}
            </span>
            <span className="text-xs text-muted-foreground">
              at {formatClock(entry.checkedInAt)}
            </span>
            {entry.awaitingApproval ? (
              canMark ? (
                <div className="mt-1.5 flex gap-1.5">
                  <Button size="sm" disabled={busy} onClick={onApprove}>
                    <Check className="size-3.5" aria-hidden="true" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={onReject}
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                  Not reviewed
                </span>
              )
            ) : (
              <span
                className={cn(
                  "text-xs font-semibold",
                  entry.attendance === expected
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-rose-700 dark:text-rose-300",
                )}
              >
                {entry.attendance === expected
                  ? "Approved"
                  : entry.attendance === "Absent"
                    ? "Not approved"
                    : "Changed by an officer"}
              </span>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        )}
      </td>

      <td className="py-3 pr-5 pl-4 text-right align-middle whitespace-nowrap">
        <div
          role="group"
          aria-label={`Attendance for ${entry.memberName}`}
          className="inline-flex gap-0.5 rounded-full bg-muted p-[3px]"
        >
          {MARKS.map((option) => {
            const pressed = entry.attendance === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={pressed}
                title={option.label}
                disabled={!canMark || busy}
                onClick={() => onMark(option.value)}
                className={cn(
                  "inline-flex h-[34px] items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed xl:px-3",
                  pressed
                    ? option.pressed
                    : "text-muted-foreground/80 enabled:hover:text-foreground",
                  !canMark && !pressed && "opacity-60",
                )}
              >
                <option.icon className="size-4" aria-hidden="true" />
                <span className="sr-only xl:not-sr-only">{option.label}</span>
              </button>
            );
          })}
        </div>
        {entry.response === "NotAttending" && entry.attendance === "Absent" ? (
          <div className="mt-1 text-xs text-muted-foreground">
            With apologies
          </div>
        ) : null}
      </td>
    </tr>
  );
}
