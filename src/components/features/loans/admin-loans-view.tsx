"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
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
import { LoanRequestsTable } from "@/components/features/loans/loan-requests-table";
import { MemberLoansView } from "@/components/features/loans/member-loans-view";
import { BulkRepaymentUploadDialog } from "@/components/features/loans/bulk-repayment-upload";
import { TransferClaimsQueue } from "@/components/features/loans/transfer-repayment";
import { useCoopTransferClaims } from "@/hooks/use-loan-repayments";
import { LoanRecordsTable } from "@/components/features/loans/loan-records-table";
import {
  LOAN_SLICE_LABELS,
  LoanStatusCards,
  loansInSlice,
  type LoanSlice,
} from "@/components/features/loans/loan-status-cards";
import { PENDING_LOAN_STATUSES } from "@/lib/coop-data";
import { useCooperative } from "@/hooks/use-cooperative";
import { useCoopLoanRecords, useCoopLoanTypes } from "@/hooks/use-coop-loans";
import { useTabAccess } from "@/hooks/use-permission";
import type { AuthenticatedMember } from "@/types/auth";

type AdminLoansTab = "requests" | "members" | "transfers" | "my";

const MODULE = "Loans";

interface AdminLoansViewProps {
  member: AuthenticatedMember;
}

export function AdminLoansView({ member }: AdminLoansViewProps) {
  const coopId = member.cooperativeId ?? member.id;
  const { data: coop } = useCooperative(coopId);
  const { data: totalsByType = [] } = useCoopLoanTypes(coopId);
  const { data: allLoans = [] } = useCoopLoanRecords(coopId);

  // Which status card is filtering the list (Still owed / Repaid / In progress / Overdue).
  const [slice, setSlice] = useState<LoanSlice | null>(null);

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
  const [bulkOpen, setBulkOpen] = useState(false);
  const { data: transferClaims = [] } = useCoopTransferClaims(
    coopId,
    membersAccess !== null,
  );
  const pendingTransfers = transferClaims.filter(
    (claim) => claim.status === "Pending",
  ).length;

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

  // A role that doesn't grant other members' loans (Members Loans or loan Requests) sees only
  // their own — exactly what a plain member sees, no co-op totals or member tabs.
  if (requestsAccess === null && membersAccess === null) {
    return (
      <MemberLoansView
        coopId={coopId}
        memberId={member.id}
        memberName={member.name}
      />
    );
  }

  const pendingRequests = allLoans.filter((loan) =>
    PENDING_LOAN_STATUSES.includes(loan.status),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>
        {activeTab === "my" && myAccess === "write" ? (
          <Button onClick={() => setMyTakeOpen(true)}>+ New Loan</Button>
        ) : (activeTab === "members" || activeTab === "transfers") &&
          membersAccess === "write" ? (
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Bulk upload repayments
          </Button>
        ) : null}
      </div>

      <LoanStatusCards
        records={allLoans}
        currency={coop.currency}
        scope="coop"
        active={slice}
        onSelect={setSlice}
      />

      {slice ? (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground">
                {LOAN_SLICE_LABELS[slice]} loans
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSlice(null)}>
                Clear filter
              </Button>
            </div>
            <LoanRecordsTable records={loansInSlice(allLoans, slice)} />
          </CardContent>
        </Card>
      ) : null}

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
                {membersAccess !== null ? (
                  <TabsTab value="transfers">
                    Bank transfers
                    {pendingTransfers > 0 ? (
                      <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">
                        {pendingTransfers}
                      </span>
                    ) : null}
                  </TabsTab>
                ) : null}
                {myAccess !== null ? (
                  <TabsTab value="my">My Loans</TabsTab>
                ) : null}
                <TabsIndicator />
              </TabsList>
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

            {membersAccess !== null ? (
              <TabsPanel value="transfers">
                <TransferClaimsQueue
                  coopId={coopId}
                  claims={transferClaims}
                  currency={coop.currency}
                  canDecide={membersAccess === "write"}
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

      {membersAccess === "write" ? (
        <BulkRepaymentUploadDialog
          coopId={coopId}
          currency={coop.currency}
          open={bulkOpen}
          onOpenChange={setBulkOpen}
        />
      ) : null}
    </div>
  );
}
