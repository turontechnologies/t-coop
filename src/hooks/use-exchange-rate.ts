import { useEffect, useRef, useState } from "react";
import { fetchExchangeRate } from "@/lib/exchange-rate";

const DEFAULT_POLL_MS = 5 * 60_000; // provider itself only refreshes ~daily; this just keeps the UI current

interface UseExchangeRateResult {
  rate: number | null;
  asOf: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Live from→to conversion rate, refetched on mount and on an interval. */
export function useExchangeRate(
  from: string,
  to: string,
  pollMs: number = DEFAULT_POLL_MS,
): UseExchangeRateResult {
  const [rate, setRate] = useState<number | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchExchangeRate(from, to)
      .then((result) => {
        if (!mounted.current) return;
        setRate(result.rate);
        setAsOf(result.asOf);
      })
      .catch((err) => {
        if (!mounted.current) return;
        setError(
          err instanceof Error ? err.message : "Couldn't fetch exchange rate",
        );
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });
  }, [from, to, tick]);

  useEffect(() => {
    if (pollMs <= 0) return;
    const interval = setInterval(() => setTick((t) => t + 1), pollMs);
    return () => clearInterval(interval);
  }, [pollMs]);

  return {
    rate,
    asOf,
    loading,
    error,
    refresh: () => setTick((t) => t + 1),
  };
}
