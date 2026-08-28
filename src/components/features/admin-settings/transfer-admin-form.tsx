"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, TriangleAlert } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTransferAdmin } from "@/hooks/use-update-cooperative";
import {
  transferAdminSchema,
  type TransferAdminFormValues,
} from "@/lib/validations/coop.schema";
import { useAuthStore } from "@/store/auth.store";

/** Hands the co-op's admin identity over to a new person — e.g. after an election, when the
 * co-op's leadership changes. The outgoing admin doesn't lose access to the platform; they
 * become a regular member of the same co-op under a freshly generated membership ID, keeping
 * every profile field they had. Since this resets the caller's own login credentials whenever
 * they're the one handing over, a successful transfer signs them out immediately afterward. */
export function TransferAdminForm() {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const coopId = member?.id;
  const logout = useAuthStore((state) => state.logout);
  const transferAdmin = useTransferAdmin(coopId ?? "");

  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const phoneId = useId();

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    trigger,
    formState: { errors, isValid },
  } = useForm<TransferAdminFormValues>({
    resolver: zodResolver(transferAdminSchema),
    mode: "onChange",
    defaultValues: {
      newFirstName: "",
      newLastName: "",
      newEmail: "",
      newPhone: "",
    },
  });

  const onConfirm = handleSubmit(async (values) => {
    try {
      await transferAdmin.mutateAsync(values);
      toast.success("Admin role transferred", {
        description: `${values.newFirstName} ${values.newLastName} can now sign in as this co-operative's admin. You've been signed out.`,
      });
      reset();
      logout();
      router.push("/login");
    } catch (error) {
      toast.error("Couldn't transfer the admin role", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const busy = transferAdmin.isPending;

  return (
    <div className="max-w-xl space-y-4">
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
        This hands over full admin access to a new person immediately —
        you&apos;ll become a regular member of this co-operative and be signed
        out. This can&apos;t be undone from here.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={firstNameId}>New Admin&apos;s First Name</Label>
          <Input
            id={firstNameId}
            placeholder="Enter first name"
            disabled={busy}
            aria-invalid={!!errors.newFirstName}
            className="h-11"
            {...register("newFirstName")}
          />
          <FieldError message={errors.newFirstName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={lastNameId}>New Admin&apos;s Last Name</Label>
          <Input
            id={lastNameId}
            placeholder="Enter last name"
            disabled={busy}
            aria-invalid={!!errors.newLastName}
            className="h-11"
            {...register("newLastName")}
          />
          <FieldError message={errors.newLastName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={emailId}>New Admin&apos;s Email</Label>
          <Input
            id={emailId}
            type="email"
            placeholder="Enter email"
            disabled={busy}
            aria-invalid={!!errors.newEmail}
            className="h-11"
            {...register("newEmail")}
          />
          <FieldError message={errors.newEmail?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={phoneId}>New Admin&apos;s Phone</Label>
          <Input
            id={phoneId}
            placeholder="Enter phone number"
            disabled={busy}
            aria-invalid={!!errors.newPhone}
            className="h-11"
            {...register("newPhone")}
          />
          <FieldError message={errors.newPhone?.message} />
        </div>
      </div>

      <div className="flex justify-end">
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={async () => {
                  await trigger();
                }}
              />
            }
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Transferring…
              </>
            ) : (
              "Transfer Admin Role"
            )}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Transfer admin role?</AlertDialogTitle>
              <AlertDialogDescription>
                {isValid
                  ? `${getValues("newFirstName")} ${getValues("newLastName")} (${getValues("newEmail")}) will be able to sign in as this co-operative's admin immediately. You'll become a regular member and be signed out.`
                  : "Fill in the new admin's details above first."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={!isValid}
                onClick={() => onConfirm()}
              >
                Yes, transfer it
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive">
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
