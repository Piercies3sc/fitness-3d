export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      exercise_muscles: {
        Row: {
          exercise_id: string
          exposure_factor: number
          muscle_id: string
          role: string
        }
        Insert: {
          exercise_id: string
          exposure_factor: number
          muscle_id: string
          role: string
        }
        Update: {
          exercise_id?: string
          exposure_factor?: number
          muscle_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_muscles_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_muscles_muscle_id_fkey"
            columns: ["muscle_id"]
            isOneToOne: false
            referencedRelation: "muscles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          body_region: string | null
          created_at: string
          description: string | null
          equipment: string | null
          home_friendly: boolean
          id: string
          is_active: boolean
          model_path: string | null
          movement_type: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          body_region?: string | null
          created_at?: string
          description?: string | null
          equipment?: string | null
          home_friendly?: boolean
          id?: string
          is_active?: boolean
          model_path?: string | null
          movement_type?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          body_region?: string | null
          created_at?: string
          description?: string | null
          equipment?: string | null
          home_friendly?: boolean
          id?: string
          is_active?: boolean
          model_path?: string | null
          movement_type?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      muscle_meshes: {
        Row: {
          created_at: string
          id: string
          mesh_name: string
          muscle_id: string
          side: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mesh_name: string
          muscle_id: string
          side?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mesh_name?: string
          muscle_id?: string
          side?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "muscle_meshes_muscle_id_fkey"
            columns: ["muscle_id"]
            isOneToOne: false
            referencedRelation: "muscles"
            referencedColumns: ["id"]
          },
        ]
      }
      muscles: {
        Row: {
          created_at: string
          id: string
          name: string
          region: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          region?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          region?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bmr_sex: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          height_cm: number | null
          id: string
          unit_preference: string
          updated_at: string
        }
        Insert: {
          bmr_sex?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          height_cm?: number | null
          id: string
          unit_preference?: string
          updated_at?: string
        }
        Update: {
          bmr_sex?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          height_cm?: number | null
          id?: string
          unit_preference?: string
          updated_at?: string
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string
          id: string
          recorded_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          recorded_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          id?: string
          recorded_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      routine_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          planned_sets: number
          position: number
          routine_id: string
          target_reps_max: number | null
          target_reps_min: number | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          planned_sets: number
          position: number
          routine_id: string
          target_reps_max?: number | null
          target_reps_min?: number | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          planned_sets?: number
          position?: number
          routine_id?: string
          target_reps_max?: number | null
          target_reps_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          planned_sets_snapshot: number
          position: number
          target_reps_max_snapshot: number | null
          target_reps_min_snapshot: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          planned_sets_snapshot: number
          position: number
          target_reps_max_snapshot?: number | null
          target_reps_min_snapshot?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          planned_sets_snapshot?: number
          position?: number
          target_reps_max_snapshot?: number | null
          target_reps_min_snapshot?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          reps: number
          set_number: number
          set_type: Database["public"]["Enums"]["set_type"]
          updated_at: string
          weight_kg: number
          workout_exercise_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          reps: number
          set_number: number
          set_type?: Database["public"]["Enums"]["set_type"]
          updated_at?: string
          weight_kg: number
          workout_exercise_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          reps?: number
          set_number?: number
          set_type?: Database["public"]["Enums"]["set_type"]
          updated_at?: string
          weight_kg?: number
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          routine_id: string | null
          routine_name_snapshot: string
          started_at: string
          status: Database["public"]["Enums"]["workout_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          routine_id?: string | null
          routine_name_snapshot: string
          started_at?: string
          status?: Database["public"]["Enums"]["workout_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          routine_id?: string | null
          routine_name_snapshot?: string
          started_at?: string
          status?: Database["public"]["Enums"]["workout_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      start_workout_from_routine: {
        Args: { p_routine_id: string }
        Returns: string
      }
    }
    Enums: {
      set_type: "warmup" | "working"
      workout_status: "active" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      set_type: ["warmup", "working"],
      workout_status: ["active", "completed"],
    },
  },
} as const
