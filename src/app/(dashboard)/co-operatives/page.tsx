"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoopListTable } from "@/components/features/coop/coop-list-table";
import { useCoopStore } from "@/store/coop.store";

export default function CooperativesPage() {
  const cooperatives = useCoopStore((state) => state.cooperatives);

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>
        <Button render={<Link href="/co-operatives/new" />}>
          <Plus className="size-4" aria-hidden="true" />
          Add New Co-operative
        </Button>
      </div>

      <CoopListTable cooperatives={cooperatives} />
    </div>
  );
}
