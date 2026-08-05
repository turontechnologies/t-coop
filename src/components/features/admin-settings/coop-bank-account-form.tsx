"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { BadgeCheck, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
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
import { useBankList } from "@/hooks/use-bank-list";
import { resolveBankAccount } from "@/lib/bank-lookup";
import {
  coopBankAccountSchema,
  type CoopBankAccountFormValues,
} from "@/lib/validations/admin-settings.schema";
import { useAdminSettingsStore } from "@/store/admin-settings.store";

export function CoopBankAccountForm() {
  const coopBankAccount = useAdminSettingsStore(
    (state) => state.coopBankAccount,
  );
  const updateCoopBankAccount = useAdminSettingsStore(
    (state) => state.updateCoopBankAccount,
  );
  const { banks, loading: banksLoading } = useBankList();
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
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
    defaultValues: coopBankAccount,
  });

  const bankCode = watch("bankCode");
  const accountNumber = watch("accountNumber");
  const accountName = watch("accountName");

  const invalidateAccountName = () => {
    if (accountName) setValue("accountName", "", { shouldDirty: true });
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const resolvedName = await resolveBankAccount(accountNumber, bankCode);
      setValue("accountName", resolvedName, { shouldDirty: true });
      toast.success("Account verified", { description: resolvedName });
    } catch (error) {
      toast.error("Couldn't verify that account", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setVerifying(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    updateCoopBankAccount({
      ...values,
      accountName: values.accountName ?? "",
    });
    setSaving(false);
    reset(values);
    toast.success("Bank account saved");
  });

  const busy = saving || verifying;

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor={bankId}>Bank Name</Label>
          <Controller
            control={control}
            name="bankCode"
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={(value) => {
                  field.onChange(value ?? "");
                  invalidateAccountName();
                }}
                disabled={busy || banksLoading}
              >
                <SelectTrigger
                  id={bankId}
                  className="h-11 w-full"
                  aria-invalid={!!errors.bankCode}
                >
                  <SelectValue
                    placeholder={
                      banksLoading ? "Loading banks…" : "Displayed Here"
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

        <div className="space-y-2 sm:pt-7">
          <Button
            type="button"
            onClick={handleVerify}
            disabled={
              busy || !bankCode || accountNumber?.length !== 10 || !!accountName
            }
            className="h-11 w-full sm:w-auto"
          >
            {verifying ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : accountName ? (
              "Verified"
            ) : (
              "Verify"
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Account Name</Label>
        <Input
          value={accountName ?? ""}
          disabled
          placeholder="Displayed Here"
          className="h-11"
        />
        {accountName ? (
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
          onClick={() => reset(coopBankAccount)}
          disabled={busy}
        >
          Reset
        </Button>
        <Button type="submit" disabled={busy || !isDirty}>
          {saving ? (
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
