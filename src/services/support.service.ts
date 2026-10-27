import { apiClient } from "@/lib/axios";
import type { SupportTicket, TicketCategory } from "@/lib/support-data";

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

/** Real backend, `SupportTicketController` — raise/reply/escalate/resolve/close/reopen. */
export const supportService = {
  async list(): Promise<SupportTicket[]> {
    const { data } = await apiClient.get<SupportTicket[]>("/support/tickets");
    return data;
  },

  async get(ticketId: string): Promise<SupportTicket> {
    const { data } = await apiClient.get<SupportTicket>(
      `/support/tickets/${ticketId}`,
    );
    return data;
  },

  async raise(payload: RaiseTicketPayload): Promise<SupportTicket> {
    const { data } = await apiClient.post<SupportTicket>(
      "/support/tickets",
      payload,
    );
    return data;
  },

  async reply(ticketId: string, payload: ReplyPayload): Promise<SupportTicket> {
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
    const { data } = await apiClient.patch<SupportTicket>(
      `/support/tickets/${ticketId}/resolve`,
      payload,
    );
    return data;
  },

  async close(ticketId: string, payload?: NotePayload): Promise<SupportTicket> {
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
    const { data } = await apiClient.patch<SupportTicket>(
      `/support/tickets/${ticketId}/reopen`,
      payload ?? {},
    );
    return data;
  },
};
