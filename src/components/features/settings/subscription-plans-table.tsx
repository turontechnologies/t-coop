"use client";

import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/types/subscription";

interface SubscriptionPlansTableProps {
  plans: SubscriptionPlan[];
  onEdit: (plan: SubscriptionPlan) => void;
  onDelete: (plan: SubscriptionPlan) => void;
  emptyMessage: string;
}

function durationLabel(days: number): string {
  if (days % 365 === 0)
    return `${days / 365} yr${days === 365 ? "" : "s"} (${days}d)`;
  if (days % 30 === 0) return `${days / 30} mo (${days}d)`;
  if (days % 7 === 0)
    return `${days / 7} wk${days === 7 ? "" : "s"} (${days}d)`;
  return `${days} day${days === 1 ? "" : "s"}`;
}

export function SubscriptionPlansTable({
  plans,
  onEdit,
  onDelete,
  emptyMessage,
}: SubscriptionPlansTableProps) {
  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">Plan</th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Duration
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Amount
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              plans.map((plan) => {
                const isActive = plan.status === "Active";
                return (
                  <tr
                    key={plan.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {plan.label}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {durationLabel(plan.durationInDays)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatNaira(plan.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={isActive ? "secondary" : "destructive"}
                        className={cn(isActive && "bg-success/15 text-success")}
                      >
                        {plan.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(plan)}
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Edit ${plan.label}`}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                        </button>
                        <DeletePlanDialog plan={plan} onDelete={onDelete} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <MobileRecordList
        isEmpty={plans.length === 0}
        emptyMessage={emptyMessage}
      >
        {plans.map((plan) => {
          const isActive = plan.status === "Active";
          return (
            <MobileRecordCard
              key={plan.id}
              title={plan.label}
              badge={
                <Badge
                  variant={isActive ? "secondary" : "destructive"}
                  className={cn(isActive && "bg-success/15 text-success")}
                >
                  {plan.status}
                </Badge>
              }
              fields={[
                {
                  label: "Duration",
                  value: durationLabel(plan.durationInDays),
                },
                { label: "Amount", value: formatNaira(plan.amount) },
              ]}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => onEdit(plan)}
                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Edit ${plan.label}`}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                  </button>
                  <DeletePlanDialog plan={plan} onDelete={onDelete} />
                </>
              }
            />
          );
        })}
      </MobileRecordList>
    </div>
  );
}

function DeletePlanDialog({
  plan,
  onDelete,
}: {
  plan: SubscriptionPlan;
  onDelete: (plan: SubscriptionPlan) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${plan.label}`}
          />
        }
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Plan</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{plan.label}&quot;? Co-ops can
            no longer pick it for a new payment — this doesn&apos;t affect any
            payment already made against it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => onDelete(plan)}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
