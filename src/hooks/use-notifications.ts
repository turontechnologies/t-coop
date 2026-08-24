import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";

const NOTIFICATIONS_KEY = ["notifications"];
const UNREAD_COUNT_KEY = ["notifications", "unread-count"];

// The one deliberate exception to this app's "staleTime tiering, no polling" convention (see
// project-overview.md) — there's no WebSocket/SSE infrastructure, and a notification bell that
// only updates on navigation misses the whole point of "tell the user now." 30s keeps it feeling
// live without hammering the backend.
const POLL_MS = 30_000;

export function useNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => notificationService.list(),
    staleTime: POLL_MS,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: () => notificationService.unreadCount(),
    staleTime: POLL_MS,
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useNotificationMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
  };

  const markRead = useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: invalidate,
  });

  return { markRead, markAllRead };
}
