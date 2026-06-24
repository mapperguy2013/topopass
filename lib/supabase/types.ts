export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "learner" | "admin";
export type QuestionType = "knowledge" | "map-click" | "route-drawing";
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type QuestionStatus = "draft" | "published" | "archived";
export type AttemptStatus =
  | "in_progress"
  | "submitted"
  | "abandoned"
  | "expired";
export type PracticeMode =
  | "knowledge"
  | "map-click"
  | "route-drawing"
  | "mixed";
export type MockMode = "practice" | "exam" | "weak-areas" | "mistakes";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          display_name?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
        Relationships: [];
      };
      practice_attempts: {
        Row: {
          id: string;
          user_id: string;
          practice_mode: PracticeMode;
          status: AttemptStatus;
          started_at: string;
          completed_at: string | null;
          score: number | null;
          max_score: number | null;
          percentage: number | null;
          passed: boolean | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          practice_mode: PracticeMode;
          status?: AttemptStatus;
          started_at?: string;
          completed_at?: string | null;
          score?: number | null;
          max_score?: number | null;
          percentage?: number | null;
          passed?: boolean | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          practice_mode?: PracticeMode;
          status?: AttemptStatus;
          completed_at?: string | null;
          score?: number | null;
          max_score?: number | null;
          percentage?: number | null;
          passed?: boolean | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      question_attempts: {
        Row: {
          id: string;
          user_id: string;
          practice_attempt_id: string | null;
          question_id: string;
          question_type: QuestionType;
          answer: Json | null;
          result: Json | null;
          score: number | null;
          max_score: number | null;
          passed: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          practice_attempt_id?: string | null;
          question_id: string;
          question_type: QuestionType;
          answer?: Json | null;
          result?: Json | null;
          score?: number | null;
          max_score?: number | null;
          passed?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          answer?: Json | null;
          result?: Json | null;
          score?: number | null;
          max_score?: number | null;
          passed?: boolean | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      mock_attempts: {
        Row: {
          id: string;
          user_id: string;
          mode: MockMode;
          status: AttemptStatus;
          started_at: string;
          submitted_at: string | null;
          expires_at: string | null;
          duration_seconds: number | null;
          score: number | null;
          max_score: number | null;
          percentage: number | null;
          passed: boolean | null;
          result: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode?: MockMode;
          status?: AttemptStatus;
          started_at?: string;
          submitted_at?: string | null;
          expires_at?: string | null;
          duration_seconds?: number | null;
          score?: number | null;
          max_score?: number | null;
          percentage?: number | null;
          passed?: boolean | null;
          result?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          mode?: MockMode;
          status?: AttemptStatus;
          submitted_at?: string | null;
          expires_at?: string | null;
          duration_seconds?: number | null;
          score?: number | null;
          max_score?: number | null;
          percentage?: number | null;
          passed?: boolean | null;
          result?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      mock_question_attempts: {
        Row: {
          id: string;
          user_id: string;
          mock_attempt_id: string;
          question_id: string;
          question_type: QuestionType;
          question_index: number;
          answer: Json | null;
          result: Json | null;
          score: number | null;
          max_score: number | null;
          passed: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mock_attempt_id: string;
          question_id: string;
          question_type: QuestionType;
          question_index: number;
          answer?: Json | null;
          result?: Json | null;
          score?: number | null;
          max_score?: number | null;
          passed?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          question_index?: number;
          answer?: Json | null;
          result?: Json | null;
          score?: number | null;
          max_score?: number | null;
          passed?: boolean | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      saved_progress: {
        Row: {
          id: string;
          user_id: string;
          summary: Json;
          mistake_state: Json;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          summary?: Json;
          mistake_state?: Json;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          summary?: Json;
          mistake_state?: Json;
          last_synced_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      question_bank_items: {
        Row: {
          id: string;
          question_type: QuestionType;
          status: QuestionStatus;
          difficulty: QuestionDifficulty | null;
          category: string | null;
          prompt: string;
          explanation: string | null;
          tip: string | null;
          tags: string[];
          payload: Json;
          version: number;
          source: string;
          created_by: string | null;
          updated_by: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          question_type: QuestionType;
          status?: QuestionStatus;
          difficulty?: QuestionDifficulty | null;
          category?: string | null;
          prompt: string;
          explanation?: string | null;
          tip?: string | null;
          tags?: string[];
          payload?: Json;
          version?: number;
          source?: string;
          created_by?: string | null;
          updated_by?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          question_type?: QuestionType;
          status?: QuestionStatus;
          difficulty?: QuestionDifficulty | null;
          category?: string | null;
          prompt?: string;
          explanation?: string | null;
          tip?: string | null;
          tags?: string[];
          payload?: Json;
          version?: number;
          source?: string;
          updated_by?: string | null;
          published_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      newsletter_signups: {
        Row: {
          id: string;
          email: string;
          source: string;
          consent_text: string;
          consent_version: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          source?: string;
          consent_text: string;
          consent_version?: string;
          created_at?: string;
        };
        Update: {
          email?: string;
          source?: string;
          consent_text?: string;
          consent_version?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_admin_role: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type PublicTableName = keyof Database["public"]["Tables"];
export type PublicTableRow<TTable extends PublicTableName> =
  Database["public"]["Tables"][TTable]["Row"];
export type PublicTableInsert<TTable extends PublicTableName> =
  Database["public"]["Tables"][TTable]["Insert"];
export type PublicTableUpdate<TTable extends PublicTableName> =
  Database["public"]["Tables"][TTable]["Update"];
