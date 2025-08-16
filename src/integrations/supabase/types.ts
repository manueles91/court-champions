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
      match_stats: {
        Row: {
          created_at: string
          games_played: number
          games_won: number
          match_id: string
          match_played: number
          match_won: number
          player_id: string
          stat_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          games_played?: number
          games_won?: number
          match_id: string
          match_played?: number
          match_won?: number
          player_id: string
          stat_id?: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          games_played?: number
          games_won?: number
          match_id?: string
          match_played?: number
          match_won?: number
          player_id?: string
          stat_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "match_stats_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["tournament_id"]
          },
        ]
      }
      matches: {
        Row: {
          away_games: number | null
          created_at: string
          home_games: number | null
          loser_pair: string | null
          match_id: string
          pair_away_id: string
          pair_home_id: string
          tie: boolean | null
          tournament_id: string
          updated_at: string
          winner_pair: string | null
        }
        Insert: {
          away_games?: number | null
          created_at?: string
          home_games?: number | null
          loser_pair?: string | null
          match_id?: string
          pair_away_id: string
          pair_home_id: string
          tie?: boolean | null
          tournament_id: string
          updated_at?: string
          winner_pair?: string | null
        }
        Update: {
          away_games?: number | null
          created_at?: string
          home_games?: number | null
          loser_pair?: string | null
          match_id?: string
          pair_away_id?: string
          pair_home_id?: string
          tie?: boolean | null
          tournament_id?: string
          updated_at?: string
          winner_pair?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_loser_pair_fkey"
            columns: ["loser_pair"]
            isOneToOne: false
            referencedRelation: "pairs"
            referencedColumns: ["pair_id"]
          },
          {
            foreignKeyName: "matches_pair_away_id_fkey"
            columns: ["pair_away_id"]
            isOneToOne: false
            referencedRelation: "pairs"
            referencedColumns: ["pair_id"]
          },
          {
            foreignKeyName: "matches_pair_home_id_fkey"
            columns: ["pair_home_id"]
            isOneToOne: false
            referencedRelation: "pairs"
            referencedColumns: ["pair_id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["tournament_id"]
          },
          {
            foreignKeyName: "matches_winner_pair_fkey"
            columns: ["winner_pair"]
            isOneToOne: false
            referencedRelation: "pairs"
            referencedColumns: ["pair_id"]
          },
        ]
      }
      pairs: {
        Row: {
          created_at: string
          pair_id: string
          player1_id: string
          player2_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          pair_id?: string
          player1_id: string
          player2_id: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          pair_id?: string
          player1_id?: string
          player2_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pairs_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "pairs_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "pairs_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["tournament_id"]
          },
        ]
      }
      tournament_enrollments: {
        Row: {
          created_at: string
          pair_id: string
          player_id: string
          registration_id: string
          tournament_id: string
        }
        Insert: {
          created_at?: string
          pair_id: string
          player_id: string
          registration_id?: string
          tournament_id: string
        }
        Update: {
          created_at?: string
          pair_id?: string
          player_id?: string
          registration_id?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_enrollments_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "pairs"
            referencedColumns: ["pair_id"]
          },
          {
            foreignKeyName: "tournament_enrollments_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "tournament_enrollments_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["tournament_id"]
          },
        ]
      }
      tournament_stats: {
        Row: {
          created_at: string
          player_id: string
          points: number
          position: number | null
          tournament_id: string
          tournament_stat_id: string
        }
        Insert: {
          created_at?: string
          player_id: string
          points?: number
          position?: number | null
          tournament_id: string
          tournament_stat_id?: string
        }
        Update: {
          created_at?: string
          player_id?: string
          points?: number
          position?: number | null
          tournament_id?: string
          tournament_stat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["player_id"]
          },
          {
            foreignKeyName: "tournament_stats_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["tournament_id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          name: string
          starts_at: string | null
          tournament_format:
            | Database["public"]["Enums"]["tournament_format"]
            | null
          tournament_id: string
          tournament_type: Database["public"]["Enums"]["tournament_type"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          name: string
          starts_at?: string | null
          tournament_format?:
            | Database["public"]["Enums"]["tournament_format"]
            | null
          tournament_id?: string
          tournament_type?:
            | Database["public"]["Enums"]["tournament_type"]
            | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          name?: string
          starts_at?: string | null
          tournament_format?:
            | Database["public"]["Enums"]["tournament_format"]
            | null
          tournament_id?: string
          tournament_type?:
            | Database["public"]["Enums"]["tournament_type"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          phone: string | null
          player_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          phone?: string | null
          player_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          phone?: string | null
          player_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      upsert_match_stat: {
        Args: {
          p_games_played: number
          p_games_won: number
          p_match_id: string
          p_match_won: number
          p_player_id: string
          p_tournament_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      tournament_format: "round_robin_per_pairs"
      tournament_type: "fast_tournament" | "reg_tournament" | "finals"
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
      tournament_format: ["round_robin_per_pairs"],
      tournament_type: ["fast_tournament", "reg_tournament", "finals"],
    },
  },
} as const
