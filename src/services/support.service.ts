import { apiClient } from "@/lib/axios";
import type { SupportTicket, TicketCategory } from "@/lib/support-data";

const USE_MOCK = () => process.env.NEXT_PUBLIC_USE_MOCK_SUPPORT === "true";

interface RaiseTicketPayload {
  subject: string;
  category: TicketCategory;
  description: string;
  attachmentUrl?: string;
}

interface ReplyPayload {
  message: string;
  attachmentUrl?: string;
}

interface NotePayload {
  note?: string;
}

interface ResolvePayload {
  resolutionNote: string;
}

/**
 * Real backend, `SupportTicketController` — raise/reply/escalate/resolve/close/reopen. Mirrors
 * `loan-repayment.service.ts`'s USE_MOCK-gated shape; when mocked, callers fall back to
 * `useSupportStore` instead (this service simply refuses to be used in that mode).
 */
export const supportService = {
  async list(): Promise<SupportTicket[]> {
    if (USE_MOCK()) throw new Error("Mock support tickets aren't served here.");
    const { data } = await apiClient.get<SupportTicket[]>("/support/tickets");
    return data;
  },

  async get(ticketId: string): Promise<SupportTicket> {
    if (USE_MOCK()) throw new Error("Mock support tickets aren't served here.");
    const { data } = await apiClient.get<SupportTicket>(
      `/support/tickets/${ticketId}`,
    );
    return data;
  },

  async raise(payload: RaiseTicketPayload): Promise<SupportTicket> {
    if (USE_MOCK()) throw new Error("Mock support tickets aren't served here.");
    const { data } = await apiClient.post<SupportTicket>(
      "/support/tickets",
      payload,
    );
    return data;
  },

  async reply(ticketId: string, payload: ReplyPayload): Promise<SupportTicket> {
    if (USE_MOCK()) throw new Error("Mock support tickets aren't served here.");
    const { data } = await apiClient.patch<SupportTicket>(
      `/support/tickets/${ticketId}/reply`,
      payload,
    );
    return data;
  },

  async escalate(
    ticketId: string,
    payload?: NotePayload,
  ): Promise<SupportTicket> {
    if (USE_MOCK()) throw new Error("Mock support tickets aren't served here.");
    const { data } = await apiClient.patch<SupportTicket>(
      `/support/tickets/${ticketId}/escalate`,
      payload ?? {},
    );
    return data;
  },

  async resolve(
    ticketId: string,
    payload: ResolvePayload,
  ): Promise<SupportTicket> {
    if (USE_MOCK()) throw new Error("Mock support tickets aren't served here.");
    const { data } = await apiClient.patch<SupportTicket>(
      `/support/tickets/${ticketId}/resolve`,
      payload,
    );
    return data;
  },

  async close(ticketId: string, payload?: NotePayload): Promise<SupportTicket> {
    if (USE_MOCK()) throw new Error("Mock support tickets aren't served here.");
    const { data } = await apiClient.patch<SupportTicket>(
      `/support/tickets/${ticketId}/close`,
      payload ?? {},
    );
    return data;
  },

  async reopen(
    ticketId: string,
    payload?: NotePayload,
  ): Promise<SupportTicket> {
    if (USE_MOCK()) throw new Error("Mock support tickets aren't served here.");
    const { data } = await apiClient.patch<SupportTicket>(
      `/support/tickets/${ticketId}/reopen`,
      payload ?? {},
    );
    return data;
  },
};
