import { z } from "zod";

export const createNoticeSchema = z
  .object({
    type: z.enum(["General", "Meeting Notice", "Meeting Minutes"]),
    title: z.string().trim().min(1, "Enter a title"),
    message: z.string().trim().min(1, "Enter an announcement message"),
    recipient: z.enum(["All Members", "All Admins", "All Members & Admins"]),
    medium: z.enum(["Email", "SMS", "Email & SMS"]),
    targetCoopIds: z
      .array(z.string())
      .min(1, "Select at least one co-operative"),
    meetingDate: z.string().optional(),
    meetingTime: z.string().optional(),
    meetingDurationMinutes: z.number().int().min(1).max(1440),
    meetingVenue: z
      .string()
      .max(200, "Keep the venue under 200 characters")
      .optional(),
    schedule: z.enum(["now", "later"]),
    scheduleDate: z.string().optional(),
    scheduleTime: z.string().optional(),
  })
  .refine(
    (values) => values.type !== "Meeting Notice" || !!values.meetingDate,
    { message: "Enter the meeting date", path: ["meetingDate"] },
  )
  .refine(
    (values) => values.type !== "Meeting Notice" || !!values.meetingTime,
    { message: "Pick the meeting time", path: ["meetingTime"] },
  )
  .refine(
    (values) =>
      values.type !== "Meeting Notice" ||
      (values.meetingDurationMinutes >= 1 &&
        values.meetingDurationMinutes <= 1440),
    {
      message: "Meeting duration must be between 1 minute and 24 hours",
      path: ["meetingDurationMinutes"],
    },
  )
  .refine((values) => values.schedule !== "later" || !!values.scheduleDate, {
    message: "Pick a date to send on",
    path: ["scheduleDate"],
  })
  .refine((values) => values.schedule !== "later" || !!values.scheduleTime, {
    message: "Pick a time to send at",
    path: ["scheduleTime"],
  });

export type CreateNoticeFormValues = z.infer<typeof createNoticeSchema>;

export const replySchema = z.object({
  message: z.string().trim().min(1, "Enter a message"),
});

export type ReplyFormValues = z.infer<typeof replySchema>;
