"use client";

import { Pencil, Trash2 } from "lucide-react";
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
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import type { CoopUser } from "@/services/coop-staff.service";
import { cn } from "@/lib/utils";

interface CoopUsersTableProps {
  users: CoopUser[];
  onEdit: (user: CoopUser) => void;
  onRemove: (user: CoopUser) => void;
}

export function CoopUsersTable({
  users,
  onEdit,
  onRemove,
}: CoopUsersTableProps) {
  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">Name</th>
              <th className="px-4 py-2.5 font-medium text-foreground">Email</th>
              <th className="px-4 py-2.5 font-medium text-foreground">Role</th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No staff assigned yet.
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
                          aria-label={`Change ${user.name}'s role`}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </button>
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

      <MobileRecordList
        isEmpty={users.length === 0}
        emptyMessage="No staff assigned yet."
      >
        {users.map((user) => {
          const isActive = user.status === "Active";
          return (
            <MobileRecordCard
              key={user.id}
              title={user.name}
              badge={
                <Badge
                  variant={isActive ? "secondary" : "destructive"}
                  className={cn(isActive && "bg-success/15 text-success")}
                >
                  {user.status}
                </Badge>
              }
              fields={[
                { label: "Email", value: user.email },
                { label: "Role", value: user.role },
              ]}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Change ${user.name}'s role`}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </button>
                  <RemoveUserDialog user={user} onRemove={onRemove} />
                </>
              }
            />
          );
        })}
      </MobileRecordList>
    </div>
  );
}

function RemoveUserDialog({
  user,
  onRemove,
}: {
  user: CoopUser;
  onRemove: (user: CoopUser) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Remove ${user.name}'s role`}
          />
        }
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove role</AlertDialogTitle>
          <AlertDialogDescription>
            This removes {user.name}&apos;s staff access. They stay a regular
            member of the co-operative — this doesn&apos;t affect their account,
            savings, or loans.
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
