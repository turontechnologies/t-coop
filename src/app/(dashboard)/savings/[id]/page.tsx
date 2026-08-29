"use client";

import { use, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCoopSavingsRecord } from "@/hooks/use-coop-savings";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatDateLong, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SavingsDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function SavingsDetailsPage({
  params,
}: SavingsDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: record, isLoading } = useCoopSavingsRecord(id);
  const currency = useCurrency();

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (!record) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that savings record.
        </p>
        <Button variant="outline" onClick={() => router.push("/savings")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Savings & Contributions
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/savings")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Savings Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Savings Type" value={record.savingsType} />
          <Field
            label="Savings Amount"
            value={formatMoney(record.amount, currency)}
          />
          <Field label="Method" value={record.method} />
          <Field
            label="Date Saved"
            value={formatDateLong(new Date(record.date))}
          />
          <Field
            label="Member"
            value={
              <Link
                href="/profile"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {record.memberName}
              </Link>
            }
          />
          <Field
            label="Savings Balance"
            value={formatMoney(record.balanceAfter, currency)}
          />
          <Field label="Transaction ID" value={record.transactionId} />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge
              variant={
                record.status === "Success"
                  ? "secondary"
                  : record.status === "Pending"
                    ? "outline"
                    : "destructive"
              }
              className={cn(
                record.status === "Success" && "bg-success/15 text-success",
              )}
            >
              {record.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
