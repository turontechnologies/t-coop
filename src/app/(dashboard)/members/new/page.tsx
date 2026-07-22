"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddMemberForm } from "@/components/features/members-directory/add-member-form";
import { getDirectoryMembers } from "@/lib/member-directory";
import { useCoopStore } from "@/store/coop.store";

export default function NewMemberPage() {
  const router = useRouter();
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const existingMembers = getDirectoryMembers(cooperatives);

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

      <AddMemberForm existingMembers={existingMembers} />
    </div>
  );
}
