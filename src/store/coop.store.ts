import { create } from "zustand";
import {
  coopMemberSavingsBalance,
  INITIAL_COOPERATIVES,
  type CoopMember,
  type CoopMemberStatus,
  type CoopSavingsRecord,
  type CoopStatus,
  type Cooperative,
  type SavingsRequestStatus,
} from "@/lib/coop-data";

export type MemberEditableFields = Pick<
  CoopMember,
  | "firstName"
  | "lastName"
  | "email"
  | "role"
  | "guarantor"
  | "country"
  | "state"
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
}

export const useCoopStore = create<CoopState>((set) => ({
  cooperatives: INITIAL_COOPERATIVES,
  addCooperative: (coop) =>
    set((state) => ({ cooperatives: [coop, ...state.cooperatives] })),
  setCooperativeStatus: (coopId, status) =>
    set((state) => ({
      cooperatives: state.cooperatives.map((coop) =>
        coop.id === coopId ? { ...coop, status } : coop,
      ),
    })),
  setMemberStatus: (coopId, memberId, status) =>
    set((state) => ({
      cooperatives: state.cooperatives.map((coop) =>
        coop.id === coopId
          ? {
              ...coop,
              members: coop.members.map((member) =>
                member.id === memberId ? { ...member, status } : member,
              ),
            }
          : coop,
      ),
    })),
  updateMember: (coopId, memberId, updates) =>
    set((state) => ({
      cooperatives: state.cooperatives.map((coop) =>
        coop.id === coopId
          ? {
              ...coop,
              members: coop.members.map((member) =>
                member.id === memberId ? { ...member, ...updates } : member,
              ),
            }
          : coop,
      ),
    })),
  addMember: (coopId, member) =>
    set((state) => ({
      cooperatives: state.cooperatives.map((coop) =>
        coop.id === coopId
          ? { ...coop, members: [member, ...coop.members] }
          : coop,
      ),
    })),
  addSavingsRecord: (coopId, record) =>
    set((state) => ({
      cooperatives: state.cooperatives.map((coop) =>
        coop.id === coopId
          ? { ...coop, savings: [record, ...coop.savings] }
          : coop,
      ),
    })),
  resolveSavingsRequest: (coopId, requestId, status) =>
    set((state) => ({
      cooperatives: state.cooperatives.map((coop) => {
        if (coop.id !== coopId) return coop;
        const request = coop.savingsRequests.find((r) => r.id === requestId);
        if (!request || request.status !== "Pending") return coop;

        const resolvedAt = new Date().toISOString();
        const savingsRequests = coop.savingsRequests.map((r) =>
          r.id === requestId ? { ...r, status, resolvedAt } : r,
        );

        if (status === "Declined") {
          return { ...coop, savingsRequests };
        }

        const signedAmount =
          request.type === "Withdrawal" ? -request.amount : request.amount;
        const balanceBefore = coopMemberSavingsBalance(
          coop,
          request.memberId,
          request.savingsType,
        );
        const record: CoopSavingsRecord = {
          id: `coop-sav-${Date.now()}`,
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

        return {
          ...coop,
          savingsRequests,
          savings: [record, ...coop.savings],
        };
      }),
    })),
}));
