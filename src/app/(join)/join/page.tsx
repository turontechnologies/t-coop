import type { Metadata } from "next";
import { FindCooperative } from "@/components/features/join/find-cooperative";

export const metadata: Metadata = {
  title: "Join a co-operative | T-Cooperative",
  description: "Find your co-operative and apply to become a member.",
};

export default function JoinPage() {
  return <FindCooperative />;
}
