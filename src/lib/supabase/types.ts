/**
 * Supabase Database Type Definitions
 * 
 * This file serves as the type interface for Supabase data operations.
 * When database tables are generated or updated via Supabase CLI,
 * update this contract using: npx supabase gen types typescript
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Future database table definitions will be declared here
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: unknown[];
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: unknown;
    };
    CompositeTypes: {
      [key: string]: unknown;
    };
  };
}
