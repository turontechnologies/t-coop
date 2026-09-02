export type TicketStatus = "Open" | "Escalated" | "Resolved" | "Closed";

export const TICKET_CATEGORIES = [
  "Savings",
  "Loans",
  "Account",
  "Payments",
  "Other",
] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export type TicketRaiserRole = "member" | "admin";
/** Who currently owns resolving this ticket — starts as the raiser's own admin (or, for an
 * admin's own ticket, straight to the super admin), and moves to "super_admin" the moment it's
 * escalated. Never moves back — resolving an escalated ticket is always the super admin's call. */
export type TicketAssigneeRole = "admin" | "super_admin";

export type TicketEventType =
  "Raised" | "Reply" | "Escalated" | "Resolved" | "Closed" | "Reopened";

export interface TicketEvent {
  id: string;
  type: TicketEventType;
  actorId: string;
  actorName: string;
  actorRole: TicketRaiserRole | "super_admin";
  message?: string;
  /** Evidence attached to a Raised or Reply event — a Cloudinary URL from the same
   * `uploadService.uploadAttachment` flow used everywhere else in the app. */
  attachmentUrl?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: TicketCategory;
  description: string;
  status: TicketStatus;
  /** The co-operative this ticket belongs to — always set, even for an admin's own ticket
   * (their own id, same "admin id == co-op id" invariant used everywhere else). This is what
   * keeps a co-op's tickets invisible to every other co-op's admin. */
  cooperativeId: string;
  cooperativeName: string;
  raisedById: string;
  raisedByName: string;
  raisedByRole: TicketRaiserRole;
  assignedToRole: TicketAssigneeRole;
  createdAt: string;
  resolvedAt?: string;
  resolutionNote?: string;
  timeline: TicketEvent[];
}

export function ticketStatusBadgeVariant(
  status: TicketStatus,
): "secondary" | "outline" | "destructive" {
  if (status === "Resolved" || status === "Closed") return "secondary";
  if (status === "Open") return "outline";
  return "destructive";
}

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: "ticket-1",
    subject: "Withdrawal still pending after 3 days",
    category: "Savings",
    description:
      "I requested a withdrawal from my Basic Savings on Monday and it's still showing Pending. Can someone check?",
    status: "Open",
    cooperativeId: "COOP-0001",
    cooperativeName: "Turon Co-operative",
    raisedById: "MB-0001",
    raisedByName: "Tunde Bakare",
    raisedByRole: "member",
    assignedToRole: "admin",
    createdAt: daysAgo(3),
    timeline: [
      {
        id: "evt-1",
        type: "Raised",
        actorId: "MB-0001",
        actorName: "Tunde Bakare",
        actorRole: "member",
        message:
          "I requested a withdrawal from my Basic Savings on Monday and it's still showing Pending. Can someone check?",
        createdAt: daysAgo(3),
      },
    ],
  },
  {
    id: "ticket-2",
    subject: "Can't reach our Paystack settlement account",
    category: "Payments",
    description:
      "Our co-op's Paystack payout account got suspended and I don't have platform-level access to fix it — please advise.",
    status: "Escalated",
    cooperativeId: "COOP-0001",
    cooperativeName: "Turon Co-operative",
    raisedById: "COOP-0001",
    raisedByName: "Chidinma Eze",
    raisedByRole: "admin",
    assignedToRole: "super_admin",
    createdAt: daysAgo(5),
    timeline: [
      {
        id: "evt-2",
        type: "Raised",
        actorId: "COOP-0001",
        actorName: "Chidinma Eze",
        actorRole: "admin",
        message:
          "Our co-op's Paystack payout account got suspended and I don't have platform-level access to fix it — please advise.",
        createdAt: daysAgo(5),
      },
      {
        id: "evt-3",
        type: "Escalated",
        actorId: "COOP-0001",
        actorName: "Chidinma Eze",
        actorRole: "admin",
        message: "Forwarding — this needs platform-level payout access.",
        createdAt: daysAgo(4),
      },
    ],
  },
];
