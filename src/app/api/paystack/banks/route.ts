import { NextResponse } from "next/server";

interface PaystackBank {
  name: string;
  code: string;
  active: boolean;
  is_deleted: boolean;
  supports_transfer: boolean;
  type: string;
}

interface PaystackBanksResponse {
  status: boolean;
  message: string;
  data?: PaystackBank[];
}

// Paystack's bank list barely changes — cache it for an hour instead of
// hitting their API on every page load.
export const revalidate = 3600;

export async function GET() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      {
        error:
          "Paystack isn't configured yet — add PAYSTACK_SECRET_KEY to .env.local.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://api.paystack.co/bank?currency=NGN", {
      headers: { Authorization: `Bearer ${secretKey}` },
      next: { revalidate: 3600 },
    });
    const result: PaystackBanksResponse = await response.json();

    if (!response.ok || !result.status || !result.data) {
      return NextResponse.json(
        { error: result.message || "Couldn't load the bank list" },
        { status: 502 },
      );
    }

    const banks = result.data
      .filter(
        (bank) => bank.active && !bank.is_deleted && bank.supports_transfer,
      )
      .map((bank) => ({ name: bank.name, code: bank.code }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Paystack's real bank codes are capped at 3 live account-resolves/day
    // even in test mode. "001" is a special sandbox code — not a real bank,
    // so it's absent from this list — that Paystack's own resolve endpoint
    // accepts unlimited times, always returning a fake "TEST ACCOUNT ..."
    // name. Prepended here so verifying the resolve flow doesn't burn the
    // real quota; it's clearly labeled and genuinely cannot be used to
    // create a Transfer Recipient (Paystack rejects it as an invalid bank
    // code), so it's only useful for the preview step, not a real payout.
    const withSandbox = [
      {
        name: "Test Bank (sandbox preview only — not for payouts)",
        code: "001",
      },
      ...banks,
    ];

    return NextResponse.json({ banks: withSandbox });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach Paystack to load the bank list" },
      { status: 502 },
    );
  }
}
