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
import type { BillingCycle } from "@/types/subscription";

const BILLING_CYCLES: BillingCycle[] = [
  "Weekly",
  "Monthly",
  "Quarterly",
  "Yearly",
];

export interface ManualSubscriptionPaymentPayload {
  coopId: string;
  amountPaid: number;
  cycle: BillingCycle;
}

interface CooperativeOption {
  id: string;
  name: string;
}

interface ManualSubscriptionPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to show a co-op picker (list page); pass to lock it (detail page). */
  coop?: CooperativeOption;
  cooperatives?: CooperativeOption[];
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
  const cycleId = useId();

  const [coopId, setCoopId] = useState(coop?.id ?? "");
  const [amount, setAmount] = useState("");
  const [cycle, setCycle] = useState<BillingCycle>("Yearly");

  const amountNumber = Number(amount);
  const isValid = !!coopId && amountNumber > 0;

  const reset = () => {
    setCoopId(coop?.id ?? "");
    setAmount("");
    setCycle("Yearly");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleUpload = () => {
    onUpload({ coopId, amountPaid: amountNumber, cycle });
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
            <Label htmlFor={cycleId}>Billing Cycle</Label>
            <Select
              value={cycle}
              onValueChange={(value) =>
                setCycle((value ?? "Yearly") as BillingCycle)
              }
              disabled={busy}
            >
              <SelectTrigger id={cycleId} className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BILLING_CYCLES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Whether this counts as a new subscription or a renewal is worked
              out automatically from the co-op&apos;s payment history.
            </p>
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
