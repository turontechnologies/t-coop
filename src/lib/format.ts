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

const NAIRA_FORMATTER = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
});

export function formatNaira(amount: number): string {
  return `₦${NAIRA_FORMATTER.format(amount)}`;
}

export function formatDateLong(date: Date = new Date()): string {
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}
