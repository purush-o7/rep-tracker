export type { Database } from "./database";

import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Workout = Database["public"]["Tables"]["workouts"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type WorkoutTag = Database["public"]["Tables"]["workout_tags"]["Row"];
export type WorkoutImage = Database["public"]["Tables"]["workout_images"]["Row"];
export type WorkoutLog = Database["public"]["Tables"]["workout_logs"]["Row"];
export type WorkoutSet = Database["public"]["Tables"]["workout_sets"]["Row"];
export type WorkoutPartner = Database["public"]["Tables"]["workout_partners"]["Row"];

export type WorkoutWithTags = Workout & {
  workout_tags: (WorkoutTag & { tags: Tag })[];
  workout_images: WorkoutImage[];
};

export type WorkoutLogWithDetails = WorkoutLog & {
  workouts: Workout;
  workout_sets: WorkoutSet[];
};

export type WorkoutGroup = Database["public"]["Tables"]["workout_groups"]["Row"];
export type WorkoutGroupItem = Database["public"]["Tables"]["workout_group_items"]["Row"];

export type WorkoutGroupWithItems = WorkoutGroup & {
  workout_group_items: (WorkoutGroupItem & { workouts: Workout })[];
};

export type DailyPlanItem = Database["public"]["Tables"]["daily_plan_items"]["Row"];
export type DailyPlanItemWithWorkout = DailyPlanItem & { workouts: Workout };

export type BodyWeightLog = Database["public"]["Tables"]["body_weight_logs"]["Row"];
export type WeeklyScheduleEntry = Database["public"]["Tables"]["weekly_schedule"]["Row"];

/** Prescribed targets for an exercise inside a routine */
export type ExerciseTargets = {
  target_sets: number | null;
  target_reps: number | null;
  target_weight_kg: number | null;
};

/** Previous session summary shown while logging sets */
export type LastSession = {
  performed_at: string;
  sets: { set_number: number; reps: number; weight_kg: number }[];
};
