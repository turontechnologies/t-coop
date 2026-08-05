"use client";

import { useRouter } from "next/navigation";
import { Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmToggleDialog } from "@/components/features/coop/confirm-toggle-dialog";
import type { CoopLoanTypeSetting } from "@/lib/admin-settings-data";
import { cn } from "@/lib/utils";

interface LoanTypeSettingsTableProps {
  settings: CoopLoanTypeSetting[];
  onToggleStatus: (setting: CoopLoanTypeSetting) => void;
}

export function LoanTypeSettingsTable({
  settings,
  onToggleStatus,
}: LoanTypeSettingsTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/60">
            <th className="px-4 py-2.5 font-medium text-foreground">
              Loan Type
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Eligibility %
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Duration
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Loan Approver
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">Status</th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {settings.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No loan types yet.
              </td>
            </tr>
          ) : (
            settings.map((setting) => {
              const isActive = setting.status === "Active";
              return (
                <tr
                  key={setting.id}
                  onClick={() =>
                    router.push(`/settings/loans/new?id=${setting.id}`)
                  }
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {setting.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {setting.eligibilityPercent}% of savings
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {setting.durationMonths} Months
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {setting.approver1}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={isActive ? "secondary" : "destructive"}
                      className={cn(isActive && "bg-success/15 text-success")}
                    >
                      {setting.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <ConfirmToggleDialog
                      trigger={
                        <button
                          type="button"
                          onClick={(event) => event.stopPropagation()}
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={
                            isActive
                              ? `Disable ${setting.name}`
                              : `Activate ${setting.name}`
                          }
                        />
                      }
                      entityLabel="Loan Type"
                      name={setting.name}
                      isActive={isActive}
                      onConfirm={() => onToggleStatus(setting)}
                    >
                      <Power className="size-3.5" aria-hidden="true" />
                    </ConfirmToggleDialog>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
