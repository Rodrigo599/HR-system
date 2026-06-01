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
      content_assignments: {
        Row: {
          assigned_at: string
          completed_at: string | null
          id: string
          item_id: string
          seen_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          completed_at?: string | null
          id?: string
          item_id: string
          seen_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          completed_at?: string | null
          id?: string
          item_id?: string
          seen_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_assignments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          file_url: string | null
          id: string
          link_url: string | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          link_url?: string | null
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          id?: string
          link_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
        }
        Relationships: []
      }
      dependents: {
        Row: {
          birth_date: string
          consent: boolean
          created_at: string
          id: string
          name: string
          profile_id: string
          relationship: string
          updated_at: string
        }
        Insert: {
          birth_date: string
          consent?: boolean
          created_at?: string
          id?: string
          name: string
          profile_id: string
          relationship: string
          updated_at?: string
        }
        Update: {
          birth_date?: string
          consent?: boolean
          created_at?: string
          id?: string
          name?: string
          profile_id?: string
          relationship?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_responses: {
        Row: {
          created_at: string
          evaluation_id: string
          final_score: number | null
          id: string
          manager_score: number | null
          self_score: number | null
          topic_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evaluation_id: string
          final_score?: number | null
          id?: string
          manager_score?: number | null
          self_score?: number | null
          topic_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evaluation_id?: string
          final_score?: number | null
          id?: string
          manager_score?: number | null
          self_score?: number | null
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_responses_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_responses_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "evaluation_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_topics: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sector_id: string | null
          type: Database["public"]["Enums"]["evaluation_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sector_id?: string | null
          type: Database["public"]["Enums"]["evaluation_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sector_id?: string | null
          type?: Database["public"]["Enums"]["evaluation_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_topics_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          assigned_to: string
          created_at: string
          created_by: string
          flow_type: string
          form_id: string | null
          id: string
          month: number
          status: Database["public"]["Enums"]["evaluation_status"]
          type: Database["public"]["Enums"]["evaluation_type"]
          updated_at: string
          year: number
        }
        Insert: {
          assigned_to: string
          created_at?: string
          created_by: string
          flow_type?: string
          form_id?: string | null
          id?: string
          month: number
          status?: Database["public"]["Enums"]["evaluation_status"]
          type: Database["public"]["Enums"]["evaluation_type"]
          updated_at?: string
          year: number
        }
        Update: {
          assigned_to?: string
          created_at?: string
          created_by?: string
          flow_type?: string
          form_id?: string | null
          id?: string
          month?: number
          status?: Database["public"]["Enums"]["evaluation_status"]
          type?: Database["public"]["Enums"]["evaluation_type"]
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "smart_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_results: {
        Row: {
          created_at: string
          id: string
          kpi_id: string
          month: number
          score: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          kpi_id: string
          month: number
          score: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          kpi_id?: string
          month?: number
          score?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_results_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sector_id: string | null
          target_value: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sector_id?: string | null
          target_value: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sector_id?: string | null
          target_value?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpis_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      one_on_one_notes: {
        Row: {
          author_user_id: string
          content: string
          created_at: string
          id: string
          one_on_one_id: string
          type: string
        }
        Insert: {
          author_user_id: string
          content: string
          created_at?: string
          id?: string
          one_on_one_id: string
          type?: string
        }
        Update: {
          author_user_id?: string
          content?: string
          created_at?: string
          id?: string
          one_on_one_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_notes_one_on_one_id_fkey"
            columns: ["one_on_one_id"]
            isOneToOne: false
            referencedRelation: "one_on_ones"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_topics: {
        Row: {
          addressed: boolean
          author_user_id: string
          content: string
          created_at: string
          id: string
          one_on_one_id: string
        }
        Insert: {
          addressed?: boolean
          author_user_id: string
          content: string
          created_at?: string
          id?: string
          one_on_one_id: string
        }
        Update: {
          addressed?: boolean
          author_user_id?: string
          content?: string
          created_at?: string
          id?: string
          one_on_one_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_topics_one_on_one_id_fkey"
            columns: ["one_on_one_id"]
            isOneToOne: false
            referencedRelation: "one_on_ones"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_ones: {
        Row: {
          created_at: string
          id: string
          manager_id: string
          notes: string | null
          recurrence_rule: string | null
          report_id: string
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_id: string
          notes?: string | null
          recurrence_rule?: string | null
          report_id: string
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_id?: string
          notes?: string | null
          recurrence_rule?: string | null
          report_id?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pdi_tasks: {
        Row: {
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          link: string | null
          pdi_id: string
          review_comment: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["pdi_task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          link?: string | null
          pdi_id: string
          review_comment?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["pdi_task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          link?: string | null
          pdi_id?: string
          review_comment?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["pdi_task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdi_tasks_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
        ]
      }
      pdis: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          start_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pointwise_feedback: {
        Row: {
          content: string
          created_at: string
          from_user_id: string
          id: string
          to_user_id: string
          type: string
          visibility: string
        }
        Insert: {
          content: string
          created_at?: string
          from_user_id: string
          id?: string
          to_user_id: string
          type: string
          visibility?: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string
          id?: string
          to_user_id?: string
          type?: string
          visibility?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          manager_id: string | null
          preferred_language: string
          sector_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          manager_id?: string | null
          preferred_language?: string
          sector_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          manager_id?: string | null
          preferred_language?: string
          sector_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sectors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      smart_form_responses: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          data: Json
          evaluation_id: string | null
          form_id: string
          id: string
          phase: string | null
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          data?: Json
          evaluation_id?: string | null
          form_id: string
          id?: string
          phase?: string | null
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          data?: Json
          evaluation_id?: string | null
          form_id?: string
          id?: string
          phase?: string | null
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_form_responses_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "evaluations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "smart_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      smart_forms: {
        Row: {
          category: string
          config: Json
          created_at: string
          created_by: string | null
          id: string
          name: string
          sector_id: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          sector_id?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          sector_id?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_forms_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aggregate_feedback_by_form: {
        Args: { p_form_id: string; p_period: string }
        Returns: {
          avg_value: number
          field_name: string
          response_count: number
        }[]
      }
      content_item_progress: {
        Args: { p_item_id: string }
        Returns: {
          completion_rate: number
          total_assigned: number
          total_completed: number
          total_in_progress: number
          total_seen: number
        }[]
      }
      current_profile_id: { Args: never; Returns: string }
      derive_blind_status: {
        Args: { current_status: string; side: string }
        Returns: string
      }
      get_my_sector_id: { Args: never; Returns: string }
      get_my_team_profile_ids: { Args: never; Returns: string[] }
      get_my_team_user_ids: { Args: never; Returns: string[] }
      user_has_role: { Args: { check_role: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "gestor" | "colaborador" | "analista"
      content_status: "not_seen" | "seen" | "in_progress" | "completed"
      content_type: "training" | "reading" | "process"
      evaluation_status:
        | "pending_self"
        | "pending_manager"
        | "completed"
        | "closed"
        | "leader_submitted"
        | "self_submitted"
        | "both_submitted"
      evaluation_type: "cultural" | "performance" | "kpi"
      pdi_task_status: "pending" | "submitted" | "approved" | "rejected"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["admin", "gestor", "colaborador", "analista"],
      content_status: ["not_seen", "seen", "in_progress", "completed"],
      content_type: ["training", "reading", "process"],
      evaluation_status: [
        "pending_self",
        "pending_manager",
        "completed",
        "closed",
        "leader_submitted",
        "self_submitted",
        "both_submitted",
      ],
      evaluation_type: ["cultural", "performance", "kpi"],
      pdi_task_status: ["pending", "submitted", "approved", "rejected"],
    },
  },
} as const
