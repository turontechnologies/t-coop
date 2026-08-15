"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, TriangleAlert } from "lucide-react";
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
import { useFeeSettings, useUpdateFeeSettings } from "@/hooks/use-fee-settings";
import {
  feeChargesSchema,
  type FeeChargesFormValues,
} from "@/lib/validations/settings.schema";

const CHARGE_TYPES = ["Fixed", "Percentage"] as const;

export function FeesChargesForm() {
  const {
    data: feeSettings,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useFeeSettings();

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => refetch()}
      isRetrying={isFetching}
      errorTitle="Couldn't load fees & charges"
    >
      {feeSettings ? <FeesChargesFormBody feeSettings={feeSettings} /> : null}
    </QueryBoundary>
  );
}

function FeesChargesFormBody({
  feeSettings,
}: {
  feeSettings: FeeChargesFormValues;
}) {
  const updateFeeSettings = useUpdateFeeSettings();
  const savingsTypeId = useId();
  const loansTypeId = useId();
  const withdrawalFeeId = useId();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FeeChargesFormValues>({
    resolver: zodResolver(feeChargesSchema),
    defaultValues: feeSettings,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateFeeSettings.mutateAsync(values);
      reset(values);
      toast.success("Fees & charges saved");
    } catch (error) {
      toast.error("Couldn't save fees & charges", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const saving = updateFeeSettings.isPending;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {/* One shared grid for both rows so the Charge Type / Amount columns
          line up — two separate grids would size their "auto" columns
          independently and drift out of alignment. */}
      <div className="grid grid-cols-1 items-start gap-x-4 gap-y-6 sm:grid-cols-[1fr_auto_auto]">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Savings Charges</p>
          <p className="text-xs text-muted-foreground">
            Configure how much to charge each member for savings and
            contributions
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={savingsTypeId}>Charge Type</Label>
          <Controller
            control={control}
            name="savingsChargeType"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(value as (typeof CHARGE_TYPES)[number])
                }
              >
                <SelectTrigger id={savingsTypeId} className="h-11 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHARGE_TYPES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Enter"
            className="h-11 w-32"
            aria-invalid={!!errors.savingsChargeAmount}
            {...register("savingsChargeAmount", { valueAsNumber: true })}
          />
          <FieldError message={errors.savingsChargeAmount?.message} />
        </div>

        <div className="h-px bg-border sm:col-span-3" />

        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Loans Charges</p>
          <p className="text-xs text-muted-foreground">
            Configure how much to charge each member for savings and
            contributions
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={loansTypeId}>Charge Type</Label>
          <Controller
            control={control}
            name="loansChargeType"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(value as (typeof CHARGE_TYPES)[number])
                }
              >
                <SelectTrigger id={loansTypeId} className="h-11 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHARGE_TYPES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            inputMode="decimal"
            placeholder="Enter"
            className="h-11 w-32"
            aria-invalid={!!errors.loansChargeAmount}
            {...register("loansChargeAmount", { valueAsNumber: true })}
          />
          <FieldError message={errors.loansChargeAmount?.message} />
        </div>

        <div className="h-px bg-border sm:col-span-3" />

        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Withdrawal Fee</p>
          <p className="text-xs text-muted-foreground">
            The platform&apos;s cut of every member withdrawal — stacked on top
            of each co-op&apos;s own withdrawal fee, and shown to the member
            before they confirm.
          </p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={withdrawalFeeId}>Platform Fee %</Label>
          <Input
            id={withdrawalFeeId}
            type="number"
            inputMode="decimal"
            placeholder="Enter percentage"
            className="h-11 w-32"
            aria-invalid={!!errors.withdrawalFeePercent}
            {...register("withdrawalFeePercent", { valueAsNumber: true })}
          />
          <FieldError message={errors.withdrawalFeePercent?.message} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => reset(feeSettings)}
          disabled={saving}
        >
          Reset
        </Button>
        <Button type="submit" disabled={saving || !isDirty}>
          {saving ? (
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
