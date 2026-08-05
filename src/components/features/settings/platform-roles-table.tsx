"use client";

import { Badge } from "@/components/ui/badge";
import { PERMISSION_MODULES, type PlatformRole } from "@/lib/settings-data";
import { formatDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PlatformRolesTableProps {
  roles: PlatformRole[];
}

function permissionsLabel(permissions: string[]): string {
  if (permissions.length >= PERMISSION_MODULES.length) return "All access";
  if (permissions.length === 1) return permissions[0];
  return `${permissions.length} modules`;
}

export function PlatformRolesTable({ roles }: PlatformRolesTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/60">
            <th className="px-4 py-2.5 font-medium text-foreground">Role</th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Permissions
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Date Added
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {roles.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No roles created yet.
              </td>
            </tr>
          ) : (
            roles.map((role) => (
              <tr
                key={role.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {role.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {permissionsLabel(role.permissions)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateLong(new Date(role.dateAdded))}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      role.status === "Active" ? "secondary" : "destructive"
                    }
                    className={cn(
                      role.status === "Active" && "bg-success/15 text-success",
                    )}
                  >
                    {role.status}
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
