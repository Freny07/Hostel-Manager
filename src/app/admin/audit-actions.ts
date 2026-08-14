"use server";

import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";

export interface AuditLogRow {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: {
    full_name: string | null;
    email: string;
    role: string;
  } | null;
}

export interface AuditActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Admin-only retrieval of audit logs.
 */
export async function getAuditLogsAction(
  actionFilter?: string
): Promise<AuditActionResult<AuditLogRow[]>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (role !== "admin") {
    return { success: false, error: "Access Restricted: Admin privileges required to view audit logs." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auditTable = (supabase as any).from("audit_logs");

  let query = auditTable
    .select(`
      id,
      actor_id,
      action,
      target_type,
      target_id,
      metadata,
      created_at,
      actor:profiles!audit_logs_actor_id_fkey(full_name, email, role)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (actionFilter && actionFilter !== "all") {
    query = query.eq("action", actionFilter);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: (data || []) as AuditLogRow[] };
}
