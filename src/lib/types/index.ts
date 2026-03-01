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
