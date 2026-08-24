"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { LoanTypeSettingsTable } from "@/components/features/admin-settings/loan-type-settings-table";
import {
  useCoopLoanTypeMutations,
  useCoopLoanTypes,
} from "@/hooks/use-coop-loans";
import { useAuthStore } from "@/store/auth.store";
import type { CoopLoanTypeSummary } from "@/types/coop-loans";

export function AdminLoanSettingsTab() {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const coopId = member?.id;
  const typesQuery = useCoopLoanTypes(coopId);
  const mutations = useCoopLoanTypeMutations(coopId ?? "");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const types = typesQuery.data ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return types;
    return types.filter((type) => type.name.toLowerCase().includes(query));
  }, [typesQuery.data, search]);

  const handleToggleStatus = async (setting: CoopLoanTypeSummary) => {
    const next = setting.status === "Active" ? "Inactive" : "Active";
    try {
      await mutations.updateTypeStatus.mutateAsync({
        typeId: setting.id,
        status: next,
      });
      toast.success(
        next === "Active"
          ? `${setting.name} activated`
          : `${setting.name} disabled`,
      );
    } catch (error) {
      toast.error("Couldn't update status", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="h-9 pl-8"
          />
        </div>
        <Button onClick={() => router.push("/settings/loans/new")}>
          New Loan Type
        </Button>
      </div>

      <QueryBoundary
        isLoading={typesQuery.isLoading}
        isError={typesQuery.isError}
        error={typesQuery.error}
        onRetry={() => typesQuery.refetch()}
        isRetrying={typesQuery.isFetching}
      >
        <LoanTypeSettingsTable
          settings={filtered}
          onToggleStatus={handleToggleStatus}
        />
      </QueryBoundary>
    </div>
  );
}
