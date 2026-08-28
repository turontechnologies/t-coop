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
import { activeSavingsTypeDefs } from "@/lib/admin-settings-data";
import { TOTAL_SAVINGS_WITHDRAWAL } from "@/lib/coop-data";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatMoney } from "@/lib/format";
import type { SavingsRecord } from "@/lib/savings-data";
import { useAdminSettingsStore } from "@/store/admin-settings.store";
import { useSettingsStore } from "@/store/settings.store";
import { cn } from "@/lib/utils";

export interface WithdrawalPayload {
  savingsType: string;
  amount: number;
  note: string;
  feePercent: number;
  feeAmount: number;
  netAmount: number;
}

interface RequestWithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  memberRecords: SavingsRecord[];
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
  busy,
  memberRecords,
  onProceed,
}: RequestWithdrawalModalProps) {
  const typeId = useId();
  const amountId = useId();
  const noteId = useId();
  const currency = useCurrency();
  const [savingsType, setSavingsType] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const savingsTypeSettings = useAdminSettingsStore(
    (state) => state.savingsTypeSettings,
  );
  const savingsTypes = useMemo(
    () => activeSavingsTypeDefs(savingsTypeSettings),
    [savingsTypeSettings],
  );

  const coopFeeType = useAdminSettingsStore((state) => state.withdrawalFeeType);
  const coopFeeAmount = useAdminSettingsStore(
    (state) => state.withdrawalFeeAmount,
  );
  const platformFeeType = useSettingsStore(
    (state) => state.feeSettings.withdrawalFeeType,
  );
  const platformFeeAmount = useSettingsStore(
    (state) => state.feeSettings.withdrawalFeeAmount,
  );

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

  const availableBalance =
    savingsType === TOTAL_SAVINGS_WITHDRAWAL
      ? totalBalance
      : (balanceByType.get(savingsType) ?? 0);

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
    !!savingsType &&
    amountNumber > 0 &&
    amountNumber <= availableBalance &&
    availableBalance > 0;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSavingsType("");
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
              value={savingsType}
              onValueChange={(value) => {
                setSavingsType(value ?? "");
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
                  <SelectItem key={type.name} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {savingsType ? (
              <p className="text-xs text-muted-foreground">
                Available balance:{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(availableBalance, currency)}
                </span>
              </p>
            ) : null}
          </div>

          {savingsType ? (
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
              disabled={busy || !savingsType}
              className="h-11"
            />
            {savingsType && amountNumber > availableBalance ? (
              <p className="text-xs text-destructive">
                Amount exceeds your available balance of{" "}
                {formatMoney(availableBalance, currency)}
              </p>
            ) : null}
          </div>

          {savingsType && amountNumber > 0 ? (
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
                savingsType,
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
