export type NotificationType =
  | "SUBSCRIPTION_EXPIRING"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_RENEWED"
  | "NOTICE_BOARD"
  | "COOPERATIVE_WELCOME"
  | "COOPERATIVE_STATUS"
  | "MEMBER_ADDED"
  | "MEMBER_STATUS"
  | "PLATFORM_STAFF_JOINED";

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}
