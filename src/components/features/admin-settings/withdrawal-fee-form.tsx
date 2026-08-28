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
  withdrawalFeeSchema,
  type WithdrawalFeeFormValues,
} from "@/lib/validations/admin-settings.schema";
import { useAuthStore } from "@/store/auth.store";

const FEE_TYPES = ["Fixed", "Percentage"] as const;

export function WithdrawalFeeForm() {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.id;
  const { data: coop, isLoading } = useCooperative(coopId);
  const { data: profile } = useProfile(coopId);
  const updateCooperative = useUpdateCooperative(coopId ?? "");
  const feeTypeId = useId();
  const feeAmountId = useId();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<WithdrawalFeeFormValues>({
    resolver: zodResolver(withdrawalFeeSchema),
    values: coop
      ? {
          withdrawalFeeAmount: coop.withdrawalFeeAmount,
          withdrawalFeeType: coop.withdrawalFeeType,
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
        withdrawalFeeAmount: values.withdrawalFeeAmount,
        withdrawalFeeType: values.withdrawalFeeType,
      });
      reset(values);
      toast.success("Withdrawal fee updated");
    } catch (error) {
      toast.error("Couldn't update withdrawal fee", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  if (isLoading || !coop) {
    return (
      <Card>
        <CardContent>
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Withdrawal Fee
            </p>
            <p className="text-xs text-muted-foreground">
              What your co-operative keeps from every member withdrawal, on top
              of the platform&apos;s own fee — a fixed amount or a percentage.
              Shown to members before they confirm a withdrawal.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor={feeTypeId}>Fee Type</Label>
              <Controller
                control={control}
                name="withdrawalFeeType"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as (typeof FEE_TYPES)[number])
                    }
                    disabled={updateCooperative.isPending}
                  >
                    <SelectTrigger id={feeTypeId} className="h-11 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FEE_TYPES.map((option) => (
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
              <Label htmlFor={feeAmountId}>
                {watch("withdrawalFeeType") === "Fixed"
                  ? "Fee Amount"
                  : "Fee %"}
              </Label>
              <Input
                id={feeAmountId}
                type="number"
                inputMode="decimal"
                placeholder="Enter amount"
                className="h-11 w-32"
                disabled={updateCooperative.isPending}
                aria-invalid={!!errors.withdrawalFeeAmount}
                {...register("withdrawalFeeAmount", {
                  valueAsNumber: true,
                })}
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
          {errors.withdrawalFeeAmount ? (
            <p className="text-sm text-destructive">
              {errors.withdrawalFeeAmount.message}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
