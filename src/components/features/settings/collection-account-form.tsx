"use client";

import { useEffect, useId, useRef, useState } from "react";
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
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { useBankList } from "@/hooks/use-bank-list";
import {
  useCollectionAccount,
  useUpdateCollectionAccount,
} from "@/hooks/use-collection-account";
import { resolveBankAccount } from "@/lib/bank-lookup";
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

  const [verifying, setVerifying] = useState(false);
  // Already-saved, already-verified accounts shouldn't re-hit Paystack on
  // every page load — seed this as "already attempted" for whatever came
  // back from the backend already carrying a resolved account name.
  const lastAttemptRef = useRef<string | null>(
    collectionAccount.accountName
      ? `${collectionAccount.bankCode}:${collectionAccount.accountNumber}`
      : null,
  );

  // Auto-verifies the moment a bank is picked and the account number hits
  // 10 digits — no manual "Verify" click needed. Re-fires automatically if
  // either value changes afterward (invalidateAccountName clears the old
  // result first), but never twice for the same bank+number pair.
  useEffect(() => {
    if (!bankCode || accountNumber?.length !== 10) {
      lastAttemptRef.current = null;
      return;
    }

    const attemptKey = `${bankCode}:${accountNumber}`;
    if (lastAttemptRef.current === attemptKey) return;
    lastAttemptRef.current = attemptKey;

    let cancelled = false;
    setVerifying(true);
    resolveBankAccount(accountNumber, bankCode)
      .then((resolvedName) => {
        if (cancelled) return;
        setValue("accountName", resolvedName, { shouldDirty: true });
        toast.success("Account verified", { description: resolvedName });
      })
      .catch((error) => {
        if (cancelled) return;
        toast.error("Couldn't verify that account", {
          description: error instanceof Error ? error.message : undefined,
        });
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bankCode, accountNumber, setValue]);

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
                    placeholder={banksLoading ? "Loading banks…" : "Select"}
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
