export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type QuestionType = "knowledge" | "map-click" | "route-drawing";
export type QuestionDifficulty = "easy" | "medium" | "hard";
export type QuestionStatus = "draft" | "active" | "archived";
export type AttemptStatus = "in_progress" | "submitted" | "abandoned" | "expired";
export type PracticeMode = "knowledge" | "map-click" | "route-drawing" | "mixed";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: "learner" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: "learner" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          role?: "learner" | "admin";
          updated_at?: string;
        };
      };
      question_banks: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: QuestionStatus;
          version: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          status?: QuestionStatus;
          version?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          status?: QuestionStatus;
          version?: number;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          bank_id: string | null;
          question_type: QuestionType;
          status: QuestionStatus;
          difficulty: QuestionDifficulty | null;
          category: string | null;
          prompt: string;
          explanation: string | null;
          tags: string[];
          payload: Json;
          source_note: string | null;
          created_by: string | null;
          reviewed_by: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          bank_id?: string | null;
          question_type: QuestionType;
          status?: QuestionStatus;
          difficulty?: QuestionDifficulty | null;
          category?: string | null;
          prompt: string;
          explanation?: string | null;
          tags?: string[];
          payload: Json;
          source_note?: string | null;
          created_by?: string | null;
          reviewed_by?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          bank_id?: string | null;
          question_type?: QuestionType;
          status?: QuestionStatus;
          difficulty?: QuestionDifficulty | null;
          category?: string | null;
          prompt?: string;
          explanation?: string | null;
          tags?: string[];
          payload?: Json;
          source_note?: string | null;
          reviewed_by?: string | null;
          published_at?: string | null;
          updated_at?: string;
        };
      };
      mock_test_attempts: {
        Row: {
          id: string;
          user_id: string;
          status: AttemptStatus;
          question_ids: string[];
          started_at: string;
          submitted_at: string | null;
          expires_at: string | null;
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
          status?: AttemptStatus;
          question_ids?: string[];
          started_at?: string;
          submitted_at?: string | null;
          expires_at?: string | null;
          score?: number | null;
          max_score?: number | null;
          percentage?: number | null;
          passed?: boolean | null;
          result?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: AttemptStatus;
          question_ids?: string[];
          submitted_at?: string | null;
          expires_at?: string | null;
          score?: number | null;
          max_score?: number | null;
          percentage?: number | null;
          passed?: boolean | null;
          result?: Json | null;
          updated_at?: string;
        };
      };
      mock_test_answers: {
        Row: {
          id: string;
          attempt_id: string;
          user_id: string;
          question_id: string;
          question_type: QuestionType;
          answer: Json;
          score: number | null;
          max_score: number | null;
          passed: boolean | null;
          details: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          user_id: string;
          question_id: string;
          question_type: QuestionType;
          answer: Json;
          score?: number | null;
          max_score?: number | null;
          passed?: boolean | null;
          details?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          answer?: Json;
          score?: number | null;
          max_score?: number | null;
          passed?: boolean | null;
          details?: Json | null;
          updated_at?: string;
        };
      };
      practice_attempts: {
        Row: {
          id: string;
          user_id: string;
          practice_mode: PracticeMode;
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
          practice_mode: PracticeMode;
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
      };
      scoring_results: {
        Row: {
          id: string;
          user_id: string;
          source_type: "mock-test" | "practice";
          source_id: string;
          score: number;
          max_score: number;
          percentage: number;
          passed: boolean;
          breakdown: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_type: "mock-test" | "practice";
          source_id: string;
          score: number;
          max_score: number;
          percentage: number;
          passed: boolean;
          breakdown?: Json | null;
          created_at?: string;
        };
        Update: {
          score?: number;
          max_score?: number;
          percentage?: number;
          passed?: boolean;
          breakdown?: Json | null;
        };
      };
      admin_question_drafts: {
        Row: {
          id: string;
          question_type: QuestionType;
          status: QuestionStatus;
          draft_payload: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_type: QuestionType;
          status?: QuestionStatus;
          draft_payload: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: QuestionStatus;
          draft_payload?: Json;
          updated_at?: string;
        };
      };
    };
  };
};

export type TableName = keyof Database["public"]["Tables"];
export type TableRow<TTable extends TableName> =
  Database["public"]["Tables"][TTable]["Row"];
export type TableInsert<TTable extends TableName> =
  Database["public"]["Tables"][TTable]["Insert"];
export type TableUpdate<TTable extends TableName> =
  Database["public"]["Tables"][TTable]["Update"];
