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

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(6, "Enter the 6-digit code")
    .regex(/^\d+$/, "The code should contain numbers only"),
});

export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

export const createNewPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type CreateNewPasswordFormValues = z.infer<
  typeof createNewPasswordSchema
>;
