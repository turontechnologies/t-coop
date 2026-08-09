"use client";

import { Pencil, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmToggleDialog } from "@/components/features/coop/confirm-toggle-dialog";
import type { CoopSavingsTypeSetting } from "@/lib/admin-settings-data";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SavingsTypeSettingsTableProps {
  settings: CoopSavingsTypeSetting[];
  onEdit: (setting: CoopSavingsTypeSetting) => void;
  onToggleStatus: (setting: CoopSavingsTypeSetting) => void;
}

export function SavingsTypeSettingsTable({
  settings,
  onEdit,
  onToggleStatus,
}: SavingsTypeSettingsTableProps) {
  const currency = useCurrency();
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/60">
            <th className="px-4 py-2.5 font-medium text-foreground">
              Savings Type
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Minimum Amount
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Maximum Amount
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
                colSpan={5}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No savings types yet.
              </td>
            </tr>
          ) : (
            settings.map((setting) => {
              const isActive = setting.status === "Active";
              return (
                <tr
                  key={setting.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {setting.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatMoney(setting.min, currency)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatMoney(setting.max, currency)}
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
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(setting)}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Edit ${setting.name}`}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <ConfirmToggleDialog
                        trigger={
                          <button
                            type="button"
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label={
                              isActive
                                ? `Disable ${setting.name}`
                                : `Activate ${setting.name}`
                            }
                          />
                        }
                        entityLabel="Savings Type"
                        name={setting.name}
                        isActive={isActive}
                        onConfirm={() => onToggleStatus(setting)}
                      >
                        <Power className="size-3.5" aria-hidden="true" />
                      </ConfirmToggleDialog>
                    </div>
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
