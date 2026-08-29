"use client";

import { use, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import {
  generateLoanTransactions,
  generateRepaymentSchedule,
  type RepaymentStatus,
} from "@/lib/loans-data";
import type { CoopLoanStatus } from "@/lib/coop-data";
import { useCoopLoanRecord } from "@/hooks/use-coop-loans";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatDateLong, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

interface LoanDetailsPageProps {
  params: Promise<{ id: string }>;
}

function statusBadgeVariant(status: CoopLoanStatus) {
  if (status === "Active" || status === "Completed") return "secondary";
  if (status === "Awaiting Guarantor" || status === "Awaiting Admin")
    return "outline";
  return "destructive";
}

function repaymentBadgeVariant(status: RepaymentStatus) {
  if (status === "Paid") return "secondary";
  if (status === "Upcoming" || status === "Pending") return "outline";
  return "destructive";
}

export default function LoanDetailsPage({ params }: LoanDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { data: record, isLoading } = useCoopLoanRecord(id);
  const currency = useCurrency();

  const schedule = useMemo(
    () => (record ? generateRepaymentSchedule(record) : []),
    [record],
  );
  const transactions = useMemo(
    () => (record ? generateLoanTransactions(record) : []),
    [record],
  );

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (!record) {
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
        onClick={() => router.push("/loans")}
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
          <Field
            label="Loan Amount"
            value={formatMoney(record.amount, currency)}
          />
          <Field label="Interest Rate" value={`${record.interestRate}% flat`} />
          <Field label="Duration" value={`${record.durationMonths} months`} />
          <Field
            label="Monthly Repayment"
            value={formatMoney(record.monthlyRepayment, currency)}
          />
          <Field
            label="Total Repayment"
            value={formatMoney(record.totalRepayment, currency)}
          />
          <Field
            label="Date Applied"
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
          <Field label="Guarantor" value={record.guarantorName} />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge
              variant={statusBadgeVariant(record.status)}
              className={cn(
                record.status === "Active" && "bg-success/15 text-success",
                record.status === "Completed" && "bg-primary/10 text-primary",
              )}
            >
              {record.status}
            </Badge>
          </div>
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
              <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
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
                          {formatMoney(item.amount, currency)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatMoney(item.interest, currency)}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {formatMoney(item.totalAmount, currency)}
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

              <MobileRecordList>
                {schedule.map((item) => (
                  <MobileRecordCard
                    key={item.installment}
                    title={formatDateLong(new Date(item.dueDate))}
                    badge={
                      <Badge
                        variant={repaymentBadgeVariant(item.status)}
                        className={cn(
                          item.status === "Paid" &&
                            "bg-success/15 text-success",
                        )}
                      >
                        {item.status}
                      </Badge>
                    }
                    fields={[
                      {
                        label: "Amount",
                        value: formatMoney(item.amount, currency),
                      },
                      {
                        label: "Interest",
                        value: formatMoney(item.interest, currency),
                      },
                      {
                        label: "Total Amount",
                        value: formatMoney(item.totalAmount, currency),
                      },
                    ]}
                  />
                ))}
              </MobileRecordList>
            </TabsPanel>

            <TabsPanel value="transactions">
              <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
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
                            {formatMoney(transaction.amount, currency)}
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

              <MobileRecordList
                isEmpty={transactions.length === 0}
                emptyMessage="No repayment transactions yet."
              >
                {transactions.map((transaction) => (
                  <MobileRecordCard
                    key={transaction.transactionId}
                    title={transaction.transactionId}
                    badge={
                      <Badge
                        variant="secondary"
                        className="bg-success/15 text-success"
                      >
                        {transaction.status}
                      </Badge>
                    }
                    fields={[
                      {
                        label: "Amount",
                        value: formatMoney(transaction.amount, currency),
                      },
                      {
                        label: "Date",
                        value: formatDateLong(new Date(transaction.date)),
                      },
                      { label: "Method", value: transaction.method },
                    ]}
                  />
                ))}
              </MobileRecordList>
            </TabsPanel>
          </Tabs>
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
