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
import type { PlatformUser } from "@/lib/settings-data";
import { cn } from "@/lib/utils";

interface PlatformUsersTableProps {
  users: PlatformUser[];
  onEdit: (user: PlatformUser) => void;
  onToggleStatus: (user: PlatformUser) => void;
  onRemove: (user: PlatformUser) => void;
}

export function PlatformUsersTable({
  users,
  onEdit,
  onToggleStatus,
  onRemove,
}: PlatformUsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/60">
            <th className="px-4 py-2.5 font-medium text-foreground">Name</th>
            <th className="px-4 py-2.5 font-medium text-foreground">Email</th>
            <th className="px-4 py-2.5 font-medium text-foreground">Role</th>
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
          {users.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No users invited yet.
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const isActive = user.status === "Active";
              return (
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.role}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateLong(new Date(user.dateAdded))}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={isActive ? "secondary" : "destructive"}
                      className={cn(isActive && "bg-success/15 text-success")}
                    >
                      {user.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(user)}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Edit ${user.name}`}
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
                                ? `Disable ${user.name}`
                                : `Activate ${user.name}`
                            }
                          />
                        }
                        entityLabel="User"
                        name={user.name}
                        isActive={isActive}
                        onConfirm={() => onToggleStatus(user)}
                      >
                        <Power className="size-3.5" aria-hidden="true" />
                      </ConfirmToggleDialog>
                      <RemoveUserDialog user={user} onRemove={onRemove} />
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

function RemoveUserDialog({
  user,
  onRemove,
}: {
  user: PlatformUser;
  onRemove: (user: PlatformUser) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Remove ${user.name}`}
          />
        }
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove user</AlertDialogTitle>
          <AlertDialogDescription>
            This removes {user.name}&apos;s access to the platform. This
            can&apos;t be undone from here.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => onRemove(user)}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
