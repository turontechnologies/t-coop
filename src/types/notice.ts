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
  attachment?: NoticeAttachment;
  sendAt: string;
  status: NoticeStatus;
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
export type MeetingAttendanceMark = "Present" | "Absent";

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
}

export interface MeetingAttendanceSummary {
  invited: number;
  physical: number;
  online: number;
  notAttending: number;
  noResponse: number;
  present: number;
  absent: number;
  unmarked: number;
}

export interface MeetingRegister {
  noticeId: string;
  title: string;
  meetingDate: string | null;
  meetingTime: string | null;
  summary: MeetingAttendanceSummary;
  entries: MeetingAttendanceEntry[];
}

export interface MyMeetingResponse {
  entry: MeetingAttendanceEntry | null;
  canRespond: boolean;
}

/** One line of attendance history. */
export interface MeetingAttendanceHistoryItem {
  noticeId: string;
  title: string;
  meetingDate: string | null;
  meetingTime: string | null;
  memberId: string;
  memberName: string;
  response: MeetingResponse | null;
  responseReason: string | null;
  attendance: MeetingAttendanceMark | null;
  attendanceNote: string | null;
}

export function noticeExcerpt(message: string, maxLength = 90): string {
  const trimmed = message.trim();
  return trimmed.length > maxLength
    ? `${trimmed.slice(0, maxLength).trimEnd()}…`
    : trimmed;
}
