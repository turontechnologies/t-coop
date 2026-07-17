import { create } from "zustand";
import {
  INITIAL_COOPERATIVES,
  type CoopMemberStatus,
  type CoopStatus,
  type Cooperative,
} from "@/lib/coop-data";

interface CoopState {
  cooperatives: Cooperative[];
  addCooperative: (coop: Cooperative) => void;
  setCooperativeStatus: (coopId: string, status: CoopStatus) => void;
  setMemberStatus: (
    coopId: string,
    memberId: string,
    status: CoopMemberStatus,
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
}));
