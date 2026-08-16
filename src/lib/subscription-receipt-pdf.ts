import { jsPDF } from "jspdf";
import { formatNaira } from "@/lib/format";
import type { SubscriptionReceipt } from "@/types/subscription";

const LOGO_URL =
  "https://res.cloudinary.com/djstai84f/image/upload/v1784102518/Logo_1_kspxky.png";
const LOGO_ASPECT = 179 / 42;

const BRAND_GREEN: [number, number, number] = [0, 101, 74];
const BRAND_GREEN_DARK: [number, number, number] = [0, 50, 36];
const SUCCESS_GREEN: [number, number, number] = [16, 128, 82];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const BORDER: [number, number, number] = [226, 232, 240];

let logoDataUrlPromise: Promise<string | null> | null = null;

/** jsPDF needs a data URL, not a bare remote URL — fetched once and cached for the session. */
function loadLogoDataUrl(): Promise<string | null> {
  if (logoDataUrlPromise) return logoDataUrlPromise;
  logoDataUrlPromise = fetch(LOGO_URL)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise<string | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        }),
    )
    .catch(() => null);
  return logoDataUrlPromise;
}

function formatReceiptDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface DetailRow {
  label: string;
  value: string;
}

function receiptRows(receipt: SubscriptionReceipt): DetailRow[] {
  return [
    { label: "Payment Reference", value: receipt.paymentRef },
    { label: "Date", value: formatReceiptDate(receipt.date) },
    { label: "Co-operative", value: `${receipt.coopName} (${receipt.coopId})` },
    { label: "Paid By", value: receipt.adminName },
    { label: "Subscription Type", value: receipt.type },
    { label: "Billing Cycle", value: receipt.cycle },
    { label: "Payment Method", value: receipt.method },
    {
      label: "Next Renewal Date",
      value: formatReceiptDate(receipt.nextRenewalDate),
    },
  ];
}

/** Builds the receipt as a jsPDF document — used both to preview inline and to download. */
export async function buildSubscriptionReceiptPdf(
  receipt: SubscriptionReceipt,
): Promise<jsPDF> {
  const width = 380;
  const rows = receiptRows(receipt);
  const rowHeight = 34;
  const headerHeight = 132;
  const amountBlockHeight = 96;
  const rowsHeight = rows.length * rowHeight;
  const footerHeight = 110;
  const height = headerHeight + amountBlockHeight + rowsHeight + footerHeight;

  const doc = new jsPDF({ unit: "pt", format: [width, height] });
  const margin = 28;
  const contentWidth = width - margin * 2;

  // Header band
  doc.setFillColor(...BRAND_GREEN_DARK);
  doc.rect(0, 0, width, headerHeight, "F");
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, width, headerHeight - 18, "F");

  const logoDataUrl = await loadLogoDataUrl();
  const logoWidth = 108;
  const logoHeight = logoWidth / LOGO_ASPECT;
  if (logoDataUrl) {
    try {
      doc.addImage(
        logoDataUrl,
        "PNG",
        (width - logoWidth) / 2,
        26,
        logoWidth,
        logoHeight,
      );
    } catch {
      // If the logo can't be embedded (e.g. offline), the receipt still renders fine without it.
    }
  }
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT RECEIPT", width / 2, 26 + logoHeight + 24, {
    align: "center",
  });

  let y = headerHeight + 8;

  // Success badge + amount
  doc.setFillColor(...SUCCESS_GREEN);
  doc.circle(width / 2, y + 22, 16, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.line(width / 2 - 7, y + 22, width / 2 - 2, y + 28);
  doc.line(width / 2 - 2, y + 28, width / 2 + 8, y + 14);

  y += 52;
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Amount Paid", width / 2, y, { align: "center" });

  y += 26;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text(formatNaira(receipt.amountPaid), width / 2, y, { align: "center" });

  y += 18;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SUCCESS_GREEN);
  doc.text("PAYMENT SUCCESSFUL", width / 2, y, { align: "center" });

  y += 20;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(1);
  doc.line(margin, y, width - margin, y);

  // Details rows
  y += 26;
  doc.setFontSize(9.5);
  for (const row of rows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(row.label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    doc.text(row.value, width - margin, y, {
      align: "right",
      maxWidth: contentWidth * 0.6,
    });
    y += rowHeight;
  }

  // Footer
  y += 6;
  doc.setDrawColor(...BORDER);
  doc.setLineDashPattern([3, 2], 0);
  doc.line(margin, y, width - margin, y);
  doc.setLineDashPattern([], 0);

  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("Thank you for subscribing to T-Cooperative", width / 2, y, {
    align: "center",
  });

  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    "This is an official receipt issued by Turon Technologies.",
    width / 2,
    y,
    {
      align: "center",
    },
  );
  y += 12;
  doc.text("Questions? support@turon.tech", width / 2, y, { align: "center" });

  return doc;
}

export async function downloadSubscriptionReceipt(
  receipt: SubscriptionReceipt,
): Promise<void> {
  const doc = await buildSubscriptionReceiptPdf(receipt);
  doc.save(`T-Cooperative-Receipt-${receipt.paymentRef}.pdf`);
}
