/**
 * Finding a member by name or membership ID, forgivingly: "ade bola" finds "Bola Adeyemi",
 * "12", "0012" or "mb12" find "MB-0012", and case, dashes and spaces don't matter. Results come
 * back best match first: exact ID, then ID or name starting with what was typed, then the rest.
 */
export interface SearchableMember {
  id: string;
  name: string;
}

const compact = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");
const digits = (value: string) => value.replace(/\D/g, "").replace(/^0+/, "");

function score(member: SearchableMember, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const id = compact(member.id);
  const qc = compact(q);
  const name = member.name.toLowerCase();

  if (qc && id === qc) return 100;
  if (qc && id.startsWith(qc)) return 90;
  // "12" / "0012" against MB-0012: compare the number part, ignoring leading zeros.
  const qd = digits(q);
  if (qd && qd === compact(q).replace(/^0+/, "") && digits(member.id) === qd)
    return 85;
  if (name.startsWith(q)) return 80;

  const words = name.split(/\s+/);
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.every((token) => words.some((word) => word.startsWith(token))))
    return 70;
  if (tokens.every((token) => name.includes(token))) return 50;
  if (qc && id.includes(qc)) return 40;
  return 0;
}

export function searchMembers<T extends SearchableMember>(
  members: T[],
  query: string,
): T[] {
  if (!query.trim()) return members;
  return members
    .map((member) => ({ member, score: score(member, query) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) => b.score - a.score || a.member.name.localeCompare(b.member.name),
    )
    .map((entry) => entry.member);
}

/** Splits text into the parts that match the query (for highlighting) and the rest. */
export function highlightParts(
  text: string,
  query: string,
): { text: string; match: boolean }[] {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (tokens.length === 0) return [{ text, match: false }];
  const splitter = new RegExp(`(${tokens.join("|")})`, "gi");
  const matcher = new RegExp(`^(?:${tokens.join("|")})$`, "i");
  return text
    .split(splitter)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, match: matcher.test(part) }));
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    (
      (parts[0]?.[0] ?? "") +
      (parts.length > 1 ? parts[parts.length - 1][0] : "")
    ).toUpperCase() || "?"
  );
}
