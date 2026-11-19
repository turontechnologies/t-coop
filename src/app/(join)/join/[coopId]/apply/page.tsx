import type { Metadata } from "next";
import { ApplyWizard } from "@/components/features/join/apply-wizard";

export const metadata: Metadata = {
  title: "Application form | T-Cooperative",
  description: "Apply to become a member of your co-operative.",
};

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ coopId: string }>;
}) {
  const { coopId } = await params;
  return <ApplyWizard coopId={decodeURIComponent(coopId)} />;
}
