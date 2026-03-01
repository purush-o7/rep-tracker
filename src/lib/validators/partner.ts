import { z } from "zod";
import { handleRegex } from "./profile";

export const invitePartnerSchema = z.object({
  handle: z
    .string()
    .regex(handleRegex, "Enter a valid handle (lowercase letters, numbers, dots, underscores)"),
});

export type InvitePartnerInput = z.infer<typeof invitePartnerSchema>;
