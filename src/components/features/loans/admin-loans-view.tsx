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
import { coopLoansBySummaryType, coopLoansTotal } from "@/lib/coop-data";
import { ADMIN_DIRECTORY_COOP_ID } from "@/lib/member-directory";
import { formatNaira } from "@/lib/format";
import type { ExportColumn } from "@/lib/table-export";
import { useCoopStore } from "@/store/coop.store";
import { useLoansStore } from "@/store/loans.store";
import type { AuthenticatedMember } from "@/types/auth";

type AdminLoansTab = "requests" | "members" | "my";

const TYPE_EXPORT_COLUMNS: ExportColumn<
  ReturnType<typeof coopLoansBySummaryType>[number]
>[] = [
  { header: "Loan Type", accessor: (row) => row.name },
  { header: "Eligibility %", accessor: (row) => row.eligibilityPercent },
  { header: "Loan Duration", accessor: (row) => row.durationMonths },
  { header: "No of Repayments", accessor: (row) => row.numberOfRepayments },
  { header: "Interest", accessor: (row) => row.interestRate },
  { header: "Earnings on Loan", accessor: (row) => row.earnings },
];

const REQUEST_EXPORT_COLUMNS: ExportColumn<
  ReturnType<
    typeof useCoopStore.getState
  >["cooperatives"][number]["loans"][number]
>[] = [
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
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const coop = cooperatives.find((c) => c.id === ADMIN_DIRECTORY_COOP_ID);

  const loanRecords = useLoansStore((state) => state.records);
  const myTotal = useMemo(
    () =>
      loanRecords
        .filter(
          (record) =>
            record.memberId === member.id &&
            (record.status === "Active" ||
              record.status === "Awaiting Approval"),
        )
        .reduce((sum, record) => sum + record.amount, 0),
    [loanRecords, member.id],
  );

  const [activeTab, setActiveTab] = useState<AdminLoansTab>("requests");
  const [myTakeOpen, setMyTakeOpen] = useState(false);

  if (!coop) {
    return (
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t find your co-operative.
      </p>
    );
  }

  const totalsByType = coopLoansBySummaryType(coop);
  const pendingRequests = coop.loans.filter(
    (loan) =>
      loan.status === "Awaiting Guarantor" || loan.status === "Awaiting Admin",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>
        {activeTab === "my" ? (
          <Button onClick={() => setMyTakeOpen(true)}>+ New Loan</Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-lg">
        <SummaryCard label="Total Loans" value={coopLoansTotal(coop)} />
        <SummaryCard label="My Loans" value={myTotal} />
      </div>

      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AdminLoansTab)}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTab value="requests">
                  Requests
                  {pendingRequests.length > 0
                    ? ` (${pendingRequests.length})`
                    : ""}
                </TabsTab>
                <TabsTab value="members">Members Loans</TabsTab>
                <TabsTab value="my">My Loans</TabsTab>
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

            <TabsPanel value="requests">
              <LoanRequestsTable requests={pendingRequests} />
            </TabsPanel>

            <TabsPanel value="members">
              <CoopLoansSummaryTable coop={coop} basePath="/loans/type" />
            </TabsPanel>

            <TabsPanel value="my">
              <MemberLoansView
                memberId={member.id}
                memberName={member.name}
                heading="My Loan Record"
                showSummary={false}
                takeOpen={myTakeOpen}
                onTakeOpenChange={setMyTakeOpen}
              />
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold text-foreground sm:text-2xl">
            {formatNaira(value)}
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Landmark className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
