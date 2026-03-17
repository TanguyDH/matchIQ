// ─── Enum types ──────────────────────────────────────────────────────────────
// Single source until shared-types is populated in Phase 4.
// These mirror the Postgres enums declared in migration 20260203000001.

export type StrategyMode  = 'EASY' | 'ADVANCED';
export type AlertType     = 'IN_PLAY' | 'PRE_MATCH';
export type RuleValueType = 'IN_PLAY' | 'PRE_MATCH' | 'ODDS';
export type Comparator    = 'GTE' | 'LTE' | 'EQ' | 'GT' | 'LT' | 'NEQ';
export type TeamScope     =
  | 'HOME'
  | 'AWAY'
  | 'TOTAL'
  | 'EITHER_TEAM'
  | 'EITHER_OPPONENT'
  | 'DIFFERENCE'
  | 'FAVOURITE'
  | 'FAVOURITE_HOME'
  | 'FAVOURITE_AWAY'
  | 'UNDERDOG'
  | 'UNDERDOG_HOME'
  | 'UNDERDOG_AWAY'
  | 'WINNING_TEAM'
  | 'LOSING_TEAM';
export type TriggerResult = 'HIT' | 'MISS';

// ─── Database schema ─────────────────────────────────────────────────────────
// Mirrors the tables created in migration 20260203000001.
// TODO: replace with `supabase gen types typescript` output once the project is provisioned.
//
// Every table must carry Row / Insert / Update / Relationships to satisfy
// @supabase/supabase-js GenericTable constraint.
// The public schema must also expose Views and Functions (even if empty) so that
// it extends GenericSchema and the typed client resolves correctly.

export interface Database {
  public: {
    Tables: {
      strategies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          mode: StrategyMode;
          alert_type: AlertType;
          desired_outcome: string | null;
          is_active: boolean;
          created_at: string;
          league_ids: number[] | null;
        };
        Insert: {
          user_id: string;
          name: string;
          description?: string | null;
          mode?: StrategyMode;
          alert_type: AlertType;
          desired_outcome?: string | null;
          is_active?: boolean;
          league_ids?: number[] | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          mode?: StrategyMode;
          alert_type?: AlertType;
          desired_outcome?: string | null;
          is_active?: boolean;
          league_ids?: number[] | null;
        };
        Relationships: [];
      };

      rules: {
        Row: {
          id: string;
          strategy_id: string;
          value_type: RuleValueType;
          metric: string;
          comparator: Comparator;
          value: number;
          team_scope: TeamScope | null;
          time_filter: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          strategy_id: string;
          value_type: RuleValueType;
          metric: string;
          comparator: Comparator;
          value: number;
          team_scope?: TeamScope | null;
          time_filter?: Record<string, unknown> | null;
        };
        Update: {
          value_type?: RuleValueType;
          metric?: string;
          comparator?: Comparator;
          value?: number;
          team_scope?: TeamScope | null;
          time_filter?: Record<string, unknown> | null;
        };
        Relationships: [];
      };

      user_telegram: {
        Row: {
          user_id: string;
          chat_id: string | null;
          link_token: string | null;
          link_token_expires_at: string | null;
          linked_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          chat_id?: string | null;
          link_token?: string | null;
          link_token_expires_at?: string | null;
          linked_at?: string | null;
        };
        Update: {
          chat_id?: string | null;
          link_token?: string | null;
          link_token_expires_at?: string | null;
          linked_at?: string | null;
        };
        Relationships: [];
      };

      user_settings: {
        Row: { user_id: string; default_league_ids: number[] | null; created_at: string };
        Insert: { user_id: string; default_league_ids?: number[] | null };
        Update: { default_league_ids?: number[] | null };
        Relationships: [];
      };

      performance: {
        Row: {
          strategy_id: string;
          total_triggers: number;
          total_hits: number;
          total_misses: number;
          hit_rate: string;
        };
        Insert: { strategy_id: string };
        Update: {
          total_triggers?: number;
          total_hits?: number;
          total_misses?: number;
          hit_rate?: string;
        };
        Relationships: [];
      };

      match_stats_timeline: {
        Row: {
          match_id: string;
          minute: number;
          home_score: number;
          away_score: number;
          inplay: Record<string, number>;
          captured_at: string;
        };
        Insert: {
          match_id: string;
          minute: number;
          home_score: number;
          away_score: number;
          inplay: Record<string, number>;
          captured_at?: string;
        };
        Update: {
          home_score?: number;
          away_score?: number;
          inplay?: Record<string, number>;
          captured_at?: string;
        };
        Relationships: [];
      };

      // triggers are read-only from the API's perspective;
      // the worker writes them via the service-role key.
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
