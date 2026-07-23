export interface InitiateTransferParams {
  accountNumber: string;
  bankCode: string;
  accountName: string;
  amount: number;
  reason: string;
}

export interface InitiateTransferResult {
  status: string;
  transferCode: string;
  reference: string;
}

/** Registers the recipient and initiates a real Paystack Transfer (payout). */
export async function initiateTransfer(
  params: InitiateTransferParams,
): Promise<InitiateTransferResult> {
  const response = await fetch("/api/paystack/transfer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Couldn't process this payout");
  }
  return data;
}

/** Completes a transfer that Paystack flagged as requiring OTP confirmation. */
export async function finalizeTransfer(
  transferCode: string,
  otp: string,
): Promise<string> {
  const response = await fetch("/api/paystack/transfer/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transferCode, otp }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Couldn't confirm this transfer");
  }
  return data.status;
}
