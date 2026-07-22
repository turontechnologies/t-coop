"use client";

import { Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmToggleDialog } from "@/components/features/coop/confirm-toggle-dialog";
import type { Cooperative } from "@/lib/coop-data";
import { coopLoansTotal, coopSavingsTotal } from "@/lib/coop-data";
import { formatNaira } from "@/lib/format";
import { useCoopStore } from "@/store/coop.store";

interface CoopHeaderCardProps {
  coop: Cooperative;
}

export function CoopHeaderCard({ coop }: CoopHeaderCardProps) {
  const setCooperativeStatus = useCoopStore(
    (state) => state.setCooperativeStatus,
  );

  const isActive = coop.status === "Active";

  const handleConfirm = async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const next = isActive ? "Disabled" : "Active";
    setCooperativeStatus(coop.id, next);
    toast.success(
      next === "Disabled" ? "Co-operative disabled" : "Co-operative activated",
      { description: `${coop.name} is now ${next.toLowerCase()}.` },
    );
  };

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Co-operative Details
          </h2>

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

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Co-op ID" value={coop.id} />
          <Field label="Co-op Name" value={coop.name} />
          <Field label="Contact Email" value={coop.contactEmail} />
          <Field label="Contact Phone no" value={coop.contactPhone} />
          <Field label="Admin" value={coop.adminName} />
          <Field label="Address" value={`${coop.address}, ${coop.state}`} />
          <Field
            label="Total Savings"
            value={formatNaira(coopSavingsTotal(coop))}
          />
          <Field label="Total Loan" value={formatNaira(coopLoansTotal(coop))} />
        </div>
      </CardContent>
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
