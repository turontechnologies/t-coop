import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  INITIAL_NOTICES,
  INITIAL_NOTICE_REPLIES,
  type Notice,
  type NoticeReply,
} from "@/lib/notice-data";
import { logActivity } from "@/lib/audit-log";

export const NOTICE_STORE_NAME = "tcoop-notice-board";

interface NoticeState {
  notices: Notice[];
  replies: NoticeReply[];
  /** `${memberId}:${noticeId}` -> true, tracked per-browser so each signed-in identity has its own read state. */
  readMarkers: Record<string, true>;
  addNotice: (notice: Notice) => void;
  deleteNotice: (id: string) => void;
  resendNotice: (id: string) => void;
  addReply: (reply: NoticeReply) => void;
  markRead: (memberId: string, noticeId: string) => void;
}

export const useNoticeStore = create<NoticeState>()(
  persist(
    (set, get) => ({
      notices: INITIAL_NOTICES,
      replies: INITIAL_NOTICE_REPLIES,
      readMarkers: {},
      addNotice: (notice) => {
        set((state) => ({ notices: [notice, ...state.notices] }));
        logActivity({
          module: "Notices",
          action: "Create",
          resource: notice.title,
        });
      },
      deleteNotice: (id) => {
        const notice = get().notices.find((n) => n.id === id);
        set((state) => ({
          notices: state.notices.filter((n) => n.id !== id),
          replies: state.replies.filter((reply) => reply.noticeId !== id),
        }));
        if (notice) {
          logActivity({
            module: "Notices",
            action: "Delete",
            resource: notice.title,
            status: "Warning",
          });
        }
      },
      resendNotice: (id) => {
        const notice = get().notices.find((n) => n.id === id);
        set((state) => ({
          notices: state.notices.map((n) =>
            n.id === id ? { ...n, sendAt: new Date().toISOString() } : n,
          ),
        }));
        if (notice) {
          logActivity({
            module: "Notices",
            action: "Update",
            resource: notice.title,
          });
        }
      },
      addReply: (reply) => {
        set((state) => ({ replies: [...state.replies, reply] }));
        const notice = get().notices.find((n) => n.id === reply.noticeId);
        logActivity({
          module: "Notices",
          action: "Create",
          resource: `Reply — ${notice?.title ?? reply.noticeId}`,
          status: "Info",
        });
      },
      markRead: (memberId, noticeId) =>
        set((state) => ({
          readMarkers: {
            ...state.readMarkers,
            [`${memberId}:${noticeId}`]: true,
          },
        })),
    }),
    {
      name: NOTICE_STORE_NAME,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
