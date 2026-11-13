"use client";

import { useId, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  computeEligibleAmount,
  describeInterest,
  type LoanMode,
} from "@/lib/loans-data";
import { coopMemberFullName, type CoopMember } from "@/lib/coop-data";
import { useCoopLoanTypes } from "@/hooks/use-coop-loans";
import { useLoanEligibility, useLoanSettings } from "@/hooks/use-loans-self";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GuarantorMultiSelect } from "@/components/features/loans/guarantor-multi-select";
import { TermsPreview } from "@/components/features/loans/loan-request-panels";
import type { LoanFeeCredit } from "@/services/loan-fee.service";

interface TakeLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coopId: string | undefined;
  busy: boolean;
  memberId: string;
  members: CoopMember[];
  totalSavings: number;
  /** The application fee paid for this application, when the co-op charges one. */
  feeCredit?: LoanFeeCredit | null;
  onProceed: (application: {
    loanTypeId: string;
    amount: number;
    loanMode: LoanMode;
    durationMonths: number;
    guarantorMemberIds?: string[];
  }) => void;
}

const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;
const digits = (value: string) => Number(value.replace(/[^\d.]/g, "")) || 0;

export function TakeLoanModal({
  open,
  onOpenChange,
  coopId,
  busy,
  memberId,
  members,
  totalSavings,
  feeCredit,
  onProceed,
}: TakeLoanModalProps) {
  const typeId = useId();
  const amountId = useId();
  const monthsId = useId();
  const guarantorId = useId();
  const currency = useCurrency();
  const [loanMode, setLoanMode] = useState<LoanMode>("TimesTwo");
  const [loanTypeId, setLoanTypeId] = useState("");
  const [amountText, setAmountText] = useState("");
  const [monthsText, setMonthsText] = useState("");
  const [guarantorMemberIds, setGuarantorMemberIds] = useState<string[]>([]);

  const { data: settings } = useLoanSettings(open ? coopId : undefined);
  const rules = {
    savingsMultiplier: settings?.savingsMultiplier ?? 2,
    withinPercent: settings?.withinPercent ?? 100,
  };
  const minAmount = settings?.minAmount ?? 0;
  const minGuarantors = settings?.minGuarantors ?? 2;

  const {
    data: types,
    isLoading: isLoadingTypes,
    isFetching: isFetchingTypes,
    isError: hasTypesError,
    error: typesError,
    refetch: refetchTypes,
  } = useCoopLoanTypes(coopId, open);
  const loanTypes = useMemo(
    () => (types ?? []).filter((type) => type.status === "Active"),
    [types],
  );
  const selectedType = loanTypes.find((type) => type.id === loanTypeId);
  const maxMonths = selectedType?.durationMonths ?? 0;
  // The backend's numbers, so the form, the dashboard and the application check agree:
  // co-op rules, minus what's already tied up in current loans, capped by the type.
  const { data: eligibility } = useLoanEligibility(open ? coopId : undefined);
  const typeLimit = eligibility?.perType.find(
    (t) => t.loanTypeId === loanTypeId,
  );
  const eligibleAmount = selectedType
    ? typeLimit
      ? loanMode === "Within"
        ? typeLimit.within
        : typeLimit.timesTwo
      : computeEligibleAmount(totalSavings, selectedType, loanMode, rules)
    : 0;
  const blockedReason = eligibility?.problem || null;
  const amount = digits(amountText);
  const months = Number(monthsText) || 0;

  const needsGuarantor = loanMode === "TimesTwo" && minGuarantors > 0;
  // Anyone active in this co-op, a member or the admin, can stand as guarantor, except the
  // borrower themselves (the backend enforces it too).
  const guarantorOptions = members
    .filter((member) => member.id !== memberId && member.status === "Active")
    .map((member) => ({
      id: member.id,
      name: coopMemberFullName(member),
      tag: member.role === "Admin" ? "Admin" : undefined,
    }));

  const amountError =
    !selectedType || !amountText
      ? null
      : amount > eligibleAmount
        ? `That's more than you can borrow. The most is ${formatMoney(eligibleAmount, currency)}.`
        : minAmount > 0 && amount < minAmount
          ? `The smallest loan is ${formatMoney(minAmount, currency)}.`
          : null;
  const monthsError =
    !selectedType || !monthsText
      ? null
      : months < 1 || !Number.isInteger(months)
        ? "Enter a whole number of months."
        : months > maxMonths
          ? `The longest period for ${selectedType.name} is ${plural(maxMonths, "month")}.`
          : null;

  const isValid =
    !blockedReason &&
    !!selectedType &&
    amount > 0 &&
    !amountError &&
    months > 0 &&
    !monthsError &&
    (!needsGuarantor || guarantorMemberIds.length >= minGuarantors);

  const reset = () => {
    setLoanMode("TimesTwo");
    setLoanTypeId("");
    setAmountText("");
    setMonthsText("");
    setGuarantorMemberIds([]);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const modes: { value: LoanMode; title: string; body: string }[] = [
    {
      value: "TimesTwo",
      title: "Times two",
      body: `Borrow up to ${rules.savingsMultiplier}× your savings (${formatMoney(totalSavings, currency)} saved → up to ${formatMoney(totalSavings * rules.savingsMultiplier, currency)}).${minGuarantors > 0 ? ` Needs at least ${plural(minGuarantors, "guarantor")}.` : ""}`,
    },
    {
      value: "Within",
      title: "Within",
      body: `Borrow from your own savings, up to ${rules.withinPercent === 100 ? "what you've saved" : `${rules.withinPercent}% of it`}. No guarantor. It comes out of your savings, and your repayments go back into them.`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Take a Loan</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {blockedReason ? (
            <p className="rounded-xl bg-destructive/10 px-3.5 py-3 text-sm font-medium text-destructive">
              {blockedReason}
            </p>
          ) : null}

          {feeCredit ? (
            <p className="flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Application fee paid
              <span className="font-medium text-muted-foreground">
                · {formatMoney(feeCredit.amount, currency)} · Ref{" "}
                {feeCredit.reference}
              </span>
            </p>
          ) : null}

          <div className="space-y-2">
            <Label className="text-[0.95rem] text-foreground">
              How are you borrowing?
            </Label>
            <div
              className="grid gap-2.5"
              role="radiogroup"
              aria-label="How are you borrowing?"
            >
              {modes.map((mode) => {
                const checked = loanMode === mode.value;
                return (
                  <label
                    key={mode.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3.5 rounded-2xl border px-4 py-3.5 transition-colors",
                      checked
                        ? "border-primary/60 bg-primary/5"
                        : "border-border hover:border-foreground/20",
                    )}
                  >
                    <input
                      type="radio"
                      name="loan-mode"
                      className="mt-1 size-4 accent-[var(--primary)]"
                      checked={checked}
                      disabled={busy}
                      onChange={() => setLoanMode(mode.value)}
                    />
                    <span>
                      <span className="block font-bold text-foreground">
                        {mode.title}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                        {mode.body}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={typeId}>Loan Type</Label>
            <Select
              value={loanTypeId}
              items={loanTypes.map((type) => ({
                value: type.id,
                label: type.name,
              }))}
              onValueChange={(value) => {
                setLoanTypeId(value ?? "");
                const type = loanTypes.find((t) => t.id === value);
                if (type && !monthsText)
                  setMonthsText(String(type.durationMonths));
              }}
              disabled={busy}
            >
              <SelectTrigger id={typeId} className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {loanTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} · up to {type.durationMonths} months ·{" "}
                    {describeInterest(type, (value) =>
                      formatMoney(value, currency),
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingTypes || isFetchingTypes ? (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                Loading loan types…
              </p>
            ) : hasTypesError ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-destructive" role="alert">
                  {typesError instanceof Error
                    ? typesError.message
                    : "Couldn't load loan types."}
                </p>
                <button
                  type="button"
                  className="shrink-0 text-xs font-medium text-primary underline underline-offset-4 disabled:opacity-50"
                  onClick={() => void refetchTypes()}
                  disabled={isFetchingTypes}
                >
                  {isFetchingTypes ? "Retrying…" : "Retry"}
                </button>
              </div>
            ) : loanTypes.length === 0 ? (
              <p className="text-xs text-muted-foreground" role="status">
                No active loan types are available. Ask your co-op admin to
                activate or add one.
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor={amountId}>Loan Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-semibold text-muted-foreground">
                  ₦
                </span>
                <Input
                  id={amountId}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Enter amount"
                  value={amountText}
                  aria-invalid={!!amountError}
                  onChange={(event) => setAmountText(event.target.value)}
                  onBlur={() =>
                    amount && setAmountText(amount.toLocaleString("en-NG"))
                  }
                  disabled={busy || !selectedType}
                  className="pl-8"
                />
              </div>
              {amountError ? (
                <p className="text-sm font-medium text-destructive">
                  {amountError}
                </p>
              ) : selectedType ? (
                <p className="text-xs text-muted-foreground">
                  You can borrow up to {formatMoney(eligibleAmount, currency)}
                  {eligibility &&
                  (loanMode === "Within"
                    ? eligibility.tiedWithin
                    : eligibility.tiedTimesTwo) > 0
                    ? ` (after ${formatMoney(loanMode === "Within" ? eligibility.tiedWithin : eligibility.tiedTimesTwo, currency)} in your current loans)`
                    : ""}
                  {minAmount > 0
                    ? ` · at least ${formatMoney(minAmount, currency)}`
                    : ""}
                  .
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={monthsId}>Repay over</Label>
              <div className="relative">
                <Input
                  id={monthsId}
                  type="number"
                  min={1}
                  max={maxMonths || undefined}
                  step={1}
                  inputMode="numeric"
                  placeholder="Months"
                  value={monthsText}
                  aria-invalid={!!monthsError}
                  onChange={(event) => setMonthsText(event.target.value)}
                  disabled={busy || !selectedType}
                  className="pr-20"
                />
                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">
                  months
                </span>
              </div>
              {monthsError ? (
                <p className="text-sm font-medium text-destructive">
                  {monthsError}
                </p>
              ) : selectedType ? (
                <p className="text-xs text-muted-foreground">
                  Up to {plural(maxMonths, "month")}.
                </p>
              ) : null}
            </div>
          </div>

          {isValid ||
          (selectedType &&
            amount > 0 &&
            !amountError &&
            months > 0 &&
            !monthsError) ? (
            <TermsPreview
              amount={amount}
              months={months}
              loanType={selectedType}
              currency={currency}
            />
          ) : null}

          {needsGuarantor ? (
            <div className="space-y-2">
              <Label htmlFor={guarantorId}>Guarantors</Label>
              <GuarantorMultiSelect
                id={guarantorId}
                options={guarantorOptions}
                value={guarantorMemberIds}
                onChange={setGuarantorMemberIds}
                min={minGuarantors}
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">
                {guarantorMemberIds.length < minGuarantors
                  ? `Pick ${minGuarantors - guarantorMemberIds.length} more. Each guarantor is asked to accept.`
                  : "Each guarantor is asked to accept before the loan goes to the loan committee."}
              </p>
            </div>
          ) : null}

          {loanMode === "Within" && amount > 0 && !amountError ? (
            <p className="text-xs text-muted-foreground">
              {formatMoney(amount, currency)} comes out of your savings when the
              loan is paid out, and the principal part of each repayment goes
              back into them.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!isValid || busy}
            onClick={() =>
              onProceed({
                loanTypeId,
                amount,
                loanMode,
                durationMonths: months,
                guarantorMemberIds: needsGuarantor
                  ? guarantorMemberIds
                  : undefined,
              })
            }
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              "Proceed"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
