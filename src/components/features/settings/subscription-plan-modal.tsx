"use client";

import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubscriptionPlanMutations } from "@/hooks/use-subscription-plan-mutations";
import {
  subscriptionPlanSchema,
  type SubscriptionPlanFormValues,
} from "@/lib/validations/subscription-plan.schema";
import type {
  SubscriptionPlan,
  SubscriptionPlanType,
} from "@/types/subscription";

interface SubscriptionPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to add a new plan; pass to edit an existing one. */
  plan?: SubscriptionPlan;
  /** Pre-selects (and locks, for edit) which type this plan belongs to. */
  defaultType: SubscriptionPlanType;
}

export function SubscriptionPlanModal({
  open,
  onOpenChange,
  plan,
  defaultType,
}: SubscriptionPlanModalProps) {
  const { create, update } = useSubscriptionPlanMutations();
  const isEditing = !!plan;

  const labelId = useId();
  const durationId = useId();
  const amountId = useId();
  const statusId = useId();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionPlanFormValues>({
    resolver: zodResolver(subscriptionPlanSchema),
    defaultValues: {
      type: plan?.type ?? defaultType,
      label: plan?.label ?? "",
      durationInDays: plan?.durationInDays ?? 30,
      amount: plan?.amount ?? 0,
      status: plan?.status ?? "Active",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        type: plan?.type ?? defaultType,
        label: plan?.label ?? "",
        durationInDays: plan?.durationInDays ?? 30,
        amount: plan?.amount ?? 0,
        status: plan?.status ?? "Active",
      });
    }
  }, [open, plan, defaultType, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEditing) {
        await update.mutateAsync({
          id: plan.id,
          values: {
            label: values.label,
            durationInDays: values.durationInDays,
            amount: values.amount,
            status: values.status,
          },
        });
        toast.success("Plan updated", {
          description: `${values.label} was saved.`,
        });
      } else {
        await create.mutateAsync(values);
        toast.success("Plan added", {
          description: `${values.label} is now available.`,
        });
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? "Couldn't save changes" : "Couldn't add plan", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const busy = isSubmitting || create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Plan" : "Add Subscription Plan"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(value ?? "New Subscription")
                  }
                  disabled={isEditing || busy}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New Subscription">
                      New Subscription
                    </SelectItem>
                    <SelectItem value="Renewal">Renewal</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {isEditing ? (
              <p className="text-xs text-muted-foreground">
                Delete and re-add this plan to move it between New Subscription
                and Renewal.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={labelId}>Plan Name</Label>
            <Input
              id={labelId}
              placeholder="e.g. Monthly, 6 Months, Yearly"
              disabled={busy}
              aria-invalid={!!errors.label}
              className="h-11"
              {...register("label")}
            />
            <FieldError message={errors.label?.message} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={durationId}>Duration (days)</Label>
              <Input
                id={durationId}
                type="number"
                inputMode="numeric"
                disabled={busy}
                aria-invalid={!!errors.durationInDays}
                className="h-11"
                {...register("durationInDays", { valueAsNumber: true })}
              />
              <FieldError message={errors.durationInDays?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={amountId}>Amount (₦)</Label>
              <Input
                id={amountId}
                type="number"
                inputMode="numeric"
                disabled={busy}
                aria-invalid={!!errors.amount}
                className="h-11"
                {...register("amount", { valueAsNumber: true })}
              />
              <FieldError message={errors.amount?.message} />
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Label htmlFor={statusId}>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "Active")}
                    disabled={busy}
                  >
                    <SelectTrigger id={statusId} className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Inactive plans stay in payment history but can&apos;t be picked
                for a new payment.
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="sm:w-32">
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Add Plan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
