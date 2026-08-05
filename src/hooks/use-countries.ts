import { useEffect, useState } from "react";
import { fetchCountries } from "@/lib/geo-lookup";

// Module-level cache — same list for every user/session, fetch once per
// page load rather than once per mounted form (mirrors useBankList).
let cachedCountries: string[] | null = null;
let inFlight: Promise<string[]> | null = null;

export function useCountries() {
  const [countries, setCountries] = useState<string[]>(cachedCountries ?? []);
  const [loading, setLoading] = useState(!cachedCountries);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedCountries) return;

    inFlight ??= fetchCountries();
    inFlight
      .then((result) => {
        cachedCountries = result;
        setCountries(result);
      })
      .catch((err) => {
        inFlight = null;
        setError(
          err instanceof Error ? err.message : "Couldn't load countries",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return { countries, loading, error };
}
