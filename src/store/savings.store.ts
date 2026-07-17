import { create } from "zustand";
import {
  INITIAL_SAVINGS_RECORDS,
  type SavingsRecord,
} from "@/lib/savings-data";

interface SavingsState {
  records: SavingsRecord[];
  addRecord: (record: SavingsRecord) => void;
}

export const useSavingsStore = create<SavingsState>((set) => ({
  records: INITIAL_SAVINGS_RECORDS,
  addRecord: (record) =>
    set((state) => ({ records: [record, ...state.records] })),
}));
