"use client";

import { useMemo, useState } from "react";
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
import {
  coopMemberFullName,
  coopMemberSavingsBalance,
  coopSavingsBySummaryType,
  coopSavingsTotal,
  type CoopSavingsRecord,
} from "@/lib/coop-data";
import { ADMIN_DIRECTORY_COOP_ID } from "@/lib/member-directory";
import { formatNaira } from "@/lib/format";
import type { ExportColumn } from "@/lib/table-export";
import { useCoopStore } from "@/store/coop.store";
import { useSavingsStore } from "@/store/savings.store";
import type { AuthenticatedMember } from "@/types/auth";

type AdminSavingsTab = "members" | "my" | "request";

const TYPE_EXPORT_COLUMNS: ExportColumn<
  ReturnType<typeof coopSavingsBySummaryType>[number]
>[] = [
  { header: "Savings Type", accessor: (row) => row.name },
  { header: "Minimum Savings", accessor: (row) => row.min },
  { header: "Maximum Savings", accessor: (row) => row.max },
  { header: "Earnings on Savings", accessor: (row) => row.earnings },
  { header: "Total Savings & Contributions", accessor: (row) => row.total },
];

const REQUEST_EXPORT_COLUMNS: ExportColumn<
  ReturnType<
    typeof useCoopStore.getState
  >["cooperatives"][number]["savingsRequests"][number]
>[] = [
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
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const addSavingsRecord = useCoopStore((state) => state.addSavingsRecord);
  const resolveSavingsRequest = useCoopStore(
    (state) => state.resolveSavingsRequest,
  );
  const coop = cooperatives.find((c) => c.id === ADMIN_DIRECTORY_COOP_ID);

  const savingsRecords = useSavingsStore((state) => state.records);
  const myTotal = useMemo(
    () =>
      savingsRecords
        .filter((record) => record.memberId === member.id)
        .reduce((sum, record) => sum + record.amount, 0),
    [savingsRecords, member.id],
  );

  const [activeTab, setActiveTab] = useState<AdminSavingsTab>("members");
  const [tellerOpen, setTellerOpen] = useState(false);
  const [tellerBusy, setTellerBusy] = useState(false);
  const [myAddOpen, setMyAddOpen] = useState(false);

  if (!coop) {
    return (
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t find your co-operative.
      </p>
    );
  }

  const totalsByType = coopSavingsBySummaryType(coop);
  const pendingRequests = coop.savingsRequests.filter(
    (request) => request.status === "Pending",
  );

  const handlePrimaryAction = () => {
    if (activeTab === "members") setTellerOpen(true);
    else if (activeTab === "my") setMyAddOpen(true);
  };

  const handleUploadTeller = async (payload: UploadTellerPayload) => {
    const uploadedMember = coop.members.find((m) => m.id === payload.memberId);
    if (!uploadedMember) return;

    setTellerBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 700));

    const balanceBefore = coopMemberSavingsBalance(
      coop,
      payload.memberId,
      payload.savingsType,
    );
    const record: CoopSavingsRecord = {
      id: `coop-sav-${Date.now()}`,
      memberId: payload.memberId,
      memberName: coopMemberFullName(uploadedMember),
      savingsType: payload.savingsType,
      amount: payload.amount,
      balanceAfter: balanceBefore + payload.amount,
      method: "Manual Upload",
      transactionId: `TR-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      status: "Success",
      receiptUrl: payload.receiptUrl,
    };
    addSavingsRecord(coop.id, record);
    setTellerBusy(false);
    setTellerOpen(false);
    toast.success("Teller upload recorded", {
      description: `${formatNaira(payload.amount)} added to ${record.memberName}'s ${payload.savingsType}.`,
    });
  };

  const handleResolveRequest = async (
    requestId: string,
    status: "Approved" | "Declined",
  ) => {
    const request = coop.savingsRequests.find((r) => r.id === requestId);
    resolveSavingsRequest(coop.id, requestId, status);
    if (request) {
      toast.success(
        status === "Approved" ? "Request approved" : "Request declined",
        {
          description:
            status === "Approved"
              ? `${formatNaira(request.amount)} ${request.type === "Deposit" ? "deposit" : "withdrawal"} recorded for ${request.memberName}.`
              : `${request.memberName}'s request was declined.`,
        },
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>
        {activeTab !== "request" ? (
          <Button onClick={handlePrimaryAction}>+ New Savings</Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-lg">
        <SummaryCard label="Total Savings" value={coopSavingsTotal(coop)} />
        <SummaryCard label="My Savings" value={myTotal} />
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
                  rows={coop.savingsRequests}
                  columns={REQUEST_EXPORT_COLUMNS}
                  filenamePrefix={`${coop.id}-savings-requests`}
                  exportTitle={`${coop.name} — Savings Requests`}
                  entityLabel="request"
                />
              ) : null}
            </div>

            <TabsPanel value="members">
              <CoopSavingsSummaryTable coop={coop} basePath="/savings/type" />
            </TabsPanel>

            <TabsPanel value="my">
              <MemberSavingsView
                memberId={member.id}
                memberName={member.name}
                memberEmail={member.email}
                heading="My Savings Record"
                showSummary={false}
                addOpen={myAddOpen}
                onAddOpenChange={setMyAddOpen}
              />
            </TabsPanel>

            <TabsPanel value="request">
              <SavingsRequestsTable
                requests={coop.savingsRequests}
                onResolve={handleResolveRequest}
              />
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>

      <UploadTellerModal
        open={tellerOpen}
        onOpenChange={setTellerOpen}
        members={coop.members}
        busy={tellerBusy}
        onUpload={handleUploadTeller}
      />
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
          <PiggyBank className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
