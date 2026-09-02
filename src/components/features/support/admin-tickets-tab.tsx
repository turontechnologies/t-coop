"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import {
  RaiseTicketModal,
  type RaiseTicketPayload,
} from "@/components/features/support/raise-ticket-modal";
import { TicketListTable } from "@/components/features/support/ticket-list-table";
import { useRaiseTicket, useSupportTickets } from "@/hooks/use-support";
import type { AuthenticatedMember } from "@/types/auth";

interface AdminTicketsTabProps {
  member: AuthenticatedMember;
}

export function AdminTicketsTab({ member }: AdminTicketsTabProps) {
  const { data: tickets, isLoading } = useSupportTickets();
  const raiseTicket = useRaiseTicket();

  // The backend already scopes this list to the admin's own co-op — split here into "raised to
  // me" (a member's ticket, still theirs to answer) vs "my own" (raised by this admin themself).
  const raisedToMe = useMemo(
    () =>
      (tickets ?? []).filter(
        (ticket) =>
          ticket.raisedByRole === "member" && ticket.assignedToRole === "admin",
      ),
    [tickets],
  );
  const myTickets = useMemo(
    () => (tickets ?? []).filter((ticket) => ticket.raisedById === member.id),
    [tickets, member.id],
  );

  const [raiseOpen, setRaiseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"raised" | "my">("raised");

  const handleRaise = (payload: RaiseTicketPayload) => {
    raiseTicket.mutate(payload, {
      onSuccess: () => {
        setRaiseOpen(false);
        toast.success("Ticket raised", {
          description: "The super admin will be notified.",
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
        <h2 className="text-sm font-semibold text-foreground">Tickets</h2>
        {activeTab === "my" ? (
          <Button onClick={() => setRaiseOpen(true)}>Raise an Issue</Button>
        ) : null}
      </div>

      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "raised" | "my")}
          >
            <TabsList>
              <TabsTab value="raised">
                Raised to Me
                {raisedToMe.length > 0 ? ` (${raisedToMe.length})` : ""}
              </TabsTab>
              <TabsTab value="my">My Tickets</TabsTab>
              <TabsIndicator />
            </TabsList>

            <TabsPanel value="raised">
              <TicketListTable
                tickets={raisedToMe}
                showRaisedBy
                emptyMessage={
                  isLoading
                    ? "Loading tickets…"
                    : "No issues have been raised by your members yet."
                }
              />
            </TabsPanel>

            <TabsPanel value="my">
              <TicketListTable
                tickets={myTickets}
                emptyMessage={
                  isLoading
                    ? "Loading tickets…"
                    : "You haven't raised any issues yet."
                }
              />
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>

      <RaiseTicketModal
        open={raiseOpen}
        onOpenChange={setRaiseOpen}
        recipientLabel="the super admin"
        busy={raiseTicket.isPending}
        onSubmit={handleRaise}
      />
    </div>
  );
}
