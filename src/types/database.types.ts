export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workshops: {
        Row: {
          id: string
          created_at: string
          name: string
          slug: string
          logo_url: string | null
          address: string | null
          phone: string | null
          settings: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          slug: string
          logo_url?: string | null
          address?: string | null
          phone?: string | null
          settings?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          slug?: string
          logo_url?: string | null
          address?: string | null
          phone?: string | null
          settings?: Json | null
        }
      }
      profiles: {
        Row: {
          id: string
          workshop_id: string
          full_name: string | null
          avatar_url: string | null
          role: Database['public']['Enums']['user_role']
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          workshop_id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: Database['public']['Enums']['user_role']
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          workshop_id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: Database['public']['Enums']['user_role']
          created_at?: string
          updated_at?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          workshop_id: string
          full_name: string
          phone: string | null
          email: string | null
          document_id: string | null
          address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workshop_id: string
          full_name: string
          phone?: string | null
          email?: string | null
          document_id?: string | null
          address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workshop_id?: string
          full_name?: string
          phone?: string | null
          email?: string | null
          document_id?: string | null
          address?: string | null
          created_at?: string
        }
      }
      motorcycles: {
        Row: {
          id: string
          workshop_id: string
          customer_id: string
          plate: string
          make: string
          model: string
          year: number | null
          color: string | null
          vin: string | null
          engine_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          workshop_id: string
          customer_id: string
          plate: string
          make: string
          model: string
          year?: number | null
          color?: string | null
          vin?: string | null
          engine_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          workshop_id?: string
          customer_id?: string
          plate?: string
          make?: string
          model?: string
          year?: number | null
          color?: string | null
          vin?: string | null
          engine_number?: string | null
          created_at?: string
        }
      }
      workorders: {
        Row: {
          id: string
          workshop_id: string
          customer_id: string
          motorcycle_id: string
          status: Database['public']['Enums']['workorder_status']
          tracking_token: string
          mileage: number | null
          description: string | null
          total_amount: number
          technician_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          workshop_id: string
          customer_id: string
          motorcycle_id: string
          status?: Database['public']['Enums']['workorder_status']
          tracking_token?: string
          mileage?: number | null
          description?: string | null
          total_amount?: number
          technician_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          workshop_id?: string
          customer_id?: string
          motorcycle_id?: string
          status?: Database['public']['Enums']['workorder_status']
          tracking_token?: string
          mileage?: number | null
          description?: string | null
          total_amount?: number
          technician_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          workshop_id: string
          workorder_id: string
          type: Database['public']['Enums']['item_type']
          description: string
          quantity: number
          unit_price: number
          status: Database['public']['Enums']['item_status']
          created_at: string
        }
        Insert: {
          id?: string
          workshop_id: string
          workorder_id: string
          type: Database['public']['Enums']['item_type']
          description: string
          quantity?: number
          unit_price: number
          status?: Database['public']['Enums']['item_status']
          created_at?: string
        }
        Update: {
          id?: string
          workshop_id?: string
          workorder_id?: string
          type?: Database['public']['Enums']['item_type']
          description?: string
          quantity?: number
          unit_price?: number
          status?: Database['public']['Enums']['item_status']
          created_at?: string
        }
      }
      order_timeline_events: {
        Row: {
          id: string
          workshop_id: string
          workorder_id: string
          status: Database['public']['Enums']['workorder_status']
          description: string | null
          media_urls: string[] | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          workshop_id: string
          workorder_id: string
          status: Database['public']['Enums']['workorder_status']
          description?: string | null
          media_urls?: string[] | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          workshop_id?: string
          workorder_id?: string
          status?: Database['public']['Enums']['workorder_status']
          description?: string | null
          media_urls?: string[] | null
          created_at?: string
          created_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      workorder_status:
        | 'received'
        | 'diagnosing'
        | 'waiting_approval'
        | 'in_repair'
        | 'quality_check'
        | 'ready_for_pickup'
        | 'delivered'
      user_role: 'owner' | 'manager' | 'mechanic' | 'receptionist'
      item_status: 'pending' | 'approved' | 'rejected'
      item_type: 'part' | 'labor'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
