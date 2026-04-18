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
      bookmarks: {
        Row: {
          anonymous_id: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          anonymous_id: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          anonymous_id?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          anonymous_id: string
          content: string
          created_at: string
          has_effect: string | null
          id: string
          image_url: string | null
          parent_id: string | null
          room_id: string
        }
        Insert: {
          anonymous_id: string
          content: string
          created_at?: string
          has_effect?: string | null
          id?: string
          image_url?: string | null
          parent_id?: string | null
          room_id: string
        }
        Update: {
          anonymous_id?: string
          content?: string
          created_at?: string
          has_effect?: string | null
          id?: string
          image_url?: string | null
          parent_id?: string | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          anonymous_id: string
          content: string
          created_at: string
          downvotes: number
          id: string
          parent_id: string | null
          post_id: string
          upvotes: number
        }
        Insert: {
          anonymous_id: string
          content: string
          created_at?: string
          downvotes?: number
          id?: string
          parent_id?: string | null
          post_id: string
          upvotes?: number
        }
        Update: {
          anonymous_id?: string
          content?: string
          created_at?: string
          downvotes?: number
          id?: string
          parent_id?: string | null
          post_id?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          anonymous_id: string
          id: string
          message_id: string
          read_at: string
        }
        Insert: {
          anonymous_id: string
          id?: string
          message_id: string
          read_at?: string
        }
        Update: {
          anonymous_id?: string
          id?: string
          message_id?: string
          read_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_anonymous_id: string | null
          anonymous_id: string
          comment_id: string | null
          created_at: string
          id: string
          payload: Json | null
          post_id: string | null
          read: boolean
          type: string
        }
        Insert: {
          actor_anonymous_id?: string | null
          anonymous_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          post_id?: string | null
          read?: boolean
          type: string
        }
        Update: {
          actor_anonymous_id?: string | null
          anonymous_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          post_id?: string | null
          read?: boolean
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          anonymous_id: string
          id: string
          post_id: string
          shared_at: string
        }
        Insert: {
          anonymous_id: string
          id?: string
          post_id: string
          shared_at?: string
        }
        Update: {
          anonymous_id?: string
          id?: string
          post_id?: string
          shared_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_views: {
        Row: {
          anonymous_id: string
          id: string
          post_id: string
          viewed_at: string
        }
        Insert: {
          anonymous_id: string
          id?: string
          post_id: string
          viewed_at?: string
        }
        Update: {
          anonymous_id?: string
          id?: string
          post_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_views_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          anonymous_id: string
          category: string | null
          comment_count: number
          content: string | null
          created_at: string
          downvotes: number
          id: string
          share_count: number
          title: string
          updated_at: string
          upvotes: number
          view_count: number
        }
        Insert: {
          anonymous_id: string
          category?: string | null
          comment_count?: number
          content?: string | null
          created_at?: string
          downvotes?: number
          id?: string
          share_count?: number
          title: string
          updated_at?: string
          upvotes?: number
          view_count?: number
        }
        Update: {
          anonymous_id?: string
          category?: string | null
          comment_count?: number
          content?: string | null
          created_at?: string
          downvotes?: number
          id?: string
          share_count?: number
          title?: string
          updated_at?: string
          upvotes?: number
          view_count?: number
        }
        Relationships: []
      }
      reactions: {
        Row: {
          anonymous_id: string
          comment_id: string | null
          created_at: string
          emoji: string
          id: string
          post_id: string | null
        }
        Insert: {
          anonymous_id: string
          comment_id?: string | null
          created_at?: string
          emoji: string
          id?: string
          post_id?: string | null
        }
        Update: {
          anonymous_id?: string
          comment_id?: string | null
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          anonymous_id: string
          comment_id: string | null
          created_at: string
          details: string | null
          id: string
          post_id: string | null
          reason: string
        }
        Insert: {
          anonymous_id: string
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string | null
          reason: string
        }
        Update: {
          anonymous_id?: string
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      room_presence: {
        Row: {
          anonymous_id: string
          id: string
          is_typing: boolean
          last_seen: string
          room_id: string
        }
        Insert: {
          anonymous_id: string
          id?: string
          is_typing?: boolean
          last_seen?: string
          room_id: string
        }
        Update: {
          anonymous_id?: string
          id?: string
          is_typing?: boolean
          last_seen?: string
          room_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          anonymous_id: string
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          vote_type: number
        }
        Insert: {
          anonymous_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          vote_type: number
        }
        Update: {
          anonymous_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          vote_type?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
