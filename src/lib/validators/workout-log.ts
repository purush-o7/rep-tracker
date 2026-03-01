import { z } from "zod";

export const workoutSetSchema = z.object({
  set_number: z.number().int().positive(),
  reps: z.number().int().positive("Reps must be greater than 0"),
  weight_kg: z.number().min(0, "Weight cannot be negative"),
});

export const workoutLogSchema = z.object({
  workout_id: z.string().uuid(),
  performed_at: z.string().optional(),
  notes: z.string().optional(),
  sets: z.array(workoutSetSchema).min(1, "Add at least one set"),
});

export type WorkoutSetInput = z.infer<typeof workoutSetSchema>;
export type WorkoutLogInput = z.infer<typeof workoutLogSchema>;
