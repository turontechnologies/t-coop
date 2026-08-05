"use client";

import { useId } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlatformRole } from "@/lib/settings-data";
import {
  inviteUserSchema,
  type InviteUserFormValues,
} from "@/lib/validations/settings.schema";

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: PlatformRole[];
  busy: boolean;
  onInvite: (values: InviteUserFormValues) => void;
}

export function InviteUserModal({
  open,
  onOpenChange,
  roles,
  busy,
  onInvite,
}: InviteUserModalProps) {
  const emailId = useId();
  const roleId = useId();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: { email: "", role: "" },
    mode: "onChange",
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onSubmit = handleSubmit((values) => onInvite(values));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              type="email"
              placeholder="Enter email"
              disabled={busy}
              aria-invalid={!!errors.email}
              className="h-11"
              {...register("email")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={roleId}>Role</Label>
            <Controller
              control={control}
              name="role"
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
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
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
                  Inviting…
                </>
              ) : (
                "Invite User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
