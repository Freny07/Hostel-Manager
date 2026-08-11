/**
 * Supabase Database Type Definitions
 * 
 * Foundational schema definition for Hostel-Manager:
 * - roles
 * - profiles
 * - hostels
 * - floors
 * - rooms
 * - beds
 * - room_allocations
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
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          role_id: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          roll_number: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role_id?: string | null;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          roll_number?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role_id?: string | null;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          roll_number?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey";
            columns: ["role_id"];
            referencedRelation: "roles";
            referencedColumns: ["id"];
          }
        ];
      };
      hostels: {
        Row: {
          id: string;
          name: string;
          code: string;
          gender_type: "male" | "female" | "co-ed";
          address: string | null;
          total_floors: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          gender_type?: "male" | "female" | "co-ed";
          address?: string | null;
          total_floors?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          gender_type?: "male" | "female" | "co-ed";
          address?: string | null;
          total_floors?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      floors: {
        Row: {
          id: string;
          hostel_id: string;
          floor_number: number;
          name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hostel_id: string;
          floor_number: number;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hostel_id?: string;
          floor_number?: number;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "floors_hostel_id_fkey";
            columns: ["hostel_id"];
            referencedRelation: "hostels";
            referencedColumns: ["id"];
          }
        ];
      };
      rooms: {
        Row: {
          id: string;
          floor_id: string;
          room_number: string;
          room_type: "single" | "double" | "triple" | "dormitory";
          capacity: number;
          status: "available" | "occupied" | "full" | "under_maintenance" | "inactive";
          monthly_rent: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          floor_id: string;
          room_number: string;
          room_type?: "single" | "double" | "triple" | "dormitory";
          capacity?: number;
          status?: "available" | "occupied" | "full" | "under_maintenance" | "inactive";
          monthly_rent?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          floor_id?: string;
          room_number?: string;
          room_type?: "single" | "double" | "triple" | "dormitory";
          capacity?: number;
          status?: "available" | "occupied" | "full" | "under_maintenance" | "inactive";
          monthly_rent?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_floor_id_fkey";
            columns: ["floor_id"];
            referencedRelation: "floors";
            referencedColumns: ["id"];
          }
        ];
      };
      beds: {
        Row: {
          id: string;
          room_id: string;
          bed_label: string;
          status: "available" | "occupied" | "reserved" | "under_maintenance";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          bed_label: string;
          status?: "available" | "occupied" | "reserved" | "under_maintenance";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          bed_label?: string;
          status?: "available" | "occupied" | "reserved" | "under_maintenance";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "beds_room_id_fkey";
            columns: ["room_id"];
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          }
        ];
      };
      room_allocations: {
        Row: {
          id: string;
          student_id: string;
          bed_id: string;
          start_date: string;
          end_date: string | null;
          status: "active" | "cancelled" | "completed" | "transferred";
          allocated_by: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          bed_id: string;
          start_date?: string;
          end_date?: string | null;
          status?: "active" | "cancelled" | "completed" | "transferred";
          allocated_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          bed_id?: string;
          start_date?: string;
          end_date?: string | null;
          status?: "active" | "cancelled" | "completed" | "transferred";
          allocated_by?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_allocations_student_id_fkey";
            columns: ["student_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_allocations_bed_id_fkey";
            columns: ["bed_id"];
            referencedRelation: "beds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_allocations_allocated_by_fkey";
            columns: ["allocated_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
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
