import type { UserRole } from "@/types/auth";

export type NoticeType = "General" | "Meeting Notice" | "Meeting Minutes";
export type NoticeRecipient = "All Members" | "All Admins" | "All Members & Admins";
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

export function noticeExcerpt(message: string, maxLength = 90): string {
  const trimmed = message.trim();
  return trimmed.length > maxLength
    ? `${trimmed.slice(0, maxLength).trimEnd()}…`
    : trimmed;
}
