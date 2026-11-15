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
  const withdrawalFeeTypeId = useId();
  const withdrawalFeeAmountId = useId();
  const loanFeePercentId = useId();
  const graceDaysId = useId();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
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
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          Defaults for new co-operatives
        </h3>
        <p className="text-sm text-muted-foreground">
          A new co-operative starts with these platform fees. Change any
          co-operative&apos;s own fees under &ldquo;Fees per co-operative&rdquo;
          below.
        </p>
      </div>
      {/* One shared grid for both rows so the Charge Type / Amount columns
          line up — two separate grids would size their "auto" columns
          independently and drift out of alignment. */}
      <div className="grid grid-cols-1 items-start gap-x-4 gap-y-6 sm:grid-cols-[1fr_auto_auto]">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Savings Charges</p>
          <p className="text-xs text-muted-foreground">
            The platform&apos;s cut of every savings deposit, on top of the
            co-op&apos;s own charge
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
            The platform&apos;s cut of every loan, taken from the amount paid
            out to the member
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
        <div className="space-y-2">
          <Label htmlFor={withdrawalFeeTypeId}>Fee Type</Label>
          <Controller
            control={control}
            name="withdrawalFeeType"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(value as (typeof CHARGE_TYPES)[number])
                }
              >
                <SelectTrigger id={withdrawalFeeTypeId} className="h-11 w-40">
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
          <Label htmlFor={withdrawalFeeAmountId}>
            {watch("withdrawalFeeType") === "Fixed"
              ? "Platform Fee Amount"
              : "Platform Fee %"}
          </Label>
          <Input
            id={withdrawalFeeAmountId}
            type="number"
            inputMode="decimal"
            placeholder="Enter amount"
            className="h-11 w-32"
            aria-invalid={!!errors.withdrawalFeeAmount}
            {...register("withdrawalFeeAmount", { valueAsNumber: true })}
          />
          <FieldError message={errors.withdrawalFeeAmount?.message} />
        </div>

        <div className="h-px bg-border sm:col-span-3" />

        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Loan Application Fee
          </p>
          <p className="text-xs text-muted-foreground">
            The platform&apos;s percentage of every loan application fee a
            co-operative collects. Members pay the co-op&apos;s fee as set; this
            is the platform&apos;s share of it.
          </p>
        </div>
        <div className="hidden sm:block" />
        <div className="space-y-2">
          <Label htmlFor={loanFeePercentId}>Platform Share %</Label>
          <Input
            id={loanFeePercentId}
            type="number"
            inputMode="decimal"
            placeholder="0"
            className="h-11 w-32"
            aria-invalid={!!errors.loanApplicationFeePercent}
            {...register("loanApplicationFeePercent", { valueAsNumber: true })}
          />
          <FieldError message={errors.loanApplicationFeePercent?.message} />
        </div>

        <div className="h-px bg-border sm:col-span-3" />

        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Subscription Grace Period
          </p>
          <p className="text-xs text-muted-foreground">
            How many days a co-operative can keep working after its subscription
            expires, before it is locked. Applies to every co-operative. 0 locks
            it the day after expiry.
          </p>
        </div>
        <div className="hidden sm:block" />
        <div className="space-y-2">
          <Label htmlFor={graceDaysId}>Days</Label>
          <Input
            id={graceDaysId}
            type="number"
            inputMode="numeric"
            placeholder="0"
            className="h-11 w-32"
            aria-invalid={!!errors.subscriptionGraceDays}
            {...register("subscriptionGraceDays", { valueAsNumber: true })}
          />
          <FieldError message={errors.subscriptionGraceDays?.message} />
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
