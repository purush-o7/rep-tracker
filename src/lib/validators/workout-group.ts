import { z } from "zod";

export const workoutGroupItemSchema = z.object({
  workout_id: z.string().uuid(),
  sort_order: z.number().int().min(0),
});

export const createWorkoutGroupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  description: z.string().max(500).optional(),
  items: z.array(workoutGroupItemSchema),
});

export type CreateWorkoutGroupInput = z.infer<typeof createWorkoutGroupSchema>;
export type WorkoutGroupItemInput = z.infer<typeof workoutGroupItemSchema>;
