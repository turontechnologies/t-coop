"use client";

import { Camera, IdCard, Mail } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRoleLabel } from "@/config/dashboard-nav";
import { getInitials } from "@/lib/format";
import type { AuthenticatedMember } from "@/types/auth";

interface ProfileHeaderCardProps {
  member: AuthenticatedMember;
}

export function ProfileHeaderCard({ member }: ProfileHeaderCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="relative shrink-0">
          <span className="flex size-20 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
            {getInitials(member.name)}
          </span>
          <button
            type="button"
            onClick={() =>
              toast.info("Coming soon", {
                description: "Photo upload isn't wired up yet.",
              })
            }
            className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-card text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground"
            aria-label="Change profile photo"
          >
            <Camera className="size-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h2 className="text-lg font-semibold text-foreground">
              {member.name}
            </h2>
            <Badge variant="secondary">{getRoleLabel(member.role)}</Badge>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" aria-hidden="true" />
              {member.email}
            </span>
            <span className="flex items-center gap-1.5">
              <IdCard className="size-3.5" aria-hidden="true" />
              {member.id}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
