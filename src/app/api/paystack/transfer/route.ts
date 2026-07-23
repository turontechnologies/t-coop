import { NextResponse } from "next/server";

interface PaystackRecipientResponse {
  status: boolean;
  message: string;
  data?: { recipient_code: string };
}

interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data?: { transfer_code: string; reference: string; status: string };
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

  const { accountNumber, bankCode, accountName, amount, reason } =
    await request.json();
  if (!accountNumber || !bankCode || !accountName || !amount) {
    return NextResponse.json(
      { error: "Missing recipient bank details or amount" },
      { status: 400 },
    );
  }

  const headers = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };

  try {
    const recipientResponse = await fetch(
      "https://api.paystack.co/transferrecipient",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "nuban",
          name: accountName,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: "NGN",
        }),
      },
    );
    const recipientResult: PaystackRecipientResponse =
      await recipientResponse.json();

    if (
      !recipientResponse.ok ||
      !recipientResult.status ||
      !recipientResult.data
    ) {
      return NextResponse.json(
        {
          error:
            recipientResult.message ||
            "Couldn't register this account for payout",
        },
        { status: 422 },
      );
    }

    const transferResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "balance",
        amount: Math.round(Number(amount) * 100),
        recipient: recipientResult.data.recipient_code,
        reason: reason || "T-Coop payout",
      }),
    });
    const transferResult: PaystackTransferResponse =
      await transferResponse.json();

    if (
      !transferResponse.ok ||
      !transferResult.status ||
      !transferResult.data
    ) {
      return NextResponse.json(
        { error: transferResult.message || "Transfer could not be initiated" },
        { status: 422 },
      );
    }

    return NextResponse.json({
      status: transferResult.data.status,
      transferCode: transferResult.data.transfer_code,
      reference: transferResult.data.reference,
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach Paystack to process this payout" },
      { status: 502 },
    );
  }
}
