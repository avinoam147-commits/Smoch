export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: { Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      admin_audit: {
        Row: {
          action: string;
          actor_id: string | null;
          after: Json | null;
          before: Json | null;
          created_at: string;
          entity: string;
          entity_id: string | null;
          id: number;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          entity: string;
          entity_id?: string | null;
          id?: never;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          after?: Json | null;
          before?: Json | null;
          created_at?: string;
          entity?: string;
          entity_id?: string | null;
          id?: never;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          description: string;
          key: string;
          updated_at: string;
          value: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          description?: string;
          key: string;
          updated_at?: string;
          value: NonNullable<Json>;
        };
        Update: {
          description?: string;
          key?: string;
          updated_at?: string;
          value?: NonNullable<Json>;
        };
        Relationships: [];
      };
      companies: {
        Row: {
          about: string;
          admin_note: string | null;
          category: string;
          city: string | null;
          claimed: boolean;
          created_at: string;
          created_by: string | null;
          founded: number | null;
          id: string;
          logo_url: string | null;
          name: string;
          price_range: string | null;
          registry_data: Json | null;
          registry_id: string | null;
          registry_verified: boolean;
          slug: string;
          social_url: string | null;
          status: string;
          tagline: string;
          updated_at: string;
          website: string | null;
        };
        ComputedFields: never;
        Insert: {
          about?: string;
          admin_note?: string | null;
          category: string;
          city?: string | null;
          claimed?: boolean;
          created_at?: string;
          created_by?: string | null;
          founded?: number | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          price_range?: string | null;
          registry_data?: Json | null;
          registry_id?: string | null;
          registry_verified?: boolean;
          slug: string;
          social_url?: string | null;
          status?: string;
          tagline?: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          about?: string;
          admin_note?: string | null;
          category?: string;
          city?: string | null;
          claimed?: boolean;
          created_at?: string;
          created_by?: string | null;
          founded?: number | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          price_range?: string | null;
          registry_data?: Json | null;
          registry_id?: string | null;
          registry_verified?: boolean;
          slug?: string;
          social_url?: string | null;
          status?: string;
          tagline?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      company_claims: {
        Row: {
          admin_note: string | null;
          company_id: string;
          created_at: string;
          decided_at: string | null;
          full_name: string;
          id: string;
          job_title: string;
          message: string | null;
          phone: string | null;
          status: string;
          user_id: string;
          work_email: string;
        };
        ComputedFields: never;
        Insert: {
          admin_note?: string | null;
          company_id: string;
          created_at?: string;
          decided_at?: string | null;
          full_name: string;
          id?: string;
          job_title: string;
          message?: string | null;
          phone?: string | null;
          status?: string;
          user_id?: string;
          work_email: string;
        };
        Update: {
          admin_note?: string | null;
          company_id?: string;
          created_at?: string;
          decided_at?: string | null;
          full_name?: string;
          id?: string;
          job_title?: string;
          message?: string | null;
          phone?: string | null;
          status?: string;
          user_id?: string;
          work_email?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_claims_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_claims_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "company_stats";
            referencedColumns: ["company_id"];
          },
        ];
      };
      company_members: {
        Row: {
          company_id: string;
          created_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          company_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_members_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "company_stats";
            referencedColumns: ["company_id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          is_banned: boolean;
          notify_email: boolean;
          role: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id: string;
          is_banned?: boolean;
          notify_email?: boolean;
          role?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          is_banned?: boolean;
          notify_email?: boolean;
          role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      receipts: {
        Row: {
          admin_note: string | null;
          created_at: string;
          decided_at: string | null;
          file_deleted_at: string | null;
          id: string;
          review_id: string;
          status: string;
          storage_path: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          admin_note?: string | null;
          created_at?: string;
          decided_at?: string | null;
          file_deleted_at?: string | null;
          id?: string;
          review_id: string;
          status?: string;
          storage_path?: string | null;
          user_id?: string;
        };
        Update: {
          admin_note?: string | null;
          created_at?: string;
          decided_at?: string | null;
          file_deleted_at?: string | null;
          id?: string;
          review_id?: string;
          status?: string;
          storage_path?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipts_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          reason: string;
          reporter_id: string | null;
          resolution_note: string | null;
          resolved_at: string | null;
          review_id: string;
          status: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason: string;
          reporter_id?: string | null;
          resolution_note?: string | null;
          resolved_at?: string | null;
          review_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason?: string;
          reporter_id?: string | null;
          resolution_note?: string | null;
          resolved_at?: string | null;
          review_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      review_replies: {
        Row: {
          author_id: string | null;
          body: string;
          company_id: string;
          created_at: string;
          review_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          author_id?: string | null;
          body: string;
          company_id: string;
          created_at?: string;
          review_id: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          company_id?: string;
          created_at?: string;
          review_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_replies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_replies_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "company_stats";
            referencedColumns: ["company_id"];
          },
          {
            foreignKeyName: "review_replies_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: true;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      review_votes: {
        Row: {
          created_at: string;
          review_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          review_id: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          review_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          added_by: string | null;
          amount_paid: number | null;
          author_name: string;
          body: string;
          company_id: string;
          created_at: string;
          edited_at: string | null;
          experience_date: string | null;
          helpful_count: number;
          id: string;
          moderation_note: string | null;
          paid: boolean;
          rating: number;
          source: string;
          status: string;
          updated_at: string;
          user_id: string | null;
          verified_purchase: boolean;
        };
        ComputedFields: never;
        Insert: {
          added_by?: string | null;
          amount_paid?: number | null;
          author_name: string;
          body: string;
          company_id: string;
          created_at?: string;
          edited_at?: string | null;
          experience_date?: string | null;
          helpful_count?: number;
          id?: string;
          moderation_note?: string | null;
          paid?: boolean;
          rating: number;
          source?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          verified_purchase?: boolean;
        };
        Update: {
          added_by?: string | null;
          amount_paid?: number | null;
          author_name?: string;
          body?: string;
          company_id?: string;
          created_at?: string;
          edited_at?: string | null;
          experience_date?: string | null;
          helpful_count?: number;
          id?: string;
          moderation_note?: string | null;
          paid?: boolean;
          rating?: number;
          source?: string;
          status?: string;
          updated_at?: string;
          user_id?: string | null;
          verified_purchase?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "company_stats";
            referencedColumns: ["company_id"];
          },
        ];
      };
    };
    Views: {
      company_stats: {
        Row: {
          company_id: string | null;
          r1: number | null;
          r2: number | null;
          r3: number | null;
          r4: number | null;
          r5: number | null;
          raw_average: number | null;
          review_count: number | null;
          trust_score: number | null;
        };
        ComputedFields: never;
        Relationships: [];
      };
    };
    Functions: {
      admin_list_users: {
        Args: { max_rows?: number; search?: string };
        Returns: {
          created_at: string;
          display_name: string;
          email: string;
          id: string;
          is_banned: boolean;
          phone_verified: boolean;
          review_count: number;
          role: string;
        }[];
      };
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_banned: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_company_member: { Args: { cid: string }; Returns: boolean };
      is_internal: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_service: { Args: Record<PropertyKey, never>; Returns: boolean };
      make_display_name: { Args: { full_name: string }; Returns: string };
      moderation_reason: { Args: { t: string }; Returns: string };
      phone_verified: { Args: Record<PropertyKey, never>; Returns: boolean };
      setting: { Args: { k: string }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
