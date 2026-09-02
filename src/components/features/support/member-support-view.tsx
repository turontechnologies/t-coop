"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RaiseTicketModal,
  type RaiseTicketPayload,
} from "@/components/features/support/raise-ticket-modal";
import { TicketListTable } from "@/components/features/support/ticket-list-table";
import { useRaiseTicket, useSupportTickets } from "@/hooks/use-support";

interface MemberSupportViewProps {
  recipientLabel: string;
}

export function MemberSupportView({ recipientLabel }: MemberSupportViewProps) {
  const { data: tickets, isLoading } = useSupportTickets();
  const raiseTicket = useRaiseTicket();

  const [raiseOpen, setRaiseOpen] = useState(false);

  const handleRaise = (payload: RaiseTicketPayload) => {
    raiseTicket.mutate(payload, {
      onSuccess: () => {
        setRaiseOpen(false);
        toast.success("Ticket raised", {
          description: `${recipientLabel} will be notified.`,
        });
      },
      onError: (error) => {
        toast.error("Couldn't raise the ticket", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        });
      },
    });
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
            tickets={tickets ?? []}
            emptyMessage={
              isLoading
                ? "Loading your tickets…"
                : "You haven't raised any issues yet."
            }
          />
        </CardContent>
      </Card>

      <RaiseTicketModal
        open={raiseOpen}
        onOpenChange={setRaiseOpen}
        recipientLabel={recipientLabel}
        busy={raiseTicket.isPending}
        onSubmit={handleRaise}
      />
    </div>
  );
}
