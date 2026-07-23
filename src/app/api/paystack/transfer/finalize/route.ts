import { NextResponse } from "next/server";

interface PaystackFinalizeResponse {
  status: boolean;
  message: string;
  data?: { status: string };
}

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      {
        error:
          "Paystack isn't configured for payouts yet — add PAYSTACK_SECRET_KEY to .env.local.",
      },
      { status: 503 },
    );
  }

  const { transferCode, otp } = await request.json();
  if (!transferCode || !otp) {
    return NextResponse.json(
      { error: "Transfer code and OTP are required" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      "https://api.paystack.co/transfer/finalize_transfer",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transfer_code: transferCode, otp }),
      },
    );
    const result: PaystackFinalizeResponse = await response.json();

    if (!response.ok || !result.status || !result.data) {
      return NextResponse.json(
        { error: result.message || "Couldn't confirm this transfer" },
        { status: 422 },
      );
    }

    return NextResponse.json({ status: result.data.status });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach Paystack to confirm this transfer" },
      { status: 502 },
    );
  }
}
