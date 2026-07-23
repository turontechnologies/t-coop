import type { BankDef } from "@/lib/bank-data";

/** The full list of active, transfer-capable Nigerian banks (commercial, microfinance, PSB…) via Paystack. */
export async function fetchBanks(): Promise<BankDef[]> {
  const response = await fetch("/api/paystack/banks");
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Couldn't load the bank list");
  }
  return data.banks;
}

/** Resolves a real Nigerian bank account number to its registered account name via Paystack. */
export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<string> {
  const response = await fetch("/api/paystack/resolve-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountNumber, bankCode }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Couldn't verify that account number");
  }
  return data.accountName;
}
