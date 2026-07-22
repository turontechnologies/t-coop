export interface BvnIdentity {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

// No real BVN/identity verification backend exists yet — this is a small
// hardcoded lookup table so the "Proceed" auto-fill step in Add New Member
// is a genuine, testable mock rather than a fake that always succeeds.
const MOCK_BVN_REGISTRY: Record<string, BvnIdentity> = {
  "22110099887": {
    firstName: "Kunle",
    lastName: "Adebayo",
    phone: "08051234567",
    email: "kunle.adebayo@example.com",
  },
  "22110099888": {
    firstName: "Ngozi",
    lastName: "Eze",
    phone: "08067654321",
    email: "ngozi.eze@example.com",
  },
  "22110099889": {
    firstName: "Tariq",
    lastName: "Bello",
    phone: "08078889999",
    email: "tariq.bello@example.com",
  },
};

export const DEMO_BVNS = Object.keys(MOCK_BVN_REGISTRY);

export async function lookupBvn(bvn: string): Promise<BvnIdentity> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const match = MOCK_BVN_REGISTRY[bvn.trim()];
  if (!match) {
    throw new Error(
      "We couldn't verify that BVN. Try one of the demo BVNs below, or check the number and try again.",
    );
  }

  return match;
}
