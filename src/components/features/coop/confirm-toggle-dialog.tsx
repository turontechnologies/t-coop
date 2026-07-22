"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
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

interface ConfirmToggleDialogProps {
  /** The element AlertDialogTrigger renders as (e.g. a Button or icon button). */
  trigger: ReactElement;
  /** Visible trigger content (icon/label), separate from the styled `trigger` element. */
  children: ReactNode;
  /** e.g. "Member", "Co-operative" — used as "Disable {entityLabel}" / "Activate {entityLabel}". */
  entityLabel: string;
  /** The specific name shown in the confirmation description, e.g. a member's or co-op's name. */
  name: string;
  isActive: boolean;
  onConfirm: () => Promise<void> | void;
}

export function ConfirmToggleDialog({
  trigger,
  children,
  entityLabel,
  name,
  isActive,
  onConfirm,
}: ConfirmToggleDialogProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const action = isActive ? "Disable" : "Activate";

  const handleConfirm = async () => {
    setBusy(true);
    await onConfirm();
    setBusy(false);
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger}>{children}</AlertDialogTrigger>
      <AlertDialogContent onClick={(event) => event.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action} {entityLabel}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to {action.toLowerCase()} &quot;{name}&quot;?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isActive ? "destructive" : "default"}
            disabled={busy}
            onClick={handleConfirm}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              action
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
