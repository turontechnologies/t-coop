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
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import { MemberSavingsView } from "@/components/features/savings/member-savings-view";
import {
  UploadTellerModal,
  type UploadTellerPayload,
} from "@/components/features/savings/upload-teller-modal";
import { SavingsRequestsTable } from "@/components/features/savings/savings-requests-table";
import type { SavingsRequest } from "@/lib/coop-data";
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
import { initiateTransfer } from "@/lib/paystack-transfer";
import type { ExportColumn } from "@/lib/table-export";
import type { AuthenticatedMember } from "@/types/auth";
import type { CoopSavingsTypeSummary } from "@/types/coop-savings";

type AdminSavingsTab = "members" | "my" | "request";

const TYPE_EXPORT_COLUMNS: ExportColumn<CoopSavingsTypeSummary>[] = [
  { header: "Savings Type", accessor: (row) => row.name },
  { header: "Minimum Savings", accessor: (row) => row.min },
  { header: "Maximum Savings", accessor: (row) => row.max },
  { header: "Earnings on Savings", accessor: (row) => row.earnings },
  { header: "Total Savings & Contributions", accessor: (row) => row.total },
];

const REQUEST_EXPORT_COLUMNS: ExportColumn<SavingsRequest>[] = [
  { header: "Member", accessor: (row) => row.memberName },
  { header: "Type", accessor: (row) => row.type },
  { header: "Savings Type", accessor: (row) => row.savingsType },
  { header: "Amount", accessor: (row) => row.amount },
  { header: "Requested", accessor: (row) => row.requestedAt },
  { header: "Status", accessor: (row) => row.status },
];

interface AdminSavingsViewProps {
  member: AuthenticatedMember;
}

export function AdminSavingsView({ member }: AdminSavingsViewProps) {
  const coopId = member.id;
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

  const [activeTab, setActiveTab] = useState<AdminSavingsTab>("members");
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

    let transferReference: string | undefined;

    // Approving a withdrawal is real money leaving the co-op's Paystack
    // balance for the member's bank account — attempt that transfer first,
    // and only mark the request Approved (and create the ledger record) if
    // it actually goes through. A failed/misconfigured transfer should
    // never silently look like a successful withdrawal.
    if (status === "Approved" && request.type === "Withdrawal") {
      const bankDetails = members.find((m) => m.id === request.memberId);

      if (!bankDetails?.accountNumber || !bankDetails?.bankCode) {
        toast.error("Can't disburse this withdrawal", {
          description: `${request.memberName} hasn't verified their bank account yet.`,
        });
        return;
      }

      try {
        const transfer = await initiateTransfer({
          accountNumber: bankDetails.accountNumber,
          bankCode: bankDetails.bankCode,
          accountName: bankDetails.accountName || request.memberName,
          amount: request.netAmount ?? request.amount,
          reason: `T-Coop savings withdrawal — ${request.savingsType}`,
        });
        transferReference = transfer.reference;
      } catch (error) {
        toast.error("Payout failed", {
          description:
            error instanceof Error
              ? error.message
              : "Couldn't process this withdrawal payout.",
        });
        return;
      }
    }

    try {
      await decideWithdrawal.mutateAsync({
        requestId,
        status,
        transferReference,
      });
      toast.success(
        status === "Approved" ? "Request approved" : "Request declined",
        {
          description:
            status === "Approved"
              ? `${formatMoney(request.amount, coop.currency)} paid out to ${request.memberName}.`
              : `${request.memberName}'s request was declined.`,
        },
      );
    } catch (error) {
      toast.error("Couldn't resolve request", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>
        {activeTab === "my" ? (
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
        ) : activeTab === "members" ? (
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
                <TabsTab value="members">Members Savings</TabsTab>
                <TabsTab value="my">My Savings</TabsTab>
                <TabsTab value="request">
                  Request
                  {pendingRequests.length > 0
                    ? ` (${pendingRequests.length})`
                    : ""}
                </TabsTab>
                <TabsIndicator />
              </TabsList>
              {activeTab === "members" ? (
                <ExportImportMenu
                  rows={totalsByType}
                  columns={TYPE_EXPORT_COLUMNS}
                  filenamePrefix={`${coop.id}-savings-summary`}
                  exportTitle={`${coop.name} — Savings & Contributions`}
                />
              ) : null}
              {activeTab === "request" ? (
                <ExportImportMenu
                  rows={allRequests}
                  columns={REQUEST_EXPORT_COLUMNS}
                  filenamePrefix={`${coop.id}-savings-requests`}
                  exportTitle={`${coop.name} — Savings Requests`}
                  entityLabel="request"
                />
              ) : null}
            </div>

            <TabsPanel value="members">
              <CoopSavingsSummaryTable
                totalsByType={totalsByType}
                currency={coop.currency}
                coopId={coop.id}
                basePath="/savings/type"
              />
            </TabsPanel>

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

            <TabsPanel value="request">
              <SavingsRequestsTable
                requests={allRequests}
                onResolve={handleResolveRequest}
              />
            </TabsPanel>
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
