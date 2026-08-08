"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { findCurrency } from "@/lib/currency-data";
import { formatTimeAgo } from "@/lib/format";

interface CoopCurrencyDisplayProps {
  currency: string;
  baseCurrency?: string;
  /** Compact = inline text for a table cell; full = card-style with a refresh button and timestamp. */
  variant?: "compact" | "full";
}

export function CoopCurrencyDisplay({
  currency,
  baseCurrency = "NGN",
  variant = "compact",
}: CoopCurrencyDisplayProps) {
  const { rate, asOf, loading, error, refresh } = useExchangeRate(
    currency,
    baseCurrency,
  );
  const currencyDef = findCurrency(currency);
  const sameCurrency = currency === baseCurrency;

  if (variant === "compact") {
    return (
      <div className="space-y-0.5">
        <Badge variant="outline" className="font-medium">
          {currency}
        </Badge>
        {!sameCurrency ? (
          <p className="text-xs text-muted-foreground">
            {loading ? (
              "Loading rate…"
            ) : error || rate === null ? (
              "Rate unavailable"
            ) : (
              <>
                1 {currency} ≈ {rate.toFixed(2)} {baseCurrency}
              </>
            )}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Currency</p>
          <p className="text-sm font-semibold text-foreground">
            {currencyDef ? `${currencyDef.name} (${currency})` : currency}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="Refresh exchange rate"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCcw className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {sameCurrency ? (
        <p className="text-xs text-muted-foreground">
          Same as the platform base currency ({baseCurrency}) — no conversion
          needed.
        </p>
      ) : error || rate === null ? (
        <p className="text-xs text-destructive">
          {loading ? "Loading rate…" : "Couldn't fetch a live rate."}
        </p>
      ) : (
        <div className="space-y-0.5">
          <p className="text-sm text-foreground">
            1 {currency} ≈{" "}
            {rate.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
            {baseCurrency}
          </p>
          <p className="text-xs text-muted-foreground">
            Live rate — refreshed{" "}
            {asOf ? formatTimeAgo(new Date(asOf).toISOString()) : "just now"}
          </p>
        </div>
      )}
    </div>
  );
}
