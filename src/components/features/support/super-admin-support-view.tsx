"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketListTable } from "@/components/features/support/ticket-list-table";
import type { TicketStatus } from "@/lib/support-data";
import { useSupportStore } from "@/store/support.store";

const STATUS_OPTIONS = ["All", "Open", "Escalated", "Resolved"] as const;

export function SuperAdminSupportView() {
  const tickets = useSupportStore((state) => state.tickets);
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("All");

  // Platform-wide, no tenant filter — every co-op's escalations and every admin's own tickets
  // land here, since there's no one above the super admin to isolate them from.
  const platformTickets = useMemo(
    () => tickets.filter((ticket) => ticket.assignedToRole === "super_admin"),
    [tickets],
  );
  const filtered = useMemo(
    () =>
      status === "All"
        ? platformTickets
        : platformTickets.filter(
            (ticket) => ticket.status === (status as TicketStatus),
          ),
    [platformTickets, status],
  );
  const openCount = platformTickets.filter(
    (t) => t.status !== "Resolved",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          All Tickets{openCount > 0 ? ` (${openCount} open)` : ""}
        </h2>
        <Select
          value={status}
          onValueChange={(value) =>
            setStatus((value ?? "All") as (typeof STATUS_OPTIONS)[number])
          }
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "All" ? "By status" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent>
          <TicketListTable
            tickets={filtered}
            showRaisedBy
            showCooperative
            emptyMessage="No tickets match this filter."
          />
        </CardContent>
      </Card>
    </div>
  );
}
