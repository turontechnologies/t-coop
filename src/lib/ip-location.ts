/**
 * Best-effort IP-based geolocation for the audit log — free, keyless,
 * CORS-open, so called directly from the browser (same pattern as
 * geo-lookup.ts's countriesnow.space). This resolves the request's public
 * IP to an approximate city/region/country — not GPS-accurate, and
 * meaningless for local/dev network requests (those typically resolve to
 * the ISP's nearest point of presence). The same lookup also returns the
 * public IP itself, so one call fills both the Location and IP Address
 * audit-log columns.
 */
export interface ApproximateLocation {
  location: string;
  ipAddress: string;
}

export async function fetchApproximateLocation(): Promise<ApproximateLocation> {
  const response = await fetch("https://ipwho.is/");
  if (!response.ok) throw new Error("Couldn't resolve location");
  const data = await response.json();
  if (!data.success) throw new Error("Couldn't resolve location");
  const parts = [data.city, data.region, data.country].filter(Boolean);
  if (parts.length === 0) throw new Error("Couldn't resolve location");
  return { location: parts.join(", "), ipAddress: data.ip ?? "Unknown" };
}
