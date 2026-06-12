import { z } from "zod";

export const workoutSetSchema = z
  .object({
    set_number: z.number().int().positive(),
    reps: z.number().int().positive().optional().nullable(),
    weight_kg: z.number().min(0, "Weight cannot be negative").default(0),
    duration_seconds: z.number().int().positive().optional().nullable(),
    distance_m: z.number().int().positive().optional().nullable(),
  })
  .refine((s) => s.reps || s.duration_seconds || s.distance_m, {
    message: "A set needs reps, a duration or a distance",
  });

export const workoutLogSchema = z.object({
  workout_id: z.string().uuid(),
  performed_at: z.string().optional(),
  notes: z.string().optional(),
  sets: z.array(workoutSetSchema).min(1, "Add at least one set"),
});

export type WorkoutSetInput = z.infer<typeof workoutSetSchema>;
export type WorkoutLogInput = z.infer<typeof workoutLogSchema>;
