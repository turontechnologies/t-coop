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
import { useSupportTickets } from "@/hooks/use-support";

const STATUS_OPTIONS = [
  "All",
  "Open",
  "Escalated",
  "Resolved",
  "Closed",
] as const;

export function SuperAdminSupportView() {
  const { data: tickets, isLoading } = useSupportTickets();
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("All");

  // The backend already scopes this to platform-assigned tickets, tenant-agnostic by design.
  const platformTickets = useMemo(() => tickets ?? [], [tickets]);
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
    (t) => t.status !== "Resolved" && t.status !== "Closed",
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
            emptyMessage={
              isLoading ? "Loading tickets…" : "No tickets match this filter."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
