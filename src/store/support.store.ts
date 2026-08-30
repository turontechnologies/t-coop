import { create } from "zustand";
import { logActivity } from "@/lib/audit-log";
import {
  INITIAL_SUPPORT_TICKETS,
  type SupportTicket,
  type TicketCategory,
  type TicketRaiserRole,
} from "@/lib/support-data";

interface RaiseTicketPayload {
  subject: string;
  category: TicketCategory;
  description: string;
  raisedById: string;
  raisedByName: string;
  raisedByRole: TicketRaiserRole;
  cooperativeId: string;
  cooperativeName: string;
}

interface ActorParams {
  actorId: string;
  actorName: string;
  actorRole: TicketRaiserRole | "super_admin";
}

interface SupportState {
  tickets: SupportTicket[];
  raiseTicket: (payload: RaiseTicketPayload) => void;
  replyToTicket: (
    ticketId: string,
    actor: ActorParams,
    message: string,
  ) => void;
  escalateTicket: (ticketId: string, actor: ActorParams, note?: string) => void;
  resolveTicket: (
    ticketId: string,
    actor: ActorParams,
    resolutionNote: string,
  ) => void;
}

let eventCounter = 0;
function nextEventId(): string {
  eventCounter += 1;
  return `evt-${Date.now()}-${eventCounter}`;
}

export const useSupportStore = create<SupportState>()((set) => ({
  tickets: INITIAL_SUPPORT_TICKETS,

  raiseTicket: (payload) => {
    const id = `ticket-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const ticket: SupportTicket = {
      id,
      subject: payload.subject,
      category: payload.category,
      description: payload.description,
      status: "Open",
      cooperativeId: payload.cooperativeId,
      cooperativeName: payload.cooperativeName,
      raisedById: payload.raisedById,
      raisedByName: payload.raisedByName,
      raisedByRole: payload.raisedByRole,
      // A member's ticket always starts with their own co-op's admin; an admin raising their
      // own issue has no co-op-level layer above them, so it goes straight to the platform.
      assignedToRole:
        payload.raisedByRole === "member" ? "admin" : "super_admin",
      createdAt,
      timeline: [
        {
          id: nextEventId(),
          type: "Raised",
          actorId: payload.raisedById,
          actorName: payload.raisedByName,
          actorRole: payload.raisedByRole,
          message: payload.description,
          createdAt,
        },
      ],
    };

    set((state) => ({ tickets: [ticket, ...state.tickets] }));
    logActivity({
      module: "Support",
      action: "Create",
      resource: payload.subject,
      status: "Info",
    });
  },

  replyToTicket: (ticketId, actor, message) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              timeline: [
                ...ticket.timeline,
                {
                  id: nextEventId(),
                  type: "Reply",
                  actorId: actor.actorId,
                  actorName: actor.actorName,
                  actorRole: actor.actorRole,
                  message,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : ticket,
      ),
    }));
  },

  escalateTicket: (ticketId, actor, note) => {
    let subject = "";
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.id !== ticketId || ticket.status === "Resolved")
          return ticket;
        subject = ticket.subject;
        return {
          ...ticket,
          status: "Escalated",
          assignedToRole: "super_admin",
          timeline: [
            ...ticket.timeline,
            {
              id: nextEventId(),
              type: "Escalated",
              actorId: actor.actorId,
              actorName: actor.actorName,
              actorRole: actor.actorRole,
              message: note,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }),
    }));
    if (subject) {
      logActivity({
        module: "Support",
        action: "Update",
        resource: `Escalated — ${subject}`,
        status: "Warning",
      });
    }
  },

  resolveTicket: (ticketId, actor, resolutionNote) => {
    let subject = "";
    const resolvedAt = new Date().toISOString();
    set((state) => ({
      tickets: state.tickets.map((ticket) => {
        if (ticket.id !== ticketId || ticket.status === "Resolved")
          return ticket;
        subject = ticket.subject;
        return {
          ...ticket,
          status: "Resolved",
          resolvedAt,
          resolutionNote,
          timeline: [
            ...ticket.timeline,
            {
              id: nextEventId(),
              type: "Resolved",
              actorId: actor.actorId,
              actorName: actor.actorName,
              actorRole: actor.actorRole,
              message: resolutionNote,
              createdAt: resolvedAt,
            },
          ],
        };
      }),
    }));
    if (subject) {
      logActivity({
        module: "Support",
        action: "Update",
        resource: `Resolved — ${subject}`,
      });
    }
  },
}));
