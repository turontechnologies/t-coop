"use client";

import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";

interface LoanSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
}

export function LoanSuccessModal({
  open,
  onOpenChange,
  amount,
}: LoanSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={false} className="text-center">
        <DialogHeader className="items-center text-center">
          <DialogTitle>Loan Successful</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="size-8" aria-hidden="true" />
          </span>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Your loan application for {formatNaira(amount)} has been submitted
          successfully and is awaiting approval.
        </p>

        <DialogFooter className="sm:justify-center">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Back to home
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
