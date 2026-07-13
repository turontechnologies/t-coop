import { z } from "zod";

export const loginSchema = z.object({
  membershipId: z.string().trim().min(1, "Enter your membership ID"),
  password: z
    .string()
    .min(1, "Enter your password")
    .min(6, "Password must be at least 6 characters"),
  keepLoggedIn: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
