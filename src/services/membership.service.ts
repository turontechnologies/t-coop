import { apiClient } from "@/lib/axios";
import type { CoopPaymentGateway } from "@/lib/coop-checkout";

/* ---------- What the join pages show ---------- */

export interface CoopListing {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
}

export interface GuarantorRules {
  required: boolean;
  min: number;
  /** "Any", "CoopOnly" or "Mix". */
  source: string;
  fromCoop: number;
  fromOutside: number;
}

export interface CoopApplyInfo {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  open: boolean;
  rules: string | null;
  requirements: string[];
  formFee: number;
  firstSavings: number;
  totalFee: number;
  currency: string;
  savingsTypeName: string | null;
  requireIdDocument: boolean;
  minAge: number;
  guarantors: GuarantorRules;
  canPayOnline: boolean;
}

export type GuarantorStatus = "Pending" | "Confirmed" | "Declined" | "NotAsked";

export interface ApplicationGuarantor {
  id: string;
  memberId: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  status: GuarantorStatus;
  respondedAt: string | null;
}

export type ApplicationStatus = "Draft" | "Submitted" | "Approved" | "Rejected";

export interface Application {
  id: string;
  reference: string;
  status: ApplicationStatus;
  cooperativeId: string;
  cooperativeName: string;
  firstName: string;
  lastName: string;
  otherName: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  email: string;
  phone: string;
  nin: string | null;
  occupation: string | null;
  homeAddress: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  nextOfKinName: string | null;
  nextOfKinPhone: string | null;
  nextOfKinRelationship: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  photoUrl: string | null;
  idDocumentUrl: string | null;
  idDocumentType: string | null;
  guarantors: ApplicationGuarantor[];
  formFee: number;
  firstSavings: number;
  totalFee: number;
  paymentStarted: boolean;
  submittedAt: string | null;
  decisionNote: string | null;
}

/** One guarantor as sent with the form: a member by ID, or someone from outside. */
export interface GuarantorInput {
  memberId?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface ApplicationDetails {
  firstName: string;
  lastName: string;
  otherName: string;
  gender: string;
  dateOfBirth: string | null;
  phone: string;
  nin: string;
  occupation: string;
  homeAddress: string;
  country: string;
  state: string;
  city: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  idDocumentType: string;
  /** Left out (null) to keep the guarantors already saved. */
  guarantors: GuarantorInput[] | null;
}

export interface PayResponse {
  submitted: boolean;
  reference: string | null;
  amount: number | null;
  gateway: CoopPaymentGateway | null;
  publicKey: string | null;
  email: string;
  application: Application | null;
}

export interface ApplicationStatusView {
  reference: string;
  status: ApplicationStatus;
  cooperativeName: string;
  submittedAt: string | null;
  decidedAt: string | null;
  note: string | null;
  message: string;
}

/* ---------- What the admin sees ---------- */

export type CheckStatus = "pass" | "warn" | "fail" | "info";

export interface ApplicationCheck {
  key: string;
  label: string;
  status: CheckStatus;
  detail: string;
  weight: number;
}

export interface ApplicationChecks {
  score: number;
  level: "high" | "medium" | "low";
  levelLabel: string;
  checks: ApplicationCheck[];
}

export interface ApplicationListItem {
  id: string;
  reference: string;
  status: ApplicationStatus;
  fullName: string;
  email: string;
  phone: string;
  photoUrl: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  score: number;
  level: "high" | "medium" | "low";
  levelLabel: string;
  guarantorsConfirmed: number;
  guarantorsAsked: number;
  amountPaid: number | null;
  memberId: string | null;
}

export interface ApplicationDetail {
  application: Application;
  createdAt: string;
  emailVerifiedAt: string | null;
  bankAccountName: string | null;
  paymentReference: string | null;
  paymentGateway: string | null;
  amountPaid: number | null;
  paidAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  decisionNote: string | null;
  memberId: string | null;
  checks: ApplicationChecks;
  savingsTypeName: string | null;
  nextMemberId: string | null;
}

export interface RegistrationSettings {
  open: boolean;
  formFee: number;
  firstSavings: number;
  totalFee: number;
  savingsTypeId: string | null;
  rules: string | null;
  requirements: string | null;
  defaultRequirements: string[];
  requireIdDocument: boolean;
  minAge: number;
  canPayOnline: boolean;
  waitingCount: number;
}

export type RegistrationSettingsInput = Omit<
  RegistrationSettings,
  "totalFee" | "defaultRequirements" | "canPayOnline" | "waitingCount"
>;

export interface VouchRequest {
  id: string;
  applicationReference: string;
  applicantName: string;
  applicantPhone: string;
  applicantPhotoUrl: string | null;
  cooperativeName: string;
  submittedAt: string | null;
}

const tokenHeader = (token: string) => ({
  headers: { "X-Application-Token": token },
});

/** The public join pages: no login, the application's own key after the email code. */
export const joinService = {
  async cooperatives(search: string): Promise<CoopListing[]> {
    const { data } = await apiClient.get<CoopListing[]>("/apply/cooperatives", {
      params: search ? { search } : undefined,
    });
    return data;
  },

  async cooperative(coopId: string): Promise<CoopApplyInfo> {
    const { data } = await apiClient.get<CoopApplyInfo>(
      `/apply/cooperatives/${encodeURIComponent(coopId)}`,
    );
    return data;
  },

  async start(
    coopId: string,
    body: { firstName: string; lastName: string; email: string; phone: string },
  ): Promise<{ applicationId: string; email: string; resumed: boolean }> {
    const { data } = await apiClient.post(
      `/apply/cooperatives/${encodeURIComponent(coopId)}/start`,
      body,
    );
    return data;
  },

  async verify(
    applicationId: string,
    code: string,
  ): Promise<{ token: string; application: Application }> {
    const { data } = await apiClient.post(
      `/apply/applications/${applicationId}/verify`,
      { code },
    );
    return data;
  },

  async get(applicationId: string, token: string): Promise<Application> {
    const { data } = await apiClient.get<Application>(
      `/apply/applications/${applicationId}`,
      tokenHeader(token),
    );
    return data;
  },

  async save(
    applicationId: string,
    token: string,
    details: ApplicationDetails,
  ): Promise<Application> {
    const { data } = await apiClient.put<Application>(
      `/apply/applications/${applicationId}`,
      { ...details, dateOfBirth: details.dateOfBirth || null },
      tokenHeader(token),
    );
    return data;
  },

  async upload(
    applicationId: string,
    token: string,
    kind: "photo" | "id",
    file: File,
  ): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<{ url: string }>(
      `/apply/applications/${applicationId}/files`,
      form,
      {
        params: { kind },
        timeout: 60_000,
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Application-Token": token,
        },
      },
    );
    return data.url;
  },

  async lookupGuarantor(
    applicationId: string,
    token: string,
    memberId: string,
  ): Promise<{ memberId: string; name: string }> {
    const { data } = await apiClient.get(
      `/apply/applications/${applicationId}/guarantor-lookup`,
      { ...tokenHeader(token), params: { memberId } },
    );
    return data;
  },

  async banks(): Promise<{ name: string; code: string }[]> {
    const { data } = await apiClient.get<{
      banks: { name: string; code: string }[];
    }>("/apply/banks");
    return data.banks;
  },

  async resolveAccount(
    applicationId: string,
    token: string,
    accountNumber: string,
    bankCode: string,
  ): Promise<string> {
    const { data } = await apiClient.post<{ accountName: string }>(
      `/apply/applications/${applicationId}/resolve-account`,
      { accountNumber, bankCode },
      tokenHeader(token),
    );
    return data.accountName;
  },

  async pay(applicationId: string, token: string): Promise<PayResponse> {
    const { data } = await apiClient.post<PayResponse>(
      `/apply/applications/${applicationId}/pay`,
      {},
      { ...tokenHeader(token), timeout: 30_000 },
    );
    return data;
  },

  async confirmPayment(
    applicationId: string,
    token: string,
    reference: string,
  ): Promise<Application> {
    const { data } = await apiClient.post<Application>(
      `/apply/applications/${applicationId}/pay/confirm`,
      { reference },
      { ...tokenHeader(token), timeout: 30_000 },
    );
    return data;
  },

  async status(
    reference: string,
    email: string,
  ): Promise<ApplicationStatusView> {
    const { data } = await apiClient.get<ApplicationStatusView>(
      "/apply/status",
      { params: { reference, email } },
    );
    return data;
  },
};

