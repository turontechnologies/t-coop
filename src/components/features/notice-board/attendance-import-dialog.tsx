"use client";

import { useId, useRef, useState } from "react";
import { AlertCircle, FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  downloadAttendanceTemplate,
  parseAttendanceFile,
  type ImportedAttendanceRow,
} from "@/lib/attendance-import";
import type { ImportRowError } from "@/lib/table-import";
import { useImportAttendance, useMeetingRegister } from "@/hooks/use-notices";
import { formatDateLong } from "@/lib/format";
import { meetingDay } from "@/lib/meeting";
import { cn } from "@/lib/utils";

export interface ImportableMeeting {
  noticeId: string;
  title: string;
  meetingDate: string | null;
}

const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Upload a meeting's attendance from a spreadsheet: pick the meeting (unless it's fixed),
 * download its template, fill in the Attendance column and drop the file back in. Officers can
 * do this at any time — before, during or after the meeting — unlike live marking.
 */
export function AttendanceImportDialog({
  open,
  onOpenChange,
  meetings,
  noticeId: fixedNoticeId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Meetings to choose from; leave out when `noticeId` is given. */
  meetings?: ImportableMeeting[];
  noticeId?: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const noticeId = fixedNoticeId ?? picked ?? meetings?.[0]?.noticeId;
  const { data: register, isLoading } = useMeetingRegister(noticeId, open);
  const importAttendance = useImportAttendance();
  const inputRef = useRef<HTMLInputElement>(null);
  const meetingFieldId = useId();

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportedAttendanceRow[]>([]);
  const [issues, setIssues] = useState<ImportRowError[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const reset = () => {
    setFile(null);
    setRows([]);
    setIssues([]);
    setProblem(null);
  };

  const take = async (next: File | undefined) => {
    if (!next || !register) return;
    reset();
    setFile(next);
    if (!/\.(xlsx|xls|csv)$/i.test(next.name)) {
      setProblem(
        `"${next.name}" isn't a spreadsheet. Upload the template as .xlsx, or save it as .csv.`,
      );
      return;
    }
    if (next.size > MAX_BYTES) {
      setProblem(
        "This file is over 2 MB. Attendance sheets are much smaller; check you picked the right file.",
      );
      return;
    }
    try {
      const parsed = await parseAttendanceFile(next, register);
      setRows(parsed.rows);
      setIssues(parsed.errors);
      if (parsed.rows.length === 0)
        setProblem(
          "No rows to import. Fill in the Attendance column for at least one person.",
        );
    } catch {
      setProblem(
        "We couldn't read that file. Download the template, fill it in without changing the headers, and upload it again.",
      );
    }
  };

  const submit = async () => {
    if (!noticeId || rows.length === 0) return;
    try {
      await importAttendance.mutateAsync({
        noticeId,
        entries: rows.map((row) => ({
          memberId: row.memberId,
          attendance: row.attendance,
          note: row.note,
        })),
      });
      toast.success(
        `Imported attendance for ${rows.length} ${rows.length === 1 ? "person" : "people"}`,
      );
      reset();
      onOpenChange(false);
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "Couldn't import the file.",
      );
    }
  };

  const counts = {
    inPerson: rows.filter((r) => r.attendance === "Present").length,
    online: rows.filter((r) => r.attendance === "PresentOnline").length,
    absent: rows.filter((r) => r.attendance === "Absent").length,
  };
  const meetingItems = (meetings ?? []).map((m) => ({
    value: m.noticeId,
    label: `${m.title}${m.meetingDate ? ` · ${formatDateLong(meetingDay(m.meetingDate))}` : ""}`,
  }));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import attendance</DialogTitle>
          <DialogDescription>
            Upload a spreadsheet with each person&apos;s attendance for a
            meeting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!fixedNoticeId ? (
            <div className="space-y-2">
              <Label htmlFor={meetingFieldId}>Meeting</Label>
              <Select
                items={meetingItems}
                value={noticeId ?? null}
                onValueChange={(value) => {
                  setPicked(value ?? null);
                  reset();
                }}
              >
                <SelectTrigger id={meetingFieldId} className="w-full">
                  <SelectValue placeholder="Choose a meeting" />
                </SelectTrigger>
                <SelectContent>
                  {meetingItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3">
              <FileSpreadsheet
                className="size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                {file.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={reset}
                aria-label="Remove file"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <label
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void take(event.dataTransfer.files[0]);
              }}
              className={cn(
                "grid cursor-pointer justify-items-center gap-2 rounded-2xl border-[1.5px] border-dashed px-5 py-8 text-center transition-colors",
                dragging
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/40 hover:border-primary/60 hover:bg-primary/5",
                (!register || isLoading) && "pointer-events-none opacity-60",
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                onChange={(event) => {
                  void take(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <span className="flex size-12 items-center justify-center rounded-full bg-card text-primary shadow-card dark:text-emerald-300">
                <Upload className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-foreground">
                Drop your file here, or{" "}
                <span className="text-primary dark:text-emerald-300">
                  browse
                </span>
              </span>
              <span className="text-xs text-muted-foreground">
                Excel (.xlsx) or CSV, up to 2 MB
              </span>
            </label>
          )}

          <p className="text-sm text-muted-foreground">
            Do you need a template?{" "}
            <button
              type="button"
              disabled={!register}
              onClick={() => register && downloadAttendanceTemplate(register)}
              className="font-semibold text-primary underline underline-offset-2 disabled:opacity-50 dark:text-emerald-300"
            >
              Download here
            </button>
            <span className="mt-1 block text-xs">
              It lists everyone invited. Fill in Attendance with In person,
              Online or Absent; leave it blank to keep someone as they are.
            </span>
          </p>

          {rows.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {counts.inPerson} in person
                </Chip>
                <Chip tone="bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
                  {counts.online} online
                </Chip>
                <Chip tone="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                  {counts.absent} absent
                </Chip>
              </div>
              <p className="text-sm text-muted-foreground">
                Importing replaces the attendance already recorded for these{" "}
                {rows.length} {rows.length === 1 ? "person" : "people"}.
              </p>
            </div>
          ) : null}

          {issues.length > 0 ? (
            <ul className="list-disc space-y-1 rounded-xl bg-amber-50 py-3 pr-4 pl-8 text-sm text-foreground dark:bg-amber-500/10">
              {issues.slice(0, 6).map((issue) => (
                <li key={`${issue.row}-${issue.message}`}>
                  Row {issue.row}: {issue.message}
                </li>
              ))}
              {issues.length > 6 ? <li>and {issues.length - 6} more</li> : null}
            </ul>
          ) : null}

          {problem ? (
            <p className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-3 text-sm font-medium text-destructive">
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {problem}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={rows.length === 0 || importAttendance.isPending}
          >
            {importAttendance.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {rows.length
              ? `Import ${rows.length} ${rows.length === 1 ? "record" : "records"}`
              : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center rounded-full px-2.5 text-sm font-semibold",
        tone,
      )}
    >
      {children}
    </span>
  );
}
