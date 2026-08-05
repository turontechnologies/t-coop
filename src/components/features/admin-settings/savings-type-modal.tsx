"use client";

import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CoopSavingsTypeSetting } from "@/lib/admin-settings-data";
import {
  savingsTypeSettingSchema,
  type SavingsTypeSettingFormValues,
} from "@/lib/validations/admin-settings.schema";

interface SavingsTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSetting?: CoopSavingsTypeSetting | null;
  memberOptions: string[];
  busy: boolean;
  onSubmit: (values: SavingsTypeSettingFormValues) => void;
}

export function SavingsTypeModal({
  open,
  onOpenChange,
  editingSetting,
  memberOptions,
  busy,
  onSubmit: onSubmitProp,
}: SavingsTypeModalProps) {
  const nameId = useId();
  const minId = useId();
  const maxId = useId();
  const isEditing = !!editingSetting;

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<SavingsTypeSettingFormValues>({
    resolver: zodResolver(savingsTypeSettingSchema),
    defaultValues: { name: "", min: 0, max: 0, approvalGroup: [] },
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: editingSetting?.name ?? "",
      min: editingSetting?.min ?? 0,
      max: editingSetting?.max ?? 0,
      approvalGroup: editingSetting?.approvalGroup ?? [],
    });
  }, [open, editingSetting, reset]);

  const handleOpenChange = (next: boolean) => {
    if (!next) reset({ name: "", min: 0, max: 0, approvalGroup: [] });
    onOpenChange(next);
  };

  const onSubmit = handleSubmit((values) => onSubmitProp(values));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Savings Type" : "New Savings Type"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Savings Name</Label>
            <Input
              id={nameId}
              placeholder="Enter savings name"
              disabled={busy}
              aria-invalid={!!errors.name}
              className="h-11"
              {...register("name")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={minId}>Minimum Savings</Label>
              <Input
                id={minId}
                type="number"
                inputMode="decimal"
                placeholder="Enter amount"
                disabled={busy}
                aria-invalid={!!errors.min}
                className="h-11"
                {...register("min", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={maxId}>Maximum Savings</Label>
              <Input
                id={maxId}
                type="number"
                inputMode="decimal"
                placeholder="Enter amount"
                disabled={busy}
                aria-invalid={!!errors.max}
                className="h-11"
                {...register("max", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Approval Group</Label>
            <Controller
              control={control}
              name="approvalGroup"
              render={({ field }) => (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        disabled={busy}
                        className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    }
                  >
                    <span
                      className={
                        field.value.length === 0
                          ? "text-muted-foreground"
                          : undefined
                      }
                    >
                      {field.value.length === 0
                        ? "Select member(s)"
                        : `${field.value.length} selected`}
                    </span>
                    <ChevronDown
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-(--anchor-width) min-w-56"
                  >
                    {memberOptions.map((name) => (
                      <DropdownMenuCheckboxItem
                        key={name}
                        closeOnClick={false}
                        checked={field.value.includes(name)}
                        onCheckedChange={(checked) => {
                          field.onChange(
                            checked
                              ? [...field.value, name]
                              : field.value.filter((item) => item !== name),
                          );
                        }}
                      >
                        {name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            />
            {errors.approvalGroup ? (
              <p className="text-sm text-destructive">
                {errors.approvalGroup.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !isValid}>
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
