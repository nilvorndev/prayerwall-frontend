import { z } from "zod";

export const emailSchema = z.string().trim().email("Enter a valid email address.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(128, "Password is too long.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Display name must be at least 2 characters long.")
  .max(60, "Display name must be 60 characters or fewer.");

export const prayerDescriptionSchema = z
  .string()
  .trim()
  .min(1, "Prayer content is required.")
  .max(1200, "Prayer content must be 1200 characters or fewer.");

export const prayerFormSchema = z.object({
  description: prayerDescriptionSchema,
  is_public: z.boolean().optional().default(true),
  title: z.string().trim().max(200).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    first_name: z.string().trim().max(60).optional().or(z.literal("")),
    last_name: z.string().trim().max(60).optional().or(z.literal("")),
  })
  .transform((value) => ({
    ...value,
    first_name: value.first_name?.trim() || undefined,
    last_name: value.last_name?.trim() || undefined,
  }));

export const verifySchema = z.object({
  token: z.string().trim().optional(),
  code: z.string().trim().optional(),
}).refine(data => data.token || data.code, {
  message: "Verification token or code is required.",
});

export const anonymousCreateSchema = z.object({
  display_name: displayNameSchema.optional().or(z.literal("")),
});

export const accountUpdateSchema = z.object({
  first_name: z.string().trim().max(60).optional().or(z.literal("")),
  last_name: z.string().trim().max(60).optional().or(z.literal("")),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
export type PrayerFormInput = z.infer<typeof prayerFormSchema>;
