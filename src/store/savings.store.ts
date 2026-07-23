import { create } from "zustand";
import {
  INITIAL_SAVINGS_RECORDS,
  type SavingsRecord,
} from "@/lib/savings-data";
import type { SavingsRequest, SavingsRequestStatus } from "@/lib/coop-data";

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

export const useSavingsStore = create<SavingsState>()((set) => ({
  records: INITIAL_SAVINGS_RECORDS,
  requests: [],
  addRecord: (record) =>
    set((state) => ({ records: [record, ...state.records] })),
  addRequest: (request) =>
    set((state) => ({ requests: [request, ...state.requests] })),
  resolveRequest: (requestId, status) =>
    set((state) => {
      const request = state.requests.find((r) => r.id === requestId);
      if (!request || request.status !== "Pending") return state;

      const resolvedAt = new Date().toISOString();
      const requests = state.requests.map((r) =>
        r.id === requestId ? { ...r, status, resolvedAt } : r,
      );

      if (status === "Declined") {
        return { requests };
      }

      const signedAmount =
        request.type === "Withdrawal" ? -request.amount : request.amount;
      const balanceBefore = state.records
        .filter(
          (record) =>
            record.memberId === request.memberId &&
            record.savingsType === request.savingsType,
        )
        .reduce((sum, record) => sum + record.amount, 0);

      const record: SavingsRecord = {
        id: `sav-${Date.now()}`,
        memberId: request.memberId,
        memberName: request.memberName,
        savingsType: request.savingsType,
        amount: signedAmount,
        balanceAfter: balanceBefore + signedAmount,
        method: "Manual Upload",
        transactionId: `TR-${Date.now()}`,
        date: resolvedAt.slice(0, 10),
        status: "Success",
      };

      return { requests, records: [record, ...state.records] };
    }),
}));
