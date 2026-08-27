import type { IdGenerationType } from "@/types/cooperative";

const DIGIT_ALPHABETS: Record<IdGenerationType, string> = {
  NUMERIC: "0123456789",
  ALPHA: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ALPHANUMERIC: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
};

/** Client-side mirror of CooperativeController.encodeBaseN — purely for the "Next ID would look
 * like" preview shown while editing the format; the real next id always comes from the backend's
 * next-id endpoint, which is what actually gets used when a co-op/member is created. */
export function previewGeneratedId(
  prefix: string,
  type: IdGenerationType,
  padding: number,
): string {
  const digits = DIGIT_ALPHABETS[type];
  const base = digits.length;
  const safePadding = Math.max(1, Math.min(10, padding || 1));

  let value = 1;
  let encoded = "";
  do {
    encoded = digits[value % base] + encoded;
    value = Math.floor(value / base);
  } while (value > 0);
  while (encoded.length < safePadding) {
    encoded = digits[0] + encoded;
  }

  return `${(prefix || "").toUpperCase()}-${encoded}`;
}

export const ID_GENERATION_TYPE_OPTIONS: {
  value: IdGenerationType;
  label: string;
}[] = [
  { value: "NUMERIC", label: "Numeric (0-9)" },
  { value: "ALPHA", label: "Alphabetical (A-Z)" },
  { value: "ALPHANUMERIC", label: "Alphanumeric (0-9, A-Z)" },
];
