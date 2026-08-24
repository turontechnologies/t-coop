import { apiClient } from "@/lib/axios";
import type { Notice, NoticeAttachment, NoticeReply } from "@/types/notice";
import type { CreateNoticeFormValues } from "@/lib/validations/notice.schema";

export interface CreateNoticePayload {
  type: CreateNoticeFormValues["type"];
  title: string;
  message: string;
  recipient: CreateNoticeFormValues["recipient"];
  medium: CreateNoticeFormValues["medium"];
  meetingDate?: string;
  attachment?: NoticeAttachment;
  sendAt: string;
  targetCoopIds: string[];
}

/**
 * Real backend only — Notice Board moved off its old per-browser localStorage store entirely
 * (see documentation/notice-board-page.md). No mock fallback: a feature whose entire point is
 * "the right people, across devices, get the right message" can't be meaningfully simulated
 * offline.
 */
export const noticeService = {
  async list(): Promise<Notice[]> {
    const { data } = await apiClient.get<Notice[]>("/notices");
    return data;
  },

  async get(id: string): Promise<Notice> {
    const { data } = await apiClient.get<Notice>(`/notices/${id}`);
    return data;
  },

  async create(payload: CreateNoticePayload): Promise<Notice> {
    const { data } = await apiClient.post<Notice>("/notices", payload);
    return data;
  },

  async resend(id: string): Promise<Notice> {
    const { data } = await apiClient.post<Notice>(`/notices/${id}/resend`);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/notices/${id}`);
  },

  async getReplies(noticeId: string): Promise<NoticeReply[]> {
    const { data } = await apiClient.get<NoticeReply[]>(
      `/notices/${noticeId}/replies`,
    );
    return data;
  },

  async addReply(noticeId: string, message: string): Promise<NoticeReply> {
    const { data } = await apiClient.post<NoticeReply>(
      `/notices/${noticeId}/replies`,
      { message },
    );
    return data;
  },

  /** Uploads a notice attachment to Cloudinary via the real backend, returning a hosted URL —
   * replaces the old approach of inlining the file as base64 directly into the notice record. */
  async uploadAttachment(file: File): Promise<NoticeAttachment> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<NoticeAttachment>(
      "/uploads/attachment",
      formData,
    );
    return data;
  },
};
