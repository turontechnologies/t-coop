"use client";

import { useMemo, useState } from "react";
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
import { useSupportStore } from "@/store/support.store";
import type { AuthenticatedMember } from "@/types/auth";

interface AdminTicketsTabProps {
  member: AuthenticatedMember;
  cooperativeName: string;
}

export function AdminTicketsTab({
  member,
  cooperativeName,
}: AdminTicketsTabProps) {
  const tickets = useSupportStore((state) => state.tickets);
  const raiseTicket = useSupportStore((state) => state.raiseTicket);

  // Members Directory tickets — everyone in this admin's own co-op who raised a ticket that
  // hasn't been escalated away from them yet, tenant-isolated to this co-op alone.
  const raisedToMe = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.cooperativeId === member.id &&
          ticket.raisedByRole === "member" &&
          ticket.assignedToRole === "admin",
      ),
    [tickets, member.id],
  );
  const myTickets = useMemo(
    () => tickets.filter((ticket) => ticket.raisedById === member.id),
    [tickets, member.id],
  );

  const [raiseOpen, setRaiseOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"raised" | "my">("raised");

  const handleRaise = (payload: RaiseTicketPayload) => {
    raiseTicket({
      ...payload,
      raisedById: member.id,
      raisedByName: member.name,
      raisedByRole: "admin",
      cooperativeId: member.id,
      cooperativeName,
    });
    setRaiseOpen(false);
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
                emptyMessage="No issues have been raised by your members yet."
              />
            </TabsPanel>

            <TabsPanel value="my">
              <TicketListTable
                tickets={myTickets}
                emptyMessage="You haven't raised any issues yet."
              />
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>

      <RaiseTicketModal
        open={raiseOpen}
        onOpenChange={setRaiseOpen}
        recipientLabel="the super admin"
        busy={false}
        onSubmit={handleRaise}
      />
    </div>
  );
}
