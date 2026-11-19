"use client";

import { use } from "react";
import { ApplicationReview } from "@/components/features/members-directory/application-review";

export default function ApplicationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ApplicationReview applicationId={id} />;
}
