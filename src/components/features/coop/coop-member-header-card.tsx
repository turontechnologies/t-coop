"use client";

import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { CoopMember } from "@/lib/coop-data";
import { coopMemberFullName } from "@/lib/coop-data";
import { getInitials } from "@/lib/format";

interface CoopMemberHeaderCardProps {
  member: CoopMember;
}

export function CoopMemberHeaderCard({ member }: CoopMemberHeaderCardProps) {
  const fullName = coopMemberFullName(member);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
          {getInitials(fullName)}
        </span>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h2 className="text-lg font-semibold text-foreground">
              {fullName}
            </h2>
            <Badge variant="secondary">{member.role}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Membership ID" value={member.id} />
            <Field label="Email" value={member.email} />
            <Field label="Guarantor" value={member.guarantor} />
            <Field label="Country" value={member.country} />
            <Field label="State" value={member.state} />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Full Details</p>
              <button
                type="button"
                onClick={() =>
                  toast.info("Coming soon", {
                    description:
                      "The full KYC profile view isn't wired up yet.",
                  })
                }
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
