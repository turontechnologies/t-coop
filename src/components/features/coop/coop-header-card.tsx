"use client";

import { useState } from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Cooperative } from "@/lib/coop-data";
import { coopLoansTotal, coopSavingsTotal } from "@/lib/coop-data";
import { formatNaira } from "@/lib/format";
import { useCoopStore } from "@/store/coop.store";

interface CoopHeaderCardProps {
  coop: Cooperative;
}

export function CoopHeaderCard({ coop }: CoopHeaderCardProps) {
  const [busy, setBusy] = useState(false);
  const setCooperativeStatus = useCoopStore(
    (state) => state.setCooperativeStatus,
  );

  const isActive = coop.status === "Active";

  const handleToggle = async () => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const next = isActive ? "Disabled" : "Active";
    setCooperativeStatus(coop.id, next);
    setBusy(false);
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
          <Button
            size="sm"
            variant={isActive ? "destructive" : "secondary"}
            onClick={handleToggle}
            disabled={busy}
          >
            {isActive ? (
              <Ban className="size-3.5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            )}
            {isActive ? "Disable Co-operative" : "Activate Co-operative"}
          </Button>
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
