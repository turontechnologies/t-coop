import { useEffect, useState } from "react";
import { fetchExchangeRate } from "@/lib/exchange-rate";

interface AggregateItem {
  amount: number;
  currency: string;
}

interface UseAggregateInCurrencyResult {
  total: number | null;
  loading: boolean;
}

/**
 * Sums amounts that may be in different currencies into one figure, in
 * `targetCurrency` — the one place in the app that genuinely needs a live
 * conversion (summing several co-ops' savings totals, each possibly in a
 * different currency, into a single platform-wide figure). Everywhere else
 * a co-op's amounts are just displayed in that co-op's own currency
 * (`formatMoney(amount, useCurrency())`) with no conversion math needed.
 */
export function useAggregateInCurrency(
  items: AggregateItem[],
  targetCurrency = "NGN",
): UseAggregateInCurrencyResult {
  const currencyKey = [...new Set(items.map((item) => item.currency))]
    .sort()
    .join(",");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const uniqueCurrencies = currencyKey ? currencyKey.split(",") : [];

    if (uniqueCurrencies.length === 0) {
      setRates({});
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(
      uniqueCurrencies.map((currency) =>
        fetchExchangeRate(currency, targetCurrency).then(
          (result) => [currency, result.rate] as const,
        ),
      ),
    )
      .then((entries) => {
        if (!cancelled) setRates(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setRates({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currencyKey, targetCurrency]);

  if (loading) return { total: null, loading: true };
  if (currencyKey === "") return { total: 0, loading: false };

  const allRatesKnown = [...new Set(items.map((item) => item.currency))].every(
    (currency) => currency in rates,
  );
  if (!allRatesKnown) return { total: null, loading: false };

  const total = items.reduce(
    (acc, item) => acc + item.amount * (rates[item.currency] ?? 0),
    0,
  );
  return { total, loading: false };
}
