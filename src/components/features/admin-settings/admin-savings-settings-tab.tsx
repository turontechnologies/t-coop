"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { SavingsTypeModal } from "@/components/features/admin-settings/savings-type-modal";
import { SavingsTypeSettingsTable } from "@/components/features/admin-settings/savings-type-settings-table";
import { WithdrawalFeeForm } from "@/components/features/admin-settings/withdrawal-fee-form";
import {
  useCoopSavingsTypeMutations,
  useCoopSavingsTypes,
} from "@/hooks/use-coop-savings";
import type { SavingsTypeSettingFormValues } from "@/lib/validations/admin-settings.schema";
import { useAuthStore } from "@/store/auth.store";
import type { CoopSavingsTypeSummary } from "@/types/coop-savings";

export function AdminSavingsSettingsTab() {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.id;
  const typesQuery = useCoopSavingsTypes(coopId);
  const mutations = useCoopSavingsTypeMutations(coopId ?? "");

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] =
    useState<CoopSavingsTypeSummary | null>(null);

  const filtered = useMemo(() => {
    const types = typesQuery.data ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return types;
    return types.filter((type) => type.name.toLowerCase().includes(query));
  }, [typesQuery.data, search]);

  const busy = mutations.createType.isPending || mutations.updateType.isPending;

  const handleSubmit = async (values: SavingsTypeSettingFormValues) => {
    try {
      if (editingSetting) {
        await mutations.updateType.mutateAsync({
          typeId: editingSetting.id,
          values,
        });
        toast.success("Savings type updated", { description: values.name });
      } else {
        await mutations.createType.mutateAsync(values);
        toast.success("Savings type created", { description: values.name });
      }
      setModalOpen(false);
      setEditingSetting(null);
    } catch (error) {
      toast.error(
        editingSetting
          ? "Couldn't update savings type"
          : "Couldn't create savings type",
        {
          description:
            error instanceof Error ? error.message : "Please try again.",
        },
      );
    }
  };

  const handleToggleStatus = async (type: CoopSavingsTypeSummary) => {
    const next = type.status === "Active" ? "Inactive" : "Active";
    try {
      await mutations.updateTypeStatus.mutateAsync({
        typeId: type.id,
        status: next,
      });
      toast.success(
        next === "Active" ? `${type.name} activated` : `${type.name} disabled`,
      );
    } catch (error) {
      toast.error("Couldn't update status", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <WithdrawalFeeForm />

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
        <Button
          onClick={() => {
            setEditingSetting(null);
            setModalOpen(true);
          }}
        >
          New Savings Type
        </Button>
      </div>

      <QueryBoundary
        isLoading={typesQuery.isLoading}
        isError={typesQuery.isError}
        error={typesQuery.error}
        onRetry={() => typesQuery.refetch()}
        isRetrying={typesQuery.isFetching}
      >
        <SavingsTypeSettingsTable
          settings={filtered}
          onEdit={(setting) => {
            setEditingSetting(setting);
            setModalOpen(true);
          }}
          onToggleStatus={handleToggleStatus}
        />
      </QueryBoundary>

      <SavingsTypeModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingSetting(null);
        }}
        editingSetting={editingSetting}
        busy={busy}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
