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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      business_structure_fees: {
        Row: {
          created_at: string
          fee_notes: string | null
          id: string
          last_verified: string | null
          perplexity_sources: string[] | null
          province_code: string
          structure_type: string
          updated_at: string
          verified_fee: string
        }
        Insert: {
          created_at?: string
          fee_notes?: string | null
          id?: string
          last_verified?: string | null
          perplexity_sources?: string[] | null
          province_code: string
          structure_type: string
          updated_at?: string
          verified_fee: string
        }
        Update: {
          created_at?: string
          fee_notes?: string | null
          id?: string
          last_verified?: string | null
          perplexity_sources?: string[] | null
          province_code?: string
          structure_type?: string
          updated_at?: string
          verified_fee?: string
        }
        Relationships: []
      }
      canadian_grants: {
        Row: {
          amount_max: number | null
          amount_min: number | null
          application_url: string
          auto_verified_at: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          eligibility_age_max: number | null
          eligibility_age_min: number | null
          eligibility_citizen_required: boolean | null
          eligibility_indigenous_only: boolean | null
          eligibility_newcomer_max_years: number | null
          eligibility_notes: string | null
          eligibility_pr_eligible: boolean | null
          eligibility_sectors: string[] | null
          funding_description: string | null
          id: string
          last_verified: string | null
          name: string
          organization: string
          province: string | null
          status: string | null
          type: string
          updated_at: string | null
          url_status: string | null
          verification_notes: string | null
          verification_source: string | null
          why_apply: string | null
        }
        Insert: {
          amount_max?: number | null
          amount_min?: number | null
          application_url: string
          auto_verified_at?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          eligibility_age_max?: number | null
          eligibility_age_min?: number | null
          eligibility_citizen_required?: boolean | null
          eligibility_indigenous_only?: boolean | null
          eligibility_newcomer_max_years?: number | null
          eligibility_notes?: string | null
          eligibility_pr_eligible?: boolean | null
          eligibility_sectors?: string[] | null
          funding_description?: string | null
          id?: string
          last_verified?: string | null
          name: string
          organization: string
          province?: string | null
          status?: string | null
          type: string
          updated_at?: string | null
          url_status?: string | null
          verification_notes?: string | null
          verification_source?: string | null
          why_apply?: string | null
        }
        Update: {
          amount_max?: number | null
          amount_min?: number | null
          application_url?: string
          auto_verified_at?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          eligibility_age_max?: number | null
          eligibility_age_min?: number | null
          eligibility_citizen_required?: boolean | null
          eligibility_indigenous_only?: boolean | null
          eligibility_newcomer_max_years?: number | null
          eligibility_notes?: string | null
          eligibility_pr_eligible?: boolean | null
          eligibility_sectors?: string[] | null
          funding_description?: string | null
          id?: string
          last_verified?: string | null
          name?: string
          organization?: string
          province?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          url_status?: string | null
          verification_notes?: string | null
          verification_source?: string | null
          why_apply?: string | null
        }
        Relationships: []
      }
      ft_cache: {
        Row: {
          cache_key: string
          cache_type: string
          created_at: string
          data: Json
          expires_at: string
          id: string
          updated_at: string
        }
        Insert: {
          cache_key: string
          cache_type: string
          created_at?: string
          data: Json
          expires_at: string
          id?: string
          updated_at?: string
        }
        Update: {
          cache_key?: string
          cache_type?: string
          created_at?: string
          data?: Json
          expires_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ft_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_path: string | null
          file_url: string | null
          id: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["doc_type"]
          file_path?: string | null
          file_url?: string | null
          id?: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["doc_type"]
          file_path?: string | null
          file_url?: string | null
          id?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ft_documents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ft_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ft_events: {
        Row: {
          created_at: string
          device_type: string | null
          event_data: Json | null
          event_name: string
          id: string
          page_path: string | null
          referrer: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          event_data?: Json | null
          event_name: string
          id?: string
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          event_data?: Json | null
          event_name?: string
          id?: string
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ft_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ft_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ft_experiment_assignments: {
        Row: {
          conversion_event: string | null
          converted: boolean
          converted_at: string | null
          created_at: string
          experiment_id: string
          id: string
          updated_at: string
          user_id: string
          variant: string
        }
        Insert: {
          conversion_event?: string | null
          converted?: boolean
          converted_at?: string | null
          created_at?: string
          experiment_id: string
          id?: string
          updated_at?: string
          user_id: string
          variant: string
        }
        Update: {
          conversion_event?: string | null
          converted?: boolean
          converted_at?: string | null
          created_at?: string
          experiment_id?: string
          id?: string
          updated_at?: string
          user_id?: string
          variant?: string
        }
        Relationships: []
      }
      ft_generated_content: {
        Row: {
          content: Json
          content_type: string
          created_at: string
          id: string
          idea_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          content_type: string
          created_at?: string
          id?: string
          idea_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          content_type?: string
          created_at?: string
          id?: string
          idea_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ft_generated_content_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ft_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ft_grant_kits: {
        Row: {
          budget_template: Json | null
          business_summary: string | null
          cover_letter: string | null
          created_at: string
          grant_id: string
          id: string
          idea_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_template?: Json | null
          business_summary?: string | null
          cover_letter?: string | null
          created_at?: string
          grant_id: string
          id?: string
          idea_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_template?: Json | null
          business_summary?: string | null
          cover_letter?: string | null
          created_at?: string
          grant_id?: string
          id?: string
          idea_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ft_grant_kits_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "canadian_grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ft_grant_kits_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ft_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ft_ideas: {
        Row: {
          business_names: Json | null
          canadian_resources: Json | null
          category: string | null
          confidence_factors: Json | null
          created_at: string
          customer_acquisition: Json | null
          description: string | null
          financials: Json | null
          id: string
          investment_max: number | null
          investment_min: number | null
          market_analysis: Json | null
          market_signals: Json | null
          ninety_day_roadmap: Json | null
          pricing_strategy: Json | null
          quick_win: string | null
          risk_level: string | null
          risk_mitigation: Json | null
          session_id: string
          swot_analysis: Json | null
          tagline: string | null
          time_to_launch: string | null
          time_to_revenue: string | null
          title: string
          user_id: string
          viability_score: number | null
        }
        Insert: {
          business_names?: Json | null
          canadian_resources?: Json | null
          category?: string | null
          confidence_factors?: Json | null
          created_at?: string
          customer_acquisition?: Json | null
          description?: string | null
          financials?: Json | null
          id?: string
          investment_max?: number | null
          investment_min?: number | null
          market_analysis?: Json | null
          market_signals?: Json | null
          ninety_day_roadmap?: Json | null
          pricing_strategy?: Json | null
          quick_win?: string | null
          risk_level?: string | null
          risk_mitigation?: Json | null
          session_id: string
          swot_analysis?: Json | null
          tagline?: string | null
          time_to_launch?: string | null
          time_to_revenue?: string | null
          title: string
          user_id: string
          viability_score?: number | null
        }
        Update: {
          business_names?: Json | null
          canadian_resources?: Json | null
          category?: string | null
          confidence_factors?: Json | null
          created_at?: string
          customer_acquisition?: Json | null
          description?: string | null
          financials?: Json | null
          id?: string
          investment_max?: number | null
          investment_min?: number | null
          market_analysis?: Json | null
          market_signals?: Json | null
          ninety_day_roadmap?: Json | null
          pricing_strategy?: Json | null
          quick_win?: string | null
          risk_level?: string | null
          risk_mitigation?: Json | null
          session_id?: string
          swot_analysis?: Json | null
          tagline?: string | null
          time_to_launch?: string | null
          time_to_revenue?: string | null
          title?: string
          user_id?: string
          viability_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ft_ideas_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ft_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ft_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          meta: Json | null
          role: Database["public"]["Enums"]["message_role"]
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          meta?: Json | null
          role: Database["public"]["Enums"]["message_role"]
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meta?: Json | null
          role?: Database["public"]["Enums"]["message_role"]
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ft_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ft_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ft_orders: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          session_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          tier: Database["public"]["Enums"]["order_tier"]
          tier_name: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          tier: Database["public"]["Enums"]["order_tier"]
          tier_name?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          tier?: Database["public"]["Enums"]["order_tier"]
          tier_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ft_orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ft_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ft_quickwin_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          idea_id: string
          notes: string | null
          quick_win: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          idea_id: string
          notes?: string | null
          quick_win: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          idea_id?: string
          notes?: string | null
          quick_win?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ft_referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ft_referrals: {
        Row: {
          converted_at: string | null
          created_at: string | null
          id: string
          referred_email: string
          referred_user_id: string | null
          referrer_id: string
          reward_amount: number | null
          reward_type: string | null
          status: string | null
        }
        Insert: {
          converted_at?: string | null
          created_at?: string | null
          id?: string
          referred_email: string
          referred_user_id?: string | null
          referrer_id: string
          reward_amount?: number | null
          reward_type?: string | null
          status?: string | null
        }
        Update: {
          converted_at?: string | null
          created_at?: string | null
          id?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_id?: string
          reward_amount?: number | null
          reward_type?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ft_registration_progress: {
        Row: {
          business_name: string | null
          business_number: string | null
          business_structure: string
          completed_steps: Json | null
          copilot_messages: Json | null
          created_at: string
          current_step: number | null
          custom_steps: Json | null
          id: string
          idea_id: string
          path_generated_at: string | null
          province: string
          status: string | null
          step_notes: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          business_number?: string | null
          business_structure?: string
          completed_steps?: Json | null
          copilot_messages?: Json | null
          created_at?: string
          current_step?: number | null
          custom_steps?: Json | null
          id?: string
          idea_id: string
          path_generated_at?: string | null
          province: string
          status?: string | null
          step_notes?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          business_number?: string | null
          business_structure?: string
          completed_steps?: Json | null
          copilot_messages?: Json | null
          created_at?: string
          current_step?: number | null
          custom_steps?: Json | null
          id?: string
          idea_id?: string
          path_generated_at?: string | null
          province?: string
          status?: string | null
          step_notes?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ft_registration_progress_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ft_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ft_sessions: {
        Row: {
          collected_data: Json | null
          created_at: string
          id: string
          last_notified_at: string | null
          progress: number
          session_type: Database["public"]["Enums"]["session_type"]
          status: Database["public"]["Enums"]["session_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          collected_data?: Json | null
          created_at?: string
          id?: string
          last_notified_at?: string | null
          progress?: number
          session_type?: Database["public"]["Enums"]["session_type"]
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          collected_data?: Json | null
          created_at?: string
          id?: string
          last_notified_at?: string | null
          progress?: number
          session_type?: Database["public"]["Enums"]["session_type"]
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          onboarding_complete: boolean | null
          phone: string | null
          province: string | null
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          onboarding_complete?: boolean | null
          phone?: string | null
          province?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          onboarding_complete?: boolean | null
          phone?: string | null
          province?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      registration_requirements: {
        Row: {
          cost_estimate: string | null
          created_at: string | null
          description: string | null
          government_url: string | null
          id: string
          idea_id: string
          is_baseline: boolean | null
          is_industry_specific: boolean | null
          last_verified: string | null
          perplexity_sources: string[] | null
          province: string
          source_verified: boolean | null
          step_id: string
          time_estimate: string | null
          title: string
          updated_at: string | null
          verification_notes: string | null
        }
        Insert: {
          cost_estimate?: string | null
          created_at?: string | null
          description?: string | null
          government_url?: string | null
          id?: string
          idea_id: string
          is_baseline?: boolean | null
          is_industry_specific?: boolean | null
          last_verified?: string | null
          perplexity_sources?: string[] | null
          province: string
          source_verified?: boolean | null
          step_id: string
          time_estimate?: string | null
          title: string
          updated_at?: string | null
          verification_notes?: string | null
        }
        Update: {
          cost_estimate?: string | null
          created_at?: string | null
          description?: string | null
          government_url?: string | null
          id?: string
          idea_id?: string
          is_baseline?: boolean | null
          is_industry_specific?: boolean | null
          last_verified?: string | null
          perplexity_sources?: string[] | null
          province?: string
          source_verified?: boolean | null
          step_id?: string
          time_estimate?: string | null
          title?: string
          updated_at?: string | null
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_requirements_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ft_ideas"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      doc_type: "tier1_report"
      message_role: "user" | "assistant" | "system"
      order_status: "pending" | "paid" | "failed"
      order_tier: "tier1" | "tier2" | "tier3"
      session_status:
        | "intake"
        | "ready_to_pay"
        | "paid"
        | "generating"
        | "ideas_generated"
        | "completed"
        | "abandoned_notified"
      session_type: "tier1_idea"
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
      app_role: ["admin", "moderator", "user"],
      doc_type: ["tier1_report"],
      message_role: ["user", "assistant", "system"],
      order_status: ["pending", "paid", "failed"],
      order_tier: ["tier1", "tier2", "tier3"],
      session_status: [
        "intake",
        "ready_to_pay",
        "paid",
        "generating",
        "ideas_generated",
        "completed",
        "abandoned_notified",
      ],
      session_type: ["tier1_idea"],
    },
  },
} as const
