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
  | 'FAVOURITE'
  | 'UNDERDOG'
  | 'WINNING_TEAM'
  | 'LOSING_TEAM'
  | 'DIFFERENCE';
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
        };
        Insert: {
          user_id: string;
          name: string;
          description?: string | null;
          mode?: StrategyMode;
          alert_type: AlertType;
          desired_outcome?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          mode?: StrategyMode;
          alert_type?: AlertType;
          desired_outcome?: string | null;
          is_active?: boolean;
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

      // triggers & performance are read-only from the API's perspective;
      // the worker writes them via the service-role key.
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
