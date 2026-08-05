import { create } from "zustand";
import {
  coopMemberFullName,
  coopMemberSavingsBalance,
  findCooperative,
  INITIAL_COOPERATIVES,
  type CoopMember,
  type CoopMemberStatus,
  type CoopSavingsRecord,
  type CoopStatus,
  type CoopSubscriptionPayment,
  type Cooperative,
  type SavingsRequestStatus,
} from "@/lib/coop-data";
import { logActivity } from "@/lib/audit-log";
import { formatNaira } from "@/lib/format";

export type MemberEditableFields = Pick<
  CoopMember,
  | "firstName"
  | "lastName"
  | "email"
  | "role"
  | "guarantor"
  | "country"
  | "state"
  | "city"
  | "bankCode"
  | "accountNumber"
  | "accountName"
>;

interface CoopState {
  cooperatives: Cooperative[];
  addCooperative: (coop: Cooperative) => void;
  setCooperativeStatus: (coopId: string, status: CoopStatus) => void;
  setMemberStatus: (
    coopId: string,
    memberId: string,
    status: CoopMemberStatus,
  ) => void;
  updateMember: (
    coopId: string,
    memberId: string,
    updates: MemberEditableFields,
  ) => void;
  addMember: (coopId: string, member: CoopMember) => void;
  addSavingsRecord: (coopId: string, record: CoopSavingsRecord) => void;
  resolveSavingsRequest: (
    coopId: string,
    requestId: string,
    status: Extract<SavingsRequestStatus, "Approved" | "Declined">,
  ) => void;
  respondToGuarantorRequest: (
    coopId: string,
    loanId: string,
    decision: "Accepted" | "Rejected",
    documentUrl?: string,
  ) => void;
  resolveLoanRequest: (
    coopId: string,
    loanId: string,
    decision: "Approved" | "Rejected",
    rejectionReason?: string,
  ) => void;
  addSubscriptionPayment: (
    coopId: string,
    payment: CoopSubscriptionPayment,
  ) => void;
}

