import type { UserRole } from "@/types/auth";

export type NoticeType = "General" | "Meeting Notice" | "Meeting Minutes";
export type NoticeRecipient =
  "All Members" | "All Admins" | "All Members & Admins";
export type NoticeMedium = "Email" | "SMS" | "Email & SMS";
export type NoticeStatus = "Scheduled" | "Sent";

export interface NoticeAttachment {
  name: string;
  url: string;
  size: number;
}

export interface Notice {
  id: string;
  type: NoticeType;
  title: string;
  message: string;
  recipient: NoticeRecipient;
  medium: NoticeMedium;
  meetingDate?: string;
  /** "HH:mm", the co-op's local time. */
  meetingTime?: string;
  meetingDurationMinutes: number;
  /** Where the meeting happens — a place, a link, or both. */
  meetingVenue?: string | null;
  /** The meeting this minutes notice records, when created from a meeting page. */
  meetingNoticeId?: string | null;
  attachment?: NoticeAttachment;
  sendAt: string;
  status: NoticeStatus;
  createdById: string;
  createdByName: string;
  createdByRole: UserRole;
  createdAt: string;
  targetCoopIds: string[];
}

export interface NoticeReply {
  id: string;
  noticeId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatarUrl: string | null;
  message: string;
  createdAt: string;
}

/** A member's answer to a meeting notice. */
export type MeetingResponse = "Physical" | "Online" | "NotAttending";
/** "Present" = in person; "PresentOnline" = joined online. */
export type MeetingAttendanceMark = "Present" | "PresentOnline" | "Absent";

export const ATTENDANCE_LABELS: Record<MeetingAttendanceMark, string> = {
  Present: "In person",
  PresentOnline: "Online",
  Absent: "Absent",
};

export const MEETING_RESPONSE_LABELS: Record<MeetingResponse, string> = {
  Physical: "Attending in person",
  Online: "Attending online",
  NotAttending: "Not attending",
};

/** One member's line on a meeting's register. */
export interface MeetingAttendanceEntry {
  memberId: string;
  memberName: string;
  response: MeetingResponse | null;
  responseReason: string | null;
  respondedAt: string | null;
  attendance: MeetingAttendanceMark | null;
  attendanceNote: string | null;
  /** Filled in automatically from a "not attending" answer, not by an officer. */
  attendanceAuto: boolean;
  markedAt: string | null;
  /** The member's own check-in during the meeting; it counts once an officer approves it. */
  checkInMode: CheckInMode | null;
  checkedInAt: string | null;
  /** Checked in, and no officer has approved or rejected it yet. */
  awaitingApproval: boolean;
}

export type CheckInMode = "InPerson" | "Online";

export const CHECK_IN_LABELS: Record<CheckInMode, string> = {
  InPerson: "In person",
  Online: "Online",
};

/** When a meeting's attendance windows open and close (ISO instants). Officers mark and approve
 * from `startsAt` to `endsAt`; members check in from `startsAt` to `checkInClosesAt`. */
export interface MeetingWindow {
  startsAt: string | null;
  checkInClosesAt: string | null;
  endsAt: string | null;
}

export interface MeetingAttendanceSummary {
  invited: number;
  physical: number;
  online: number;
  notAttending: number;
  noResponse: number;
  present: number;
  presentInPerson: number;
  presentOnline: number;
  absent: number;
  unmarked: number;
  checkedIn: number;
  awaitingApproval: number;
}

export interface MeetingRegister {
  noticeId: string;
  title: string;
  meetingDate: string | null;
  meetingTime: string | null;
  meetingDurationMinutes: number;
  meetingVenue: string | null;
  attendanceEndsAt: string | null;
  canMarkAttendance: boolean;
  window: MeetingWindow;
  summary: MeetingAttendanceSummary;
  entries: MeetingAttendanceEntry[];
}

export interface MyMeetingResponse {
  entry: MeetingAttendanceEntry | null;
  canRespond: boolean;
  canCheckIn: boolean;
  window: MeetingWindow;
}

/** One line of attendance history. */
export interface MeetingAttendanceHistoryItem {
  noticeId: string;
  title: string;
  meetingDate: string | null;
  meetingTime: string | null;
  meetingDurationMinutes: number;
  meetingVenue: string | null;
  /** The meeting has started; upcoming meetings don't count towards rates. */
  held: boolean;
  memberId: string;
  memberName: string;
  response: MeetingResponse | null;
  responseReason: string | null;
  attendance: MeetingAttendanceMark | null;
  attendanceNote: string | null;
  checkInMode: CheckInMode | null;
  awaitingApproval: boolean;
}

/** "Received" for a sent notice someone else wrote; "Sent" / "Scheduled" for your own. */
export function noticeStatusLabel(
  notice: Pick<Notice, "status" | "createdById">,
  viewerId: string | undefined,
): "Sent" | "Received" | "Scheduled" {
  if (notice.status === "Scheduled") return "Scheduled";
  return notice.createdById && notice.createdById === viewerId
    ? "Sent"
    : "Received";
}

export function noticeExcerpt(message: string, maxLength = 90): string {
  const trimmed = message.trim();
  return trimmed.length > maxLength
    ? `${trimmed.slice(0, maxLength).trimEnd()}…`
    : trimmed;
}
