"use client";

import { useEffect, useId, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  computeInstallments,
  type CoopLoanTypeSetting,
  type InterestType,
  type RepaymentInterval,
} from "@/lib/admin-settings-data";
import { coopMemberFullName } from "@/lib/coop-data";
import { getDirectoryMembers } from "@/lib/member-directory";
import {
  loanTypeSettingSchema,
  type LoanTypeSettingFormValues,
} from "@/lib/validations/admin-settings.schema";
import { useAdminSettingsStore } from "@/store/admin-settings.store";
import { useCoopStore } from "@/store/coop.store";

const DURATION_OPTIONS = [3, 6, 12, 24];
const REPAYMENT_INTERVALS: RepaymentInterval[] = [
  "Weekly",
  "Monthly",
  "Quarterly",
];
const INTEREST_TYPES: InterestType[] = ["Percentage", "Fixed"];

export default function LoanTypeCreationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get("id");

  const cooperatives = useCoopStore((state) => state.cooperatives);
  const loanTypeSettings = useAdminSettingsStore(
    (state) => state.loanTypeSettings,
  );
  const addLoanTypeSetting = useAdminSettingsStore(
    (state) => state.addLoanTypeSetting,
  );
  const updateLoanTypeSetting = useAdminSettingsStore(
    (state) => state.updateLoanTypeSetting,
  );

  const editingSetting = useMemo(
    () => loanTypeSettings.find((setting) => setting.id === editingId),
    [loanTypeSettings, editingId],
  );
  const isEditing = !!editingSetting;

  const memberOptions = useMemo(
    () => getDirectoryMembers(cooperatives).map(coopMemberFullName),
    [cooperatives],
  );

  const [busy, setBusy] = useState(false);
  const nameId = useId();
  const eligibilityId = useId();
  const maxAmountId = useId();
  const interestAmountId = useId();
  const loanTermsId = useId();
  const guarantorTermsId = useId();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
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
      interestType: "Percentage",
      interestAmount: 0,
      approver1: "",
      approver2: "",
      loanTerms: "",
      guarantorTerms: "",
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
      interestType: editingSetting.interestType,
      interestAmount: editingSetting.interestAmount,
      approver1: editingSetting.approver1,
      approver2: editingSetting.approver2,
      loanTerms: editingSetting.loanTerms,
      guarantorTerms: editingSetting.guarantorTerms,
    });
  }, [editingSetting, reset]);

  const durationMonths = watch("durationMonths");
  const repaymentInterval = watch("repaymentInterval");
  const installments = computeInstallments(
    durationMonths || 0,
    repaymentInterval,
  );

  const onSubmit = handleSubmit(async (values) => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 700));

    if (editingSetting) {
      updateLoanTypeSetting(editingSetting.id, {
        ...values,
        approver2: values.approver2 ?? "",
        numberOfInstallments: installments,
      });
      toast.success("Loan type updated", { description: values.name });
    } else {
      const setting: CoopLoanTypeSetting = {
        id: `loan-type-${Date.now()}`,
        ...values,
        approver2: values.approver2 ?? "",
        numberOfInstallments: installments,
        status: "Active",
      };
      addLoanTypeSetting(setting);
      toast.success("Loan type created", { description: values.name });
    }

    setBusy(false);
    router.push("/settings");
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
                      onValueChange={(value) =>
                        field.onChange(Number(value ?? 0))
                      }
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
                      onValueChange={(value) =>
                        field.onChange(value as RepaymentInterval)
                      }
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
                  value={installments}
                  disabled
                  placeholder="Auto calculated"
                  className="h-11"
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Approver 1</Label>
                <Controller
                  control={control}
                  name="approver1"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? "")}
                      disabled={busy}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select approver" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Approver 2</Label>
                <Controller
                  control={control}
                  name="approver2"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) => field.onChange(value ?? "")}
                      disabled={busy}
                    >
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Select approver" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={loanTermsId}>Loan Terms</Label>
              <Textarea
                id={loanTermsId}
                placeholder="Enter documents required."
                disabled={busy}
                aria-invalid={!!errors.loanTerms}
                {...register("loanTerms")}
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Guarantor Requirements
            </p>
            <p className="text-xs text-muted-foreground">
              Create guarantor requirements
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={guarantorTermsId}>Loan Terms</Label>
            <Textarea
              id={guarantorTermsId}
              placeholder="Enter documents required."
              disabled={busy}
              aria-invalid={!!errors.guarantorTerms}
              {...register("guarantorTerms")}
            />
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
