"use client";

import { useId, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Pencil, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  useCoopPlatformFees,
  useUpdateCoopPlatformFees,
} from "@/hooks/use-platform-earnings";
import { formatNaira } from "@/lib/format";
import type { ChargeType, CoopPlatformFees } from "@/lib/settings-data";
import {
  coopPlatformFeesSchema,
  type CoopPlatformFeesFormValues,
} from "@/lib/validations/settings.schema";

const CHARGE_TYPES = ["Fixed", "Percentage"] as const;

function describe(type: ChargeType, amount: number) {
  return type === "Fixed" ? formatNaira(amount) : `${amount}%`;
}

/** Super admin: the platform's own fees from each co-operative, edited one co-op at a time. */
export function CoopPlatformFeesSection() {
  const query = useCoopPlatformFees();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<CoopPlatformFees | null>(null);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all = query.data ?? [];
    if (!term) return all;
    return all.filter(
      (row) =>
        row.cooperativeName.toLowerCase().includes(term) ||
        row.cooperativeId.toLowerCase().includes(term),
    );
  }, [query.data, search]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">
            Fees per co-operative
          </h3>
          <p className="text-sm text-muted-foreground">
            What the platform takes from each co-operative. Each one can be
            different.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search co-operatives"
            aria-label="Search co-operatives"
            className="h-10 pl-9"
          />
        </div>
      </div>

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
        errorTitle="Couldn't load co-operative fees"
      >
        <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  "Co-operative",
                  "Savings",
                  "Loans",
                  "Withdrawal",
                  "Loan App. Fee",
                  "",
                ].map((heading, index) => (
                  <th
                    key={heading || index}
                    className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                  >
                    {heading || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {search
                      ? "No co-operative matches that search."
                      : "No co-operatives yet."}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.cooperativeId}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {row.cooperativeName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.cooperativeId}
                        {row.status !== "Active" ? (
                          <Badge variant="destructive" className="ml-2">
                            {row.status}
                          </Badge>
                        ) : null}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {describe(row.savingsChargeType, row.savingsChargeAmount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {describe(row.loansChargeType, row.loansChargeAmount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {describe(row.withdrawalFeeType, row.withdrawalFeeAmount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {row.loanApplicationFeePercent}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(row)}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <MobileRecordList
          isEmpty={rows.length === 0}
          emptyMessage={
            search
              ? "No co-operative matches that search."
              : "No co-operatives yet."
          }
        >
          {rows.map((row) => (
            <MobileRecordCard
              key={row.cooperativeId}
              onClick={() => setEditing(row)}
              title={row.cooperativeName}
              fields={[
                {
                  label: "Savings",
                  value: describe(
                    row.savingsChargeType,
                    row.savingsChargeAmount,
                  ),
                },
                {
                  label: "Loans",
                  value: describe(row.loansChargeType, row.loansChargeAmount),
                },
                {
                  label: "Withdrawal",
                  value: describe(
                    row.withdrawalFeeType,
                    row.withdrawalFeeAmount,
                  ),
                },
                {
                  label: "Loan app. fee",
                  value: `${row.loanApplicationFeePercent}%`,
                },
              ]}
            />
          ))}
        </MobileRecordList>
      </QueryBoundary>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-w-xl">
          {editing ? (
            <EditCoopFeesForm
              key={editing.cooperativeId}
              fees={editing}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EditCoopFeesForm({
  fees,
  onDone,
}: {
  fees: CoopPlatformFees;
  onDone: () => void;
}) {
  const update = useUpdateCoopPlatformFees();
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<CoopPlatformFeesFormValues>({
    resolver: zodResolver(coopPlatformFeesSchema),
    defaultValues: {
      savingsChargeType: fees.savingsChargeType,
      savingsChargeAmount: fees.savingsChargeAmount,
      loansChargeType: fees.loansChargeType,
      loansChargeAmount: fees.loansChargeAmount,
      withdrawalFeeType: fees.withdrawalFeeType,
      withdrawalFeeAmount: fees.withdrawalFeeAmount,
      loanApplicationFeePercent: fees.loanApplicationFeePercent,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await update.mutateAsync({ cooperativeId: fees.cooperativeId, values });
      toast.success(`Fees saved for ${fees.cooperativeName}`);
      onDone();
    } catch (error) {
      toast.error("Couldn't save the fees", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const rowsConfig = [
    {
      label: "Savings charge",
      hint: "Taken from every savings deposit",
      type: "savingsChargeType",
      amount: "savingsChargeAmount",
    },
    {
      label: "Loan charge",
      hint: "Taken from every loan paid out",
      type: "loansChargeType",
      amount: "loansChargeAmount",
    },
    {
      label: "Withdrawal fee",
      hint: "Taken from every savings withdrawal",
      type: "withdrawalFeeType",
      amount: "withdrawalFeeAmount",
    },
  ] as const;

  return (
    <form onSubmit={onSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>{fees.cooperativeName}</DialogTitle>
        <DialogDescription>
          The platform&apos;s fees from this co-operative only. New charges use
          these from now on; past ones are not changed.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        {rowsConfig.map((row) => (
          <FeeRow
            key={row.type}
            label={row.label}
            hint={row.hint}
            typeField={
              <Controller
                control={control}
                name={row.type}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as (typeof CHARGE_TYPES)[number])
                    }
                  >
                    <SelectTrigger
                      className="h-11 w-36"
                      aria-label={`${row.label} type`}
                    >
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
            }
            amountLabel={watch(row.type) === "Fixed" ? "Amount (₦)" : "Percent"}
            amountInput={
              <Input
                type="number"
                inputMode="decimal"
                className="h-11 w-28"
                aria-label={`${row.label} amount`}
                aria-invalid={!!errors[row.amount]}
                {...register(row.amount, { valueAsNumber: true })}
              />
            }
            error={errors[row.amount]?.message}
          />
        ))}
        <FeeRow
          label="Loan application fee"
          hint="The platform's share of each application fee members pay"
          amountLabel="Percent"
          amountInput={
            <Input
              type="number"
              inputMode="decimal"
              className="h-11 w-28"
              aria-label="Loan application fee percent"
              aria-invalid={!!errors.loanApplicationFeePercent}
              {...register("loanApplicationFeePercent", {
                valueAsNumber: true,
              })}
            />
          }
          error={errors.loanApplicationFeePercent?.message}
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          disabled={update.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={update.isPending || !isDirty}>
          {update.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Save fees"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function FeeRow({
  label,
  hint,
  typeField,
  amountLabel,
  amountInput,
  error,
}: {
  label: string;
  hint: string;
  typeField?: React.ReactNode;
  amountLabel: string;
  amountInput: React.ReactNode;
  error?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-2 border-b border-border pb-5 last:border-0 last:pb-0">
      <div>
        <p id={id} className="text-sm font-medium text-foreground">
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex flex-wrap items-end gap-3" aria-labelledby={id}>
        {typeField ? (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Type</Label>
            {typeField}
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{amountLabel}</Label>
          {amountInput}
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
