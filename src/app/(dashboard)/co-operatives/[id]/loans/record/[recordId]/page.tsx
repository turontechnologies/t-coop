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
import { coopLoanStatusBadgeVariant, findCooperative } from "@/lib/coop-data";
import {
  generateLoanTransactions,
  generateRepaymentSchedule,
  type RepaymentStatus,
} from "@/lib/loans-data";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { formatDateLong, formatMoney } from "@/lib/format";
import { useCoopStore } from "@/store/coop.store";
import { cn } from "@/lib/utils";

interface CoopLoanRecordPageProps {
  params: Promise<{ id: string; recordId: string }>;
}

function repaymentBadgeVariant(status: RepaymentStatus) {
  if (status === "Paid") return "secondary";
  if (status === "Upcoming" || status === "Pending") return "outline";
  return "destructive";
}

export default function CoopLoanRecordPage({
  params,
}: CoopLoanRecordPageProps) {
  const { id, recordId } = use(params);
  const router = useRouter();
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const coop = findCooperative(cooperatives, id);
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
    <CurrencyProvider currency={coop.currency}>
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
            <Field
              label="Loan Amount"
              value={formatMoney(record.amount, coop.currency)}
            />
            <Field
              label="Interest Rate"
              value={`${record.interestRate}% flat`}
            />
            <Field label="Duration" value={`${record.durationMonths} months`} />
            <Field
              label="Monthly Repayment"
              value={formatMoney(record.monthlyRepayment, coop.currency)}
            />
            <Field
              label="Total Repayment"
              value={formatMoney(record.totalRepayment, coop.currency)}
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
            <Field label="Guarantor" value={record.guarantorName} />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                variant={coopLoanStatusBadgeVariant(record.status)}
                className={cn(
                  record.status === "Active" && "bg-success/15 text-success",
                  record.status === "Completed" && "bg-primary/10 text-primary",
                )}
              >
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
                            {formatMoney(item.amount, coop.currency)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatMoney(item.interest, coop.currency)}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            {formatMoney(item.totalAmount, coop.currency)}
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

                <MobileRecordList
                  isEmpty={schedule.length === 0}
                  emptyMessage="No repayment schedule yet."
                >
                  {schedule.map((item) => (
                    <MobileRecordCard
                      key={item.installment}
                      title={`Installment ${item.installment}`}
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
                          value: formatMoney(item.amount, coop.currency),
                        },
                        {
                          label: "Interest",
                          value: formatMoney(item.interest, coop.currency),
                        },
                        {
                          label: "Total Amount",
                          value: formatMoney(item.totalAmount, coop.currency),
                        },
                        {
                          label: "Due Date",
                          value: formatDateLong(new Date(item.dueDate)),
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
                              {formatMoney(transaction.amount, coop.currency)}
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
                          value: formatMoney(transaction.amount, coop.currency),
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
    </CurrencyProvider>
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
