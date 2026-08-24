"use client";

import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { BadgeCheck, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAutoVerifyBankAccount } from "@/hooks/use-auto-verify-bank-account";
import { useBankList } from "@/hooks/use-bank-list";
import { useCooperative } from "@/hooks/use-cooperative";
import { useUpdateCooperativeBankAccount } from "@/hooks/use-update-cooperative";
import {
  coopBankAccountSchema,
  type CoopBankAccountFormValues,
} from "@/lib/validations/admin-settings.schema";
import { useAuthStore } from "@/store/auth.store";

export function CoopBankAccountForm() {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.id;
  const { data: coop, isLoading } = useCooperative(coopId);
  const updateBankAccount = useUpdateCooperativeBankAccount(coopId ?? "");
  const { banks, loading: banksLoading } = useBankList();
  const bankId = useId();
  const accountNumberId = useId();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CoopBankAccountFormValues>({
    resolver: zodResolver(coopBankAccountSchema),
  });

  useEffect(() => {
    if (!coop) return;
    reset({
      bankCode: coop.bankCode ?? "",
      accountNumber: coop.accountNumber ?? "",
      accountName: coop.accountName ?? "",
    });
  }, [coop, reset]);

  const bankCode = watch("bankCode");
  const accountNumber = watch("accountNumber");
  const accountName = watch("accountName");

  const invalidateAccountName = () => {
    if (accountName) setValue("accountName", "", { shouldDirty: true });
  };

  const { verifying } = useAutoVerifyBankAccount({
    bankCode,
    accountNumber,
    onVerified: (resolvedName) =>
      setValue("accountName", resolvedName, { shouldDirty: true }),
    initialBankCode: coop?.bankCode ?? "",
    initialAccountNumber: coop?.accountNumber ?? "",
    initialAccountName: coop?.accountName ?? "",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateBankAccount.mutateAsync(values);
      reset(values);
      toast.success("Bank account saved");
    } catch (error) {
      toast.error("Couldn't save bank account", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const busy = updateBankAccount.isPending || verifying;

  if (isLoading || !coop) {
    return <div className="h-56 max-w-xl animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={bankId}>Bank Name</Label>
          <Controller
            control={control}
            name="bankCode"
            render={({ field }) => (
              <Combobox
                id={bankId}
                value={field.value ?? ""}
                onValueChange={(value) => {
                  field.onChange(value);
                  invalidateAccountName();
                }}
                options={banks.map((bank) => ({
                  value: bank.code,
                  label: bank.name,
                }))}
                placeholder="Displayed Here"
                searchPlaceholder="Search banks…"
                loading={banksLoading}
                disabled={busy}
                ariaInvalid={!!errors.bankCode}
              />
            )}
          />
          <FieldError message={errors.bankCode?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={accountNumberId}>Account No</Label>
          <Input
            id={accountNumberId}
            placeholder="Displayed Here"
            disabled={busy}
            className="h-11"
            aria-invalid={!!errors.accountNumber}
            {...register("accountNumber", { onChange: invalidateAccountName })}
          />
          <FieldError message={errors.accountNumber?.message} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Account Name</Label>
        <Input
          value={accountName ?? ""}
          disabled
          placeholder={verifying ? "Verifying…" : "Displayed Here"}
          className="h-11"
        />
        {verifying ? (
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Verifying with the bank…
          </p>
        ) : accountName ? (
          <p className="flex items-center gap-1 text-xs font-medium text-success">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Verified with the bank
          </p>
        ) : null}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            reset({
              bankCode: coop.bankCode ?? "",
              accountNumber: coop.accountNumber ?? "",
              accountName: coop.accountName ?? "",
            })
          }
          disabled={busy}
        >
          Reset
        </Button>
        <Button type="submit" disabled={busy || !isDirty}>
          {updateBankAccount.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Update Details"
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
