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
import { SAVINGS_TYPES } from "@/lib/savings-data";
import { formatNaira } from "@/lib/format";
import type { SavingsRecord } from "@/lib/savings-data";

interface RequestWithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  memberRecords: SavingsRecord[];
  onProceed: (savingsType: string, amount: number, note: string) => void;
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
  const [savingsType, setSavingsType] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

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

  const availableBalance = balanceByType.get(savingsType) ?? 0;
  const amountNumber = Number(amount);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Withdrawal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={typeId}>Savings Type</Label>
            <Select
              value={savingsType}
              onValueChange={(value) => setSavingsType(value ?? "")}
              disabled={busy}
            >
              <SelectTrigger id={typeId} className="h-11 w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {SAVINGS_TYPES.map((type) => (
                  <SelectItem key={type.name} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {savingsType ? (
              <p className="text-xs text-muted-foreground">
                Available balance: {formatNaira(availableBalance)}
              </p>
            ) : null}
          </div>

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
                {formatNaira(availableBalance)}
              </p>
            ) : null}
          </div>

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
            onClick={() => onProceed(savingsType, amountNumber, note.trim())}
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