/** The co-op's side: settings, the list of applications, and decisions. */
export const membershipAdminService = {
  async settings(coopId: string): Promise<RegistrationSettings> {
    const { data } = await apiClient.get<RegistrationSettings>(
      `/cooperatives/${coopId}/registration-settings`,
    );
    return data;
  },

  async saveSettings(
    coopId: string,
    input: RegistrationSettingsInput,
  ): Promise<RegistrationSettings> {
    const { data } = await apiClient.put<RegistrationSettings>(
      `/cooperatives/${coopId}/registration-settings`,
      input,
    );
    return data;
  },

  async list(
    coopId: string,
    status: "Submitted" | "Approved" | "Rejected" | "All",
  ): Promise<ApplicationListItem[]> {
    const { data } = await apiClient.get<ApplicationListItem[]>(
      `/cooperatives/${coopId}/membership-applications`,
      { params: { status } },
    );
    return data;
  },

  async detail(coopId: string, id: string): Promise<ApplicationDetail> {
    const { data } = await apiClient.get<ApplicationDetail>(
      `/cooperatives/${coopId}/membership-applications/${id}`,
      { timeout: 30_000 },
    );
    return data;
  },

  async approve(
    coopId: string,
    id: string,
    body: { membershipId: string | null; note: string | null },
  ): Promise<ApplicationDetail> {
    const { data } = await apiClient.post<ApplicationDetail>(
      `/cooperatives/${coopId}/membership-applications/${id}/approve`,
      body,
      { timeout: 30_000 },
    );
    return data;
  },

  async reject(
    coopId: string,
    id: string,
    reason: string,
  ): Promise<ApplicationDetail> {
    const { data } = await apiClient.post<ApplicationDetail>(
      `/cooperatives/${coopId}/membership-applications/${id}/reject`,
      { reason },
    );
    return data;
  },

  async vouches(): Promise<VouchRequest[]> {
    const { data } = await apiClient.get<VouchRequest[]>("/membership-vouches");
    return data;
  },

  async answerVouch(id: string, knowsThem: boolean): Promise<void> {
    await apiClient.post(`/membership-vouches/${id}`, { knowsThem });
  },
};
