import { apiClient } from "@/lib/axios";
import { uploadService } from "@/services/upload.service";
import type {
  MeetingAttendanceHistoryItem,
  MeetingAttendanceMark,
  MeetingRegister,
  MeetingResponse,
  MyMeetingResponse,
  Notice,
  NoticeAttachment,
  NoticeReply,
} from "@/types/notice";
import type { CreateNoticeFormValues } from "@/lib/validations/notice.schema";

export interface CreateNoticePayload {
  type: CreateNoticeFormValues["type"];
  title: string;
  message: string;
  recipient: CreateNoticeFormValues["recipient"];
  medium: CreateNoticeFormValues["medium"];
  meetingDate?: string;
  meetingTime?: string;
  meetingDurationMinutes?: number;
  meetingNoticeId?: string;
  attachment?: NoticeAttachment;
  sendAt: string;
  targetCoopIds: string[];
}

/**
 * Real backend (NoticeController) — see documentation/notice-board-page.md.
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

  /** The caller's own RSVP line for a meeting notice (MeetingAttendanceController). */
  async getMyResponse(noticeId: string): Promise<MyMeetingResponse> {
    const { data } = await apiClient.get<MyMeetingResponse>(
      `/notices/${noticeId}/my-response`,
    );
    return data;
  },

  async respond(
    noticeId: string,
    response: MeetingResponse,
    reason?: string,
  ): Promise<MyMeetingResponse> {
    const { data } = await apiClient.put<MyMeetingResponse>(
      `/notices/${noticeId}/my-response`,
      { response, reason },
    );
    return data;
  },

  /** A meeting's whole register — officers only. */
  async getRegister(noticeId: string): Promise<MeetingRegister> {
    const { data } = await apiClient.get<MeetingRegister>(
      `/notices/${noticeId}/attendance`,
    );
    return data;
  },

  async markAttendance(
    noticeId: string,
    entries: {
      memberId: string;
      attendance: MeetingAttendanceMark | null;
      note: string | null;
    }[],
  ): Promise<MeetingRegister> {
    const { data } = await apiClient.put<MeetingRegister>(
      `/notices/${noticeId}/attendance`,
      { entries },
    );
    return data;
  },

  async getMyAttendance(): Promise<MeetingAttendanceHistoryItem[]> {
    const { data } =
      await apiClient.get<MeetingAttendanceHistoryItem[]>("/attendance/me");
    return data;
  },

  async getCoopAttendance(
    coopId: string,
    memberId?: string,
  ): Promise<MeetingAttendanceHistoryItem[]> {
    const { data } = await apiClient.get<MeetingAttendanceHistoryItem[]>(
      `/cooperatives/${coopId}/attendance`,
      { params: memberId ? { memberId } : undefined },
    );
    return data;
  },

  /** Uploads a notice attachment to Cloudinary via the real backend, returning a hosted URL —
   * replaces the old approach of inlining the file as base64 directly into the notice record. */
  async uploadAttachment(file: File): Promise<NoticeAttachment> {
    const url = await uploadService.uploadAttachment(file);
    return { url, name: file.name, size: file.size };
  },
};
