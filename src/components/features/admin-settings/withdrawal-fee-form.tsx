"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  withdrawalFeeSchema,
  type WithdrawalFeeFormValues,
} from "@/lib/validations/admin-settings.schema";
import { useAdminSettingsStore } from "@/store/admin-settings.store";

export function WithdrawalFeeForm() {
  const withdrawalFeePercent = useAdminSettingsStore(
    (state) => state.withdrawalFeePercent,
  );
  const updateWithdrawalFeePercent = useAdminSettingsStore(
    (state) => state.updateWithdrawalFeePercent,
  );
  const [saving, setSaving] = useState(false);
  const feeId = useId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<WithdrawalFeeFormValues>({
    resolver: zodResolver(withdrawalFeeSchema),
    defaultValues: { withdrawalFeePercent },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    updateWithdrawalFeePercent(values.withdrawalFeePercent);
    setSaving(false);
    reset(values);
    toast.success("Withdrawal fee updated");
  });

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
                aria-invalid={!!errors.withdrawalFeePercent}
                {...register("withdrawalFeePercent", {
                  valueAsNumber: true,
                })}
              />
            </div>
            <Button type="submit" disabled={saving || !isDirty}>
              {saving ? (
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
