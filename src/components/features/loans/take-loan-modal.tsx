"use client";

import { useId, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { computeEligibleAmount, computeLoanTerms } from "@/lib/loans-data";
import { coopMemberFullName, type CoopMember } from "@/lib/coop-data";
import { useCoopLoanTypes } from "@/hooks/use-coop-loans";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TakeLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coopId: string | undefined;
  busy: boolean;
  memberId: string;
  members: CoopMember[];
  totalSavings: number;
  onProceed: (
    loanTypeId: string,
    amount: number,
    guarantorMemberId: string,
  ) => void;
}

export function TakeLoanModal({
  open,
  onOpenChange,
  coopId,
  busy,
  memberId,
  members,
  totalSavings,
  onProceed,
}: TakeLoanModalProps) {
  const typeId = useId();
  const amountId = useId();
  const guarantorId = useId();
  const currency = useCurrency();
  const [loanTypeId, setLoanTypeId] = useState("");
  const [amount, setAmount] = useState("");
  const [guarantorMemberId, setGuarantorMemberId] = useState("");

  const { data: types } = useCoopLoanTypes(coopId);
  const loanTypes = useMemo(
    () => (types ?? []).filter((type) => type.status === "Active"),
    [types],
  );
  const selectedType = loanTypes.find((type) => type.id === loanTypeId);
  const eligibleAmount = selectedType
    ? computeEligibleAmount(totalSavings, selectedType)
    : 0;
  const amountNumber = Number(amount);
  const terms = useMemo(
    () =>
      selectedType && amountNumber > 0
        ? computeLoanTerms(selectedType, amountNumber)
        : null,
    [selectedType, amountNumber],
  );

  const guarantorOptions = members.filter((member) => member.id !== memberId);

  const isValid =
    !!selectedType &&
    !!guarantorMemberId &&
    amountNumber > 0 &&
    amountNumber <= eligibleAmount;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setLoanTypeId("");
      setAmount("");
      setGuarantorMemberId("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Take a Loan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={typeId}>Loan Type</Label>
            <Select
              value={loanTypeId}
              onValueChange={(value) => setLoanTypeId(value ?? "")}
              disabled={busy}
            >
              <SelectTrigger id={typeId} className="h-11 w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {loanTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType ? (
              <p className="text-xs text-muted-foreground">
                Eligible amount: {formatMoney(eligibleAmount, currency)} ·{" "}
                {selectedType.interestRate}% interest over{" "}
                {selectedType.durationMonths} months
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={amountId}>Loan Amount</Label>
            <Input
              id={amountId}
              type="number"
              inputMode="numeric"
              placeholder="Enter amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={busy || !selectedType}
              className="h-11"
            />
            {selectedType && amountNumber > eligibleAmount ? (
              <p className="text-xs text-destructive">
                Amount exceeds your eligible amount of{" "}
                {formatMoney(eligibleAmount, currency)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={guarantorId}>Guarantor</Label>
            <Select
              value={guarantorMemberId}
              onValueChange={(value) => setGuarantorMemberId(value ?? "")}
              disabled={busy}
            >
              <SelectTrigger id={guarantorId} className="h-11 w-full">
                <SelectValue placeholder="Select a guarantor" />
              </SelectTrigger>
              <SelectContent>
                {guarantorOptions.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {coopMemberFullName(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {terms ? (
            <div className="space-y-2 rounded-xl bg-accent/60 p-4">
              <p className="text-sm font-semibold text-foreground">
                Loan Details
              </p>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Loan Type</dt>
                <dd className="text-right font-medium text-foreground">
                  {selectedType?.name}
                </dd>
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="text-right font-medium text-foreground">
                  {terms.durationMonths} months
                </dd>
                <dt className="text-muted-foreground">Loan Amount</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatMoney(amountNumber, currency)}
                </dd>
                <dt className="text-muted-foreground">Total Repayment</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatMoney(terms.totalRepayment, currency)}
                </dd>
                <dt className="text-muted-foreground">Monthly Repayment</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatMoney(terms.monthlyRepayment, currency)}
                </dd>
              </dl>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            aria-disabled={busy}
            className={cn(busy && "pointer-events-none opacity-50")}
            onClick={() => {
              if (busy) return;
              handleOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!isValid}
            aria-disabled={busy}
            className={cn(busy && "pointer-events-none opacity-50")}
            onClick={() => {
              if (busy) return;
              onProceed(loanTypeId, amountNumber, guarantorMemberId);
            }}
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
