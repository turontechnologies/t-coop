"use client";

import { useId, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
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
import { SAVINGS_TYPES } from "@/lib/savings-data";

interface AddSavingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy: boolean;
  onProceed: (savingsType: string, amount: number) => void;
}

export function AddSavingsModal({
  open,
  onOpenChange,
  busy,
  onProceed,
}: AddSavingsModalProps) {
  const typeId = useId();
  const amountId = useId();
  const [savingsType, setSavingsType] = useState("");
  const [amount, setAmount] = useState("");

  const selectedType = SAVINGS_TYPES.find((type) => type.name === savingsType);
  const amountNumber = Number(amount);
  const isValid =
    !!selectedType &&
    amountNumber > 0 &&
    amountNumber >= selectedType.min &&
    amountNumber <= selectedType.max;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSavingsType("");
      setAmount("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Savings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={typeId}>Savings Type</Label>
            <div className="relative">
              <select
                id={typeId}
                value={savingsType}
                onChange={(event) => setSavingsType(event.target.value)}
                disabled={busy}
                className="h-11 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 pr-8 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30"
              >
                <option value="" disabled>
                  Select
                </option>
                {SAVINGS_TYPES.map((type) => (
                  <option key={type.name} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            {selectedType ? (
              <p className="text-xs text-muted-foreground">
                Save between ₦{selectedType.min.toLocaleString()} and ₦
                {selectedType.max.toLocaleString()}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={amountId}>Amount to save</Label>
            <Input
              id={amountId}
              type="number"
              inputMode="numeric"
              placeholder="Enter amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={busy}
              className="h-11"
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
            onClick={() => onProceed(savingsType, amountNumber)}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Processing…
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
