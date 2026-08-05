"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ActivityDetailsPanel } from "@/components/features/settings/activity-details-panel";
import { ACTION_ICONS, MODULE_ICONS, STATUS_STYLES } from "@/lib/audit-log-ui";
import { formatTimeAgo, getInitials } from "@/lib/format";
import type { AuditLogEntry } from "@/lib/audit-log-data";
import { cn } from "@/lib/utils";
import { useAuditLogStore } from "@/store/audit-log.store";

export function SettingsLogsTab() {
  const entries = useAuditLogStore((state) => state.entries);
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(
    null,
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter(
      (entry) =>
        entry.activityBy.toLowerCase().includes(query) ||
        entry.role.toLowerCase().includes(query) ||
        entry.module.toLowerCase().includes(query) ||
        entry.action.toLowerCase().includes(query) ||
        entry.resource.toLowerCase().includes(query) ||
        entry.location.toLowerCase().includes(query) ||
        entry.ipAddress.toLowerCase().includes(query),
    );
  }, [entries, search]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Every action taken across the platform, newest first — who did it, where
        (module/action/resource), and their approximate location and IP address
        at the time (resolved from the request, so this is best-effort, not
        GPS).
      </p>

      <div className="relative w-full max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search"
          className="h-9 pl-8"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">Time</th>
              <th className="px-4 py-2.5 font-medium text-foreground">User</th>
              <th className="px-4 py-2.5 font-medium text-foreground">Role</th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Module
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Action
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Resource
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                IP Address
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                <span className="sr-only">More</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No activity matches your search.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => {
                const ModuleIcon = MODULE_ICONS[entry.module];
                const ActionIcon = ACTION_ICONS[entry.action];
                const statusStyle = STATUS_STYLES[entry.status];
                const StatusIcon = statusStyle.icon;
                return (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatTimeAgo(entry.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                          {getInitials(entry.activityBy)}
                        </span>
                        <span className="font-medium text-foreground">
                          {entry.activityBy}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.role}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <ModuleIcon className="size-3.5" aria-hidden="true" />
                        {entry.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <ActionIcon className="size-3.5" aria-hidden="true" />
                        {entry.action}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-foreground">
                      {entry.resource}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          statusStyle.badgeClassName,
                        )}
                      >
                        <StatusIcon className="size-3" aria-hidden="true" />
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {entry.ipAddress}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedEntry(entry);
                        }}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="View activity details"
                      >
                        <MoreHorizontal
                          className="size-3.5"
                          aria-hidden="true"
                        />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ActivityDetailsPanel
        entry={selectedEntry}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null);
        }}
      />
    </div>
  );
}
