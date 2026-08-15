"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoopListTable } from "@/components/features/coop/coop-list-table";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { useCooperatives } from "@/hooks/use-cooperatives";

export default function CooperativesPage() {
  const {
    data: cooperatives,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCooperatives();

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>
        <Button
          nativeButton={false}
          render={<Link href="/co-operatives/new" />}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add New Co-operative
        </Button>
      </div>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isRetrying={isFetching}
        errorTitle="Couldn't load co-operatives"
      >
        <CoopListTable cooperatives={cooperatives ?? []} />
      </QueryBoundary>
    </div>
  );
}
