"use client";

import { useState } from "react";
import { Ban, CheckCircle2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmToggleDialog } from "@/components/features/coop/confirm-toggle-dialog";
import { CoopCurrencyDisplay } from "@/components/features/coop/coop-currency-display";
import { EditCooperativeModal } from "@/components/features/coop/edit-cooperative-modal";
import { useUpdateCooperativeStatus } from "@/hooks/use-update-cooperative-status";
import { formatMoney } from "@/lib/format";
import type { CooperativeSummary } from "@/types/cooperative";

interface CoopHeaderCardProps {
  coop: CooperativeSummary;
}

export function CoopHeaderCard({ coop }: CoopHeaderCardProps) {
  const [editing, setEditing] = useState(false);
  const updateStatus = useUpdateCooperativeStatus(coop.id);

  const isActive = coop.status === "Active";

  const handleConfirm = async () => {
    const next = isActive ? "Disabled" : "Active";
    try {
      await updateStatus.mutateAsync(next);
      toast.success(
        next === "Disabled"
          ? "Co-operative disabled"
          : "Co-operative activated",
        { description: `${coop.name} is now ${next.toLowerCase()}.` },
      );
    } catch (error) {
      toast.error("Couldn't update status", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Co-operative Details
          </h2>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit
            </Button>

            <ConfirmToggleDialog
              trigger={
                <Button
                  size="sm"
                  variant={isActive ? "destructive" : "secondary"}
                />
              }
              entityLabel="Co-operative"
              name={coop.name}
              isActive={isActive}
              onConfirm={handleConfirm}
            >
              {isActive ? (
                <Ban className="size-3.5" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
              )}
              {isActive ? "Disable Co-operative" : "Activate Co-operative"}
            </ConfirmToggleDialog>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Co-op ID" value={coop.id} />
          <Field label="Co-op Name" value={coop.name} />
          <Field label="Contact Email" value={coop.contactEmail} />
          <Field label="Contact Phone no" value={coop.contactPhone} />
          <Field label="Admin" value={coop.adminName} />
          <Field label="Address" value={`${coop.address}, ${coop.state}`} />
          <Field
            label="Total Savings"
            value={formatMoney(coop.totalSavings, coop.currency)}
          />
          <Field
            label="Total Loan"
            value={formatMoney(coop.totalLoans, coop.currency)}
          />
        </div>

        <div className="max-w-xs">
          <CoopCurrencyDisplay currency={coop.currency} variant="full" />
        </div>
      </CardContent>

      <EditCooperativeModal
        coop={coop}
        open={editing}
        onOpenChange={setEditing}
      />
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
