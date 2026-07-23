"use client";

import { useId, useState } from "react";
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
import { LocationFields } from "@/components/features/shared/location-fields";
import { useBankList } from "@/hooks/use-bank-list";
import { resolveBankAccount } from "@/lib/bank-lookup";
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
  const { banks, loading: banksLoading } = useBankList();
  const [verifying, setVerifying] = useState(false);

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
    getValues,
    setError,
    trigger,
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

  const handleVerify = async () => {
    const fieldsValid = await trigger(["accountNumber", "bankCode"]);
    if (!fieldsValid) return;

    setVerifying(true);
    try {
      const resolvedName = await resolveBankAccount(
        getValues("accountNumber"),
        getValues("bankCode"),
      );
      setValue("accountName", resolvedName, { shouldValidate: true });
      toast.success("Account verified", { description: resolvedName });
    } catch (error) {
      setError("accountNumber", {
        message:
          error instanceof Error ? error.message : "Verification failed.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    updateMember(coopId, member.id, {
      ...values,
      accountName: values.accountName ?? "",
    });
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Controller
                control={control}
                name="bankCode"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    disabled={isSubmitting || verifying || banksLoading}
                  >
                    <SelectTrigger
                      id={bankId}
                      className="h-11 w-full"
                      aria-invalid={!!errors.bankCode}
                    >
                      <SelectValue
                        placeholder={
                          banksLoading ? "Loading banks…" : "Select bank"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Button
                type="button"
                onClick={handleVerify}
                disabled={isSubmitting || verifying}
                className="h-11"
              >
                {verifying ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
            <FieldError
              message={
                errors.accountNumber?.message ?? errors.bankCode?.message
              }
            />
            {accountName ? (
              <p className="text-xs font-medium text-success">{accountName}</p>
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
