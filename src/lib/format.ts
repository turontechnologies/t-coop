import { findCurrency } from "@/lib/currency-data";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatTodayLong(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
  return initials.join("");
}

const AMOUNT_FORMATTER = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
});

/**
 * The one money formatter used everywhere — pass the co-operative's own
 * currency (from `useCurrency()`) so every amount on an admin/member page
 * reflects what that co-op actually set, not a hardcoded Naira.
 */
export function formatMoney(amount: number, currencyCode = "NGN"): string {
  const symbol = findCurrency(currencyCode)?.symbol ?? `${currencyCode} `;
  return `${symbol}${AMOUNT_FORMATTER.format(amount)}`;
}

/** NGN-specific — kept for platform-level figures (e.g. subscription revenue) that are intentionally always in the platform's own currency, not a co-op's. */
export function formatNaira(amount: number): string {
  return formatMoney(amount, "NGN");
}

export function formatDateLong(date: Date = new Date()): string {
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const datePart = formatDateLong(date);
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}

export function formatTimeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.round(diffMs / 60_000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateLong(new Date(iso));
}
