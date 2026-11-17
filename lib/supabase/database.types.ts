export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      budget_plans: {
        Row: {
          category_id: string;
          month: string;
          planned_amount: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category_id: string;
          month: string;
          planned_amount: number;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          category_id?: string;
          month?: string;
          planned_amount?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'budget_plans_category_fkey';
            columns: ['user_id', 'category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['user_id', 'id'];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          default_amount: number;
          id: string;
          name: string;
          sort_order: number;
          type: Database['public']['Enums']['category_type'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          default_amount?: number;
          id: string;
          name: string;
          sort_order?: number;
          type: Database['public']['Enums']['category_type'];
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          default_amount?: number;
          id?: string;
          name?: string;
          sort_order?: number;
          type?: Database['public']['Enums']['category_type'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          category_id: string;
          created_at: string;
          date: string;
          id: string;
          note: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id: string;
          created_at?: string;
          date: string;
          id: string;
          note?: string | null;
          user_id?: string;
        };
        Update: {
          amount?: number;
          category_id?: string;
          created_at?: string;
          date?: string;
          id?: string;
          note?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_category_fkey';
            columns: ['user_id', 'category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['user_id', 'id'];
          },
        ];
      };
      tv_episodes: {
        Row: {
          air_date: string | null;
          episode_number: number;
          name: string | null;
          overview: string | null;
          runtime: number | null;
          season_number: number;
          show_tmdb_id: number;
          still_path: string | null;
          tmdb_id: number;
        };
        Insert: {
          air_date?: string | null;
          episode_number: number;
          name?: string | null;
          overview?: string | null;
          runtime?: number | null;
          season_number: number;
          show_tmdb_id: number;
          still_path?: string | null;
          tmdb_id: number;
        };
        Update: {
          air_date?: string | null;
          episode_number?: number;
          name?: string | null;
          overview?: string | null;
          runtime?: number | null;
          season_number?: number;
          show_tmdb_id?: number;
          still_path?: string | null;
          tmdb_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tv_episodes_show_tmdb_id_fkey';
            columns: ['show_tmdb_id'];
            isOneToOne: false;
            referencedRelation: 'tv_shows';
            referencedColumns: ['tmdb_id'];
          },
        ];
      };
      tv_follows: {
        Row: {
          archived: boolean;
          followed_at: string;
          show_tmdb_id: number;
          watchlist: boolean;
        };
        Insert: {
          archived?: boolean;
          followed_at?: string;
          show_tmdb_id: number;
          watchlist?: boolean;
        };
        Update: {
          archived?: boolean;
          followed_at?: string;
          show_tmdb_id?: number;
          watchlist?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'tv_follows_show_tmdb_id_fkey';
            columns: ['show_tmdb_id'];
            isOneToOne: true;
            referencedRelation: 'tv_shows';
            referencedColumns: ['tmdb_id'];
          },
        ];
      };
      tv_list_shows: {
        Row: {
          list_id: number;
          show_tmdb_id: number;
        };
        Insert: {
          list_id: number;
          show_tmdb_id: number;
        };
        Update: {
          list_id?: number;
          show_tmdb_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'tv_list_shows_list_id_fkey';
            columns: ['list_id'];
            isOneToOne: false;
            referencedRelation: 'tv_lists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tv_list_shows_show_tmdb_id_fkey';
            columns: ['show_tmdb_id'];
            isOneToOne: false;
            referencedRelation: 'tv_shows';
            referencedColumns: ['tmdb_id'];
          },
        ];
      };
      tv_lists: {
        Row: {
          created_at: string;
          id: number;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: never;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: never;
          name?: string;
        };
        Relationships: [];
      };
      tv_notified: {
        Row: {
          episode_tmdb_id: number;
          notified_at: string;
        };
        Insert: {
          episode_tmdb_id: number;
          notified_at?: string;
        };
        Update: {
          episode_tmdb_id?: number;
          notified_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tv_notified_episode_tmdb_id_fkey';
            columns: ['episode_tmdb_id'];
            isOneToOne: true;
            referencedRelation: 'tv_episodes';
            referencedColumns: ['tmdb_id'];
          },
        ];
      };
      tv_settings: {
        Row: {
          id: boolean;
          services: number[];
        };
        Insert: {
          id?: boolean;
          services?: number[];
        };
        Update: {
          id?: boolean;
          services?: number[];
        };
        Relationships: [];
      };
      tv_shows: {
        Row: {
          backdrop_path: string | null;
          first_air_date: string | null;
          last_synced_at: string | null;
          name: string;
          overview: string | null;
          poster_path: string | null;
          providers: Json | null;
          status: string | null;
          tmdb_id: number;
          tvdb_id: number | null;
        };
        Insert: {
          backdrop_path?: string | null;
          first_air_date?: string | null;
          last_synced_at?: string | null;
          name: string;
          overview?: string | null;
          poster_path?: string | null;
          providers?: Json | null;
          status?: string | null;
          tmdb_id: number;
          tvdb_id?: number | null;
        };
        Update: {
          backdrop_path?: string | null;
          first_air_date?: string | null;
          last_synced_at?: string | null;
          name?: string;
          overview?: string | null;
          poster_path?: string | null;
          providers?: Json | null;
          status?: string | null;
          tmdb_id?: number;
          tvdb_id?: number | null;
        };
        Relationships: [];
      };
      tv_watches: {
        Row: {
          episode_number: number;
          id: number;
          season_number: number;
          show_tmdb_id: number;
          watched_at: string;
        };
        Insert: {
          episode_number: number;
          id?: never;
          season_number: number;
          show_tmdb_id: number;
          watched_at?: string;
        };
        Update: {
          episode_number?: number;
          id?: never;
          season_number?: number;
          show_tmdb_id?: number;
          watched_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tv_watches_show_tmdb_id_fkey';
            columns: ['show_tmdb_id'];
            isOneToOne: false;
            referencedRelation: 'tv_shows';
            referencedColumns: ['tmdb_id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      tv_date: { Args: { ts: string }; Returns: string };
      tv_dormant: {
        Args: never;
        Returns: {
          show_tmdb_id: number;
        }[];
      };
      tv_home: { Args: never; Returns: Json };
      tv_library: {
        Args: never;
        Returns: {
          aired_total: number;
          aired_watched: number;
          archived: boolean;
          dormant: boolean;
          last_watched_at: string;
          next_air_date: string;
          show_tmdb_id: number;
          watchlist: boolean;
        }[];
      };
      tv_pending_notifications: {
        Args: never;
        Returns: {
          air_date: string;
          episode_number: number;
          episode_tmdb_id: number;
          name: string;
          season_number: number;
          show_name: string;
        }[];
      };
      tv_stats: { Args: never; Returns: Json };
      tv_today: { Args: never; Returns: string };
      tv_up_next: {
        Args: never;
        Returns: {
          aired_total: number;
          aired_watched: number;
          episode_number: number;
          episode_tmdb_id: number;
          season_number: number;
          show_tmdb_id: number;
        }[];
      };
    };
    Enums: {
      category_type: 'income' | 'expense' | 'savings';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      category_type: ['income', 'expense', 'savings'],
    },
  },
} as const;
