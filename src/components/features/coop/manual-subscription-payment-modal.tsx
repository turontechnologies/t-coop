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
import type { Cooperative } from "@/lib/coop-data";

export interface ManualSubscriptionPaymentPayload {
  coopId: string;
  amountPaid: number;
  narration: string;
}

interface ManualSubscriptionPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to show a co-op picker (top-level page); pass to lock it (detail page). */
  coop?: Cooperative;
  cooperatives?: Cooperative[];
  busy: boolean;
  onUpload: (payload: ManualSubscriptionPaymentPayload) => void;
}

export function ManualSubscriptionPaymentModal({
  open,
  onOpenChange,
  coop,
  cooperatives = [],
  busy,
  onUpload,
}: ManualSubscriptionPaymentModalProps) {
  const coopId_ = useId();
  const amountId = useId();
  const narrationId = useId();

  const [coopId, setCoopId] = useState(coop?.id ?? "");
  const [amount, setAmount] = useState("");
  const [narration, setNarration] = useState("Renewal");

  const amountNumber = Number(amount);
  const isValid = !!coopId && amountNumber > 0;

  const reset = () => {
    setCoopId(coop?.id ?? "");
    setAmount("");
    setNarration("Renewal");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleUpload = () => {
    onUpload({ coopId, amountPaid: amountNumber, narration });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual Upload</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {coop ? null : (
            <div className="space-y-2">
              <Label htmlFor={coopId_}>Co-operative</Label>
              <Select
                value={coopId}
                onValueChange={(value) => setCoopId(value ?? "")}
                disabled={busy}
              >
                <SelectTrigger id={coopId_} className="h-11 w-full">
                  <SelectValue placeholder="Select co-operative" />
                </SelectTrigger>
                <SelectContent>
                  {cooperatives.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={amountId}>Amount Paid</Label>
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

          <div className="space-y-2">
            <Label htmlFor={narrationId}>Narration</Label>
            <Input
              id={narrationId}
              placeholder="e.g. Renewal"
              value={narration}
              onChange={(event) => setNarration(event.target.value)}
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
            onClick={handleUpload}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Uploading…
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
