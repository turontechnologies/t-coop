import { z } from "zod";

export const subscriptionPlanSchema = z.object({
  type: z.enum(["New Subscription", "Renewal"]),
  label: z.string().trim().min(1, "Enter a name for this plan"),
  durationInDays: z
    .number()
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 day"),
  amount: z.number().positive("Enter an amount greater than zero"),
  status: z.enum(["Active", "Inactive"]),
});

export type SubscriptionPlanFormValues = z.infer<typeof subscriptionPlanSchema>;
