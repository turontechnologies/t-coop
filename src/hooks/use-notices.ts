import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  noticeService,
  type CreateNoticePayload,
} from "@/services/notice.service";
import type {
  CheckInMode,
  MeetingAttendanceMark,
  MeetingResponse,
} from "@/types/notice";

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
    mutationFn: ({
      noticeId,
      message,
    }: {
      noticeId: string;
      message: string;
    }) => noticeService.addReply(noticeId, message),
    onSuccess: (_reply, { noticeId }) => {
      queryClient.invalidateQueries({ queryKey: repliesKey(noticeId) });
    },
  });

  return { uploadAttachment, create, resend, remove, addReply };
}

const myResponseKey = (noticeId: string) => [
  "notices",
  noticeId,
  "my-response",
];
const registerKey = (noticeId: string) => ["notices", noticeId, "attendance"];
const ATTENDANCE_KEY = ["attendance"];

/** The signed-in member's RSVP for a meeting notice. */
export function useMyMeetingResponse(
  noticeId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: myResponseKey(noticeId as string),
    queryFn: () => noticeService.getMyResponse(noticeId as string),
    enabled: Boolean(noticeId) && enabled,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}

export function useRespondToMeeting(noticeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      response,
      reason,
    }: {
      response: MeetingResponse;
      reason?: string;
    }) => noticeService.respond(noticeId, response, reason),
    onSuccess: (data) => {
      queryClient.setQueryData(myResponseKey(noticeId), data);
      queryClient.invalidateQueries({ queryKey: registerKey(noticeId) });
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEY });
    },
  });
}

/** A meeting's register (RSVPs + attendance) — officers only. */
export function useMeetingRegister(
  noticeId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: registerKey(noticeId as string),
    queryFn: () => noticeService.getRegister(noticeId as string),
    enabled: Boolean(noticeId) && enabled,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}

export function useMarkAttendance(noticeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      entries: {
        memberId: string;
        attendance: MeetingAttendanceMark | null;
        note: string | null;
      }[],
    ) => noticeService.markAttendance(noticeId, entries),
    onSuccess: (register) => {
      queryClient.setQueryData(registerKey(noticeId), register);
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEY });
    },
  });
}

/** The member checks themselves in (in person or online). */
export function useCheckIn(noticeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mode: CheckInMode) => noticeService.checkIn(noticeId, mode),
    onSuccess: (data) => {
      queryClient.setQueryData(myResponseKey(noticeId), data);
      queryClient.invalidateQueries({ queryKey: registerKey(noticeId) });
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEY });
    },
  });
}

/** Officers approve members' check-ins. */
export function useApproveCheckIns(noticeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberIds: string[]) =>
      noticeService.approveCheckIns(noticeId, memberIds),
    onSuccess: (register) => {
      queryClient.setQueryData(registerKey(noticeId), register);
      queryClient.invalidateQueries({ queryKey: myResponseKey(noticeId) });
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_KEY });
    },
  });
}

export function useMyAttendance(enabled = true) {
  return useQuery({
    queryKey: [...ATTENDANCE_KEY, "me"],
    queryFn: () => noticeService.getMyAttendance(),
    enabled,
    staleTime: 30_000,
  });
}

export function useCoopAttendance(coopId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [...ATTENDANCE_KEY, "coop", coopId],
    queryFn: () => noticeService.getCoopAttendance(coopId as string),
    enabled: Boolean(coopId) && enabled,
    staleTime: 30_000,
  });
}
