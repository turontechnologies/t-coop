import { apiClient } from "@/lib/axios";
import { logActivity } from "@/lib/audit-log";
import { useCoopStore } from "@/store/coop.store";
import type { Cooperative } from "@/lib/coop-data";
import { LOAN_TYPES } from "@/lib/loans-data";
import { SAVINGS_TYPES } from "@/lib/savings-data";
import type { CooperativeSummary } from "@/types/cooperative";
import type {
  AddCooperativeFormValues,
  EditCooperativeFormValues,
} from "@/lib/validations/coop.schema";
import type { CoopBankAccountFormValues } from "@/lib/validations/admin-settings.schema";

const USE_MOCK = () => process.env.NEXT_PUBLIC_USE_MOCK_COOPERATIVES === "true";

function toSummary(coop: Cooperative): CooperativeSummary {
  return {
    id: coop.id,
    name: coop.name,
    adminName: coop.adminName,
    contactEmail: coop.contactEmail,
    contactPhone: coop.contactPhone,
    address: coop.address,
    country: coop.country,
    state: coop.state,
    city: coop.city,
    status: coop.status,
    currency: coop.currency,
    withdrawalFeePercent: 0,
    bankCode: null,
    accountNumber: null,
    accountName: null,
    memberIdPrefix: "MB",
    memberIdPadding: 4,
    memberIdType: "NUMERIC",
    memberCount: coop.members.length,
    savingsTypeCount: SAVINGS_TYPES.length,
    loanTypeCount: LOAN_TYPES.length,
    totalSavings: coop.savings.reduce((sum, record) => sum + record.amount, 0),
    totalLoans: coop.loans.reduce((sum, record) => sum + record.amount, 0),
  };
}

export const cooperativeService = {
  async getCooperatives(): Promise<CooperativeSummary[]> {
    if (USE_MOCK()) return mockGetCooperatives();
    const { data } = await apiClient.get<CooperativeSummary[]>("/cooperatives");
    return data;
  },

  async getCooperative(id: string): Promise<CooperativeSummary> {
    if (USE_MOCK()) return mockGetCooperative(id);
    const { data } = await apiClient.get<CooperativeSummary>(
      `/cooperatives/${id}`,
    );
    return data;
  },

  async createCooperative(
    values: AddCooperativeFormValues,
  ): Promise<CooperativeSummary> {
    if (USE_MOCK()) return mockCreateCooperative(values);
    const { data } = await apiClient.post<CooperativeSummary>(
      "/cooperatives",
      values,
    );
    return data;
  },

  async updateCooperative(
    id: string,
    values: EditCooperativeFormValues,
  ): Promise<CooperativeSummary> {
    if (USE_MOCK()) return mockUpdateCooperative(id, values);
    const { data } = await apiClient.patch<CooperativeSummary>(
      `/cooperatives/${id}`,
      values,
    );
    return data;
  },

  async updateCooperativeStatus(
    id: string,
    status: "Active" | "Disabled",
  ): Promise<CooperativeSummary> {
    if (USE_MOCK()) return mockUpdateCooperativeStatus(id, status);
    const { data } = await apiClient.patch<CooperativeSummary>(
      `/cooperatives/${id}/status`,
      { status },
    );
    return data;
  },

  async updateBankAccount(
    id: string,
    values: CoopBankAccountFormValues,
  ): Promise<CooperativeSummary> {
    const { data } = await apiClient.patch<CooperativeSummary>(
      `/cooperatives/${id}/bank-account`,
      { ...values, accountName: values.accountName ?? "" },
    );
    return data;
  },

  async getNextCoopId(): Promise<string> {
    const { data } = await apiClient.get<{ nextId: string }>(
      "/cooperatives/next-id",
    );
    return data.nextId;
  },

  async getNextMemberId(coopId: string): Promise<string> {
    const { data } = await apiClient.get<{ nextId: string }>(
      `/cooperatives/${coopId}/members/next-id`,
    );
    return data.nextId;
  },
};

// Kept for local demoing without a backend running at all — flip
// NEXT_PUBLIC_USE_MOCK_COOPERATIVES back to "true" to use these instead.
async function mockGetCooperatives(): Promise<CooperativeSummary[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return useCoopStore.getState().cooperatives.map(toSummary);
}

async function mockGetCooperative(id: string): Promise<CooperativeSummary> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const coop = useCoopStore.getState().cooperatives.find((c) => c.id === id);
  if (!coop) throw new Error("We couldn't find that co-operative");
  return toSummary(coop);
}

async function mockCreateCooperative(
  values: AddCooperativeFormValues,
): Promise<CooperativeSummary> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  const store = useCoopStore.getState();
  const isTaken = store.cooperatives.some(
    (coop) => coop.id.toLowerCase() === values.coopId.trim().toLowerCase(),
  );
  if (isTaken) {
    throw new Error("That co-op ID is already in use. Please choose another.");
  }

  const coop: Cooperative = {
    id: values.coopId.trim(),
    name: values.coopName.trim(),
    adminName: `${values.adminFirstName.trim()} ${values.adminLastName.trim()}`,
    contactEmail: values.contactEmail.trim(),
    contactPhone: values.contactPhone.trim(),
    address: values.address.trim(),
    country: values.country,
    state: values.state.trim(),
    city: values.city.trim(),
    status: "Active",
    members: [],
    savings: [],
    loans: [],
    savingsRequests: [],
    subscriptionFee: 150_000,
    subscriptionPayments: [],
    currency: "NGN",
  };
  store.addCooperative(coop);
  return toSummary(coop);
}

async function mockUpdateCooperative(
  id: string,
  values: EditCooperativeFormValues,
): Promise<CooperativeSummary> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const store = useCoopStore.getState();
  const coop = store.cooperatives.find((c) => c.id === id);
  if (!coop) throw new Error("We couldn't find that co-operative");

  const { adminFirstName, adminLastName, ...rest } = values;
  const updated: Cooperative = {
    ...coop,
    ...rest,
    adminName: `${adminFirstName.trim()} ${adminLastName.trim()}`,
  };
  useCoopStore.setState({
    cooperatives: store.cooperatives.map((c) => (c.id === id ? updated : c)),
  });
  logActivity({
    module: "Co-operatives",
    action: "Update",
    resource: updated.name,
  });
  return toSummary(updated);
}

async function mockUpdateCooperativeStatus(
  id: string,
  status: "Active" | "Disabled",
): Promise<CooperativeSummary> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const store = useCoopStore.getState();
  const coop = store.cooperatives.find((c) => c.id === id);
  if (!coop) throw new Error("We couldn't find that co-operative");
  store.setCooperativeStatus(id, status);
  return toSummary({ ...coop, status });
}
