"use client";

import { formatDateLong } from "@/lib/format";
import { useSettingsStore } from "@/store/settings.store";

export function SettingsLogsTab() {
  const activityLog = useSettingsStore((state) => state.activityLog);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/60">
            <th className="px-4 py-2.5 font-medium text-foreground">
              Activity
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Activity By
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">Role</th>
            <th className="px-4 py-2.5 font-medium text-foreground">Date</th>
          </tr>
        </thead>
        <tbody>
          {activityLog.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No activity recorded yet.
              </td>
            </tr>
          ) : (
            activityLog.map((entry) => (
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
                  {formatDateLong(new Date(entry.date))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
