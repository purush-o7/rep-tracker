export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          age: number | null;
          gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
          height_cm: number | null;
          weight_kg: number | null;
          avatar_url: string | null;
          role: "user" | "super_admin";
          handle: string | null;
          is_public: boolean;
          partner_can_view_logs: boolean;
          partner_can_edit_logs: boolean;
          current_streak: number;
          longest_streak: number;
          last_workout_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          age?: number | null;
          gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          avatar_url?: string | null;
          role?: "user" | "super_admin";
          handle?: string | null;
          is_public?: boolean;
          partner_can_view_logs?: boolean;
          partner_can_edit_logs?: boolean;
          current_streak?: number;
          longest_streak?: number;
          last_workout_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          age?: number | null;
          gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          avatar_url?: string | null;
          role?: "user" | "super_admin";
          handle?: string | null;
          is_public?: boolean;
          partner_can_view_logs?: boolean;
          partner_can_edit_logs?: boolean;
          current_streak?: number;
          longest_streak?: number;
          last_workout_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workouts: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          youtube_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          youtube_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          youtube_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
      };
      workout_tags: {
        Row: {
          workout_id: string;
          tag_id: string;
        };
        Insert: {
          workout_id: string;
          tag_id: string;
        };
        Update: {
          workout_id?: string;
          tag_id?: string;
        };
      };
      workout_images: {
        Row: {
          id: string;
          workout_id: string;
          storage_path: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          storage_path: string;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          storage_path?: string;
          display_order?: number;
          created_at?: string;
        };
      };
      workout_logs: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string;
          performed_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workout_id: string;
          performed_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workout_id?: string;
          performed_at?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      workout_sets: {
        Row: {
          id: string;
          log_id: string;
          set_number: number;
          reps: number;
          weight_kg: number;
        };
        Insert: {
          id?: string;
          log_id: string;
          set_number: number;
          reps: number;
          weight_kg: number;
        };
        Update: {
          id?: string;
          log_id?: string;
          set_number?: number;
          reps?: number;
          weight_kg?: number;
        };
      };
      workout_partners: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          addressee_id?: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_groups: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workout_group_items: {
        Row: {
          id: string;
          group_id: string;
          workout_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          workout_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          workout_id?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      daily_plan_items: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string;
          plan_date: string;
          sort_order: number;
          source_group_id: string | null;
          is_completed: boolean;
          workout_log_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workout_id: string;
          plan_date?: string;
          sort_order?: number;
          source_group_id?: string | null;
          is_completed?: boolean;
          workout_log_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workout_id?: string;
          plan_date?: string;
          sort_order?: number;
          source_group_id?: string | null;
          is_completed?: boolean;
          workout_log_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      weekly_activity: {
        Row: {
          user_id: string;
          day_of_week: number;
          day_name: string;
          workout_count: number;
        };
      };
      muscle_group_activity: {
        Row: {
          user_id: string;
          tag_name: string;
          workout_count: number;
        };
      };
    };
    Enums: {
      user_role: "user" | "super_admin";
      gender: "male" | "female" | "other" | "prefer_not_to_say";
      partner_status: "pending" | "accepted" | "rejected";
    };
  };
};
