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
