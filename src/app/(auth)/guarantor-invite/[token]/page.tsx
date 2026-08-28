import type { Metadata } from "next";
import { GuarantorInviteResponse } from "@/components/features/members-directory/guarantor-invite-response";

export const metadata: Metadata = {
  title: "Guarantor Request | T-Cooperative",
  description: "Accept or decline a guarantor request on T-Cooperative.",
};

export default async function GuarantorInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="space-y-8">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Guarantor Request
        </h2>
      </div>
      <GuarantorInviteResponse token={token} />
    </div>
  );
}
