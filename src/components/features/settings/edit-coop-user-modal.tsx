"use client";

import { useEffect, useId, useState } from "react";
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
import type { CoopRole, CoopUser } from "@/services/coop-staff.service";

interface EditCoopUserModalProps {
  user: CoopUser | null;
  onOpenChange: (open: boolean) => void;
  roles: CoopRole[];
  busy: boolean;
  onSave: (memberId: string, roleId: string) => void;
}

export function EditCoopUserModal({
  user,
  onOpenChange,
  roles,
  busy,
  onSave,
}: EditCoopUserModalProps) {
  const nameId = useId();
  const emailId = useId();
  const roleId = useId();
  const [selectedRoleId, setSelectedRoleId] = useState("");

  useEffect(() => {
    if (!user) return;
    setSelectedRoleId(roles.find((role) => role.name === user.role)?.id ?? "");
  }, [user, roles]);

  const handleOpenChange = (next: boolean) => onOpenChange(next);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !selectedRoleId) return;
    onSave(user.id, selectedRoleId);
  };

  return (
    <Dialog open={!!user} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              value={user?.name ?? ""}
              disabled
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              value={user?.email ?? ""}
              disabled
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={roleId}>Role</Label>
            <Select
              value={selectedRoleId}
              onValueChange={(value) => setSelectedRoleId(value ?? "")}
              disabled={busy}
            >
              <SelectTrigger id={roleId} className="h-11 w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles
                  .filter((role) => role.status === "Active")
                  .map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={busy || !selectedRoleId}>
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
