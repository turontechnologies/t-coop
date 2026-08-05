/**
 * Best-effort IP-based geolocation for the audit log — free, keyless,
 * CORS-open, so called directly from the browser (same pattern as
 * geo-lookup.ts's countriesnow.space). This resolves the request's public
 * IP to an approximate city/region/country — not GPS-accurate, and
 * meaningless for local/dev network requests (those typically resolve to
 * the ISP's nearest point of presence).
 */
export async function fetchApproximateLocation(): Promise<string> {
  const response = await fetch("https://ipwho.is/");
  if (!response.ok) throw new Error("Couldn't resolve location");
  const data = await response.json();
  if (!data.success) throw new Error("Couldn't resolve location");
  const parts = [data.city, data.region, data.country].filter(Boolean);
  if (parts.length === 0) throw new Error("Couldn't resolve location");
  return parts.join(", ");
}
