"use client";

import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatTimeAgo } from "@/lib/format";
import { useAuditLogStore } from "@/store/audit-log.store";

export function SettingsLogsTab() {
  const entries = useAuditLogStore((state) => state.entries);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter(
      (entry) =>
        entry.activity.toLowerCase().includes(query) ||
        entry.activityBy.toLowerCase().includes(query) ||
        entry.role.toLowerCase().includes(query) ||
        entry.location.toLowerCase().includes(query),
    );
  }, [entries, search]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Every action taken across the platform, newest first — who did it, in
          what role, and their approximate location at the time (resolved from
          their IP address, so this is a best-effort location, not GPS).
        </p>
      </div>

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
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">
                Activity
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Activity By
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">Role</th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Location
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No activity matches your search.
                </td>
              </tr>
            ) : (
              filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {entry.activity}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.activityBy}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.role}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin
                        className="size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {entry.location}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatTimeAgo(entry.date)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
