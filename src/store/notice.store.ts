import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  INITIAL_NOTICES,
  INITIAL_NOTICE_REPLIES,
  type Notice,
  type NoticeReply,
} from "@/lib/notice-data";

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
    (set) => ({
      notices: INITIAL_NOTICES,
      replies: INITIAL_NOTICE_REPLIES,
      readMarkers: {},
      addNotice: (notice) =>
        set((state) => ({ notices: [notice, ...state.notices] })),
      deleteNotice: (id) =>
        set((state) => ({
          notices: state.notices.filter((notice) => notice.id !== id),
          replies: state.replies.filter((reply) => reply.noticeId !== id),
        })),
      resendNotice: (id) =>
        set((state) => ({
          notices: state.notices.map((notice) =>
            notice.id === id
              ? { ...notice, sendAt: new Date().toISOString() }
              : notice,
          ),
        })),
      addReply: (reply) =>
        set((state) => ({ replies: [...state.replies, reply] })),
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
