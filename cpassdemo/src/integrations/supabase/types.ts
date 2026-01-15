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
      bulk_uploaded_workers: {
        Row: {
          age: string | null
          batch_id: string | null
          certification_match_percentage: number | null
          claimed_at: string | null
          created_at: string | null
          education_level: string | null
          experience_years: string | null
          farm_size: string | null
          full_name: string
          gender: string | null
          id: string
          id_number: string | null
          invitation_code: string | null
          invitation_sent_at: string | null
          livestock: string | null
          location: string | null
          phone: string | null
          primary_crops: string | null
          profile_status: string | null
          skills_count: number | null
          updated_at: string | null
          work_history: string | null
        }
        Insert: {
          age?: string | null
          batch_id?: string | null
          certification_match_percentage?: number | null
          claimed_at?: string | null
          created_at?: string | null
          education_level?: string | null
          experience_years?: string | null
          farm_size?: string | null
          full_name: string
          gender?: string | null
          id?: string
          id_number?: string | null
          invitation_code?: string | null
          invitation_sent_at?: string | null
          livestock?: string | null
          location?: string | null
          phone?: string | null
          primary_crops?: string | null
          profile_status?: string | null
          skills_count?: number | null
          updated_at?: string | null
          work_history?: string | null
        }
        Update: {
          age?: string | null
          batch_id?: string | null
          certification_match_percentage?: number | null
          claimed_at?: string | null
          created_at?: string | null
          education_level?: string | null
          experience_years?: string | null
          farm_size?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          id_number?: string | null
          invitation_code?: string | null
          invitation_sent_at?: string | null
          livestock?: string | null
          location?: string | null
          phone?: string | null
          primary_crops?: string | null
          profile_status?: string | null
          skills_count?: number | null
          updated_at?: string | null
          work_history?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_uploaded_workers_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "upload_batches"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      column_mappings: {
        Row: {
          batch_id: string | null
          confidence_score: number | null
          created_at: string | null
          csv_column_name: string | null
          mapped_to_field: string | null
          mapping_id: string
        }
        Insert: {
          batch_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          csv_column_name?: string | null
          mapped_to_field?: string | null
          mapping_id?: string
        }
        Update: {
          batch_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          csv_column_name?: string | null
          mapped_to_field?: string | null
          mapping_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "column_mappings_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "upload_batches"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      skill_mappings: {
        Row: {
          batch_id: string | null
          canonical_task_matched: string | null
          confidence_score: number | null
          confidence_tier: string | null
          created_at: string | null
          mapped_skill_id: string | null
          mapped_skill_name: string | null
          mapping_id: string
          mapping_status: string | null
          matching_method: string | null
          needs_review: boolean | null
          proficiency_estimate: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          task_description: string | null
          user_input_task: string | null
          verification_tier: string | null
          worker_id: string | null
          worker_name: string | null
        }
        Insert: {
          batch_id?: string | null
          canonical_task_matched?: string | null
          confidence_score?: number | null
          confidence_tier?: string | null
          created_at?: string | null
          mapped_skill_id?: string | null
          mapped_skill_name?: string | null
          mapping_id?: string
          mapping_status?: string | null
          matching_method?: string | null
          needs_review?: boolean | null
          proficiency_estimate?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          task_description?: string | null
          user_input_task?: string | null
          verification_tier?: string | null
          worker_id?: string | null
          worker_name?: string | null
        }
        Update: {
          batch_id?: string | null
          canonical_task_matched?: string | null
          confidence_score?: number | null
          confidence_tier?: string | null
          created_at?: string | null
          mapped_skill_id?: string | null
          mapped_skill_name?: string | null
          mapping_id?: string
          mapping_status?: string | null
          matching_method?: string | null
          needs_review?: boolean | null
          proficiency_estimate?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          task_description?: string | null
          user_input_task?: string | null
          verification_tier?: string | null
          worker_id?: string | null
          worker_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_mappings_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "upload_batches"
            referencedColumns: ["batch_id"]
          },
        ]
      }
      tvet_auth: {
        Row: {
          created_at: string | null
          id: string
          institution_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          institution_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tvet_auth_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "tvet_institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      tvet_institutions: {
        Row: {
          created_at: string | null
          id: string
          institution_code: string
          institution_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          institution_code: string
          institution_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          institution_code?: string
          institution_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      upload_batches: {
        Row: {
          batch_id: string
          certification_ready_count: number | null
          created_at: string | null
          high_confidence_count: number | null
          institution_code: string
          low_confidence_count: number | null
          medium_confidence_count: number | null
          processing_completed_at: string | null
          processing_started_at: string | null
          processing_status: string | null
          skills_mapped: number | null
          source_file_name: string | null
          updated_at: string | null
          upload_mode: string
          uploaded_by: string | null
          worker_count: number | null
        }
        Insert: {
          batch_id?: string
          certification_ready_count?: number | null
          created_at?: string | null
          high_confidence_count?: number | null
          institution_code: string
          low_confidence_count?: number | null
          medium_confidence_count?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_status?: string | null
          skills_mapped?: number | null
          source_file_name?: string | null
          updated_at?: string | null
          upload_mode?: string
          uploaded_by?: string | null
          worker_count?: number | null
        }
        Update: {
          batch_id?: string
          certification_ready_count?: number | null
          created_at?: string | null
          high_confidence_count?: number | null
          institution_code?: string
          low_confidence_count?: number | null
          medium_confidence_count?: number | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          processing_status?: string | null
          skills_mapped?: number | null
          source_file_name?: string | null
          updated_at?: string | null
          upload_mode?: string
          uploaded_by?: string | null
          worker_count?: number | null
        }
        Relationships: []
      }
      worker_certifications: {
        Row: {
          cert_name: string | null
          cert_number: string | null
          cert_type: string | null
          created_at: string
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_body: string | null
          skills_covered: string[] | null
          verification_status: string | null
          worker_id: string | null
        }
        Insert: {
          cert_name?: string | null
          cert_number?: string | null
          cert_type?: string | null
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_body?: string | null
          skills_covered?: string[] | null
          verification_status?: string | null
          worker_id?: string | null
        }
        Update: {
          cert_name?: string | null
          cert_number?: string | null
          cert_type?: string | null
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_body?: string | null
          skills_covered?: string[] | null
          verification_status?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_certifications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_domains: {
        Row: {
          created_at: string
          domain_id: string | null
          domain_name: string | null
          id: string
          is_primary: boolean | null
          worker_id: string | null
        }
        Insert: {
          created_at?: string
          domain_id?: string | null
          domain_name?: string | null
          id?: string
          is_primary?: boolean | null
          worker_id?: string | null
        }
        Update: {
          created_at?: string
          domain_id?: string | null
          domain_name?: string | null
          id?: string
          is_primary?: boolean | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_domains_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_profiles: {
        Row: {
          alumni_tracking_consent: boolean | null
          assessment_date: string | null
          availability_status: string | null
          bronze_skill_count: number | null
          claim_code_generated_at: string | null
          claimed: boolean | null
          created_at: string
          current_industry: string | null
          data_tier: string | null
          domain_skills_count: number | null
          email: string | null
          experience_duration: string | null
          foundation_skills_count: number | null
          full_name: string | null
          gold_skill_count: number | null
          graduated_from_institution: string | null
          id: string
          invitation_code: string | null
          invited_by_org: string | null
          invited_by_type: string | null
          invited_to_assessment: boolean | null
          last_active_date: string | null
          location: string | null
          open_to_opportunities: boolean | null
          overall_tier: string | null
          phone_number: string | null
          platinum_skill_count: number | null
          rpl_status: string | null
          silver_skill_count: number | null
          target_certification: string | null
          tier_status: string | null
          total_skills: number | null
          trust_score: number | null
          updated_at: string | null
          upload_batch_id: string | null
          upload_source: string | null
          work_history_raw: string | null
          work_status: string | null
          years_experience: number | null
        }
        Insert: {
          alumni_tracking_consent?: boolean | null
          assessment_date?: string | null
          availability_status?: string | null
          bronze_skill_count?: number | null
          claim_code_generated_at?: string | null
          claimed?: boolean | null
          created_at?: string
          current_industry?: string | null
          data_tier?: string | null
          domain_skills_count?: number | null
          email?: string | null
          experience_duration?: string | null
          foundation_skills_count?: number | null
          full_name?: string | null
          gold_skill_count?: number | null
          graduated_from_institution?: string | null
          id?: string
          invitation_code?: string | null
          invited_by_org?: string | null
          invited_by_type?: string | null
          invited_to_assessment?: boolean | null
          last_active_date?: string | null
          location?: string | null
          open_to_opportunities?: boolean | null
          overall_tier?: string | null
          phone_number?: string | null
          platinum_skill_count?: number | null
          rpl_status?: string | null
          silver_skill_count?: number | null
          target_certification?: string | null
          tier_status?: string | null
          total_skills?: number | null
          trust_score?: number | null
          updated_at?: string | null
          upload_batch_id?: string | null
          upload_source?: string | null
          work_history_raw?: string | null
          work_status?: string | null
          years_experience?: number | null
        }
        Update: {
          alumni_tracking_consent?: boolean | null
          assessment_date?: string | null
          availability_status?: string | null
          bronze_skill_count?: number | null
          claim_code_generated_at?: string | null
          claimed?: boolean | null
          created_at?: string
          current_industry?: string | null
          data_tier?: string | null
          domain_skills_count?: number | null
          email?: string | null
          experience_duration?: string | null
          foundation_skills_count?: number | null
          full_name?: string | null
          gold_skill_count?: number | null
          graduated_from_institution?: string | null
          id?: string
          invitation_code?: string | null
          invited_by_org?: string | null
          invited_by_type?: string | null
          invited_to_assessment?: boolean | null
          last_active_date?: string | null
          location?: string | null
          open_to_opportunities?: boolean | null
          overall_tier?: string | null
          phone_number?: string | null
          platinum_skill_count?: number | null
          rpl_status?: string | null
          silver_skill_count?: number | null
          target_certification?: string | null
          tier_status?: string | null
          total_skills?: number | null
          trust_score?: number | null
          updated_at?: string | null
          upload_batch_id?: string | null
          upload_source?: string | null
          work_history_raw?: string | null
          work_status?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      worker_skills: {
        Row: {
          confidence_score: number | null
          created_at: string
          credibility_score: number | null
          domain_id: string | null
          evidence_types: Json | null
          extracted_from_bulk: boolean | null
          frequency: string | null
          id: string
          last_performed: string | null
          last_practiced_date: string | null
          platform_name: string | null
          platform_task_count: number | null
          proficiency_level: string | null
          proficiency_rating: number | null
          reference_contact: string | null
          scale_context: Json | null
          skill_category: string | null
          skill_id: string | null
          skill_name: string | null
          skill_verification_tier: string | null
          source_text: string | null
          supervision_level: string | null
          supervisor_attestations: number | null
          verification_source: string | null
          verified_by: string | null
          worker_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          credibility_score?: number | null
          domain_id?: string | null
          evidence_types?: Json | null
          extracted_from_bulk?: boolean | null
          frequency?: string | null
          id?: string
          last_performed?: string | null
          last_practiced_date?: string | null
          platform_name?: string | null
          platform_task_count?: number | null
          proficiency_level?: string | null
          proficiency_rating?: number | null
          reference_contact?: string | null
          scale_context?: Json | null
          skill_category?: string | null
          skill_id?: string | null
          skill_name?: string | null
          skill_verification_tier?: string | null
          source_text?: string | null
          supervision_level?: string | null
          supervisor_attestations?: number | null
          verification_source?: string | null
          verified_by?: string | null
          worker_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          credibility_score?: number | null
          domain_id?: string | null
          evidence_types?: Json | null
          extracted_from_bulk?: boolean | null
          frequency?: string | null
          id?: string
          last_performed?: string | null
          last_practiced_date?: string | null
          platform_name?: string | null
          platform_task_count?: number | null
          proficiency_level?: string | null
          proficiency_rating?: number | null
          reference_contact?: string | null
          scale_context?: Json | null
          skill_category?: string | null
          skill_id?: string | null
          skill_name?: string | null
          skill_verification_tier?: string | null
          source_text?: string | null
          supervision_level?: string | null
          supervisor_attestations?: number | null
          verification_source?: string | null
          verified_by?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worker_skills_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_demo_profiles: {
        Args: never
        Returns: {
          email: string
          full_name: string
          id: string
          overall_tier: string
          phone_number: string
          total_skills: number
        }[]
      }
      get_user_institution_code: { Args: never; Returns: string }
      get_user_institution_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
