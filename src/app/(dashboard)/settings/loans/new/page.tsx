"use client";

import { useEffect, useId, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import {
  useCoopLoanTypeMutations,
  useCoopLoanTypes,
} from "@/hooks/use-coop-loans";
import {
  loanTypeSettingSchema,
  type LoanTypeSettingFormValues,
} from "@/lib/validations/admin-settings.schema";
import { useAuthStore } from "@/store/auth.store";
import type { InterestType, RepaymentInterval } from "@/types/coop-loans";

const DURATION_OPTIONS = [3, 6, 12, 24];
const REPAYMENT_INTERVALS: RepaymentInterval[] = [
  "Weekly",
  "Monthly",
  "Quarterly",
];
const INTEREST_TYPES: InterestType[] = ["Percentage", "Fixed"];

function defaultInstallments(
  durationMonths: number,
  interval: RepaymentInterval,
): number {
  if (interval === "Weekly") return Math.max(1, durationMonths * 4);
  if (interval === "Quarterly")
    return Math.max(1, Math.ceil(durationMonths / 3));
  return Math.max(1, durationMonths);
}

export default function LoanTypeCreationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");

  const member = useAuthStore((state) => state.member);
  const coopId = member?.id;
  const typesQuery = useCoopLoanTypes(coopId);
  const mutations = useCoopLoanTypeMutations(coopId ?? "");

  const editingSetting = useMemo(
    () => typesQuery.data?.find((setting) => setting.id === editingId),
    [typesQuery.data, editingId],
  );
  const isEditing = !!editingSetting;

  const nameId = useId();
  const eligibilityId = useId();
  const maxAmountId = useId();
  const interestAmountId = useId();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<LoanTypeSettingFormValues>({
    resolver: zodResolver(loanTypeSettingSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      eligibilityPercent: 100,
      durationMonths: 12,
      maxAmount: 0,
      repaymentInterval: "Monthly",
      numberOfInstallments: defaultInstallments(12, "Monthly"),
      interestType: "Percentage",
      interestAmount: 0,
    },
  });

  useEffect(() => {
    if (!editingSetting) return;
    reset({
      name: editingSetting.name,
      eligibilityPercent: editingSetting.eligibilityPercent,
      durationMonths: editingSetting.durationMonths,
      maxAmount: editingSetting.maxAmount,
      repaymentInterval: editingSetting.repaymentInterval,
      numberOfInstallments: editingSetting.numberOfRepayments,
      interestType: editingSetting.interestType,
      interestAmount: editingSetting.interestRate,
    });
  }, [editingSetting, reset]);

  const durationMonths = watch("durationMonths");
  const repaymentInterval = watch("repaymentInterval");

  const busy = mutations.createType.isPending || mutations.updateType.isPending;

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editingSetting) {
        await mutations.updateType.mutateAsync({
          typeId: editingSetting.id,
          values,
        });
        toast.success("Loan type updated", { description: values.name });
      } else {
        await mutations.createType.mutateAsync(values);
        toast.success("Loan type created", { description: values.name });
      }
      router.push("/settings");
    } catch (error) {
      toast.error(
        isEditing ? "Couldn't update loan type" : "Couldn't create loan type",
        {
          description:
            error instanceof Error ? error.message : "Please try again.",
        },
      );
    }
  });

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/settings")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-6 rounded-2xl bg-card p-6 ring-1 ring-foreground/10"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Loan Type Details
            </p>
            <p className="text-xs text-muted-foreground">
              Create loan type descriptions
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={nameId}>Loan Type Name</Label>
              <Input
                id={nameId}
                placeholder="Enter loan type"
                disabled={busy}
                aria-invalid={!!errors.name}
                className="h-11"
                {...register("name")}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={eligibilityId}>Eligibility %</Label>
                <Input
                  id={eligibilityId}
                  type="number"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  disabled={busy}
                  aria-invalid={!!errors.eligibilityPercent}
                  className="h-11"
                  {...register("eligibilityPercent", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={maxAmountId}>Maximum Loan Amount</Label>
                <Input
                  id={maxAmountId}
                  type="number"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  disabled={busy}
                  aria-invalid={!!errors.maxAmount}
                  className="h-11"
                  {...register("maxAmount", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Loan Duration</Label>
                <Controller
                  control={control}
                  name="durationMonths"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => {
                        const months = Number(value ?? 0);
                        field.onChange(months);
                        setValue(
                          "numberOfInstallments",
                          defaultInstallments(months, repaymentInterval),
                        );
                      }}
                      disabled={busy}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_OPTIONS.map((months) => (
                          <SelectItem key={months} value={String(months)}>
                            {months} Months
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Repayment Interval</Label>
                <Controller
                  control={control}
                  name="repaymentInterval"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        const interval = value as RepaymentInterval;
                        field.onChange(interval);
                        setValue(
                          "numberOfInstallments",
                          defaultInstallments(durationMonths || 0, interval),
                        );
                      }}
                      disabled={busy}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        {REPAYMENT_INTERVALS.map((interval) => (
                          <SelectItem key={interval} value={interval}>
                            {interval}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>No of installments</Label>
                <Input
                  type="number"
                  disabled={busy}
                  className="h-11"
                  aria-invalid={!!errors.numberOfInstallments}
                  {...register("numberOfInstallments", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Interest Type</Label>
                <Controller
                  control={control}
                  name="interestType"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as InterestType)
                      }
                      disabled={busy}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select % or fixed" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTEREST_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={interestAmountId}>Interest Amount</Label>
                <Input
                  id={interestAmountId}
                  type="number"
                  inputMode="decimal"
                  placeholder="Enter value"
                  disabled={busy}
                  aria-invalid={!!errors.interestAmount}
                  className="h-11"
                  {...register("interestAmount", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/settings")}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !isValid}>
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Loan Type"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
