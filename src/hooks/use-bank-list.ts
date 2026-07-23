import { useEffect, useState } from "react";
import type { BankDef } from "@/lib/bank-data";
import { fetchBanks } from "@/lib/bank-lookup";

// Module-level cache — the bank list is the same for every user/session and
// barely changes, so fetch it once per page load rather than once per
// mounted form.
let cachedBanks: BankDef[] | null = null;
let inFlight: Promise<BankDef[]> | null = null;

export function useBankList() {
  const [banks, setBanks] = useState<BankDef[]>(cachedBanks ?? []);
  const [loading, setLoading] = useState(!cachedBanks);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedBanks) return;

    inFlight ??= fetchBanks();
    inFlight
      .then((result) => {
        cachedBanks = result;
        setBanks(result);
      })
      .catch((err) => {
        inFlight = null;
        setError(err instanceof Error ? err.message : "Couldn't load banks");
      })
      .finally(() => setLoading(false));
  }, []);

  return { banks, loading, error };
}
