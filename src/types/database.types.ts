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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string | null
          document_id: string | null
          email: string | null
          full_name: string
          id: string
          phone_whatsapp: string
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          email?: string | null
          full_name: string
          id?: string
          phone_whatsapp: string
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone_whatsapp?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      motorcycles: {
        Row: {
          brand: string
          customer_id: string
          id: string
          license_plate: string
          model: string
          workshop_id: string
          year: number | null
        }
        Insert: {
          brand: string
          customer_id: string
          id?: string
          license_plate: string
          model: string
          workshop_id: string
          year?: number | null
        }
        Update: {
          brand?: string
          customer_id?: string
          id?: string
          license_plate?: string
          model?: string
          workshop_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "motorcycles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motorcycles_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          approved: boolean | null
          description: string
          id: string
          quantity: number | null
          type: Database["public"]["Enums"]["item_type"]
          unit_price: number | null
          urgency: Database["public"]["Enums"]["item_urgency"] | null
          work_order_id: string
          workshop_id: string
        }
        Insert: {
          approved?: boolean | null
          description: string
          id?: string
          quantity?: number | null
          type: Database["public"]["Enums"]["item_type"]
          unit_price?: number | null
          urgency?: Database["public"]["Enums"]["item_urgency"] | null
          work_order_id: string
          workshop_id: string
        }
        Update: {
          approved?: boolean | null
          description?: string
          id?: string
          quantity?: number | null
          type?: Database["public"]["Enums"]["item_type"]
          unit_price?: number | null
          urgency?: Database["public"]["Enums"]["item_urgency"] | null
          work_order_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      order_timeline_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          media_urls: Json | null
          public_comment: string | null
          status_snapshot: Database["public"]["Enums"]["order_status"] | null
          work_order_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          media_urls?: Json | null
          public_comment?: string | null
          status_snapshot?: Database["public"]["Enums"]["order_status"] | null
          work_order_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          media_urls?: Json | null
          public_comment?: string | null
          status_snapshot?: Database["public"]["Enums"]["order_status"] | null
          work_order_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_timeline_events_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_timeline_events_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean | null
          created_at: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          workshop_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          workshop_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          created_at: string | null
          customer_notes: string | null
          fuel_level: string | null
          id: string
          initial_damage_json: Json | null
          mechanic_id: string | null
          mileage_in: number
          motorcycle_id: string
          order_number: number
          status: Database["public"]["Enums"]["order_status"] | null
          tracking_token: string | null
          updated_at: string | null
          workshop_id: string
        }
        Insert: {
          created_at?: string | null
          customer_notes?: string | null
          fuel_level?: string | null
          id?: string
          initial_damage_json?: Json | null
          mechanic_id?: string | null
          mileage_in: number
          motorcycle_id: string
          order_number?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          tracking_token?: string | null
          updated_at?: string | null
          workshop_id: string
        }
        Update: {
          created_at?: string | null
          customer_notes?: string | null
          fuel_level?: string | null
          id?: string
          initial_damage_json?: Json | null
          mechanic_id?: string | null
          mileage_in?: number
          motorcycle_id?: string
          order_number?: number
          status?: Database["public"]["Enums"]["order_status"] | null
          tracking_token?: string | null
          updated_at?: string | null
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          phone_whatsapp: string | null
          plan_type: Database["public"]["Enums"]["workshop_plan"] | null
          primary_color: string | null
          slug: string
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone_whatsapp?: string | null
          plan_type?: Database["public"]["Enums"]["workshop_plan"] | null
          primary_color?: string | null
          slug: string
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone_whatsapp?: string | null
          plan_type?: Database["public"]["Enums"]["workshop_plan"] | null
          primary_color?: string | null
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_workshop_id: { Args: never; Returns: string }
    }
    Enums: {
      item_type: "spare_part" | "labor"
      item_urgency: "low" | "medium" | "high"
      order_status:
        | "received"
        | "diagnosing"
        | "waiting_approval"
        | "in_progress"
        | "testing"
        | "ready"
        | "delivered"
        | "cancelled"
      user_role: "admin" | "mechanic" | "receptionist"
      workshop_plan: "free" | "pro" | "enterprise"
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
      item_type: ["spare_part", "labor"],
      item_urgency: ["low", "medium", "high"],
      order_status: [
        "received",
        "diagnosing",
        "waiting_approval",
        "in_progress",
        "testing",
        "ready",
        "delivered",
        "cancelled",
      ],
      user_role: ["admin", "mechanic", "receptionist"],
      workshop_plan: ["free", "pro", "enterprise"],
    },
  },
} as const
