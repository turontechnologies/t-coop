"use client";

import { useEffect, useId } from "react";
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
import { PermissionTreeEditor } from "@/components/features/settings/permission-tree-editor";
import { PLATFORM_MENU_TREE } from "@/lib/permissions";
import type { PlatformRole } from "@/lib/settings-data";
import {
  createRoleSchema,
  type CreateRoleFormValues,
} from "@/lib/validations/settings.schema";

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass to edit an existing role instead of creating a new one. */
  editingRole?: PlatformRole | null;
  busy: boolean;
  onSubmit: (values: CreateRoleFormValues) => void;
}

export function CreateRoleModal({
  open,
  onOpenChange,
  editingRole,
  busy,
  onSubmit: onSubmitProp,
}: CreateRoleModalProps) {
  const roleNameId = useId();
  const isEditing = !!editingRole;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CreateRoleFormValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { roleName: "", permissions: [] },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;
    reset({
      roleName: editingRole?.name ?? "",
      permissions: editingRole?.permissions ?? [],
    });
  }, [open, editingRole, reset]);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset({ roleName: "", permissions: [] });
    onOpenChange(next);
  };

  const onSubmit = handleSubmit((values) => onSubmitProp(values));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Role" : "Create Role"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={roleNameId}>Role Name</Label>
            <Input
              id={roleNameId}
              placeholder="Enter name"
              disabled={busy}
              aria-invalid={!!errors.roleName}
              className="h-11"
              {...register("roleName")}
            />
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <p className="text-xs text-muted-foreground">
              Check a module for access to it, then toggle Read (view only) or
              Write (can also create/edit/approve).
            </p>
            <Controller
              control={control}
              name="permissions"
              render={({ field }) => (
                <PermissionTreeEditor
                  tree={PLATFORM_MENU_TREE}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={busy}
                />
              )}
            />
            {errors.permissions ? (
              <p className="text-sm text-destructive">
                {errors.permissions.message}
              </p>
            ) : null}
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
                  {isEditing ? "Saving…" : "Creating…"}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Role"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
