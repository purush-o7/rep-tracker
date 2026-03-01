import { z } from "zod";

export const workoutSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  tag_ids: z.array(z.string().uuid()).min(1, "Select at least one muscle group"),
});

export type WorkoutInput = z.infer<typeof workoutSchema>;
