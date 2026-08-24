"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { BadgeCheck, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
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
import { LocationFields } from "@/components/features/shared/location-fields";
import { useAutoVerifyBankAccount } from "@/hooks/use-auto-verify-bank-account";
import { useBankList } from "@/hooks/use-bank-list";
import { coopMemberFullName, type CoopMember } from "@/lib/coop-data";
import {
  editMemberSchema,
  type EditMemberFormValues,
} from "@/lib/validations/coop.schema";

interface EditMemberModalProps {
  member: CoopMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EditMemberFormValues) => Promise<void>;
}

export function EditMemberModal({
  member,
  open,
  onOpenChange,
  onSubmit: submitMember,
}: EditMemberModalProps) {
  const { banks, loading: banksLoading } = useBankList();

  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const roleId = useId();
  const guarantorId = useId();
  const bankId = useId();
  const accountNumberId = useId();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
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
      city: member.city,
      bankCode: member.bankCode,
      accountNumber: member.accountNumber,
      accountName: member.accountName,
    },
  });

  const accountName = watch("accountName");
  const bankCode = watch("bankCode");
  const accountNumber = watch("accountNumber");

  const { verifying } = useAutoVerifyBankAccount({
    bankCode,
    accountNumber,
    onVerified: (resolvedName) =>
      setValue("accountName", resolvedName, { shouldValidate: true }),
    onError: (message) => setError("accountNumber", { message }),
    initialBankCode: member.bankCode,
    initialAccountNumber: member.accountNumber,
    initialAccountName: member.accountName,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await submitMember(values);
      toast.success("Member updated", {
        description: `${values.firstName} ${values.lastName}'s details were saved.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Couldn't update member", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
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
            <LocationFields
              country={watch("country")}
              state={watch("state")}
              city={watch("city")}
              onCountryChange={(value) =>
                setValue("country", value, { shouldValidate: true })
              }
              onStateChange={(value) =>
                setValue("state", value, { shouldValidate: true })
              }
              onCityChange={(value) =>
                setValue("city", value, { shouldValidate: true })
              }
              disabled={isSubmitting}
              countryError={errors.country?.message}
              stateError={errors.state?.message}
              cityError={errors.city?.message}
            />
          </div>

          <div className="space-y-2">
            <Label>Bank Account</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Controller
                control={control}
                name="bankCode"
                render={({ field }) => (
                  <Combobox
                    id={bankId}
                    value={field.value ?? ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setValue("accountName", "");
                    }}
                    options={banks.map((bank) => ({
                      value: bank.code,
                      label: bank.name,
                    }))}
                    placeholder="Select bank"
                    searchPlaceholder="Search banks…"
                    loading={banksLoading}
                    disabled={isSubmitting || verifying}
                    ariaInvalid={!!errors.bankCode}
                  />
                )}
              />
              <Input
                id={accountNumberId}
                placeholder="10-digit account number"
                disabled={isSubmitting || verifying}
                aria-invalid={!!errors.accountNumber}
                className="h-11"
                {...register("accountNumber", {
                  onChange: () => setValue("accountName", ""),
                })}
              />
            </div>
            <FieldError
              message={
                errors.accountNumber?.message ?? errors.bankCode?.message
              }
            />
            {verifying ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Verifying with the bank…
              </p>
            ) : accountName ? (
              <p className="flex items-center gap-1 text-xs font-medium text-success">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                {accountName}
              </p>
            ) : null}
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
