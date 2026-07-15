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

export const registerCooperativeSchema = z.object({
  membershipId: z.string().trim().min(1, "Enter a membership ID"),
  coopName: z.string().trim().min(1, "Enter your co-operative name"),
  firstName: z.string().trim().min(1, "Enter your first name"),
  lastName: z.string().trim().min(1, "Enter your last name"),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(/^[\d+\s-]+$/, "Enter a valid phone number"),
  country: z.string().min(1, "Select a country"),
  agreeToTerms: z.boolean().refine((value) => value === true, {
    message: "You must agree to the terms to continue",
  }),
});

export type RegisterCooperativeFormValues = z.infer<
  typeof registerCooperativeSchema
>;
