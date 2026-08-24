"use client";

import { useId, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CoopMember } from "@/lib/coop-data";
import {
  assignCoopRoleSchema,
  type AssignCoopRoleFormValues,
} from "@/lib/validations/admin-settings.schema";
import type { CoopRole, CoopUser } from "@/services/coop-staff.service";

interface AssignCoopUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: CoopMember[];
  users: CoopUser[];
  roles: CoopRole[];
  busy: boolean;
  onAssign: (values: AssignCoopRoleFormValues) => void;
}

export function AssignCoopUserModal({
  open,
  onOpenChange,
  members,
  users,
  roles,
  busy,
  onAssign,
}: AssignCoopUserModalProps) {
  const memberId = useId();
  const roleId = useId();

  const assignedIds = useMemo(
    () => new Set(users.map((user) => user.id)),
    [users],
  );
  const assignableMembers = useMemo(
    () => members.filter((member) => !assignedIds.has(member.id)),
    [members, assignedIds],
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<AssignCoopRoleFormValues>({
    resolver: zodResolver(assignCoopRoleSchema),
    defaultValues: { memberId: "", roleId: "" },
    mode: "onChange",
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onSubmit = handleSubmit((values) => onAssign(values));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a Role</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={memberId}>Member</Label>
            <Controller
              control={control}
              name="memberId"
              render={({ field }) => (
                <Combobox
                  id={memberId}
                  value={field.value}
                  onValueChange={field.onChange}
                  options={assignableMembers.map((member) => ({
                    value: member.id,
                    label: `${member.firstName} ${member.lastName} (${member.id})`,
                  }))}
                  placeholder={
                    assignableMembers.length === 0
                      ? "No members available"
                      : "Search members…"
                  }
                  searchPlaceholder="Search members…"
                  disabled={busy || assignableMembers.length === 0}
                  ariaInvalid={!!errors.memberId}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Don&apos;t see who you&apos;re looking for? Add them to Members
              Directory first, then assign a role here.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={roleId}>Role</Label>
            <Controller
              control={control}
              name="roleId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "")}
                  disabled={busy}
                >
                  <SelectTrigger id={roleId} className="h-11 w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter((role) => role.status === "Active")
                      .map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !isValid}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Assigning…
                </>
              ) : (
                "Assign Role"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
