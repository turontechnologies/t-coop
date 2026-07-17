"use client";

import { useId, useState } from "react";
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
