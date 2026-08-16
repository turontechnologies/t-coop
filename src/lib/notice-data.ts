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
  /**
   * Which co-operative(s) this notice is addressed to — super admin picks
   * from the co-operatives they've onboarded; an admin's own notices are
   * always scoped to just their own co-op. Undefined/empty means it
   * predates this field and is treated as a platform-wide broadcast, so
   * existing notices stay visible everywhere rather than disappearing.
   */
  targetCoopIds?: string[];
}

export interface NoticeReply {
  id: string;
  noticeId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatarUrl?: string;
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

/**
 * Whether a notice reaches a given co-operative. A notice with no
 * `targetCoopIds` (or an empty one) predates per-co-op targeting and is
 * treated as a platform-wide broadcast, so it stays visible everywhere.
 */
export function noticeTargetsCoop(notice: Notice, coopId: string): boolean {
  if (!notice.targetCoopIds || notice.targetCoopIds.length === 0) return true;
  return notice.targetCoopIds.includes(coopId);
}

export function noticeExcerpt(message: string, maxLength = 90): string {
  const trimmed = message.trim();
  return trimmed.length > maxLength
    ? `${trimmed.slice(0, maxLength).trimEnd()}…`
    : trimmed;
}

// Deliberately empty — the notice board starts with a clean slate; notices only ever appear
// once someone actually creates one through the real "Create Notice" flow. See
// notice.store.ts's persist `version`/`migrate` for how this also clears out anyone's
// already-persisted browser state left over from when this seeded demo data.
export const INITIAL_NOTICES: Notice[] = [];

export const INITIAL_NOTICE_REPLIES: NoticeReply[] = [];
