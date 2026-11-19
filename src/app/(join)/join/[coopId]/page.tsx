import type { Metadata } from "next";
import { JoinIntro } from "@/components/features/join/join-intro";

export const metadata: Metadata = {
  title: "Before you apply | T-Cooperative",
  description: "The co-operative's rules, what you need and the joining fee.",
};

export default async function JoinCoopPage({
  params,
}: {
  params: Promise<{ coopId: string }>;
}) {
  const { coopId } = await params;
  return <JoinIntro coopId={decodeURIComponent(coopId)} />;
}
