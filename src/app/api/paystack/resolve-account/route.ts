import { NextResponse } from "next/server";

interface PaystackResolveResponse {
  status: boolean;
  message: string;
  data?: { account_number: string; account_name: string; bank_id: number };
}

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      {
        error:
          "Paystack isn't configured for bank verification yet — add PAYSTACK_SECRET_KEY to .env.local.",
      },
      { status: 503 },
    );
  }

  const { accountNumber, bankCode } = await request.json();
  if (!accountNumber || !bankCode) {
    return NextResponse.json(
      { error: "Account number and bank are required" },
      { status: 400 },
    );
  }

  const url = `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const result: PaystackResolveResponse = await response.json();

    if (!response.ok || !result.status || !result.data) {
      return NextResponse.json(
        { error: result.message || "Couldn't verify that account number" },
        { status: response.status === 200 ? 422 : response.status },
      );
    }

    return NextResponse.json({ accountName: result.data.account_name });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach Paystack to verify this account" },
      { status: 502 },
    );
  }
}
