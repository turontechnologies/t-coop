"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddCooperativeForm } from "@/components/features/coop/add-cooperative-form";

export default function NewCooperativePage() {
  const router = useRouter();

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/co-operatives")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to Co-operatives
      </Button>

      <AddCooperativeForm />
    </div>
  );
}
