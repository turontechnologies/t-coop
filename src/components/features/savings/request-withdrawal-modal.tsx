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
import { Textarea } from "@/components/ui/textarea";
import {
  TOTAL_SAVINGS_WITHDRAWAL,
  type CoopSavingsRecord,
} from "@/lib/coop-data";
import { useCooperative } from "@/hooks/use-cooperative";
import { useCoopSavingsTypes } from "@/hooks/use-coop-savings";
import { useWithdrawalFeeSettings } from "@/hooks/use-withdrawal-fee";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface WithdrawalPayload {
  savingsTypeId: string | undefined;
  savingsTypeName: string;
  amount: number;
  note: string;
  feePercent: number;
  feeAmount: number;
  netAmount: number;
}

interface RequestWithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coopId: string | undefined;
  busy: boolean;
  memberRecords: CoopSavingsRecord[];
  onProceed: (payload: WithdrawalPayload) => void;
}

const PERCENT_OPTIONS = [5, 10, 25, 50, 75, 100];

function feeFor(
  type: "Fixed" | "Percentage",
  amount: number,
  withdrawalAmount: number,
): number {
  return type === "Fixed" ? amount : withdrawalAmount * (amount / 100);
}

function formatFee(
  type: "Fixed" | "Percentage",
  amount: number,
  currency: string,
): string {
  return type === "Fixed" ? formatMoney(amount, currency) : `${amount}%`;
}

export function RequestWithdrawalModal({
  open,
  onOpenChange,
  coopId,
  busy,
  memberRecords,
  onProceed,
}: RequestWithdrawalModalProps) {
  const typeId = useId();
  const amountId = useId();
  const noteId = useId();
  const currency = useCurrency();
  const [savingsSelection, setSavingsSelection] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const { data: types } = useCoopSavingsTypes(coopId);
  const savingsTypes = useMemo(
    () => (types ?? []).filter((type) => type.status === "Active"),
    [types],
  );
  const selectedType = savingsTypes.find(
    (type) => type.id === savingsSelection,
  );
  const isTotalSelection = savingsSelection === TOTAL_SAVINGS_WITHDRAWAL;

  const { data: coop } = useCooperative(coopId);
  const coopFeeType = coop?.withdrawalFeeType ?? "Percentage";
  const coopFeeAmount = coop?.withdrawalFeeAmount ?? 0;
  const { data: platformFee } = useWithdrawalFeeSettings();
  const platformFeeType = platformFee?.withdrawalFeeType ?? "Percentage";
  const platformFeeAmount = platformFee?.withdrawalFeeAmount ?? 0;

  const balanceByType = useMemo(() => {
    const balances = new Map<string, number>();
    for (const record of memberRecords) {
      balances.set(
        record.savingsType,
        (balances.get(record.savingsType) ?? 0) + record.amount,
      );
    }
    return balances;
  }, [memberRecords]);

  const totalBalance = useMemo(
    () => memberRecords.reduce((sum, record) => sum + record.amount, 0),
    [memberRecords],
  );

  const availableBalance = isTotalSelection
    ? totalBalance
    : (balanceByType.get(selectedType?.name ?? "") ?? 0);

  const amountNumber = Number(amount);
  const coopFeeValue =
    amountNumber > 0 ? feeFor(coopFeeType, coopFeeAmount, amountNumber) : 0;
  const platformFeeValue =
    amountNumber > 0
      ? feeFor(platformFeeType, platformFeeAmount, amountNumber)
      : 0;
  const feeAmount = coopFeeValue + platformFeeValue;
  const netAmount = amountNumber - feeAmount;

  const isValid =
    !!savingsSelection &&
    amountNumber > 0 &&
    amountNumber <= availableBalance &&
    availableBalance > 0;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSavingsSelection("");
      setAmount("");
      setNote("");
    }
    onOpenChange(next);
  };

  const applyPercent = (percent: number) => {
    if (availableBalance <= 0) return;
    const value = Math.floor(availableBalance * (percent / 100));
    setAmount(String(value));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={typeId}>Withdraw from</Label>
            <Select
              value={savingsSelection}
              onValueChange={(value) => {
                setSavingsSelection(value ?? "");
                setAmount("");
              }}
              disabled={busy}
            >
              <SelectTrigger id={typeId} className="h-11 w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TOTAL_SAVINGS_WITHDRAWAL}>
                  Total Savings (all types)
                </SelectItem>
                {savingsTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {savingsSelection ? (
              <p className="text-xs text-muted-foreground">
                Available balance:{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(availableBalance, currency)}
                </span>
              </p>
            ) : null}
          </div>

          {savingsSelection ? (
            <div className="space-y-2">
              <Label>Quick amount</Label>
              <div className="flex flex-wrap gap-1.5">
                {PERCENT_OPTIONS.map((percent) => (
                  <button
                    key={percent}
                    type="button"
                    disabled={busy || availableBalance <= 0}
                    onClick={() => applyPercent(percent)}
                    className={cn(
                      "rounded-md border border-input px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50",
                      amountNumber ===
                        Math.floor(availableBalance * (percent / 100)) &&
                        amountNumber > 0 &&
                        "border-primary bg-primary/10 text-primary",
                    )}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={amountId}>Amount to withdraw</Label>
            <Input
              id={amountId}
              type="number"
              inputMode="numeric"
              placeholder="Enter amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={busy || !savingsSelection}
              className="h-11"
            />
            {savingsSelection && amountNumber > availableBalance ? (
              <p className="text-xs text-destructive">
                Amount exceeds your available balance of{" "}
                {formatMoney(availableBalance, currency)}
              </p>
            ) : null}
          </div>

          {savingsSelection && amountNumber > 0 ? (
            <div className="space-y-1.5 rounded-lg bg-accent/60 p-3 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Withdrawal amount</span>
                <span className="text-foreground">
                  {formatMoney(amountNumber, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>
                  Withdrawal fee — co-op{" "}
                  {formatFee(coopFeeType, coopFeeAmount, currency)} + platform{" "}
                  {formatFee(platformFeeType, platformFeeAmount, currency)}
                </span>
                <span className="text-destructive">
                  -{formatMoney(feeAmount, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-1.5 font-semibold text-foreground">
                <span>You&apos;ll receive</span>
                <span>{formatMoney(netAmount, currency)}</span>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={noteId}>Note (optional)</Label>
            <Textarea
              id={noteId}
              rows={2}
              placeholder="What's this withdrawal for?"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!isValid || busy}
            onClick={() =>
              onProceed({
                savingsTypeId: isTotalSelection ? undefined : selectedType?.id,
                savingsTypeName: isTotalSelection
                  ? TOTAL_SAVINGS_WITHDRAWAL
                  : (selectedType?.name ?? ""),
                amount: amountNumber,
                note: note.trim(),
                // The effective percentage this fee worked out to — downstream displays
                // ("X% fee") don't distinguish Fixed vs Percentage, only the resulting rate.
                feePercent:
                  amountNumber > 0 ? (feeAmount / amountNumber) * 100 : 0,
                feeAmount,
                netAmount,
              })
            }
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              "Submit Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
