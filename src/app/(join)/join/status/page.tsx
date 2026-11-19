import type { Metadata } from "next";
import { ApplicationStatusCheck } from "@/components/features/join/application-status-check";

export const metadata: Metadata = {
  title: "Check my application | T-Cooperative",
  description: "See where your application to join a co-operative is.",
};

export default function ApplicationStatusPage() {
  return <ApplicationStatusCheck />;
}
