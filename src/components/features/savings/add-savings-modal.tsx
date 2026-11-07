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
import { useCoopSavingsTypes } from "@/hooks/use-coop-savings";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatMoney } from "@/lib/format";

interface AddSavingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coopId: string | undefined;
  busy: boolean;
  onProceed: (savingsTypeId: string, amount: number) => void;
}

export function AddSavingsModal({
  open,
  onOpenChange,
  coopId,
  busy,
  onProceed,
}: AddSavingsModalProps) {
  const typeId = useId();
  const amountId = useId();
  const [savingsTypeId, setSavingsTypeId] = useState("");
  const [amount, setAmount] = useState("");
  const currency = useCurrency();

  const {
    data: types,
    isLoading: isLoadingTypes,
    isFetching: isFetchingTypes,
    isError: hasTypesError,
    error: typesError,
    refetch: refetchTypes,
  } = useCoopSavingsTypes(coopId, open);
  const savingsTypes = useMemo(
    () => (types ?? []).filter((type) => type.status === "Active"),
    [types],
  );
  const selectedType = savingsTypes.find((type) => type.id === savingsTypeId);
  const amountNumber = Number(amount);
  const isValid =
    !!selectedType &&
    amountNumber > 0 &&
    amountNumber >= selectedType.min &&
    amountNumber <= selectedType.max;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSavingsTypeId("");
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
              value={savingsTypeId}
              onValueChange={(value) => setSavingsTypeId(value ?? "")}
              disabled={busy}
            >
              <SelectTrigger id={typeId} className="h-11 w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {savingsTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType ? (
              <p className="text-xs text-muted-foreground">
                Save between {formatMoney(selectedType.min, currency)} and{" "}
                {formatMoney(selectedType.max, currency)}
              </p>
            ) : null}
            {isLoadingTypes || isFetchingTypes ? (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                Loading savings types…
              </p>
            ) : hasTypesError ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-destructive" role="alert">
                  {typesError instanceof Error
                    ? typesError.message
                    : "Couldn't load savings types."}
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
            ) : savingsTypes.length === 0 ? (
              <p className="text-xs text-muted-foreground" role="status">
                No active savings types are available. Ask your co-op admin to
                activate or add one.
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
            onClick={() => onProceed(savingsTypeId, amountNumber)}
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
