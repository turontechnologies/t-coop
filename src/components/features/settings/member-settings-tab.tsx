"use client";

import { useId, useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useChangePassword } from "@/hooks/use-change-password";
import type { AuthenticatedMember } from "@/types/auth";

interface MemberSettingsTabProps {
  member: AuthenticatedMember;
}

/** A member's own /profile page already covers their personal details (name, address, bank
 * account, etc.) — re-showing that same full edit form here was redundant, so this tab is
 * scoped to settings-specific concerns only: changing your password. */
export function MemberSettingsTab({ member }: MemberSettingsTabProps) {
  const changePassword = useChangePassword();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const [fields, setFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<
    Partial<
      Record<"currentPassword" | "newPassword" | "confirmPassword", string>
    >
  >({});

  const setField = (
    field: "currentPassword" | "newPassword" | "confirmPassword",
    value: string,
  ) => {
    setFields((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!fields.currentPassword) {
      setErrors((prev) => ({
        ...prev,
        currentPassword: "Enter your current password",
      }));
      return;
    }
    if (fields.newPassword.length < 6) {
      setErrors((prev) => ({
        ...prev,
        newPassword: "Password must be at least 6 characters",
      }));
      return;
    }
    if (fields.newPassword !== fields.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      return;
    }

    try {
      await changePassword.mutateAsync({
        memberId: member.id,
        currentPassword: fields.currentPassword,
        newPassword: fields.newPassword,
      });
      setFields({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password updated");
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        currentPassword:
          error instanceof Error
            ? error.message
            : "Couldn't update your password",
      }));
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-sm space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Password</p>
        <p className="text-xs text-muted-foreground">
          Update the password you use to sign in
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={currentPasswordId}>Current Password</Label>
        <PasswordInput
          id={currentPasswordId}
          placeholder="Enter current password"
          value={fields.currentPassword}
          onChange={(event) => setField("currentPassword", event.target.value)}
          disabled={changePassword.isPending}
          aria-invalid={!!errors.currentPassword}
          className="h-11"
        />
        <FieldError message={errors.currentPassword} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={newPasswordId}>New Password</Label>
        <PasswordInput
          id={newPasswordId}
          placeholder="Enter new password"
          value={fields.newPassword}
          onChange={(event) => setField("newPassword", event.target.value)}
          disabled={changePassword.isPending}
          aria-invalid={!!errors.newPassword}
          className="h-11"
        />
        <FieldError message={errors.newPassword} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={confirmPasswordId}>Confirm New Password</Label>
        <PasswordInput
          id={confirmPasswordId}
          placeholder="Re-enter new password"
          value={fields.confirmPassword}
          onChange={(event) => setField("confirmPassword", event.target.value)}
          disabled={changePassword.isPending}
          aria-invalid={!!errors.confirmPassword}
          className="h-11"
        />
        <FieldError message={errors.confirmPassword} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={changePassword.isPending}>
          {changePassword.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive">
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
