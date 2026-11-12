import { useEffect, useState } from "react";
import { formatDateLong } from "@/lib/format";
import { formatTimeLabel } from "@/components/ui/time-picker";
import {
  MEETING_RESPONSE_LABELS,
  type MeetingAttendanceMark,
  type MeetingResponse,
  type MeetingWindow,
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

/** "3:32 PM" for an ISO instant, in the viewer's time. */
export function formatClock(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Where a meeting is, attendance-wise:
 * - `before`: not started — members can still RSVP.
 * - `checkin`: started — members check in, officers approve and mark.
 * - `approvals`: member check-in has closed (30 min before the end); officers still approve and mark.
 * - `after`: ended — attendance is final.
 */
export type MeetingPhase = "before" | "checkin" | "approvals" | "after";

export function meetingPhase(
  window: MeetingWindow | null | undefined,
  now: number = Date.now(),
): MeetingPhase {
  if (!window?.startsAt || now < Date.parse(window.startsAt)) return "before";
  if (window.endsAt && now >= Date.parse(window.endsAt)) return "after";
  if (window.checkInClosesAt && now >= Date.parse(window.checkInClosesAt))
    return "approvals";
  return "checkin";
}

/** A clock that ticks, so time-based states (check-in closing, meeting ending) update by themselves. */
export function useNow(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
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
