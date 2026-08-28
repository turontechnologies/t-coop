"use client";

import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  useCoopIdFormat,
  useUpdateCoopIdFormat,
} from "@/hooks/use-coop-id-format";
import {
  ID_GENERATION_TYPE_OPTIONS,
  previewGeneratedId,
} from "@/lib/id-format-preview";

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
  type: z.enum(["NUMERIC", "ALPHA", "ALPHANUMERIC"]),
});

type CoopIdFormatFormValues = z.infer<typeof coopIdFormatSchema>;

/** How "Add Co-operative" auto-generates the next co-op id — e.g. prefix "COOP", type NUMERIC,
 * padding 4 -> the next co-op created gets "COOP-0005" (computed from the highest existing
 * suffix, not a running count, so it's safe against gaps left by pre-existing manually-typed
 * ids). */
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
  const typeId = useId();

  const {
    control,
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

  const prefix = watch("prefix") || "COOP";
  const padding = watch("padding") || 4;
  const type = watch("type") || "NUMERIC";
  const preview = previewGeneratedId(prefix, type, padding);

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

      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[8rem_14rem_6rem_minmax(10rem,1fr)]">
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
          <Label htmlFor={typeId}>Character Type</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value ?? "NUMERIC")}
                disabled={saving}
              >
                <SelectTrigger id={typeId} className="h-11 w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ID_GENERATION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={paddingId}>Length</Label>
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
