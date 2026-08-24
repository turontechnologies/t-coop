"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCooperative } from "@/hooks/use-cooperative";
import { useProfile } from "@/hooks/use-profile";
import { useUpdateCooperative } from "@/hooks/use-update-cooperative";
import {
  withdrawalFeeSchema,
  type WithdrawalFeeFormValues,
} from "@/lib/validations/admin-settings.schema";
import { useAuthStore } from "@/store/auth.store";

export function WithdrawalFeeForm() {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.id;
  const { data: coop, isLoading } = useCooperative(coopId);
  const { data: profile } = useProfile(coopId);
  const updateCooperative = useUpdateCooperative(coopId ?? "");
  const feeId = useId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<WithdrawalFeeFormValues>({
    resolver: zodResolver(withdrawalFeeSchema),
    values: coop
      ? { withdrawalFeePercent: coop.withdrawalFeePercent }
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
        withdrawalFeePercent: values.withdrawalFeePercent,
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
              The percentage your co-operative keeps from every member
              withdrawal, on top of the platform&apos;s own fee. Shown to
              members before they confirm a withdrawal.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor={feeId}>Fee %</Label>
              <Input
                id={feeId}
                type="number"
                inputMode="decimal"
                placeholder="Enter percentage"
                className="h-11 w-32"
                disabled={updateCooperative.isPending}
                aria-invalid={!!errors.withdrawalFeePercent}
                {...register("withdrawalFeePercent", {
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
          {errors.withdrawalFeePercent ? (
            <p className="text-sm text-destructive">
              {errors.withdrawalFeePercent.message}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
