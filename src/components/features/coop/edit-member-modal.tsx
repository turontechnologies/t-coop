"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { coopMemberFullName, type CoopMember } from "@/lib/coop-data";
import {
  editMemberSchema,
  type EditMemberFormValues,
} from "@/lib/validations/coop.schema";
import { useCoopStore } from "@/store/coop.store";

interface EditMemberModalProps {
  coopId: string;
  member: CoopMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMemberModal({
  coopId,
  member,
  open,
  onOpenChange,
}: EditMemberModalProps) {
  const updateMember = useCoopStore((state) => state.updateMember);

  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const roleId = useId();
  const guarantorId = useId();
  const countryId = useId();
  const stateId = useId();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditMemberFormValues>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
      guarantor: member.guarantor,
      country: member.country,
      state: member.state,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    updateMember(coopId, member.id, values);
    toast.success("Member updated", {
      description: `${values.firstName} ${values.lastName}'s details were saved.`,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {coopMemberFullName(member)}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={firstNameId}>First Name</Label>
              <Input
                id={firstNameId}
                disabled={isSubmitting}
                aria-invalid={!!errors.firstName}
                className="h-11"
                {...register("firstName")}
              />
              <FieldError message={errors.firstName?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={lastNameId}>Last Name</Label>
              <Input
                id={lastNameId}
                disabled={isSubmitting}
                aria-invalid={!!errors.lastName}
                className="h-11"
                {...register("lastName")}
              />
              <FieldError message={errors.lastName?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={emailId}>Email Address</Label>
            <Input
              id={emailId}
              type="email"
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              className="h-11"
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={roleId}>Role</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "Member")}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id={roleId} className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Member">Member</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={guarantorId}>Guarantor</Label>
              <Input
                id={guarantorId}
                disabled={isSubmitting}
                aria-invalid={!!errors.guarantor}
                className="h-11"
                {...register("guarantor")}
              />
              <FieldError message={errors.guarantor?.message} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={countryId}>Country</Label>
              <Controller
                control={control}
                name="country"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id={countryId}
                      className="h-11 w-full"
                      aria-invalid={!!errors.country}
                    >
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.country?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={stateId}>State</Label>
              <Input
                id={stateId}
                disabled={isSubmitting}
                aria-invalid={!!errors.state}
                className="h-11"
                {...register("state")}
              />
              <FieldError message={errors.state?.message} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="sm:w-32">
              {isSubmitting ? (
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive">
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
