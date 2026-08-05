"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoanTypeSettingsTable } from "@/components/features/admin-settings/loan-type-settings-table";
import type { CoopLoanTypeSetting } from "@/lib/admin-settings-data";
import { useAdminSettingsStore } from "@/store/admin-settings.store";

export function AdminLoanSettingsTab() {
  const router = useRouter();
  const loanTypeSettings = useAdminSettingsStore(
    (state) => state.loanTypeSettings,
  );
  const setLoanTypeStatus = useAdminSettingsStore(
    (state) => state.setLoanTypeStatus,
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return loanTypeSettings;
    return loanTypeSettings.filter((setting) =>
      setting.name.toLowerCase().includes(query),
    );
  }, [loanTypeSettings, search]);

  const handleToggleStatus = async (setting: CoopLoanTypeSetting) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const next = setting.status === "Active" ? "Inactive" : "Active";
    setLoanTypeStatus(setting.id, next);
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
        <Button onClick={() => router.push("/settings/loans/new")}>
          New Loan Type
        </Button>
      </div>

      <LoanTypeSettingsTable
        settings={filtered}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}
