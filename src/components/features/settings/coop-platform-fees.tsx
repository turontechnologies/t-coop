"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CalendarClock,
  CopyCheck,
  Loader2,
  Pencil,
  RotateCcw,
  Search,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  CoopAvatar,
  EASE,
  FEES,
  FEE_ORDER,
  FeeTile,
  GraceTile,
  Segmented,
  SubscriptionPill,
  describeFee,
  subscriptionState,
} from "@/components/features/settings/payment-ui";
import { useFeeSettings } from "@/hooks/use-fee-settings";
import {
  useBulkUpdateCoopPlatformFees,
  useCoopPlatformFees,
  useUpdateCoopPlatformFees,
} from "@/hooks/use-platform-earnings";
import type { CoopPlatformFees, FeeSettings } from "@/lib/settings-data";
import {
  coopPlatformFeesSchema,
  type CoopPlatformFeesFormValues,
} from "@/lib/validations/settings.schema";
import { cn } from "@/lib/utils";

type Filter = "all" | "custom" | "grace" | "locked";

function valuesOf(
  fees: CoopPlatformFees | FeeSettings,
): CoopPlatformFeesFormValues {
  return {
    savingsChargeType: fees.savingsChargeType,
    savingsChargeAmount: fees.savingsChargeAmount,
    loansChargeType: fees.loansChargeType,
    loansChargeAmount: fees.loansChargeAmount,
    withdrawalFeeType: fees.withdrawalFeeType,
    withdrawalFeeAmount: fees.withdrawalFeeAmount,
    loanApplicationFeeType: fees.loanApplicationFeeType,
    loanApplicationFeeAmount: fees.loanApplicationFeeAmount,
    subscriptionGraceDays: fees.subscriptionGraceDays,
  };
}

function differsFromDefaults(row: CoopPlatformFees, defaults?: FeeSettings) {
  if (!defaults) return false;
  const a = valuesOf(row);
  const b = valuesOf(defaults);
  return (Object.keys(a) as (keyof CoopPlatformFeesFormValues)[]).some(
    (key) => a[key] !== b[key],
  );
}

