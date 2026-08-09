import { create } from "zustand";
import {
  INITIAL_SAVINGS_RECORDS,
  type SavingsRecord,
} from "@/lib/savings-data";
import {
  TOTAL_SAVINGS_WITHDRAWAL,
  type SavingsRequest,
  type SavingsRequestStatus,
} from "@/lib/coop-data";
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

      // A "Total Savings" withdrawal isn't attributable to one type up
      // front, so it's spread waterfall-style (largest balance first)
      // across the member's actual savings types — this keeps every
      // type's own balance accurate rather than losing the withdrawal
      // in an untyped bucket.
      if (
        req.type === "Withdrawal" &&
        req.savingsType === TOTAL_SAVINGS_WITHDRAWAL
      ) {
        const balancesByType = new Map<string, number>();
        for (const record of state.records) {
          if (record.memberId !== req.memberId) continue;
          balancesByType.set(
            record.savingsType,
            (balancesByType.get(record.savingsType) ?? 0) + record.amount,
          );
        }

        let remaining = req.amount;
        const newRecords: SavingsRecord[] = [];
        const sortedTypes = [...balancesByType.entries()].sort(
          (a, b) => b[1] - a[1],
        );
        for (const [savingsType, balance] of sortedTypes) {
          if (remaining <= 0 || balance <= 0) continue;
          const deduction = Math.min(balance, remaining);
          remaining -= deduction;
          newRecords.push({
            id: `sav-${Date.now()}-${savingsType.replace(/\s+/g, "-")}`,
            memberId: req.memberId,
            memberName: req.memberName,
            savingsType,
            amount: -deduction,
            balanceAfter: balance - deduction,
            method: "Manual Upload",
            transactionId: `TR-${Date.now()}`,
            date: resolvedAt.slice(0, 10),
            status: "Success",
          });
        }

        return { requests, records: [...newRecords, ...state.records] };
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
