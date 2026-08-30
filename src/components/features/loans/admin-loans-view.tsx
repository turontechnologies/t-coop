"use client";

import { useMemo, useState } from "react";
import { Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CoopLoansSummaryTable } from "@/components/features/coop/coop-loans-summary-table";
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import { LoanRequestsTable } from "@/components/features/loans/loan-requests-table";
import { MemberLoansView } from "@/components/features/loans/member-loans-view";
import type { CoopLoanRecord } from "@/lib/coop-data";
import { useCooperative } from "@/hooks/use-cooperative";
import { useCoopLoanRecords, useCoopLoanTypes } from "@/hooks/use-coop-loans";
import { formatMoney } from "@/lib/format";
import type { ExportColumn } from "@/lib/table-export";
import { useTabAccess } from "@/hooks/use-permission";
import type { AuthenticatedMember } from "@/types/auth";
import type { CoopLoanTypeSummary } from "@/types/coop-loans";

type AdminLoansTab = "requests" | "members" | "my";

const MODULE = "Loans";

const TYPE_EXPORT_COLUMNS: ExportColumn<CoopLoanTypeSummary>[] = [
  { header: "Loan Type", accessor: (row) => row.name },
  { header: "Eligibility %", accessor: (row) => row.eligibilityPercent },
  { header: "Loan Duration", accessor: (row) => row.durationMonths },
  { header: "No of Repayments", accessor: (row) => row.numberOfRepayments },
  { header: "Interest", accessor: (row) => row.interestRate },
  { header: "Earnings on Loan", accessor: (row) => row.earnings },
];

const REQUEST_EXPORT_COLUMNS: ExportColumn<CoopLoanRecord>[] = [
  { header: "Members Id", accessor: (row) => row.memberId },
  { header: "Full Name", accessor: (row) => row.memberName },
  { header: "Loan Type", accessor: (row) => row.loanType },
  { header: "Loan Amount", accessor: (row) => row.amount },
  { header: "No of Repayments", accessor: (row) => row.numberOfRepayments },
  { header: "Date", accessor: (row) => row.date },
  { header: "Status", accessor: (row) => row.status },
];

interface AdminLoansViewProps {
  member: AuthenticatedMember;
}

export function AdminLoansView({ member }: AdminLoansViewProps) {
  const coopId = member.id;
  const { data: coop } = useCooperative(coopId);
  const { data: totalsByType = [] } = useCoopLoanTypes(coopId);
  const { data: allLoans = [] } = useCoopLoanRecords(coopId);
  const { data: myRecords = [] } = useCoopLoanRecords(coopId, {
    memberId: member.id,
  });

  const myTotal = useMemo(
    () =>
      myRecords
        .filter(
          (record) =>
            record.status === "Active" ||
            record.status === "Awaiting Guarantor" ||
            record.status === "Awaiting Admin",
        )
        .reduce((sum, record) => sum + record.amount, 0),
    [myRecords],
  );

  const requestsAccess = useTabAccess(MODULE, "Requests");
  const membersAccess = useTabAccess(MODULE, "Members Loans");
  const myAccess = useTabAccess(MODULE, "My Loans");
  const firstVisibleTab: AdminLoansTab =
    requestsAccess !== null
      ? "requests"
      : membersAccess !== null
        ? "members"
        : "my";

  const [activeTab, setActiveTab] = useState<AdminLoansTab>(firstVisibleTab);
  const [myTakeOpen, setMyTakeOpen] = useState(false);

  if (!coop) {
    return (
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t find your co-operative.
      </p>
    );
  }

  if (requestsAccess === null && membersAccess === null && myAccess === null) {
    return (
      <p className="text-sm text-muted-foreground">
        You don&apos;t have access to any part of Loans.
      </p>
    );
  }

  const pendingRequests = allLoans.filter(
    (loan) =>
      loan.status === "Awaiting Guarantor" || loan.status === "Awaiting Admin",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>
        {activeTab === "my" && myAccess === "write" ? (
          <Button onClick={() => setMyTakeOpen(true)}>+ New Loan</Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-lg">
        <SummaryCard
          label="Total Loans"
          value={coop.totalLoans}
          currency={coop.currency}
        />
        <SummaryCard
          label="My Loans"
          value={myTotal}
          currency={coop.currency}
        />
      </div>

      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AdminLoansTab)}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                {requestsAccess !== null ? (
                  <TabsTab value="requests">
                    Requests
                    {pendingRequests.length > 0
                      ? ` (${pendingRequests.length})`
                      : ""}
                  </TabsTab>
                ) : null}
                {membersAccess !== null ? (
                  <TabsTab value="members">Members Loans</TabsTab>
                ) : null}
                {myAccess !== null ? (
                  <TabsTab value="my">My Loans</TabsTab>
                ) : null}
                <TabsIndicator />
              </TabsList>
              {activeTab === "requests" ? (
                <ExportImportMenu
                  rows={pendingRequests}
                  columns={REQUEST_EXPORT_COLUMNS}
                  filenamePrefix={`${coop.id}-loan-requests`}
                  exportTitle={`${coop.name} — Loan Requests`}
                  entityLabel="request"
                />
              ) : null}
              {activeTab === "members" ? (
                <ExportImportMenu
                  rows={totalsByType}
                  columns={TYPE_EXPORT_COLUMNS}
                  filenamePrefix={`${coop.id}-loans-summary`}
                  exportTitle={`${coop.name} — Loans`}
                />
              ) : null}
            </div>

            {requestsAccess !== null ? (
              <TabsPanel value="requests">
                <LoanRequestsTable requests={pendingRequests} />
              </TabsPanel>
            ) : null}

            {membersAccess !== null ? (
              <TabsPanel value="members">
                <CoopLoansSummaryTable
                  totalsByType={totalsByType}
                  currency={coop.currency}
                  coopId={coop.id}
                  basePath="/loans/type"
                />
              </TabsPanel>
            ) : null}

            {myAccess !== null ? (
              <TabsPanel value="my">
                <MemberLoansView
                  coopId={coopId}
                  memberId={member.id}
                  memberName={member.name}
                  heading="My Loan Record"
                  showSummary={false}
                  takeOpen={myTakeOpen}
                  onTakeOpenChange={setMyTakeOpen}
                />
              </TabsPanel>
            ) : null}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  currency = "NGN",
}: {
  label: string;
  value: number;
  currency?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold text-foreground sm:text-2xl">
            {formatMoney(value, currency)}
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Landmark className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
