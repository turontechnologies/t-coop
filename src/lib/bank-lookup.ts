import { apiClient } from "@/lib/axios";
import type { BankDef } from "@/lib/bank-data";

/** The full list of active, transfer-capable Nigerian banks (commercial, microfinance, PSB…) via
 * the backend's Paystack proxy (PaystackUtilityController), which uses the platform's own
 * Paystack key from Settings -> Integrations. */
export async function fetchBanks(): Promise<BankDef[]> {
  const { data } = await apiClient.get<{ banks: BankDef[] }>("/paystack/banks");
  return data.banks;
}

/** Resolves a real Nigerian bank account number to its registered account name via Paystack. */
export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<string> {
  const { data } = await apiClient.post<{ accountName: string }>(
    "/paystack/resolve-account",
    { accountNumber, bankCode },
  );
  return data.accountName;
}
