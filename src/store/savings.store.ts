import { create } from "zustand";
import {
  INITIAL_SAVINGS_RECORDS,
  type SavingsRecord,
} from "@/lib/savings-data";
import type { SavingsRequest, SavingsRequestStatus } from "@/lib/coop-data";
import { logActivity } from "@/lib/audit-log";
import { formatNaira } from "@/lib/format";

interface SavingsState {
  records: SavingsRecord[];
  requests: SavingsRequest[];
  addRecord: (record: SavingsRecord) => void;
  addRequest: (request: SavingsRequest) => void;
  resolveRequest: (
    requestId: string,
    status: Extract<SavingsRequestStatus, "Approved" | "Declined">,
  ) => void;
}

export const useSavingsStore = create<SavingsState>()((set, get) => ({
  records: INITIAL_SAVINGS_RECORDS,
  requests: [],
  addRecord: (record) => {
    set((state) => ({ records: [record, ...state.records] }));
    logActivity({
      module: "Savings",
      action: "Payment",
      resource: `${formatNaira(record.amount)} — ${record.savingsType}`,
    });
  },
  addRequest: (request) => {
    set((state) => ({ requests: [request, ...state.requests] }));
    logActivity({
      module: "Savings",
      action: "Create",
      resource: `${request.type} request — ${formatNaira(request.amount)} (${request.savingsType})`,
      status: "Info",
    });
  },
  resolveRequest: (requestId, status) => {
    const request = get().requests.find((r) => r.id === requestId);
    set((state) => {
      const req = state.requests.find((r) => r.id === requestId);
      if (!req || req.status !== "Pending") return state;

      const resolvedAt = new Date().toISOString();
      const requests = state.requests.map((r) =>
        r.id === requestId ? { ...r, status, resolvedAt } : r,
      );

      if (status === "Declined") {
        return { requests };
      }

      const signedAmount = req.type === "Withdrawal" ? -req.amount : req.amount;
      const balanceBefore = state.records
        .filter(
          (record) =>
            record.memberId === req.memberId &&
            record.savingsType === req.savingsType,
        )
        .reduce((sum, record) => sum + record.amount, 0);

      const record: SavingsRecord = {
        id: `sav-${Date.now()}`,
        memberId: req.memberId,
        memberName: req.memberName,
        savingsType: req.savingsType,
        amount: signedAmount,
        balanceAfter: balanceBefore + signedAmount,
        method: "Manual Upload",
        transactionId: `TR-${Date.now()}`,
        date: resolvedAt.slice(0, 10),
        status: "Success",
      };

      return { requests, records: [record, ...state.records] };
    });
    if (request) {
      logActivity({
        module: "Savings",
        action: status === "Approved" ? "Approve" : "Decline",
        resource: `${formatNaira(request.amount)} ${request.type.toLowerCase()} — ${request.memberName}`,
        status: status === "Approved" ? "Success" : "Warning",
      });
    }
  },
}));
