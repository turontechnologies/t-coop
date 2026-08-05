"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SavingsTypeModal } from "@/components/features/admin-settings/savings-type-modal";
import { SavingsTypeSettingsTable } from "@/components/features/admin-settings/savings-type-settings-table";
import type { CoopSavingsTypeSetting } from "@/lib/admin-settings-data";
import { coopMemberFullName } from "@/lib/coop-data";
import { getDirectoryMembers } from "@/lib/member-directory";
import type { SavingsTypeSettingFormValues } from "@/lib/validations/admin-settings.schema";
import { useAdminSettingsStore } from "@/store/admin-settings.store";
import { useCoopStore } from "@/store/coop.store";

export function AdminSavingsSettingsTab() {
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const savingsTypeSettings = useAdminSettingsStore(
    (state) => state.savingsTypeSettings,
  );
  const addSavingsTypeSetting = useAdminSettingsStore(
    (state) => state.addSavingsTypeSetting,
  );
  const updateSavingsTypeSetting = useAdminSettingsStore(
    (state) => state.updateSavingsTypeSetting,
  );
  const setSavingsTypeStatus = useAdminSettingsStore(
    (state) => state.setSavingsTypeStatus,
  );

  const memberOptions = useMemo(
    () => getDirectoryMembers(cooperatives).map(coopMemberFullName),
    [cooperatives],
  );

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] =
    useState<CoopSavingsTypeSetting | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return savingsTypeSettings;
    return savingsTypeSettings.filter((setting) =>
      setting.name.toLowerCase().includes(query),
    );
  }, [savingsTypeSettings, search]);

  const handleSubmit = async (values: SavingsTypeSettingFormValues) => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (editingSetting) {
      updateSavingsTypeSetting(editingSetting.id, values);
      toast.success("Savings type updated", { description: values.name });
    } else {
      const setting: CoopSavingsTypeSetting = {
        id: `sav-type-${Date.now()}`,
        ...values,
        status: "Active",
      };
      addSavingsTypeSetting(setting);
      toast.success("Savings type created", { description: values.name });
    }
    setBusy(false);
    setModalOpen(false);
    setEditingSetting(null);
  };

  const handleToggleStatus = async (setting: CoopSavingsTypeSetting) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const next = setting.status === "Active" ? "Inactive" : "Active";
    setSavingsTypeStatus(setting.id, next);
    toast.success(
      next === "Active"
        ? `${setting.name} activated`
        : `${setting.name} disabled`,
    );
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
        <Button
          onClick={() => {
            setEditingSetting(null);
            setModalOpen(true);
          }}
        >
          New Savings Type
        </Button>
      </div>

      <SavingsTypeSettingsTable
        settings={filtered}
        onEdit={(setting) => {
          setEditingSetting(setting);
          setModalOpen(true);
        }}
        onToggleStatus={handleToggleStatus}
      />

      <SavingsTypeModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingSetting(null);
        }}
        editingSetting={editingSetting}
        memberOptions={memberOptions}
        busy={busy}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
