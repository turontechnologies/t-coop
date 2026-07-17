"use client";

import { use, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { findCooperative } from "@/lib/coop-data";
import { formatDateLong, formatNaira } from "@/lib/format";
import { useCoopStore } from "@/store/coop.store";
import { cn } from "@/lib/utils";

interface CoopSavingsRecordPageProps {
  params: Promise<{ id: string; recordId: string }>;
}

export default function CoopSavingsRecordPage({
  params,
}: CoopSavingsRecordPageProps) {
  const { id, recordId } = use(params);
  const router = useRouter();
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const coop = findCooperative(cooperatives, id);
  const record = coop?.savings.find((item) => item.id === recordId);
  const member = coop?.members.find((item) => item.id === record?.memberId);

  if (!coop || !record) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that savings record.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push(`/co-operatives/${id}`)}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Co-operative
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
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
          <Field label="Savings Amount" value={formatNaira(record.amount)} />
          <Field label="Method" value={record.method} />
          <Field
            label="Date Saved"
            value={formatDateLong(new Date(record.date))}
          />
          <Field
            label="Member"
            value={
              member ? (
                <Link
                  href={`/co-operatives/${coop.id}/members/${member.id}`}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {record.memberName}
                </Link>
              ) : (
                record.memberName
              )
            }
          />
          <Field
            label="Savings Balance"
            value={formatNaira(record.balanceAfter)}
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
