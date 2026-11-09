"use client";

import { useState } from "react";
import { PiggyBank } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { CoopSavingsSummaryTable } from "@/components/features/coop/coop-savings-summary-table";
import { MemberSavingsView } from "@/components/features/savings/member-savings-view";
import {
  UploadTellerModal,
  type UploadTellerPayload,
} from "@/components/features/savings/upload-teller-modal";
import { SavingsRequestsTable } from "@/components/features/savings/savings-requests-table";
import { useCooperative } from "@/hooks/use-cooperative";
import { useCoopMembers } from "@/hooks/use-coop-members";
import {
  useCoopSavingsRecords,
  useCoopSavingsTypes,
} from "@/hooks/use-coop-savings";
import {
  useDecideWithdrawal,
  useManualSavingsDeposit,
  useWithdrawalRequests,
} from "@/hooks/use-savings-self";
import { formatMoney } from "@/lib/format";
import { useTabAccess } from "@/hooks/use-permission";
import type { AuthenticatedMember } from "@/types/auth";

type AdminSavingsTab = "members" | "my" | "request";

const MODULE = "Savings & Contributions";

interface AdminSavingsViewProps {
  member: AuthenticatedMember;
}

export function AdminSavingsView({ member }: AdminSavingsViewProps) {
  const coopId = member.cooperativeId ?? member.id;
  const { data: coop } = useCooperative(coopId);
  const { data: members = [] } = useCoopMembers(coopId);
  const { data: totalsByType = [] } = useCoopSavingsTypes(coopId);
  const { data: allRequests = [] } = useWithdrawalRequests(coopId);
  const { data: myRecords = [] } = useCoopSavingsRecords(coopId, {
    memberId: member.id,
  });

  const manualDeposit = useManualSavingsDeposit(coopId);
  const decideWithdrawal = useDecideWithdrawal(coopId);

  const myTotal = myRecords.reduce((sum, record) => sum + record.amount, 0);

  const membersAccess = useTabAccess(MODULE, "Members Savings");
  const myAccess = useTabAccess(MODULE, "My Savings");
  const requestAccess = useTabAccess(MODULE, "Request");
  const firstVisibleTab: AdminSavingsTab =
    membersAccess !== null ? "members" : myAccess !== null ? "my" : "request";

  const [activeTab, setActiveTab] = useState<AdminSavingsTab>(firstVisibleTab);
  const [tellerOpen, setTellerOpen] = useState(false);
  const [tellerBusy, setTellerBusy] = useState(false);
  const [myAddOpen, setMyAddOpen] = useState(false);
  const [myWithdrawOpen, setMyWithdrawOpen] = useState(false);

  if (!coop) {
    return (
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t find your co-operative.
      </p>
    );
  }

  const pendingRequests = allRequests.filter(
    (request) => request.status === "Pending",
  );

  if (membersAccess === null && myAccess === null && requestAccess === null) {
    return (
      <p className="text-sm text-muted-foreground">
        You don&apos;t have access to any part of Savings & Contributions.
      </p>
    );
  }

  // A role that doesn't grant other members' savings (Members Savings or withdrawal Requests)
  // sees only their own — exactly what a plain member sees, no co-op totals or member tabs.
  if (membersAccess === null && requestAccess === null) {
    return (
      <MemberSavingsView
        coopId={coopId}
        memberId={member.id}
        memberName={member.name}
        memberEmail={member.email}
      />
    );
  }

  const handlePrimaryAction = () => {
    if (activeTab === "members") setTellerOpen(true);
    else if (activeTab === "my") setMyAddOpen(true);
  };

  const handleUploadTeller = async (payload: UploadTellerPayload) => {
    setTellerBusy(true);
    try {
      const result = await manualDeposit.mutateAsync(payload);
      setTellerOpen(false);
      toast.success("Teller upload recorded", {
        description: `${formatMoney(payload.amount, coop.currency)} recorded for ${result.record.memberName} — ${formatMoney(result.record.amount, coop.currency)} credited after charges.`,
      });
    } catch (error) {
      toast.error("Couldn't record teller upload", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setTellerBusy(false);
    }
  };

  const handleResolveRequest = async (
    requestId: string,
    status: "Approved" | "Declined",
  ) => {
    const request = allRequests.find((r) => r.id === requestId);
    if (!request) return;

    // Approving pays the member out server-side (the co-op's own Paystack, else the
    // platform's) — the request only becomes Approved if Paystack accepts the transfer.
    try {
      await decideWithdrawal.mutateAsync({ requestId, status });
      toast.success(
        status === "Approved" ? "Withdrawal paid out" : "Request declined",
        {
          description:
            status === "Approved"
              ? `${formatMoney(request.netAmount ?? request.amount, coop.currency)} sent to ${request.memberName}'s bank account.`
              : `${request.memberName}'s request was declined.`,
        },
      );
    } catch (error) {
      toast.error(
        status === "Approved" ? "Payout failed" : "Couldn't decline request",
        {
          description:
            error instanceof Error ? error.message : "Please try again.",
        },
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>
        {activeTab === "my" && myAccess === "write" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setMyWithdrawOpen(true)}
              disabled={myTotal <= 0}
            >
              Withdraw
            </Button>
            <Button onClick={handlePrimaryAction}>+ New Savings</Button>
          </div>
        ) : activeTab === "members" && membersAccess === "write" ? (
          <Button onClick={handlePrimaryAction}>+ New Savings</Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-lg">
        <SummaryCard
          label="Total Savings"
          value={coop.totalSavings}
          currency={coop.currency}
        />
        <SummaryCard
          label="My Savings"
          value={myTotal}
          currency={coop.currency}
        />
      </div>

      <Card>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as AdminSavingsTab)}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                {membersAccess !== null ? (
                  <TabsTab value="members">Members Savings</TabsTab>
                ) : null}
                {myAccess !== null ? (
                  <TabsTab value="my">My Savings</TabsTab>
                ) : null}
                {requestAccess !== null ? (
                  <TabsTab value="request">
                    Request
                    {pendingRequests.length > 0
                      ? ` (${pendingRequests.length})`
                      : ""}
                  </TabsTab>
                ) : null}
                <TabsIndicator />
              </TabsList>
            </div>

            {membersAccess !== null ? (
              <TabsPanel value="members">
                <CoopSavingsSummaryTable
                  totalsByType={totalsByType}
                  currency={coop.currency}
                  coopId={coop.id}
                  basePath="/savings/type"
                />
              </TabsPanel>
            ) : null}

            {myAccess !== null ? (
              <TabsPanel value="my">
                <MemberSavingsView
                  coopId={coopId}
                  memberId={member.id}
                  memberName={member.name}
                  memberEmail={member.email}
                  heading="My Savings Record"
                  showSummary={false}
                  addOpen={myAddOpen}
                  onAddOpenChange={setMyAddOpen}
                  withdrawOpen={myWithdrawOpen}
                  onWithdrawOpenChange={setMyWithdrawOpen}
                />
              </TabsPanel>
            ) : null}

            {requestAccess !== null ? (
              <TabsPanel value="request">
                <SavingsRequestsTable
                  requests={allRequests}
                  canResolve={requestAccess === "write"}
                  onResolve={handleResolveRequest}
                />
              </TabsPanel>
            ) : null}
          </Tabs>
        </CardContent>
      </Card>

      <UploadTellerModal
        open={tellerOpen}
        onOpenChange={setTellerOpen}
        coopId={coopId}
        members={members}
        busy={tellerBusy}
        onUpload={handleUploadTeller}
      />
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
          <PiggyBank className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
