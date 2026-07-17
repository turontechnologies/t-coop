import { create } from "zustand";
import { INITIAL_LOAN_RECORDS, type LoanRecord } from "@/lib/loans-data";

interface LoansState {
  records: LoanRecord[];
  addRecord: (record: LoanRecord) => void;
}

export const useLoansStore = create<LoansState>((set) => ({
  records: INITIAL_LOAN_RECORDS,
  addRecord: (record) =>
    set((state) => ({ records: [record, ...state.records] })),
}));
