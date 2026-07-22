"use client";

import { use, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { coopLoanStatusBadgeVariant } from "@/lib/coop-data";
import { getDirectoryCoop } from "@/lib/member-directory";
import {
  generateLoanTransactions,
  generateRepaymentSchedule,
  type RepaymentStatus,
} from "@/lib/loans-data";
import { formatDateLong, formatNaira } from "@/lib/format";
import { useCoopStore } from "@/store/coop.store";
import { cn } from "@/lib/utils";

interface AdminLoanRecordPageProps {
  params: Promise<{ recordId: string }>;
}

function repaymentBadgeVariant(status: RepaymentStatus) {
  if (status === "Paid") return "secondary";
  if (status === "Upcoming" || status === "Pending") return "outline";
  return "destructive";
}

export default function AdminLoanRecordPage({
  params,
}: AdminLoanRecordPageProps) {
  const { recordId } = use(params);
  const router = useRouter();
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const coop = getDirectoryCoop(cooperatives);
  const record = coop?.loans.find((item) => item.id === recordId);
  const member = coop?.members.find((item) => item.id === record?.memberId);

  const schedule = useMemo(
    () => (record ? generateRepaymentSchedule(record) : []),
    [record],
  );
  const transactions = useMemo(
    () => (record ? generateLoanTransactions(record) : []),
    [record],
  );

  if (!coop || !record) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that loan record.
        </p>
        <Button variant="outline" onClick={() => router.push("/loans")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Loans
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
          <CardTitle>Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Loan Type" value={record.loanType} />
          <Field label="Loan Amount" value={formatNaira(record.amount)} />
          <Field label="Interest Rate" value={`${record.interestRate}% flat`} />
          <Field label="Duration" value={`${record.durationMonths} months`} />
          <Field
            label="Monthly Repayment"
            value={formatNaira(record.monthlyRepayment)}
          />
          <Field
            label="Total Repayment"
            value={formatNaira(record.totalRepayment)}
          />
          <Field
            label="Date Applied"
            value={formatDateLong(new Date(record.date))}
          />
          <Field
            label="Member"
            value={
              member ? (
                <Link
                  href={`/members/${member.id}`}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {record.memberName}
                </Link>
              ) : (
                record.memberName
              )
            }
          />
          <Field label="Guarantor" value={record.guarantorName} />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant={coopLoanStatusBadgeVariant(record.status)}>
              {record.status}
            </Badge>
          </div>
          {record.rejectionReason ? (
            <Field
              label="Rejection Reason"
              value={record.rejectionReason}
              className="sm:col-span-2 lg:col-span-4"
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Tabs defaultValue="schedule">
            <TabsList>
              <TabsTab value="schedule">Repayment Schedule</TabsTab>
              <TabsTab value="transactions">Transactions</TabsTab>
              <TabsIndicator />
            </TabsList>

            <TabsPanel value="schedule">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-accent/60">
                      <th className="px-4 py-2.5 font-medium text-foreground">
                        Amount
                      </th>
                      <th className="px-4 py-2.5 font-medium text-foreground">
                        Interest
                      </th>
                      <th className="px-4 py-2.5 font-medium text-foreground">
                        Total Amount
                      </th>
                      <th className="px-4 py-2.5 font-medium text-foreground">
                        Due Date
                      </th>
                      <th className="px-4 py-2.5 font-medium text-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((item) => (
                      <tr
                        key={item.installment}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 text-foreground">
                          {formatNaira(item.amount)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatNaira(item.interest)}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {formatNaira(item.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateLong(new Date(item.dueDate))}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={repaymentBadgeVariant(item.status)}
                            className={cn(
                              item.status === "Paid" &&
                                "bg-success/15 text-success",
                            )}
                          >
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsPanel>

            <TabsPanel value="transactions">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-accent/60">
                      <th className="px-4 py-2.5 font-medium text-foreground">
                        Transaction ID
                      </th>
                      <th className="px-4 py-2.5 font-medium text-foreground">
                        Amount
                      </th>
                      <th className="px-4 py-2.5 font-medium text-foreground">
                        Date
                      </th>
                      <th className="px-4 py-2.5 font-medium text-foreground">
                        Method
                      </th>
                      <th className="px-4 py-2.5 font-medium text-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No repayment transactions yet.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => (
                        <tr
                          key={transaction.transactionId}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {transaction.transactionId}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {formatNaira(transaction.amount)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDateLong(new Date(transaction.date))}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {transaction.method}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="secondary"
                              className="bg-success/15 text-success"
                            >
                              {transaction.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