export const useCoopStore = create<CoopState>((set, get) => ({
  cooperatives: INITIAL_COOPERATIVES,
  addCooperative: (coop) => {
    set((state) => ({ cooperatives: [coop, ...state.cooperatives] }));
    logActivity(`Co-operative created: ${coop.name}`);
  },
  setCooperativeStatus: (coopId, status) => {
    const coop = findCooperative(get().cooperatives, coopId);
    set((state) => ({
      cooperatives: state.cooperatives.map((c) =>
        c.id === coopId ? { ...c, status } : c,
      ),
    }));
    if (coop) {
      logActivity(
        `Co-operative ${status === "Active" ? "activated" : "disabled"}: ${coop.name}`,
      );
    }
  },
  setMemberStatus: (coopId, memberId, status) => {
    const coop = findCooperative(get().cooperatives, coopId);
    const member = coop?.members.find((m) => m.id === memberId);
    set((state) => ({
      cooperatives: state.cooperatives.map((c) =>
        c.id === coopId
          ? {
              ...c,
              members: c.members.map((m) =>
                m.id === memberId ? { ...m, status } : m,
              ),
            }
          : c,
      ),
    }));
    if (member) {
      logActivity(
        `Member ${status === "Active" ? "activated" : "deactivated"}: ${coopMemberFullName(member)}`,
      );
    }
  },
  updateMember: (coopId, memberId, updates) => {
    set((state) => ({
      cooperatives: state.cooperatives.map((c) =>
        c.id === coopId
          ? {
              ...c,
              members: c.members.map((m) =>
                m.id === memberId ? { ...m, ...updates } : m,
              ),
            }
          : c,
      ),
    }));
    logActivity(`Member updated: ${updates.firstName} ${updates.lastName}`);
  },
  addMember: (coopId, member) => {
    set((state) => ({
      cooperatives: state.cooperatives.map((c) =>
        c.id === coopId ? { ...c, members: [member, ...c.members] } : c,
      ),
    }));
    logActivity(`Member added: ${coopMemberFullName(member)}`);
  },
  addSavingsRecord: (coopId, record) => {
    set((state) => ({
      cooperatives: state.cooperatives.map((c) =>
        c.id === coopId ? { ...c, savings: [record, ...c.savings] } : c,
      ),
    }));
    logActivity(
      `Savings recorded: ${formatNaira(record.amount)} for ${record.memberName}`,
    );
  },
  resolveSavingsRequest: (coopId, requestId, status) => {
    const coop = findCooperative(get().cooperatives, coopId);
    const request = coop?.savingsRequests.find((r) => r.id === requestId);
    set((state) => ({
      cooperatives: state.cooperatives.map((c) => {
        if (c.id !== coopId) return c;
        const req = c.savingsRequests.find((r) => r.id === requestId);
        if (!req || req.status !== "Pending") return c;

        const resolvedAt = new Date().toISOString();
        const savingsRequests = c.savingsRequests.map((r) =>
          r.id === requestId ? { ...r, status, resolvedAt } : r,
        );

        if (status === "Declined") {
          return { ...c, savingsRequests };
        }

        const signedAmount =
          req.type === "Withdrawal" ? -req.amount : req.amount;
        const balanceBefore = coopMemberSavingsBalance(
          c,
          req.memberId,
          req.savingsType,
        );
        const record: CoopSavingsRecord = {
          id: `coop-sav-${Date.now()}`,
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

        return {
          ...c,
          savingsRequests,
          savings: [record, ...c.savings],
        };
      }),
    }));
    if (request) {
      logActivity(
        `Savings ${request.type.toLowerCase()} request ${status.toLowerCase()}: ${formatNaira(request.amount)} for ${request.memberName}`,
      );
    }
  },
  respondToGuarantorRequest: (coopId, loanId, decision, documentUrl) => {
    const coop = findCooperative(get().cooperatives, coopId);
    const loan = coop?.loans.find((l) => l.id === loanId);
    set((state) => ({
      cooperatives: state.cooperatives.map((c) => {
        if (c.id !== coopId) return c;
        return {
          ...c,
          loans: c.loans.map((loan) => {
            if (loan.id !== loanId || loan.status !== "Awaiting Guarantor") {
              return loan;
            }
            if (decision === "Rejected") {
              return {
                ...loan,
                status: "Rejected",
                rejectionReason: "Guarantor declined to stand for this loan.",
              };
            }
            return {
              ...loan,
              status: "Awaiting Admin",
              guarantorAcceptedAt: new Date().toISOString(),
              guarantorDocumentUrl: documentUrl,
            };
          }),
        };
      }),
    }));
    if (loan) {
      logActivity(
        `Guarantor ${decision.toLowerCase()} loan: ${formatNaira(loan.amount)} for ${loan.memberName}`,
      );
    }
  },
  resolveLoanRequest: (coopId, loanId, decision, rejectionReason) => {
    const coop = findCooperative(get().cooperatives, coopId);
    const loan = coop?.loans.find((l) => l.id === loanId);
    set((state) => ({
      cooperatives: state.cooperatives.map((c) => {
        if (c.id !== coopId) return c;
        return {
          ...c,
          loans: c.loans.map((loan) => {
            if (loan.id !== loanId || loan.status !== "Awaiting Admin") {
              return loan;
            }
            return decision === "Approved"
              ? { ...loan, status: "Active" }
              : { ...loan, status: "Rejected", rejectionReason };
          }),
        };
      }),
    }));
    if (loan) {
      logActivity(
        `Loan ${decision.toLowerCase()}: ${formatNaira(loan.amount)} for ${loan.memberName}`,
      );
    }
  },
  addSubscriptionPayment: (coopId, payment) => {
    const coop = findCooperative(get().cooperatives, coopId);
    set((state) => ({
      cooperatives: state.cooperatives.map((c) =>
        c.id === coopId
          ? {
              ...c,
              subscriptionPayments: [payment, ...c.subscriptionPayments],
            }
          : c,
      ),
    }));
    logActivity(
      `Subscription payment recorded: ${formatNaira(payment.amountPaid)} for ${coop?.name ?? coopId}`,
    );
  },
}));
