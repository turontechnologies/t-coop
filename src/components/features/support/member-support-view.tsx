"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RaiseTicketModal,
  type RaiseTicketPayload,
} from "@/components/features/support/raise-ticket-modal";
import { TicketListTable } from "@/components/features/support/ticket-list-table";
import { useSupportStore } from "@/store/support.store";
import type { AuthenticatedMember } from "@/types/auth";

interface MemberSupportViewProps {
  member: AuthenticatedMember;
  /** Falls back to the member's own name when a co-op name isn't otherwise known — every real
   * caller passes the branding-resolved name. */
  cooperativeName: string;
  recipientLabel: string;
}

export function MemberSupportView({
  member,
  cooperativeName,
  recipientLabel,
}: MemberSupportViewProps) {
  const tickets = useSupportStore((state) => state.tickets);
  const raiseTicket = useSupportStore((state) => state.raiseTicket);

  const myTickets = useMemo(
    () => tickets.filter((ticket) => ticket.raisedById === member.id),
    [tickets, member.id],
  );

  const [raiseOpen, setRaiseOpen] = useState(false);

  const handleRaise = (payload: RaiseTicketPayload) => {
    raiseTicket({
      ...payload,
      raisedById: member.id,
      raisedByName: member.name,
      raisedByRole: "member",
      cooperativeId: member.cooperativeId ?? member.id,
      cooperativeName,
    });
    setRaiseOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">My Tickets</h2>
        <Button onClick={() => setRaiseOpen(true)}>Raise an Issue</Button>
      </div>

      <Card>
        <CardContent>
          <TicketListTable
            tickets={myTickets}
            emptyMessage="You haven't raised any issues yet."
          />
        </CardContent>
      </Card>

      <RaiseTicketModal
        open={raiseOpen}
        onOpenChange={setRaiseOpen}
        recipientLabel={recipientLabel}
        busy={false}
        onSubmit={handleRaise}
      />
    </div>
  );
}
