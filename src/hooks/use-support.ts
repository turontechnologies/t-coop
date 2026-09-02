import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supportService } from "@/services/support.service";

const LIST_KEY = ["support-tickets"];
const detailKey = (ticketId: string) => ["support-tickets", ticketId];

function invalidateTickets(
  queryClient: ReturnType<typeof useQueryClient>,
  ticketId?: string,
) {
  queryClient.invalidateQueries({ queryKey: LIST_KEY });
  if (ticketId) {
    queryClient.invalidateQueries({ queryKey: detailKey(ticketId) });
  }
}

export function useSupportTickets() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: () => supportService.list(),
    staleTime: 15_000,
  });
}

export function useSupportTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: detailKey(ticketId ?? ""),
    queryFn: () => supportService.get(ticketId as string),
    enabled: Boolean(ticketId),
    staleTime: 5_000,
  });
}

export function useRaiseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportService.raise,
    onSuccess: () => invalidateTickets(queryClient),
  });
}

export function useReplyToTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { message: string; attachmentUrl?: string }) =>
      supportService.reply(ticketId, payload),
    onSuccess: () => invalidateTickets(queryClient, ticketId),
  });
}

export function useEscalateTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => supportService.escalate(ticketId, { note }),
    onSuccess: () => invalidateTickets(queryClient, ticketId),
  });
}

export function useResolveTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resolutionNote: string) =>
      supportService.resolve(ticketId, { resolutionNote }),
    onSuccess: () => invalidateTickets(queryClient, ticketId),
  });
}

export function useCloseTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => supportService.close(ticketId, { note }),
    onSuccess: () => invalidateTickets(queryClient, ticketId),
  });
}

export function useReopenTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note?: string) => supportService.reopen(ticketId, { note }),
    onSuccess: () => invalidateTickets(queryClient, ticketId),
  });
}
