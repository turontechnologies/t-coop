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
import {
  GUARANTORS,
  LOAN_TYPES,
  computeEligibleAmount,
  computeLoanTerms,
  findLoanType,
} from "@/lib/loans-data";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TakeLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  memberName: string;
  totalSavings: number;
  onProceed: (loanType: string, amount: number, guarantorName: string) => void;
}

export function TakeLoanModal({
  open,
  onOpenChange,
  busy,
  memberName,
  totalSavings,
  onProceed,
}: TakeLoanModalProps) {
  const typeId = useId();
  const amountId = useId();
  const guarantorId = useId();
  const [loanType, setLoanType] = useState("");
  const [amount, setAmount] = useState("");
  const [guarantorName, setGuarantorName] = useState("");

  const selectedType = findLoanType(loanType);
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

  const guarantorOptions = GUARANTORS.filter((name) => name !== memberName);

  const isValid =
    !!selectedType &&
    !!guarantorName &&
    amountNumber > 0 &&
    amountNumber <= eligibleAmount;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setLoanType("");
      setAmount("");
      setGuarantorName("");
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
              value={loanType}
              onValueChange={(value) => setLoanType(value ?? "")}
              disabled={busy}
            >
              <SelectTrigger id={typeId} className="h-11 w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {LOAN_TYPES.map((type) => (
                  <SelectItem key={type.name} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType ? (
              <p className="text-xs text-muted-foreground">
                Eligible amount: {formatNaira(eligibleAmount)} ·{" "}
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
                {formatNaira(eligibleAmount)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={guarantorId}>Guarantor</Label>
            <Select
              value={guarantorName}
              onValueChange={(value) => setGuarantorName(value ?? "")}
              disabled={busy}
            >
              <SelectTrigger id={guarantorId} className="h-11 w-full">
                <SelectValue placeholder="Select a guarantor" />
              </SelectTrigger>
              <SelectContent>
                {guarantorOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
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
                  {loanType}
                </dd>
                <dt className="text-muted-foreground">Duration</dt>
                <dd className="text-right font-medium text-foreground">
                  {terms.durationMonths} months
                </dd>
                <dt className="text-muted-foreground">Loan Amount</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatNaira(amountNumber)}
                </dd>
                <dt className="text-muted-foreground">Total Repayment</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatNaira(terms.totalRepayment)}
                </dd>
                <dt className="text-muted-foreground">Monthly Repayment</dt>
                <dd className="text-right font-medium text-foreground">
                  {formatNaira(terms.monthlyRepayment)}
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
              onProceed(loanType, amountNumber, guarantorName);
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
