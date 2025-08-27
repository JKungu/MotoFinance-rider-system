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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      bikes: {
        Row: {
          chassis_no: string
          colour: string
          created_at: string
          current_rider_id: string | null
          engine_no: string
          id: string
          make: string
          purchase_date: string
          purchase_price: number
          registration_no: string | null
          status: string
          updated_at: string
        }
        Insert: {
          chassis_no: string
          colour: string
          created_at?: string
          current_rider_id?: string | null
          engine_no: string
          id?: string
          make: string
          purchase_date: string
          purchase_price: number
          registration_no?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          chassis_no?: string
          colour?: string
          created_at?: string
          current_rider_id?: string | null
          engine_no?: string
          id?: string
          make?: string
          purchase_date?: string
          purchase_price?: number
          registration_no?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bikes_current_rider"
            columns: ["current_rider_id"]
            isOneToOne: false
            referencedRelation: "financed_riders"
            referencedColumns: ["id"]
          },
        ]
      }
      business_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string
          description: string
          expense_date: string
          id: string
          notes: string | null
          reference_no: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by: string
          description: string
          expense_date: string
          id?: string
          notes?: string | null
          reference_no?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          reference_no?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      financed_riders: {
        Row: {
          age: number
          bike_id: string | null
          created_at: string
          created_by: string | null
          daily_remittance: number
          expected_operation_days: number
          full_name: string
          id: string
          id_number: string
          next_of_kin_id: string
          next_of_kin_name: string
          next_of_kin_phone: string
          next_of_kin_relationship: string
          operation_slot: string
          operation_slot_cost: number
          postal_address: string
          potential_rider_id: string | null
          primary_phone: string
          referee_id: string | null
          referee_name: string | null
          referee_phone: string | null
          residential_area: string
          secondary_phone: string | null
          start_date: string
          status: Database["public"]["Enums"]["rider_status"]
          tertiary_phone: string | null
          total_investment: number
          updated_at: string
        }
        Insert: {
          age: number
          bike_id?: string | null
          created_at?: string
          created_by?: string | null
          daily_remittance: number
          expected_operation_days: number
          full_name: string
          id?: string
          id_number: string
          next_of_kin_id: string
          next_of_kin_name: string
          next_of_kin_phone: string
          next_of_kin_relationship: string
          operation_slot: string
          operation_slot_cost?: number
          postal_address: string
          potential_rider_id?: string | null
          primary_phone: string
          referee_id?: string | null
          referee_name?: string | null
          referee_phone?: string | null
          residential_area: string
          secondary_phone?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["rider_status"]
          tertiary_phone?: string | null
          total_investment: number
          updated_at?: string
        }
        Update: {
          age?: number
          bike_id?: string | null
          created_at?: string
          created_by?: string | null
          daily_remittance?: number
          expected_operation_days?: number
          full_name?: string
          id?: string
          id_number?: string
          next_of_kin_id?: string
          next_of_kin_name?: string
          next_of_kin_phone?: string
          next_of_kin_relationship?: string
          operation_slot?: string
          operation_slot_cost?: number
          postal_address?: string
          potential_rider_id?: string | null
          primary_phone?: string
          referee_id?: string | null
          referee_name?: string | null
          referee_phone?: string | null
          residential_area?: string
          secondary_phone?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["rider_status"]
          tertiary_phone?: string | null
          total_investment?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financed_riders_bike_id_fkey"
            columns: ["bike_id"]
            isOneToOne: false
            referencedRelation: "bikes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financed_riders_potential_rider_id_fkey"
            columns: ["potential_rider_id"]
            isOneToOne: false
            referencedRelation: "potential_riders"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          description: string
          from_account: string | null
          id: string
          notes: string | null
          reference_no: string | null
          to_account: string | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          description: string
          from_account?: string | null
          id?: string
          notes?: string | null
          reference_no?: string | null
          to_account?: string | null
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          description?: string
          from_account?: string | null
          id?: string
          notes?: string | null
          reference_no?: string | null
          to_account?: string | null
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          rider_id: string
          status: Database["public"]["Enums"]["payment_status"]
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string
          rider_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          rider_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "financed_riders"
            referencedColumns: ["id"]
          },
        ]
      }
      potential_riders: {
        Row: {
          age: number
          created_at: string
          created_by: string
          full_name: string
          id: string
          id_number: string
          introducer_id: string | null
          introducer_name: string | null
          introducer_phone: string | null
          introducer_previous_bike: string | null
          introducer_residential_area: string | null
          postal_address: string
          preferred_bike_make: string | null
          primary_phone: string
          probable_financing_date: string | null
          secondary_phone: string | null
          status: Database["public"]["Enums"]["rider_status"]
          tertiary_phone: string | null
          updated_at: string
        }
        Insert: {
          age: number
          created_at?: string
          created_by?: string
          full_name: string
          id?: string
          id_number: string
          introducer_id?: string | null
          introducer_name?: string | null
          introducer_phone?: string | null
          introducer_previous_bike?: string | null
          introducer_residential_area?: string | null
          postal_address: string
          preferred_bike_make?: string | null
          primary_phone: string
          probable_financing_date?: string | null
          secondary_phone?: string | null
          status?: Database["public"]["Enums"]["rider_status"]
          tertiary_phone?: string | null
          updated_at?: string
        }
        Update: {
          age?: number
          created_at?: string
          created_by?: string
          full_name?: string
          id?: string
          id_number?: string
          introducer_id?: string | null
          introducer_name?: string | null
          introducer_phone?: string | null
          introducer_previous_bike?: string | null
          introducer_residential_area?: string | null
          postal_address?: string
          preferred_bike_make?: string | null
          primary_phone?: string
          probable_financing_date?: string | null
          secondary_phone?: string | null
          status?: Database["public"]["Enums"]["rider_status"]
          tertiary_phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sms_notifications: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message: string
          message_type: string
          recipient_phone: string
          rider_id: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          message_type: string
          recipient_phone: string
          rider_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          message_type?: string
          recipient_phone?: string
          rider_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      payment_status: "pending" | "completed" | "failed" | "overdue"
      rider_status:
        | "potential"
        | "financed"
        | "completed"
        | "defaulted"
        | "repossessed"
      transaction_type:
        | "daily_remittance"
        | "expense"
        | "transfer"
        | "repossession"
      user_role: "admin" | "accountant" | "rider_clerk"
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
      payment_status: ["pending", "completed", "failed", "overdue"],
      rider_status: [
        "potential",
        "financed",
        "completed",
        "defaulted",
        "repossessed",
      ],
      transaction_type: [
        "daily_remittance",
        "expense",
        "transfer",
        "repossession",
      ],
      user_role: ["admin", "accountant", "rider_clerk"],
    },
  },
} as const
