"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { BadgeCheck, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { useAutoVerifyBankAccount } from "@/hooks/use-auto-verify-bank-account";
import { useBankList } from "@/hooks/use-bank-list";
import {
  useCollectionAccount,
  useUpdateCollectionAccount,
} from "@/hooks/use-collection-account";
import {
  collectionAccountSchema,
  type CollectionAccountFormValues,
} from "@/lib/validations/settings.schema";

export function CollectionAccountForm() {
  const {
    data: collectionAccount,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCollectionAccount();

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => refetch()}
      isRetrying={isFetching}
      errorTitle="Couldn't load account details"
    >
      {collectionAccount ? (
        <CollectionAccountFormBody collectionAccount={collectionAccount} />
      ) : null}
    </QueryBoundary>
  );
}

function CollectionAccountFormBody({
  collectionAccount,
}: {
  collectionAccount: CollectionAccountFormValues;
}) {
  const updateCollectionAccount = useUpdateCollectionAccount();
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
  } = useForm<CollectionAccountFormValues>({
    resolver: zodResolver(collectionAccountSchema),
    defaultValues: collectionAccount,
  });

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
    initialBankCode: collectionAccount.bankCode,
    initialAccountNumber: collectionAccount.accountNumber,
    initialAccountName: collectionAccount.accountName,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateCollectionAccount.mutateAsync({
        ...values,
        accountName: values.accountName ?? "",
      });
      reset(values);
      toast.success("Account details saved");
    } catch (error) {
      toast.error("Couldn't save account details", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const busy = updateCollectionAccount.isPending || verifying;

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xl space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={bankId}>Bank</Label>
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
                placeholder="Select"
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
          <Label htmlFor={accountNumberId}>Account Number</Label>
          <Input
            id={accountNumberId}
            placeholder="Enter"
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
          placeholder={verifying ? "Verifying…" : "Auto displays"}
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
          onClick={() => reset(collectionAccount)}
          disabled={busy}
        >
          Reset
        </Button>
        <Button type="submit" disabled={busy || !isDirty || !accountName}>
          {updateCollectionAccount.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Save Changes"
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
