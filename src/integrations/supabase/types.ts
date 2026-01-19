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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_requests: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string
          id: string
          message: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          client_id: string
          endpoint: string
          id: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          client_id: string
          endpoint: string
          id?: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          client_id?: string
          endpoint?: string
          id?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_rate_limits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "embed_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_rate_limits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "embed_clients_public"
            referencedColumns: ["id"]
          },
        ]
      }
      client_products: {
        Row: {
          category: string
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          price: number | null
          sizes: string[] | null
          sku: string | null
          stock_by_size: Json | null
          subcategory: string | null
          total_stock: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          price?: number | null
          sizes?: string[] | null
          sku?: string | null
          stock_by_size?: Json | null
          subcategory?: string | null
          total_stock?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number | null
          sizes?: string[] | null
          sku?: string | null
          stock_by_size?: Json | null
          subcategory?: string | null
          total_stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_products_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "embed_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_products_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "embed_clients_public"
            referencedColumns: ["id"]
          },
        ]
      }
      client_team_members: {
        Row: {
          accepted_at: string | null
          client_id: string
          email: string
          id: string
          invited_at: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["team_role"]
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          client_id: string
          email: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          email?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_team_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "embed_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_team_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "embed_clients_public"
            referencedColumns: ["id"]
          },
        ]
      }
      client_webhooks: {
        Row: {
          client_id: string
          created_at: string | null
          events: string[]
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_status_code: number | null
          last_triggered_at: string | null
          secret: string
          url: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_status_code?: number | null
          last_triggered_at?: string | null
          secret?: string
          url: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_status_code?: number | null
          last_triggered_at?: string | null
          secret?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_webhooks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "embed_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_webhooks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "embed_clients_public"
            referencedColumns: ["id"]
          },
        ]
      }
      embed_clients: {
        Row: {
          allowed_domains: string[]
          api_key: string
          background_color: string | null
          button_style: string | null
          created_at: string | null
          cta_text: string | null
          current_month_usage: number | null
          custom_title: string | null
          enabled_categories: string[] | null
          entry_animation: string | null
          error_message: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          monthly_limit: number | null
          name: string
          placeholder_garment: string | null
          placeholder_photo: string | null
          primary_color: string | null
          secondary_color: string | null
          show_fit_result: boolean | null
          show_size_selector: boolean | null
          slug: string
          text_color: string | null
          theme_mode: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_domains?: string[]
          api_key?: string
          background_color?: string | null
          button_style?: string | null
          created_at?: string | null
          cta_text?: string | null
          current_month_usage?: number | null
          custom_title?: string | null
          enabled_categories?: string[] | null
          entry_animation?: string | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          monthly_limit?: number | null
          name: string
          placeholder_garment?: string | null
          placeholder_photo?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_fit_result?: boolean | null
          show_size_selector?: boolean | null
          slug: string
          text_color?: string | null
          theme_mode?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_domains?: string[]
          api_key?: string
          background_color?: string | null
          button_style?: string | null
          created_at?: string | null
          cta_text?: string | null
          current_month_usage?: number | null
          custom_title?: string | null
          enabled_categories?: string[] | null
          entry_animation?: string | null
          error_message?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          monthly_limit?: number | null
          name?: string
          placeholder_garment?: string | null
          placeholder_photo?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_fit_result?: boolean | null
          show_size_selector?: boolean | null
          slug?: string
          text_color?: string | null
          theme_mode?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      embed_usage: {
        Row: {
          action: string
          category: string | null
          client_id: string
          created_at: string | null
          id: string
          referer_domain: string | null
        }
        Insert: {
          action: string
          category?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          referer_domain?: string | null
        }
        Update: {
          action?: string
          category?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          referer_domain?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "embed_usage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "embed_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "embed_usage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "embed_clients_public"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          client_id: string
          completed_steps: Json | null
          created_at: string | null
          current_step: string | null
          id: string
          is_complete: boolean | null
          last_step_at: string | null
        }
        Insert: {
          client_id: string
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: string | null
          id?: string
          is_complete?: boolean | null
          last_step_at?: string | null
        }
        Update: {
          client_id?: string
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: string | null
          id?: string
          is_complete?: boolean | null
          last_step_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "embed_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_progress_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "embed_clients_public"
            referencedColumns: ["id"]
          },
        ]
      }
      size_guides: {
        Row: {
          category: string
          client_id: string
          created_at: string
          id: string
          size_system: string
          sizes: Json
          updated_at: string
        }
        Insert: {
          category: string
          client_id: string
          created_at?: string
          id?: string
          size_system?: string
          sizes?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          client_id?: string
          created_at?: string
          id?: string
          size_system?: string
          sizes?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "size_guides_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "embed_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "size_guides_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "embed_clients_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tryon_history: {
        Row: {
          category: string
          created_at: string | null
          fit_result: string | null
          garment_image_url: string | null
          garment_size: string | null
          generated_image_url: string
          id: string
          user_id: string
          user_image_url: string | null
          user_size: string | null
          view360_image_url: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          fit_result?: string | null
          garment_image_url?: string | null
          garment_size?: string | null
          generated_image_url: string
          id?: string
          user_id: string
          user_image_url?: string | null
          user_size?: string | null
          view360_image_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          fit_result?: string | null
          garment_image_url?: string | null
          garment_size?: string | null
          generated_image_url?: string
          id?: string
          user_id?: string
          user_image_url?: string | null
          user_size?: string | null
          view360_image_url?: string | null
        }
        Relationships: []
      }
      uploaded_images: {
        Row: {
          compressed_size_kb: number | null
          created_at: string | null
          id: string
          image_type: string
          original_size_kb: number | null
          storage_path: string
          user_id: string | null
        }
        Insert: {
          compressed_size_kb?: number | null
          created_at?: string | null
          id?: string
          image_type: string
          original_size_kb?: number | null
          storage_path: string
          user_id?: string | null
        }
        Update: {
          compressed_size_kb?: number | null
          created_at?: string | null
          id?: string
          image_type?: string
          original_size_kb?: number | null
          storage_path?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          status_code: number | null
          webhook_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          status_code?: number | null
          webhook_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          status_code?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "client_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      embed_clients_public: {
        Row: {
          background_color: string | null
          button_style: string | null
          cta_text: string | null
          custom_title: string | null
          enabled_categories: string[] | null
          entry_animation: string | null
          error_message: string | null
          id: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string | null
          placeholder_garment: string | null
          placeholder_photo: string | null
          primary_color: string | null
          secondary_color: string | null
          show_fit_result: boolean | null
          show_size_selector: boolean | null
          slug: string | null
          text_color: string | null
          theme_mode: string | null
        }
        Insert: {
          background_color?: string | null
          button_style?: string | null
          cta_text?: string | null
          custom_title?: string | null
          enabled_categories?: string[] | null
          entry_animation?: string | null
          error_message?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          placeholder_garment?: string | null
          placeholder_photo?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_fit_result?: boolean | null
          show_size_selector?: boolean | null
          slug?: string | null
          text_color?: string | null
          theme_mode?: string | null
        }
        Update: {
          background_color?: string | null
          button_style?: string | null
          cta_text?: string | null
          custom_title?: string | null
          enabled_categories?: string[] | null
          entry_animation?: string | null
          error_message?: string | null
          id?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          placeholder_garment?: string | null
          placeholder_photo?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          show_fit_result?: boolean | null
          show_size_selector?: boolean | null
          slug?: string | null
          text_color?: string | null
          theme_mode?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role_for_client: {
        Args: { p_client_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["team_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_client_permission: {
        Args: {
          p_client_id: string
          p_required_role: Database["public"]["Enums"]["team_role"]
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client" | "user"
      team_role: "owner" | "admin" | "editor" | "viewer"
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
      app_role: ["admin", "client", "user"],
      team_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
