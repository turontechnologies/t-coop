"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCooperative } from "@/hooks/use-cooperative";
import { useProfile } from "@/hooks/use-profile";
import { useUpdateCooperative } from "@/hooks/use-update-cooperative";
import {
  coopChargesSchema,
  type CoopChargesFormValues,
} from "@/lib/validations/admin-settings.schema";
import { useAuthStore } from "@/store/auth.store";

const CHARGE_TYPES = ["Fixed", "Percentage"] as const;

/** This co-op's own cut of every savings deposit and loan disbursement — combined with the
 * platform's own savings/loans charge rate (super admin's Fees & Charges) at transaction time,
 * same "co-op rate + platform rate" mechanics as {@link WithdrawalFeeForm}'s withdrawal fee. */
export function CoopChargesForm() {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.id;
  const { data: coop, isLoading } = useCooperative(coopId);
  const { data: profile } = useProfile(coopId);
  const updateCooperative = useUpdateCooperative(coopId ?? "");
  const savingsTypeId = useId();
  const savingsAmountId = useId();
  const loansTypeId = useId();
  const loansAmountId = useId();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<CoopChargesFormValues>({
    resolver: zodResolver(coopChargesSchema),
    values: coop
      ? {
          savingsChargeAmount: coop.savingsChargeAmount,
          savingsChargeType: coop.savingsChargeType,
          loansChargeAmount: coop.loansChargeAmount,
          loansChargeType: coop.loansChargeType,
        }
      : undefined,
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!coop || !profile) return;
    try {
      await updateCooperative.mutateAsync({
        name: coop.name,
        adminFirstName: profile.firstName,
        adminLastName: profile.lastName,
        contactEmail: coop.contactEmail,
        contactPhone: coop.contactPhone,
        address: coop.address,
        country: coop.country,
        state: coop.state,
        city: coop.city,
        savingsChargeAmount: values.savingsChargeAmount,
        savingsChargeType: values.savingsChargeType,
        loansChargeAmount: values.loansChargeAmount,
        loansChargeType: values.loansChargeType,
      });
      reset(values);
      toast.success("Charges updated");
    } catch (error) {
      toast.error("Couldn't update charges", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  if (isLoading || !coop) {
    return (
      <Card>
        <CardContent>
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div>
            <p className="text-sm font-medium text-foreground">
              Savings & Loan Charges
            </p>
            <p className="text-xs text-muted-foreground">
              What your co-operative keeps from every savings deposit and loan
              disbursement, on top of the platform&apos;s own rate — a fixed
              amount or a percentage.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor={savingsTypeId}>Savings Charge Type</Label>
              <Controller
                control={control}
                name="savingsChargeType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as (typeof CHARGE_TYPES)[number])
                    }
                    disabled={updateCooperative.isPending}
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
              <Label htmlFor={savingsAmountId}>
                {watch("savingsChargeType") === "Fixed"
                  ? "Charge Amount"
                  : "Charge %"}
              </Label>
              <Input
                id={savingsAmountId}
                type="number"
                inputMode="decimal"
                placeholder="Enter amount"
                className="h-11 w-32"
                disabled={updateCooperative.isPending}
                aria-invalid={!!errors.savingsChargeAmount}
                {...register("savingsChargeAmount", { valueAsNumber: true })}
              />
            </div>
          </div>
          {errors.savingsChargeAmount ? (
            <p className="text-sm text-destructive">
              {errors.savingsChargeAmount.message}
            </p>
          ) : null}

          <div className="h-px bg-border" />

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor={loansTypeId}>Loans Charge Type</Label>
              <Controller
                control={control}
                name="loansChargeType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as (typeof CHARGE_TYPES)[number])
                    }
                    disabled={updateCooperative.isPending}
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
              <Label htmlFor={loansAmountId}>
                {watch("loansChargeType") === "Fixed"
                  ? "Charge Amount"
                  : "Charge %"}
              </Label>
              <Input
                id={loansAmountId}
                type="number"
                inputMode="decimal"
                placeholder="Enter amount"
                className="h-11 w-32"
                disabled={updateCooperative.isPending}
                aria-invalid={!!errors.loansChargeAmount}
                {...register("loansChargeAmount", { valueAsNumber: true })}
              />
            </div>
            <Button
              type="submit"
              disabled={updateCooperative.isPending || !isDirty}
            >
              {updateCooperative.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
          {errors.loansChargeAmount ? (
            <p className="text-sm text-destructive">
              {errors.loansChargeAmount.message}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
