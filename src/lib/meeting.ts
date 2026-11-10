import { formatDateLong } from "@/lib/format";
import { formatTimeLabel } from "@/components/ui/time-picker";
import {
  MEETING_RESPONSE_LABELS,
  type MeetingAttendanceMark,
  type MeetingResponse,
} from "@/types/notice";

/** A `yyyy-MM-dd` meeting date as local midnight (`new Date("yyyy-MM-dd")` would be UTC). */
export function meetingDay(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** "Tuesday, December 1, 2026 · 10:30 AM" — or just the date when no time was set. */
export function formatMeetingWhen(
  date: string | null | undefined,
  time: string | null | undefined,
): string {
  if (!date) return "—";
  const day = formatDateLong(meetingDay(date));
  return time ? `${day} · ${formatTimeLabel(time)}` : day;
}

export function responseLabel(response: MeetingResponse | null): string {
  return response ? MEETING_RESPONSE_LABELS[response] : "No response";
}

/** Badge colours shared by every attendance view, web-wide. */
export function responseBadgeClass(response: MeetingResponse | null): string {
  switch (response) {
    case "Physical":
      return "bg-success/15 text-success";
    case "Online":
      return "bg-primary/15 text-primary";
    case "NotAttending":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function attendanceBadgeClass(
  attendance: MeetingAttendanceMark | null,
): string {
  switch (attendance) {
    case "Present":
      return "bg-success/15 text-success";
    case "PresentOnline":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "Absent":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}
