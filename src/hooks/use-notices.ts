import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  noticeService,
  type CreateNoticePayload,
} from "@/services/notice.service";

const NOTICES_KEY = ["notices"];
const noticeKey = (id: string) => ["notices", id];
const repliesKey = (noticeId: string) => ["notices", noticeId, "replies"];

export function useNotices() {
  return useQuery({
    queryKey: NOTICES_KEY,
    queryFn: () => noticeService.list(),
    staleTime: 30_000,
  });
}

export function useNotice(id: string | undefined) {
  return useQuery({
    queryKey: noticeKey(id as string),
    queryFn: () => noticeService.get(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useNoticeReplies(noticeId: string | undefined) {
  return useQuery({
    queryKey: repliesKey(noticeId as string),
    queryFn: () => noticeService.getReplies(noticeId as string),
    enabled: Boolean(noticeId),
    staleTime: 15_000,
  });
}

export function useNoticeMutations() {
  const queryClient = useQueryClient();
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: NOTICES_KEY });

  const uploadAttachment = useMutation({
    mutationFn: (file: File) => noticeService.uploadAttachment(file),
  });

  const create = useMutation({
    mutationFn: (payload: CreateNoticePayload) => noticeService.create(payload),
    onSuccess: invalidateList,
  });

  const resend = useMutation({
    mutationFn: (id: string) => noticeService.resend(id),
    onSuccess: (notice) => {
      invalidateList();
      queryClient.invalidateQueries({ queryKey: noticeKey(notice.id) });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => noticeService.remove(id),
    onSuccess: invalidateList,
  });

  const addReply = useMutation({
    mutationFn: ({ noticeId, message }: { noticeId: string; message: string }) =>
      noticeService.addReply(noticeId, message),
    onSuccess: (_reply, { noticeId }) => {
      queryClient.invalidateQueries({ queryKey: repliesKey(noticeId) });
    },
  });

  return { uploadAttachment, create, resend, remove, addReply };
}