/** Super admin: the platform's fees and grace period for each co-operative. */
export function CoopPlatformFeesSection() {
  const query = useCoopPlatformFees();
  const defaults = useFeeSettings().data;
  const bulk = useBulkUpdateCoopPlatformFees();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<CoopPlatformFees | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const all = useMemo(() => query.data ?? [], [query.data]);
  const counts = useMemo(
    () => ({
      all: all.length,
      custom: all.filter((row) => differsFromDefaults(row, defaults)).length,
      grace: all.filter((row) => subscriptionState(row) === "grace").length,
      locked: all.filter((row) => subscriptionState(row) === "locked").length,
    }),
    [all, defaults],
  );

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter((row) => {
      if (
        term &&
        !row.cooperativeName.toLowerCase().includes(term) &&
        !row.cooperativeId.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (filter === "custom") return differsFromDefaults(row, defaults);
      if (filter === "grace") return subscriptionState(row) === "grace";
      if (filter === "locked") return subscriptionState(row) === "locked";
      return true;
    });
  }, [all, search, filter, defaults]);

  async function applyDefaultsToAll() {
    if (!defaults) return;
    const result = await bulk.mutateAsync({
      cooperativeIds: all.map((row) => row.cooperativeId),
      values: valuesOf(defaults),
    });
    setConfirmAll(false);
    if (result.failed === 0) {
      toast.success(`Defaults applied to ${result.saved} co-operatives`);
    } else {
      toast.error(`${result.failed} co-operatives couldn't be updated`, {
        description: `${result.saved} were updated. Try again for the rest.`,
      });
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-700 dark:text-amber-300">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-foreground">
              Fees per co-operative
            </h3>
            <p className="text-sm text-muted-foreground">
              Each co-operative has its own fees and grace period. Tap one to
              change it.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirmAll(true)}
          disabled={!defaults || all.length === 0}
        >
          <CopyCheck className="size-4" aria-hidden="true" />
          Apply defaults to all
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          label="Show co-operatives"
          value={filter}
          onChange={setFilter}
          options={[
            {
              value: "all",
              label: (
                <>
                  All <Count n={counts.all} />
                </>
              ),
            },
            {
              value: "custom",
              label: (
                <>
                  Custom fees <Count n={counts.custom} />
                </>
              ),
            },
            {
              value: "grace",
              label: (
                <>
                  In grace <Count n={counts.grace} />
                </>
              ),
            },
            {
              value: "locked",
              label: (
                <>
                  Expired <Count n={counts.locked} />
                </>
              ),
            },
          ]}
        />
        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search co-operatives"
            aria-label="Search co-operatives"
            className="h-10 pl-9"
          />
        </div>
      </div>

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
        errorTitle="Couldn't load co-operative fees"
      >
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <Building2
              className="mx-auto size-8 text-muted-foreground/60"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {search || filter !== "all"
                ? "No co-operative matches."
                : "No co-operatives yet."}
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {rows.map((row, index) => (
                <CoopFeeCard
                  key={row.cooperativeId}
                  row={row}
                  index={index}
                  custom={differsFromDefaults(row, defaults)}
                  onOpen={() => setEditing(row)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </QueryBoundary>

      <Sheet
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <SheetContent className="max-w-xl p-0">
          {editing ? (
            <EditCoopFeesForm
              key={editing.cooperativeId}
              fees={editing}
              defaults={defaults}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmAll} onOpenChange={setConfirmAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Apply defaults to every co-operative?
            </AlertDialogTitle>
            <AlertDialogDescription>
              All {all.length} co-operatives will get the default fees and grace
              period, replacing any custom ones. Past charges don&apos;t change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulk.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={applyDefaultsToAll}
              disabled={bulk.isPending}
            >
              {bulk.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Applying…
                </>
              ) : (
                "Apply to all"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className="ml-1 rounded-full bg-foreground/8 px-1.5 text-[11px] tabular-nums">
      {n}
    </span>
  );
}

function CoopFeeCard({
  row,
  index,
  custom,
  onOpen,
}: {
  row: CoopPlatformFees;
  index: number;
  custom: boolean;
  onOpen: () => void;
}) {
  const fees = [
    {
      key: "savings",
      type: row.savingsChargeType,
      amount: row.savingsChargeAmount,
    },
    { key: "loans", type: row.loansChargeType, amount: row.loansChargeAmount },
    {
      key: "withdrawal",
      type: row.withdrawalFeeType,
      amount: row.withdrawalFeeAmount,
    },
    {
      key: "loanApplication",
      type: row.loanApplicationFeeType,
      amount: row.loanApplicationFeeAmount,
    },
  ] as const;

  return (
    <motion.button
      layout
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index, 8) * 0.03,
        ease: EASE,
      }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-shadow duration-200 hover:border-primary/30 hover:shadow-raised focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
    >
      <div className="flex items-start gap-3">
        <CoopAvatar id={row.cooperativeId} name={row.cooperativeName} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">
            {row.cooperativeName}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.cooperativeId}
            {row.status !== "Active" ? ` · ${row.status}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
            custom
              ? "bg-violet-500/12 text-violet-700 dark:text-violet-300"
              : "bg-muted text-muted-foreground",
          )}
        >
          {custom ? "Custom" : "Default"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {fees.map((fee) => {
          const meta = FEES[fee.key];
          return (
            <div
              key={fee.key}
              className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-2"
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-lg",
                  meta.tone,
                )}
              >
                <meta.icon className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] text-muted-foreground">
                  {meta.short}
                </p>
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  {describeFee(fee.type, fee.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <SubscriptionPill fees={row} />
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" aria-hidden="true" />
          {row.subscriptionGraceDays === 0
            ? "No grace"
            : `${row.subscriptionGraceDays} day${row.subscriptionGraceDays === 1 ? "" : "s"} grace`}
        </span>
      </div>

      <span className="pointer-events-none absolute top-4 right-4 flex size-8 translate-y-1 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-raised transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        <Pencil className="size-3.5" aria-hidden="true" />
      </span>
    </motion.button>
  );
}

function EditCoopFeesForm({
  fees,
  defaults,
  onDone,
}: {
  fees: CoopPlatformFees;
  defaults?: FeeSettings;
  onDone: () => void;
}) {
  const update = useUpdateCoopPlatformFees();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CoopPlatformFeesFormValues>({
    resolver: zodResolver(coopPlatformFeesSchema),
    defaultValues: valuesOf(fees),
  });
  const graceDays = useWatch({ control, name: "subscriptionGraceDays" });

  const lockedAfter = useMemo(() => {
    if (!fees.subscriptionExpiresAt || !Number.isFinite(graceDays)) return null;
    const date = new Date(`${fees.subscriptionExpiresAt}T00:00:00`);
    date.setDate(date.getDate() + graceDays);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [fees.subscriptionExpiresAt, graceDays]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await update.mutateAsync({ cooperativeId: fees.cooperativeId, values });
      toast.success(`Saved for ${fees.cooperativeName}`);
      onDone();
    } catch (error) {
      toast.error("Couldn't save the fees", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
      <div className="relative overflow-hidden bg-console px-6 pt-6 pb-5 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/10 blur-2xl"
        />
        <SheetHeader className="relative mb-0">
          <div className="flex items-center gap-3">
            <CoopAvatar
              id={fees.cooperativeId}
              name={fees.cooperativeName}
              className="size-12 ring-2 ring-white/30"
            />
            <div className="min-w-0">
              <SheetTitle className="truncate text-white">
                {fees.cooperativeName}
              </SheetTitle>
              <SheetDescription className="text-white/75">
                {fees.cooperativeId} · the platform&apos;s fees from this
                co-operative
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/90 px-0.5 py-0.5">
            <SubscriptionPill fees={fees} />
          </span>
          {defaults ? (
            <button
              type="button"
              onClick={() =>
                reset(valuesOf(defaults), { keepDefaultValues: true })
              }
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/25"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              Use the defaults
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-4 p-6">
        {FEE_ORDER.map((fee, index) => (
          <FeeTile
            key={fee}
            fee={fee}
            index={index}
            compact
            control={control}
            register={register}
            errors={errors}
          />
        ))}
        <GraceTile
          control={control}
          errors={errors}
          index={FEE_ORDER.length}
          description={
            lockedAfter
              ? `If it isn't renewed, it locks after ${lockedAfter}.`
              : "How long it keeps working after its subscription runs out."
          }
        />
        <p className="text-xs text-muted-foreground">
          New charges use these from now on; past ones don&apos;t change.
        </p>
      </div>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-card/95 px-6 py-4 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          disabled={update.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={update.isPending || !isDirty}>
          {update.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}
