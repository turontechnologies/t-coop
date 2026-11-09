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
import { LoanRequestsTable } from "@/components/features/loans/loan-requests-table";
import { MemberLoansView } from "@/components/features/loans/member-loans-view";
import { PENDING_LOAN_STATUSES } from "@/lib/coop-data";
import { useCooperative } from "@/hooks/use-cooperative";
import { useCoopLoanRecords, useCoopLoanTypes } from "@/hooks/use-coop-loans";
import { formatMoney } from "@/lib/format";
import { useTabAccess } from "@/hooks/use-permission";
import type { AuthenticatedMember } from "@/types/auth";

type AdminLoansTab = "requests" | "members" | "my";

const MODULE = "Loans";

interface AdminLoansViewProps {
  member: AuthenticatedMember;
}

export function AdminLoansView({ member }: AdminLoansViewProps) {
  const coopId = member.cooperativeId ?? member.id;
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
            PENDING_LOAN_STATUSES.includes(record.status),
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

  const pendingRequests = allLoans.filter((loan) =>
    PENDING_LOAN_STATUSES.includes(loan.status),
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
