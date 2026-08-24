import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { resolveBankAccount } from "@/lib/bank-lookup";

interface UseAutoVerifyBankAccountOptions {
  bankCode: string | undefined;
  accountNumber: string | undefined;
  onVerified: (accountName: string) => void;
  onError?: (message: string) => void;
  /** Seeds the "already attempted" state so an already-saved, already-verified account doesn't
   * re-hit the bank the moment the form mounts. */
  initialBankCode?: string;
  initialAccountNumber?: string;
  initialAccountName?: string;
}

/**
 * OPay-style instant bank verification — no "Verify" button, no click required. Fires the moment
 * a bank is selected and the account number reaches 10 digits, and never fires twice for the same
 * bank+number pair. Extracted from the pattern first built for the Collection Account settings
 * form so every "bank + account number" field in the app behaves identically.
 */
export function useAutoVerifyBankAccount({
  bankCode,
  accountNumber,
  onVerified,
  onError,
  initialBankCode,
  initialAccountNumber,
  initialAccountName,
}: UseAutoVerifyBankAccountOptions) {
  const [verifying, setVerifying] = useState(false);
  const lastAttemptRef = useRef<string | null>(
    initialAccountName && initialBankCode && initialAccountNumber
      ? `${initialBankCode}:${initialAccountNumber}`
      : null,
  );

  useEffect(() => {
    if (!bankCode || accountNumber?.length !== 10) {
      lastAttemptRef.current = null;
      return;
    }

    const attemptKey = `${bankCode}:${accountNumber}`;
    if (lastAttemptRef.current === attemptKey) return;
    lastAttemptRef.current = attemptKey;

    let cancelled = false;
    setVerifying(true);
    resolveBankAccount(accountNumber, bankCode)
      .then((resolvedName) => {
        if (cancelled) return;
        onVerified(resolvedName);
        toast.success("Account verified", { description: resolvedName });
      })
      .catch((error) => {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Couldn't verify that account";
        onError?.(message);
        toast.error("Couldn't verify that account", { description: message });
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });

    return () => {
      cancelled = true;
    };
    // onVerified/onError are re-created every render at most call sites; the attemptKey dedup
    // above already guards against a duplicate network call, so re-running this effect on their
    // identity change is harmless — deliberately omitted rather than wrapped in useCallback
    // everywhere they're passed in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankCode, accountNumber]);

  return { verifying };
}
