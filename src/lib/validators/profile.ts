import { z } from "zod";

export const handleRegex = /^[a-z0-9_.]{3,30}$/;

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().int().positive().max(150).optional().nullable(),
  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .optional()
    .nullable(),
  height_cm: z.number().positive().optional().nullable(),
  weight_kg: z.number().positive().optional().nullable(),
  handle: z
    .string()
    .regex(handleRegex, "Only lowercase letters, numbers, dots and underscores (3-30 chars)")
    .optional()
    .nullable(),
  is_public: z.boolean().optional(),
  partner_can_view_logs: z.boolean().optional(),
  partner_can_edit_logs: z.boolean().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
