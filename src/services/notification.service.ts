import { apiClient } from "@/lib/axios";
import type { AppNotification } from "@/types/notification";

/**
 * Real backend only, like platform-staff.service.ts — this feature never had a mock, so there's
 * nothing to fall back to. See NotificationController: every caller only ever sees their own
 * notifications, scoped server-side, never a path parameter.
 */
export const notificationService = {
  async list(): Promise<AppNotification[]> {
    const { data } = await apiClient.get<AppNotification[]>("/notifications");
    return data;
  },

  async unreadCount(): Promise<number> {
    const { data } = await apiClient.get<{ count: number }>(
      "/notifications/unread-count",
    );
    return data.count;
  },

  async markRead(id: number): Promise<AppNotification> {
    const { data } = await apiClient.patch<AppNotification>(
      `/notifications/${id}/read`,
    );
    return data;
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch("/notifications/read-all");
  },
};
