import { apiClient } from "@/lib/axios";
import type { CoopSavingsRecord, SavingsRequest } from "@/lib/coop-data";

const USE_MOCK = () => process.env.NEXT_PUBLIC_USE_MOCK_SAVINGS === "true";

export interface InitializeDepositPayload {
  savingsTypeId: string;
  amount: number;
}

export interface InitializeDepositResult {
  reference: string;
  amount: number;
  publicKey: string;
  chargeAmount: number;
  netAmount: number;
}

export interface DepositResult {
  record: CoopSavingsRecord;
  grossAmount: number;
  chargeAmount: number;
}

export interface ManualDepositPayload {
  memberId: string;
  savingsTypeId: string;
  amount: number;
  receiptUrl?: string;
}

export interface WithdrawalRequestPayload {
  savingsTypeId?: string;
  amount: number;
  note?: string;
}

interface SavingsRequestDto {
  id: string;
  memberId: string;
  memberName: string;
  requestType: "Deposit" | "Withdrawal";
  savingsType: string;
  amount: number;
  note: string | null;
  status: "Pending" | "Approved" | "Declined";
  feePercent: number | null;
  feeAmount: number | null;
  netAmount: number | null;
  requestedAt: string;
  resolvedAt: string | null;
}

function fromRequestDto(dto: SavingsRequestDto): SavingsRequest {
  return {
    id: dto.id,
    memberId: dto.memberId,
    memberName: dto.memberName,
    type: dto.requestType,
    savingsType: dto.savingsType,
    amount: dto.amount,
    note: dto.note ?? undefined,
    status: dto.status,
    requestedAt: dto.requestedAt,
    resolvedAt: dto.resolvedAt ?? undefined,
    feePercent: dto.feePercent ?? undefined,
    feeAmount: dto.feeAmount ?? undefined,
    netAmount: dto.netAmount ?? undefined,
  };
}

/**
 * The real backend behind a member's own "+ New Savings" / "Withdraw" actions, and an admin's
 * "Upload Teller" / withdrawal-request decisions — mirrors `coop-savings.service.ts`'s
 * super-admin oversight shape, but hits `SavingsSelfServiceController` instead of the read-only
 * `SavingsController`. See that backend controller's own javadoc for the initialize/confirm
 * Paystack pattern this follows.
 */
export const savingsSelfService = {
  async initializeDeposit(
    coopId: string,
    payload: InitializeDepositPayload,
  ): Promise<InitializeDepositResult> {
    if (USE_MOCK()) throw new Error("Mock savings deposits aren't supported.");
    const { data } = await apiClient.post<InitializeDepositResult>(
      `/cooperatives/${coopId}/savings/deposits/initialize`,
      payload,
    );
    return data;
  },

  async confirmDeposit(
    coopId: string,
    reference: string,
  ): Promise<DepositResult> {
    if (USE_MOCK()) throw new Error("Mock savings deposits aren't supported.");
    const { data } = await apiClient.post<DepositResult>(
      `/cooperatives/${coopId}/savings/deposits/confirm`,
      { reference },
    );
    return data;
  },

  async manualDeposit(
    coopId: string,
    payload: ManualDepositPayload,
  ): Promise<DepositResult> {
    if (USE_MOCK()) throw new Error("Mock savings deposits aren't supported.");
    const { data } = await apiClient.post<DepositResult>(
      `/cooperatives/${coopId}/savings/deposits/manual`,
      payload,
    );
    return data;
  },

  async requestWithdrawal(
    coopId: string,
    payload: WithdrawalRequestPayload,
  ): Promise<SavingsRequest> {
    if (USE_MOCK()) throw new Error("Mock withdrawals aren't supported.");
    const { data } = await apiClient.post<SavingsRequestDto>(
      `/cooperatives/${coopId}/savings/withdrawals`,
      payload,
    );
    return fromRequestDto(data);
  },

  async listWithdrawals(
    coopId: string,
    memberId?: string,
  ): Promise<SavingsRequest[]> {
    if (USE_MOCK()) return [];
    const { data } = await apiClient.get<SavingsRequestDto[]>(
      `/cooperatives/${coopId}/savings/withdrawals`,
      { params: memberId ? { memberId } : undefined },
    );
    return data.map(fromRequestDto);
  },

  async decideWithdrawal(
    coopId: string,
    requestId: string,
    status: "Approved" | "Declined",
    transferReference?: string,
  ): Promise<SavingsRequest> {
    if (USE_MOCK()) throw new Error("Mock withdrawals aren't supported.");
    const { data } = await apiClient.patch<SavingsRequestDto>(
      `/cooperatives/${coopId}/savings/withdrawals/${requestId}`,
      { status, transferReference },
    );
    return fromRequestDto(data);
  },
};
