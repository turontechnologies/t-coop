"use client";

import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  useCoopIdFormat,
  useUpdateCoopIdFormat,
} from "@/hooks/use-coop-id-format";

const coopIdFormatSchema = z.object({
  prefix: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9]{1,20}$/,
      "Letters and numbers only, up to 20 characters",
    ),
  padding: z
    .number()
    .min(1, "Enter at least 1 digit")
    .max(10, "Enter at most 10 digits"),
});

type CoopIdFormatFormValues = z.infer<typeof coopIdFormatSchema>;

/** How "Add Co-operative" auto-generates the next co-op id — e.g. prefix "COOP", padding 4 ->
 * the next co-op created gets "COOP-0005" (computed from the highest existing numeric suffix,
 * not a running count, so it's safe against gaps left by pre-existing manually-typed ids). */
export function CoopIdFormatForm() {
  const {
    data: format,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCoopIdFormat();

  return (
    <Card>
      <CardContent>
        <QueryBoundary
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          isRetrying={isFetching}
          errorTitle="Couldn't load co-op ID format"
        >
          {format ? <CoopIdFormatFormBody format={format} /> : null}
        </QueryBoundary>
      </CardContent>
    </Card>
  );
}

function CoopIdFormatFormBody({ format }: { format: CoopIdFormatFormValues }) {
  const updateFormat = useUpdateCoopIdFormat();
  const prefixId = useId();
  const paddingId = useId();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<CoopIdFormatFormValues>({
    resolver: zodResolver(coopIdFormatSchema),
    defaultValues: format,
  });

  useEffect(() => reset(format), [format, reset]);

  const prefix = (watch("prefix") || "COOP").toUpperCase();
  const padding = watch("padding") || 4;
  const preview = `${prefix}-${"0".repeat(Math.max(0, padding - 1))}1`;

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateFormat.mutateAsync(values);
      toast.success("Co-op ID format saved");
    } catch (error) {
      toast.error("Couldn't save co-op ID format", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const saving = updateFormat.isPending;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Co-op ID Format</p>
        <p className="text-xs text-muted-foreground">
          How &quot;Add Co-operative&quot; generates the next co-op ID — new
          co-ops get an ID automatically, so nobody types one in by hand.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor={prefixId}>Prefix</Label>
          <Input
            id={prefixId}
            placeholder="COOP"
            className="h-11 w-32"
            aria-invalid={!!errors.prefix}
            disabled={saving}
            {...register("prefix")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={paddingId}>Digits</Label>
          <Input
            id={paddingId}
            type="number"
            className="h-11 w-24"
            aria-invalid={!!errors.padding}
            disabled={saving}
            {...register("padding", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label>Next ID would look like</Label>
          <p className="flex h-11 items-center text-sm font-medium text-foreground">
            {preview}
          </p>
        </div>
      </div>
      {errors.prefix ? (
        <p className="text-sm text-destructive">{errors.prefix.message}</p>
      ) : null}
      {errors.padding ? (
        <p className="text-sm text-destructive">{errors.padding.message}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !isDirty}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </form>
  );
}
