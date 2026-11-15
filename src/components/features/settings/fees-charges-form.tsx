"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  EASE,
  FEE_ORDER,
  FeeTile,
  GraceTile,
} from "@/components/features/settings/payment-ui";
import { useFeeSettings, useUpdateFeeSettings } from "@/hooks/use-fee-settings";
import type { FeeSettings } from "@/lib/settings-data";
import {
  feeChargesSchema,
  type FeeChargesFormValues,
} from "@/lib/validations/settings.schema";

/** Super admin: the platform fees and grace period a newly created co-operative starts with. */
export function FeesChargesForm() {
  const {
    data: feeSettings,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useFeeSettings();

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => refetch()}
      isRetrying={isFetching}
      errorTitle="Couldn't load fees & charges"
    >
      {feeSettings ? <FeesChargesFormBody feeSettings={feeSettings} /> : null}
    </QueryBoundary>
  );
}

function FeesChargesFormBody({ feeSettings }: { feeSettings: FeeSettings }) {
  const updateFeeSettings = useUpdateFeeSettings();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FeeChargesFormValues>({
    resolver: zodResolver(feeChargesSchema),
    defaultValues: feeSettings,
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateFeeSettings.mutateAsync(values);
      reset(values);
      toast.success("Defaults saved", {
        description: "New co-operatives will start with these fees.",
      });
    } catch (error) {
      toast.error("Couldn't save the defaults", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const saving = updateFeeSettings.isPending;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold text-foreground">
            Defaults for new co-operatives
          </h3>
          <p className="text-sm text-muted-foreground">
            Every new co-operative starts with these. Change one
            co-operative&apos;s own fees in &ldquo;Fees per co-operative&rdquo;
            below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {FEE_ORDER.map((fee, index) => (
          <FeeTile
            key={fee}
            fee={fee}
            index={index}
            control={control}
            register={register}
            errors={errors}
          />
        ))}
        <div className="md:col-span-2">
          <GraceTile
            control={control}
            errors={errors}
            index={FEE_ORDER.length}
            description="How long a new co-operative keeps working after its subscription runs out. Each co-operative can then have its own."
          />
        </div>
      </div>

      <AnimatePresence>
        {isDirty ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-card/95 p-3 pl-4 shadow-raised backdrop-blur"
          >
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <span className="size-2 animate-pulse rounded-full bg-amber-500" />
              You have unsaved changes
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => reset(feeSettings)}
                disabled={saving}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Undo
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Saving…
                  </>
                ) : (
                  "Save defaults"
                )}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  );
}
