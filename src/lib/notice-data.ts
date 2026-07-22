import type { UserRole } from "@/types/auth";

export type NoticeType = "General" | "Meeting Notice" | "Meeting Minutes";
export type NoticeRecipient =
  "All Members" | "All Admins" | "All Members & Admins";
export type NoticeMedium = "Email" | "SMS" | "Email & SMS";

export interface NoticeAttachment {
  name: string;
  dataUrl: string;
  size: number;
}

export interface Notice {
  id: string;
  type: NoticeType;
  title: string;
  message: string;
  recipient: NoticeRecipient;
  medium: NoticeMedium;
  /** Only meaningful for "Meeting Notice" — when the meeting itself happens. */
  meetingDate?: string;
  attachment?: NoticeAttachment;
  /** When this notice is/was delivered — future value means "Scheduled". */
  sendAt: string;
  createdByName: string;
  createdByRole: UserRole;
  createdAt: string;
}

export interface NoticeReply {
  id: string;
  noticeId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  message: string;
  createdAt: string;
}

/** Derived, not stored — a notice becomes "Sent" the instant its sendAt passes. */
export function getNoticeStatus(notice: Notice): "Scheduled" | "Sent" {
  return new Date(notice.sendAt).getTime() <= Date.now() ? "Sent" : "Scheduled";
}

export function isNoticeSent(notice: Notice): boolean {
  return getNoticeStatus(notice) === "Sent";
}

/** Members only ever see notices actually addressed to them, once sent. */
export function isNoticeVisibleToRole(notice: Notice, role: UserRole): boolean {
  if (!isNoticeSent(notice)) return role !== "member";
  if (role === "member") {
    return (
      notice.recipient === "All Members" ||
      notice.recipient === "All Members & Admins"
    );
  }
  return true;
}

export function noticeExcerpt(message: string, maxLength = 90): string {
  const trimmed = message.trim();
  return trimmed.length > maxLength
    ? `${trimmed.slice(0, maxLength).trimEnd()}…`
    : trimmed;
}

const now = Date.now();
const hoursAgo = (hours: number) =>
  new Date(now - hours * 60 * 60 * 1000).toISOString();
const hoursFromNow = (hours: number) =>
  new Date(now + hours * 60 * 60 * 1000).toISOString();

export const INITIAL_NOTICES: Notice[] = [
  {
    id: "notice-1",
    type: "General",
    title: "Cooperative Dues Reminder",
    message:
      "This is a reminder that monthly dues for July are due by the 28th. Please make your contribution via the Savings & Contributions page to avoid a late marker on your membership record.",
    recipient: "All Members",
    medium: "Email & SMS",
    sendAt: hoursAgo(20),
    createdByName: "Chidinma Eze",
    createdByRole: "admin",
    createdAt: hoursAgo(20),
  },
  {
    id: "notice-2",
    type: "Meeting Notice",
    title: "Quarterly General Meeting",
    message:
      "The quarterly general meeting will hold at the cooperative hall. All members are expected to attend. Kindly come along with your membership ID card.",
    recipient: "All Members & Admins",
    medium: "Email",
    meetingDate: hoursFromNow(72),
    sendAt: hoursAgo(3),
    createdByName: "Falola Mayowa",
    createdByRole: "super_admin",
    createdAt: hoursAgo(3),
  },
  {
    id: "notice-3",
    type: "Meeting Minutes",
    title: "Minutes — June Executive Meeting",
    message:
      "Attached are the minutes from the June executive meeting, covering the loan portfolio review and the new savings product proposal.",
    recipient: "All Admins",
    medium: "Email",
    sendAt: hoursAgo(48),
    createdByName: "Falola Mayowa",
    createdByRole: "super_admin",
    createdAt: hoursAgo(48),
  },
  {
    id: "notice-4",
    type: "General",
    title: "Upcoming System Maintenance",
    message:
      "The member portal will be briefly unavailable this coming Sunday between 1am and 3am for scheduled maintenance. We apologise for any inconvenience.",
    recipient: "All Members & Admins",
    medium: "Email & SMS",
    sendAt: hoursFromNow(24),
    createdByName: "Chidinma Eze",
    createdByRole: "admin",
    createdAt: hoursAgo(1),
  },
];

export const INITIAL_NOTICE_REPLIES: NoticeReply[] = [
  {
    id: "reply-1",
    noticeId: "notice-1",
    authorId: "MB-0001",
    authorName: "Tunde Bakare",
    authorRole: "member",
    message: "Noted, will pay before the deadline. Thank you for the reminder.",
    createdAt: hoursAgo(18),
  },
  {
    id: "reply-2",
    noticeId: "notice-2",
    authorId: "MB-0001",
    authorName: "Tunde Bakare",
    authorRole: "member",
    message:
      "Will there be a virtual option for members who can't attend in person?",
    createdAt: hoursAgo(2),
  },
];
