"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateNoticeForm } from "@/components/features/notice-board/create-notice-form";
import { useAuthStore } from "@/store/auth.store";

export default function NewNoticePage() {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);

  if (!member || member.role === "member") return null;

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/notice-board")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Notice Board
      </Button>

      <CreateNoticeForm member={member} />
    </div>
  );
}
