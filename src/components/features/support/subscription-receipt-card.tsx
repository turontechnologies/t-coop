"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/format";
import { downloadSubscriptionReceipt } from "@/lib/subscription-receipt-pdf";
import type { SubscriptionReceipt } from "@/types/subscription";

const LOGO_URL =
  "https://res.cloudinary.com/djstai84f/image/upload/v1784102518/Logo_1_kspxky.png";

interface SubscriptionReceiptCardProps {
  receipt: SubscriptionReceipt;
}

/** Opay-style branded receipt — shown immediately after a successful payment, and reused for
 * any historical payment re-opened from the transaction history list below. */
export function SubscriptionReceiptCard({
  receipt,
}: SubscriptionReceiptCardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadSubscriptionReceipt(receipt);
    } catch (error) {
      toast.error("Couldn't generate the receipt", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setDownloading(false);
    }
  };

  const rows: { label: string; value: string }[] = [
    { label: "Payment Reference", value: receipt.paymentRef },
    {
      label: "Date",
      value: new Date(receipt.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
    { label: "Co-operative", value: `${receipt.coopName} (${receipt.coopId})` },
    { label: "Paid By", value: receipt.adminName },
    { label: "Subscription Type", value: receipt.type },
    { label: "Billing Cycle", value: receipt.cycle },
    { label: "Payment Method", value: receipt.method },
    {
      label: "Next Renewal Date",
      value: new Date(receipt.nextRenewalDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="bg-gradient-to-b from-[#00654A] via-[#00543D] to-[#003224] px-6 pt-7 pb-5 text-center">
        <Image
          src={LOGO_URL}
          alt="T-Cooperative"
          width={128}
          height={30}
          className="mx-auto"
          unoptimized
        />
        <p className="mt-4 text-xs font-semibold tracking-wide text-white/70 uppercase">
          Payment Receipt
        </p>
      </div>

      <div className="space-y-5 px-6 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </span>
          <p className="text-xs text-muted-foreground">Amount Paid</p>
          <p className="text-3xl font-bold text-foreground">
            {formatNaira(receipt.amountPaid)}
          </p>
          <p className="text-xs font-semibold tracking-wide text-success uppercase">
            Payment Successful
          </p>
        </div>

        <div className="h-px bg-border" />

        <dl className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4 text-sm"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-medium text-foreground">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="border-t border-dashed border-border pt-4 text-center">
          <p className="text-sm font-semibold text-foreground">
            Thank you for subscribing to T-Cooperative
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This is an official receipt issued by Turon Technologies.
          </p>
        </div>

        <Button
          className="w-full"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Preparing PDF…
            </>
          ) : (
            <>
              <Download className="size-4" aria-hidden="true" />
              Download Receipt
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
