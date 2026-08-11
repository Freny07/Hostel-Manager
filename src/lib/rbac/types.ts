import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type AppRole = "admin" | "warden" | "maintenance" | "staff" | "student";

export type AppPermission =
  // Profile permissions
  | "profile:read"
  | "profile:write_own"
  // Hostel & Room management permissions
  | "hostels:read"
  | "hostels:manage"
  | "rooms:read"
  | "rooms:manage"
  // Room allocation permissions
  | "allocations:read_own"
  | "allocations:manage"
  // Gate pass permissions
  | "gatepass:create"
  | "gatepass:read_own"
  | "gatepass:manage"
  // Maintenance & Ticket permissions
  | "tickets:create"
  | "tickets:read_own"
  | "tickets:read_assigned"
  | "tickets:update_assigned"
  | "tickets:manage"
  // Administrative master permission
  | "admin:all";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"] & {
  roles?: {
    name: string;
  } | null;
};

export interface AuthorizationResult {
  authorized: boolean;
  role: AppRole | null;
  user: User | null;
  profile: ProfileRow | null;
  reason?: string;
}
