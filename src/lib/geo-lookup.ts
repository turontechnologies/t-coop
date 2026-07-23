/**
 * Live country/state/city data via countriesnow.space — free, keyless,
 * CORS-open, so called directly from the browser rather than proxied
 * through a server route. Its POST-with-JSON-body form (as documented)
 * now 301-redirects to an equivalent GET+query-string URL, so this calls
 * that GET form directly rather than following the redirect.
 */
const BASE = "https://countriesnow.space/api/v0.1/countries";

export async function fetchCountries(): Promise<string[]> {
  const response = await fetch(`${BASE}/positions`);
  if (!response.ok) throw new Error("Couldn't load countries");
  const json = await response.json();
  return (json.data as { name: string }[])
    .map((country) => country.name)
    .sort((a, b) => a.localeCompare(b));
}

export async function fetchStates(country: string): Promise<string[]> {
  const response = await fetch(
    `${BASE}/states/q?country=${encodeURIComponent(country)}`,
  );
  if (!response.ok) throw new Error("Couldn't load states");
  const json = await response.json();
  const states = (json.data?.states ?? []) as { name: string }[];
  return states.map((state) => state.name);
}

export async function fetchCities(
  country: string,
  state: string,
): Promise<string[]> {
  const response = await fetch(
    `${BASE}/state/cities/q?country=${encodeURIComponent(country)}&state=${encodeURIComponent(state)}`,
  );
  if (!response.ok) throw new Error("Couldn't load cities");
  const json = await response.json();
  return (json.data ?? []) as string[];
}
