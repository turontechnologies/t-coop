"use client";

import { Pencil, Power, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ConfirmToggleDialog } from "@/components/features/coop/confirm-toggle-dialog";
import { formatDateLong } from "@/lib/format";
import {
  PERMISSION_MODULES,
  type PlatformRole,
  type PlatformUser,
} from "@/lib/settings-data";
import { cn } from "@/lib/utils";

interface PlatformRolesTableProps {
  roles: PlatformRole[];
  users: PlatformUser[];
  onEdit: (role: PlatformRole) => void;
  onToggleStatus: (role: PlatformRole) => void;
  onRemove: (role: PlatformRole) => void;
}

function permissionsLabel(permissions: string[]): string {
  if (permissions.length >= PERMISSION_MODULES.length) return "All access";
  if (permissions.length === 1) return permissions[0];
  return `${permissions.length} modules`;
}

export function PlatformRolesTable({
  roles,
  users,
  onEdit,
  onToggleStatus,
  onRemove,
}: PlatformRolesTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
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
            <th className="px-4 py-2.5 font-medium text-foreground">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {roles.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No roles created yet.
              </td>
            </tr>
          ) : (
            roles.map((role) => {
              const isActive = role.status === "Active";
              const inUse = users.some((user) => user.role === role.name);
              return (
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
                      variant={isActive ? "secondary" : "destructive"}
                      className={cn(isActive && "bg-success/15 text-success")}
                    >
                      {role.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(role)}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Edit ${role.name}`}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <ConfirmToggleDialog
                        trigger={
                          <button
                            type="button"
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={
                              isActive
                                ? `Disable ${role.name}`
                                : `Activate ${role.name}`
                            }
                          />
                        }
                        entityLabel="Role"
                        name={role.name}
                        isActive={isActive}
                        onConfirm={() => onToggleStatus(role)}
                      >
                        <Power className="size-3.5" aria-hidden="true" />
                      </ConfirmToggleDialog>
                      <RemoveRoleDialog
                        role={role}
                        inUse={inUse}
                        onRemove={onRemove}
                      />
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function RemoveRoleDialog({
  role,
  inUse,
  onRemove,
}: {
  role: PlatformRole;
  inUse: boolean;
  onRemove: (role: PlatformRole) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            disabled={inUse}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
            aria-label={
              inUse
                ? `Can't remove ${role.name} — still assigned to a user`
                : `Remove ${role.name}`
            }
            title={inUse ? "Reassign or remove its users first" : undefined}
          />
        }
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove role</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the &quot;{role.name}&quot; role. This can&apos;t be
            undone from here.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => onRemove(role)}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
