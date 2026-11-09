"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { useMarkAttendance, useMeetingRegister } from "@/hooks/use-notices";
import {
  attendanceBadgeClass,
  responseBadgeClass,
  responseLabel,
} from "@/lib/meeting";
import type {
  MeetingAttendanceEntry,
  MeetingAttendanceMark,
  MeetingRegister,
} from "@/types/notice";

const NOT_MARKED = "none";
const ATTENDANCE_ITEMS = [
  { value: NOT_MARKED, label: "Not marked" },
  { value: "Present", label: "Present" },
  { value: "Absent", label: "Absent" },
];

interface Draft {
  attendance: MeetingAttendanceMark | null;
  note: string;
}

/**
 * The meeting's attendance register, for officers: who said they're coming (and how), who sent
 * an apology and why, and the Present/Absent register itself. A "not attending" answer arrives
 * already marked Absent with the member's reason; everyone else starts blank for the officer.
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="size-4.5 text-primary" aria-hidden="true" />
          Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
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
  const canMarkAttendance =
    register.canMarkAttendance &&
    !!register.attendanceEndsAt &&
    Date.parse(register.attendanceEndsAt) > now;
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      register.entries.map((entry) => [
        entry.memberId,
        { attendance: entry.attendance, note: entry.attendanceNote ?? "" },
      ]),
    ),
  );

  const changed = register.entries.filter((entry) => {
    const draft = drafts[entry.memberId];
    return (
      draft.attendance !== entry.attendance ||
      draft.note.trim() !== (entry.attendanceNote ?? "")
    );
  });

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? register.entries.filter(
          (entry) =>
            entry.memberName.toLowerCase().includes(query) ||
            entry.memberId.toLowerCase().includes(query),
        )
      : register.entries;
  }, [register.entries, search]);

  const update = (memberId: string, patch: Partial<Draft>) =>
    setDrafts((current) => ({
      ...current,
      [memberId]: { ...current[memberId], ...patch },
    }));

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Invited" value={summary.invited} />
        <Stat label="In person" value={summary.physical} />
        <Stat label="Online" value={summary.online} />
        <Stat label="Not attending" value={summary.notAttending} />
        <Stat label="No response" value={summary.noResponse} />
        <Stat label="Present" value={summary.present} tone="success" />
        <Stat label="Absent" value={summary.absent} tone="destructive" />
      </div>

      <p className="text-sm text-muted-foreground">
        {canMarkAttendance
          ? `Attendance is open for this ${register.meetingDurationMinutes}-minute meeting.`
          : `Attendance can only be marked during the meeting and closes after ${register.meetingDurationMinutes} minutes.`}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <Button
          onClick={handleSave}
          disabled={
            !canMarkAttendance || changed.length === 0 || mark.isPending
          }
        >
          {mark.isPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Save attendance{changed.length > 0 ? ` (${changed.length})` : ""}
        </Button>
      </div>

      {register.entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nobody is on this meeting&apos;s list — it wasn&apos;t addressed to
          any active members.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Member
                  </th>
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
                {visible.map((entry) => (
                  <tr
                    key={entry.memberId}
                    className="border-b border-border last:border-0 align-top"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {entry.memberName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.memberId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <ResponseCell entry={entry} />
                    </td>
                    <td className="w-44 px-4 py-3">
                      <AttendanceSelect
                        value={drafts[entry.memberId].attendance}
                        onChange={(attendance) =>
                          update(entry.memberId, { attendance })
                        }
                        disabled={!canMarkAttendance || mark.isPending}
                        label={`Attendance for ${entry.memberName}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <NoteInput
                        entry={entry}
                        draft={drafts[entry.memberId]}
                        onChange={(note) => update(entry.memberId, { note })}
                        disabled={!canMarkAttendance || mark.isPending}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 sm:hidden">
            {visible.map((entry) => (
              <div
                key={entry.memberId}
                className="space-y-3 rounded-xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {entry.memberName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.memberId}
                    </p>
                  </div>
                  <ResponseCell entry={entry} />
                </div>
                <AttendanceSelect
                  value={drafts[entry.memberId].attendance}
                  onChange={(attendance) =>
                    update(entry.memberId, { attendance })
                  }
                  disabled={!canMarkAttendance || mark.isPending}
                  label={`Attendance for ${entry.memberName}`}
                />
                <NoteInput
                  entry={entry}
                  draft={drafts[entry.memberId]}
                  onChange={(note) => update(entry.memberId, { note })}
                  disabled={!canMarkAttendance || mark.isPending}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ResponseCell({ entry }: { entry: MeetingAttendanceEntry }) {
  return (
    <div className="space-y-1">
      <Badge variant="secondary" className={responseBadgeClass(entry.response)}>
        {responseLabel(entry.response)}
      </Badge>
      {entry.responseReason ? (
        <p className="max-w-xs text-xs text-muted-foreground">
          {entry.responseReason}
        </p>
      ) : null}
    </div>
  );
}

function AttendanceSelect({
  value,
  onChange,
  disabled,
  label,
}: {
  value: MeetingAttendanceMark | null;
  onChange: (value: MeetingAttendanceMark | null) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <Select
      value={value ?? NOT_MARKED}
      items={ATTENDANCE_ITEMS}
      onValueChange={(next) =>
        onChange(
          !next || next === NOT_MARKED ? null : (next as MeetingAttendanceMark),
        )
      }
      disabled={disabled}
    >
      <SelectTrigger className="h-10 w-full" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ATTENDANCE_ITEMS.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            <span
              className={
                item.value === NOT_MARKED
                  ? "text-muted-foreground"
                  : attendanceBadgeClass(
                      item.value as MeetingAttendanceMark,
                    ).split(" ")[1]
              }
            >
              {item.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NoteInput({
  entry,
  draft,
  onChange,
  disabled,
}: {
  entry: MeetingAttendanceEntry;
  draft: Draft;
  onChange: (note: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1">
      <Input
        value={draft.note}
        onChange={(event) => onChange(event.target.value)}
        maxLength={500}
        placeholder="Optional note"
        className="h-10"
        disabled={disabled}
        aria-label={`Note for ${entry.memberName}`}
      />
      {entry.attendanceAuto ? (
        <p className="text-xs text-muted-foreground">From their apology</p>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "destructive";
}) {
  return (
    <div className="rounded-xl border border-border px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          tone === "success"
            ? "text-lg font-semibold text-success"
            : tone === "destructive"
              ? "text-lg font-semibold text-destructive"
              : "text-lg font-semibold text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}
