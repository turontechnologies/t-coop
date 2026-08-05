"use client";

import { Badge } from "@/components/ui/badge";
import { formatDateLong } from "@/lib/format";
import type { PlatformUser } from "@/lib/settings-data";
import { cn } from "@/lib/utils";

interface PlatformUsersTableProps {
  users: PlatformUser[];
}

export function PlatformUsersTable({ users }: PlatformUsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/60">
            <th className="px-4 py-2.5 font-medium text-foreground">Name</th>
            <th className="px-4 py-2.5 font-medium text-foreground">Email</th>
            <th className="px-4 py-2.5 font-medium text-foreground">Role</th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Date Added
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No users invited yet.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {user.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.email}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.role}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateLong(new Date(user.dateAdded))}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      user.status === "Active" ? "secondary" : "destructive"
                    }
                    className={cn(
                      user.status === "Active" && "bg-success/15 text-success",
                    )}
                  >
                    {user.status}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
