/**
 * Live currency conversion — free, keyless, CORS-open (same pattern as
 * geo-lookup.ts / ip-location.ts), so called directly from the browser.
 * The provider (open.er-api.com, backed by exchangerate-api.com's free
 * tier) refreshes its rates roughly once every 24 hours, not tick-by-tick —
 * "real-time" here means the UI always shows whatever the latest rate the
 * provider has, polled on an interval, not a live market feed.
 */
export interface ExchangeRateResult {
  rate: number;
  asOf: string;
}

export async function fetchExchangeRate(
  from: string,
  to: string,
): Promise<ExchangeRateResult> {
  if (from === to) {
    return { rate: 1, asOf: new Date().toISOString() };
  }
  const response = await fetch(
    `https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`,
  );
  if (!response.ok) throw new Error("Couldn't fetch exchange rate");
  const data = await response.json();
  if (data.result !== "success")
    throw new Error("Couldn't fetch exchange rate");
  const rate = data.rates?.[to];
  if (typeof rate !== "number") {
    throw new Error(`No rate available for ${from} → ${to}`);
  }
  return {
    rate,
    asOf: data.time_last_update_utc ?? new Date().toISOString(),
  };
}
