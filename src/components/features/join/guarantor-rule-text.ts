import type { GuarantorRules } from "@/services/membership.service";

/** The co-op's guarantor rule in one plain sentence. */
export function guarantorRuleText(rules: GuarantorRules): string {
  if (!rules.required) {
    return "A guarantor is not required, but you can add one. A guarantor who is already a member makes your application stronger.";
  }
  const people = (count: number) =>
    `${count} ${count === 1 ? "person" : "people"}`;
  if (rules.source === "CoopOnly") {
    return `You need ${people(rules.min)} who are already members of this co-operative to stand for you (your guarantors).`;
  }
  if (rules.source === "Mix") {
    return `You need ${people(rules.min)} to stand for you (your guarantors): at least ${rules.fromCoop} must already be ${rules.fromCoop === 1 ? "a member" : "members"} of this co-operative and at least ${rules.fromOutside} from outside it.`;
  }
  return `You need ${people(rules.min)} to stand for you (your guarantors). They can be members of this co-operative or people you know outside it.`;
}
