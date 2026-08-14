import { createServerClient } from "@/lib/supabase/server";

export interface LogAuditParams {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Server Utility: Inserts an append-only audit event into public.audit_logs.
 * Safely handles errors without crashing caller workflows.
 */
export async function logAuditEvent({
  actorId,
  action,
  targetType,
  targetId = null,
  metadata = {},
}: LogAuditParams): Promise<boolean> {
  if (!actorId || !action || !targetType) {
    return false;
  }

  try {
    const supabase = await createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auditTable = (supabase as any).from("audit_logs");

    const { error } = await auditTable.insert({
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata,
    });

    if (error) {
      console.error("[AuditLogger Error]:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[AuditLogger Exception]:", err);
    return false;
  }
}
