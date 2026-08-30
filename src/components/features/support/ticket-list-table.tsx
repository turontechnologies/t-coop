"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import { formatTimeAgo } from "@/lib/format";
import {
  ticketStatusBadgeVariant,
  type SupportTicket,
} from "@/lib/support-data";
import { cn } from "@/lib/utils";

interface TicketListTableProps {
  tickets: SupportTicket[];
  /** Shows who raised each ticket — relevant for an admin/super-admin queue, not for a member's
   * own "My Tickets" list (always them). */
  showRaisedBy?: boolean;
  /** Shows which co-op each ticket belongs to — relevant only for the super admin's
   * platform-wide queue. */
  showCooperative?: boolean;
  emptyMessage: string;
}

export function TicketListTable({
  tickets,
  showRaisedBy = false,
  showCooperative = false,
  emptyMessage,
}: TicketListTableProps) {
  const router = useRouter();

  if (tickets.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">
                Subject
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Category
              </th>
              {showRaisedBy ? (
                <th className="px-4 py-2.5 font-medium text-foreground">
                  Raised By
                </th>
              ) : null}
              {showCooperative ? (
                <th className="px-4 py-2.5 font-medium text-foreground">
                  Co-operative
                </th>
              ) : null}
              <th className="px-4 py-2.5 font-medium text-foreground">
                Raised
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => router.push(`/support/${ticket.id}`)}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {ticket.subject}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {ticket.category}
                </td>
                {showRaisedBy ? (
                  <td className="px-4 py-3 text-foreground">
                    {ticket.raisedByName}
                  </td>
                ) : null}
                {showCooperative ? (
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.cooperativeName}
                  </td>
                ) : null}
                <td className="px-4 py-3 text-muted-foreground">
                  {formatTimeAgo(ticket.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={ticketStatusBadgeVariant(ticket.status)}
                    className={cn(
                      ticket.status === "Resolved" &&
                        "bg-success/15 text-success",
                    )}
                  >
                    {ticket.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MobileRecordList isEmpty={false}>
        {tickets.map((ticket) => (
          <MobileRecordCard
            key={ticket.id}
            onClick={() => router.push(`/support/${ticket.id}`)}
            title={ticket.subject}
            badge={
              <Badge
                variant={ticketStatusBadgeVariant(ticket.status)}
                className={cn(
                  ticket.status === "Resolved" && "bg-success/15 text-success",
                )}
              >
                {ticket.status}
              </Badge>
            }
            fields={[
              { label: "Category", value: ticket.category },
              ...(showRaisedBy
                ? [{ label: "Raised By", value: ticket.raisedByName }]
                : []),
              ...(showCooperative
                ? [{ label: "Co-operative", value: ticket.cooperativeName }]
                : []),
              { label: "Raised", value: formatTimeAgo(ticket.createdAt) },
            ]}
          />
        ))}
      </MobileRecordList>
    </div>
  );
}
