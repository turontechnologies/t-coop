"use client";

import { useEffect, useId, useState } from "react";
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
import { useSubscriptionPlans } from "@/hooks/use-subscription-plans";
import { formatNaira } from "@/lib/format";

export interface ManualSubscriptionPaymentPayload {
  coopId: string;
  amountPaid: number;
  planId: string;
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
  const planId_ = useId();
  const plansQuery = useSubscriptionPlans();
  const activePlans = (plansQuery.data ?? []).filter(
    (plan) => plan.status === "Active",
  );

  const [coopId, setCoopId] = useState(coop?.id ?? "");
  const [amount, setAmount] = useState("");
  const [planId, setPlanId] = useState("");

  // Picking a plan pre-fills the amount with its listed price — still editable, since a real
  // manual payment (bank transfer, etc.) can legitimately differ from the catalog price.
  useEffect(() => {
    if (!planId && activePlans.length > 0) {
      setPlanId(activePlans[0].id);
      setAmount(String(activePlans[0].amount));
    }
  }, [planId, activePlans]);

  const amountNumber = Number(amount);
  const isValid = !!coopId && amountNumber > 0 && !!planId;

  const reset = () => {
    setCoopId(coop?.id ?? "");
    setAmount("");
    setPlanId("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleUpload = () => {
    onUpload({ coopId, amountPaid: amountNumber, planId });
  };

  const handlePlanChange = (value: string | null) => {
    setPlanId(value ?? "");
    const plan = activePlans.find((option) => option.id === value);
    if (plan) setAmount(String(plan.amount));
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
            <Label htmlFor={planId_}>Subscription Plan</Label>
            <Select
              value={planId}
              onValueChange={handlePlanChange}
              disabled={busy}
            >
              <SelectTrigger id={planId_} className="h-11 w-full">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {activePlans.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label} ({option.type}) —{" "}
                    {formatNaira(option.amount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Whether this counts as a new subscription or a renewal is worked
              out automatically from the co-op&apos;s payment history — pick
              whichever plan duration matches what was actually paid. Manage
              plans from Settings &gt; Payment Settings &gt; Subscription Plans.
            </p>
          </div>

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
