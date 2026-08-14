"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { createNotificationInternal } from "@/app/notifications/notification-actions";
import { logAuditEvent } from "@/lib/audit/audit-logger";

export interface LeaveRequestRow {
  id: string;
  student_id: string;
  hostel_id: string | null;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  hostel?: {
    id: string;
    name: string;
    code: string;
  } | null;
  reviewer?: {
    full_name: string | null;
    email: string;
  } | null;
}

export interface LeaveActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Submit a student leave request.
 * Enforces start date >= today, end date >= start date, non-empty reason, and RBAC checks.
 */
export async function createLeaveRequestAction({
  startDate,
  endDate,
  reason,
}: {
  startDate: string;
  endDate: string;
  reason: string;
}): Promise<LeaveActionResult<LeaveRequestRow>> {
  const { user, profile } = await getUserRoleAndProfile();

  if (!user || !profile) {
    return { success: false, error: "Authentication required." };
  }

  const cleanedReason = reason?.trim() || "";
  if (cleanedReason.length < 5) {
    return { success: false, error: "Leave reason must be at least 5 characters long." };
  }

  if (!startDate || !endDate) {
    return { success: false, error: "Start date and end date are required." };
  }

  // Date validations
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { success: false, error: "Invalid date format provided." };
  }

  // Ensure start date is not in the past (comparing YYYY-MM-DD string format)
  const todayStr = new Date().toISOString().split("T")[0];
  if (startDate < todayStr) {
    return { success: false, error: "Start date cannot be in the past." };
  }

  if (endDate < startDate) {
    return { success: false, error: "End date must be on or after start date." };
  }

  const supabase = await createServerClient();

  // Find student's active hostel allocation (if any)
  let hostelId: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allocationsTable = (supabase as any).from("allocations");
  const { data: alloc } = await allocationsTable
    .select(`
      id,
      bed:beds!allocations_bed_id_fkey(
        room:rooms!beds_room_id_fkey(
          floor:floors!rooms_floor_id_fkey(hostel_id)
        )
      )
    `)
    .eq("student_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (alloc?.bed?.room?.floor?.hostel_id) {
    hostelId = alloc.bed.room.floor.hostel_id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leaveTable = (supabase as any).from("leave_requests");
  const { data: newLeave, error: insertErr } = await leaveTable
    .insert({
      student_id: user.id,
      hostel_id: hostelId,
      start_date: startDate,
      end_date: endDate,
      reason: cleanedReason,
      status: "pending",
    })
    .select()
    .single();

  if (insertErr || !newLeave) {
    return { success: false, error: insertErr?.message || "Failed to submit leave request." };
  }

  // Notify wardens and admin staff
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profilesTable = (supabase as any).from("profiles");
  const { data: wardens } = await profilesTable
    .select("id")
    .in("role", ["admin", "warden", "staff"]);

  if (wardens && Array.isArray(wardens)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pAny = profile as any;
    const studentName = pAny.full_name || profile.email.split("@")[0];
    for (const w of wardens) {
      if (w.id !== user.id) {
        await createNotificationInternal({
          userId: w.id,
          title: "📋 New Leave Request Submitted",
          message: `Student '${studentName}' requested leave from ${startDate} to ${endDate}.`,
          type: "leave_requested",
          actorUserId: user.id,
        });
      }
    }
  }

  revalidatePath("/leave");
  return { success: true, data: newLeave as LeaveRequestRow };
}

/**
 * Server Action: Retrieve leave requests filtered by user role.
 * Students see their own applications; Wardens see hostel applications.
 */
export async function getLeaveRequestsAction(
  filterStatus?: string
): Promise<LeaveActionResult<LeaveRequestRow[]>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leaveTable = (supabase as any).from("leave_requests");

  let query = leaveTable
    .select(`
      id,
      student_id,
      hostel_id,
      start_date,
      end_date,
      reason,
      status,
      reviewed_by,
      reviewed_at,
      reviewer_notes,
      created_at,
      updated_at,
      student:profiles!leave_requests_student_id_fkey(id, full_name, email),
      hostel:hostels!leave_requests_hostel_id_fkey(id, name, code),
      reviewer:profiles!leave_requests_reviewed_by_fkey(full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (role === "student") {
    query = query.eq("student_id", user.id);
  }

  if (filterStatus && filterStatus !== "all") {
    query = query.eq("status", filterStatus);
  }

  const { data: list, error: fetchErr } = await query;

  if (fetchErr) {
    return { success: false, error: fetchErr.message };
  }

  return { success: true, data: (list || []) as LeaveRequestRow[] };
}

/**
 * Server Action: Warden review decision (Approve or Reject leave request).
 */
export async function reviewLeaveRequestAction({
  requestId,
  decision,
  reviewerNotes,
}: {
  requestId: string;
  decision: "approved" | "rejected";
  reviewerNotes?: string;
}): Promise<LeaveActionResult<null>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!["admin", "warden", "staff"].includes(role || "")) {
    return { success: false, error: "Access Restricted: Warden privileges required." };
  }

  if (!requestId) {
    return { success: false, error: "Request ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leaveTable = (supabase as any).from("leave_requests");

  const { data: existing } = await leaveTable
    .select("id, student_id, start_date, end_date, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!existing) {
    return { success: false, error: "Leave request not found." };
  }

  const { error: updateErr } = await leaveTable
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  // Notify student of decision
  const isApproved = decision === "approved";
  await createNotificationInternal({
    userId: existing.student_id,
    title: isApproved ? "✅ Leave Request Approved" : "❌ Leave Request Rejected",
    message: `Your leave request from ${existing.start_date} to ${existing.end_date} has been ${decision.toUpperCase()} by warden.`,
    type: "leave_decision",
    actorUserId: user.id,
  });

  // Log Audit Event
  await logAuditEvent({
    actorId: user.id,
    action: "leave.reviewed",
    targetType: "leave_request",
    targetId: requestId,
    metadata: {
      decision,
      student_id: existing.student_id,
      start_date: existing.start_date,
      end_date: existing.end_date,
      notes: reviewerNotes?.trim() || null,
    },
  });

  revalidatePath("/leave");
  return { success: true, data: null };
}

/**
 * Server Action: Allows student to cancel a pending leave request.
 */
export async function cancelLeaveRequestAction(
  requestId: string
): Promise<LeaveActionResult<null>> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!requestId) {
    return { success: false, error: "Request ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leaveTable = (supabase as any).from("leave_requests");

  const { data: existing } = await leaveTable
    .select("id, student_id, status")
    .eq("id", requestId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (!existing) {
    return { success: false, error: "Leave request not found." };
  }

  if (existing.status !== "pending") {
    return { success: false, error: "Only pending leave requests can be cancelled." };
  }

  await leaveTable
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  revalidatePath("/leave");
  return { success: true, data: null };
}
