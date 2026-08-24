"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddMemberForm } from "@/components/features/members-directory/add-member-form";
import { useCoopMembers } from "@/hooks/use-coop-members";
import { useAuthStore } from "@/store/auth.store";

export default function NewMemberPage() {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const coopId = member?.id;
  const { data: existingMembers = [] } = useCoopMembers(coopId);

  if (!member) return null;

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/members")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Members Directory
      </Button>

      <AddMemberForm
        coopId={coopId as string}
        existingMembers={existingMembers}
      />
    </div>
  );
}
