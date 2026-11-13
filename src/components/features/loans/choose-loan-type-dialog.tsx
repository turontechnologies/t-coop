"use client";

import { CheckCircle2, ChevronRight, Landmark } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LoanTypeFee } from "@/services/loan-fee.service";

/**
 * First step of New Loan when the co-op sets an application fee per loan type: the member picks
 * the type, sees its fee (or that it's already paid), and then pays that fee before the form.
 */
export function ChooseLoanTypeDialog({
  open,
  onOpenChange,
  types,
  currency,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  types: LoanTypeFee[];
  currency: string;
  onChoose: (loanTypeId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a loan type</DialogTitle>
          <DialogDescription>
            Each loan type has its own application fee, paid before the
            application form opens.
          </DialogDescription>
        </DialogHeader>

        {types.length === 0 ? (
          <p className="rounded-xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
            Your co-operative hasn&apos;t opened any loan types yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {types.map((type) => {
              const paid = !!type.credit;
              const free = type.fee <= 0;
              return (
                <li key={type.loanTypeId}>
                  <button
                    type="button"
                    onClick={() => onChoose(type.loanTypeId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    )}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:text-emerald-300">
                      <Landmark className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">
                        {type.loanTypeName}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {free
                          ? "No application fee"
                          : `Application fee ${formatMoney(type.fee, currency)}`}
                      </span>
                    </span>
                    {paid ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                        <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        Paid
                      </span>
                    ) : null}
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
