import { apiClient } from "@/lib/axios";
import {
  findCooperative,
  type CoopMember,
  type CoopMemberRole,
} from "@/lib/coop-data";
import type { EditMemberFormValues } from "@/lib/validations/coop.schema";
import { useCoopStore } from "@/store/coop.store";

const USE_MOCK = () => process.env.NEXT_PUBLIC_USE_MOCK_COOPERATIVES === "true";

interface CoopMemberDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "admin" | "member" | "super_admin";
  status: "Active" | "Inactive";
  guarantor: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
}

function toRole(role: CoopMemberDto["role"]): CoopMemberRole {
  return role === "member" ? "Member" : "Admin";
}

function fromDto(dto: CoopMemberDto): CoopMember {
  return {
    id: dto.id,
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    role: toRole(dto.role),
    status: dto.status,
    guarantor: dto.guarantor ?? "",
    country: dto.country ?? "",
    state: dto.state ?? "",
    city: dto.city ?? "",
    bankCode: dto.bankCode ?? "",
    accountNumber: dto.accountNumber ?? "",
    accountName: dto.accountName ?? "",
  };
}

/**
 * Super-admin co-op oversight Members tab — real backend (CooperativeController). Listing,
 * editing a profile, and toggling status are all real now; there's still no real way to *add* a
 * member from this specific view (that's the separate admin-facing Members Directory flow).
 */
export const coopMemberService = {
  async getMembers(coopId: string): Promise<CoopMember[]> {
    if (USE_MOCK()) return mockGetMembers(coopId);
    const { data } = await apiClient.get<CoopMemberDto[]>(
      `/cooperatives/${coopId}/members`,
    );
    return data.map(fromDto);
  },

  async updateMember(
    coopId: string,
    memberId: string,
    values: EditMemberFormValues,
  ): Promise<CoopMember> {
    if (USE_MOCK()) return mockUpdateMember(coopId, memberId, values);
    const { data } = await apiClient.patch<CoopMemberDto>(
      `/cooperatives/${coopId}/members/${memberId}`,
      { ...values, accountName: values.accountName ?? "" },
    );
    return fromDto(data);
  },

  async updateMemberStatus(
    coopId: string,
    memberId: string,
    status: "Active" | "Inactive",
  ): Promise<CoopMember> {
    if (USE_MOCK()) return mockUpdateMemberStatus(coopId, memberId, status);
    const { data } = await apiClient.patch<CoopMemberDto>(
      `/cooperatives/${coopId}/members/${memberId}/status`,
      { status },
    );
    return fromDto(data);
  },
};

async function mockGetMembers(coopId: string): Promise<CoopMember[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const coop = findCooperative(useCoopStore.getState().cooperatives, coopId);
  if (!coop) throw new Error("We couldn't find that co-operative");
  return coop.members;
}

async function mockUpdateMember(
  coopId: string,
  memberId: string,
  values: EditMemberFormValues,
): Promise<CoopMember> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  useCoopStore.getState().updateMember(coopId, memberId, {
    ...values,
    accountName: values.accountName ?? "",
  });
  const coop = findCooperative(useCoopStore.getState().cooperatives, coopId);
  const member = coop?.members.find((item) => item.id === memberId);
  if (!member) throw new Error("We couldn't find that member");
  return member;
}

async function mockUpdateMemberStatus(
  coopId: string,
  memberId: string,
  status: "Active" | "Inactive",
): Promise<CoopMember> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  useCoopStore.getState().setMemberStatus(coopId, memberId, status);
  const coop = findCooperative(useCoopStore.getState().cooperatives, coopId);
  const member = coop?.members.find((item) => item.id === memberId);
  if (!member) throw new Error("We couldn't find that member");
  return member;
}
