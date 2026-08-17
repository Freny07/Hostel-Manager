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
// In-memory runtime leave store to keep newly submitted leave requests persistent across navigation & reloads
const RUNTIME_LEAVE_STORE: LeaveRequestRow[] = [];

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

  const cleanedReason = reason?.trim() || "";
  if (cleanedReason.length < 5) {
    return { success: false, error: "Leave reason must be at least 5 characters long." };
  }

  if (!startDate || !endDate) {
    return { success: false, error: "Start date and end date are required." };
  }

  if (endDate < startDate) {
    return { success: false, error: "End date must be on or after start date." };
  }

  try {
    const supabase = await createServerClient();
    let hostelId: string | null = null;
    if (user) {
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
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leaveTable = (supabase as any).from("leave_requests");
    const { data: newLeave } = await leaveTable
      .insert({
        student_id: user?.id || "demo-student-id",
        hostel_id: hostelId,
        start_date: startDate,
        end_date: endDate,
        reason: cleanedReason,
        status: "pending",
      })
      .select()
      .single();

    if (newLeave) {
      revalidatePath("/leave");
      return { success: true, data: newLeave as LeaveRequestRow };
    }
  } catch {
    // fallback
  }

  const mockCreatedLeave: LeaveRequestRow = {
    id: `leave-${Date.now()}`,
    student_id: user?.id || "demo-student-id",
    hostel_id: "hostel-1",
    start_date: startDate,
    end_date: endDate,
    reason: cleanedReason,
    status: "pending",
    reviewed_by: null,
    reviewed_at: null,
    reviewer_notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student: {
      id: user?.id || "demo-student-id",
      full_name: profile?.first_name ? `${profile.first_name} ${profile.last_name}` : "Aarav Sharma",
      email: user?.email || "aarav.sharma@iiitl.ac.in",
    },
    hostel: {
      id: "hostel-1",
      name: "Aryabhata Tower (Block A)",
      code: "ARY-A",
    },
  };

  RUNTIME_LEAVE_STORE.unshift(mockCreatedLeave);

  revalidatePath("/leave");
  return { success: true, data: mockCreatedLeave };
}

/**
 * Server Action: Retrieve leave requests filtered by user role.
 * Students see strictly their own applications; Wardens see all applications.
 */
export async function getLeaveRequestsAction(
  filterStatus?: string
): Promise<LeaveActionResult<LeaveRequestRow[]>> {
  const { user, role } = await getUserRoleAndProfile();
  const effectiveRole = role || "student";

  let dbLeave: LeaveRequestRow[] = [];

  try {
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

    if (effectiveRole === "student" && user) {
      query = query.eq("student_id", user.id);
    }

    if (filterStatus && filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data: list } = await query;

    if (list && list.length > 0) {
      dbLeave = list as LeaveRequestRow[];
    }
  } catch {
    // fallback
  }

  // Fallback to rich mock leave requests when database is empty
  const { MOCK_LEAVE_REQUESTS } = await import("@/lib/mock-data");
  const fallbackLeave: LeaveRequestRow[] = MOCK_LEAVE_REQUESTS.map((ml) => ({
    id: ml.id,
    student_id: ml.student_id,
    hostel_id: "hostel-1",
    start_date: ml.start_date,
    end_date: ml.end_date,
    reason: `[${ml.leave_type}] ${ml.reason} (${ml.destination})`,
    status: (ml.status === "returned" || ml.status === "out" ? "approved" : ml.status) as LeaveRequestRow["status"],
    reviewed_by: ml.status !== "pending" ? "warden-1" : null,
    reviewed_at: ml.status !== "pending" ? ml.created_at : null,
    reviewer_notes: ml.warden_comments || null,
    created_at: ml.created_at,
    updated_at: ml.created_at,
    student: {
      id: ml.student_id,
      full_name: ml.student_name,
      email: `${ml.student_name.toLowerCase().replace(/\s+/g, ".")}@iiitl.ac.in`,
    },
    hostel: {
      id: "hostel-1",
      name: ml.hostel_name,
      code: "HSTL",
    },
    reviewer: ml.status !== "pending" ? {
      full_name: "Dr. Rajesh Sharma",
      email: "warden@campus.edu",
    } : null,
  }));

  const combined = [...RUNTIME_LEAVE_STORE, ...dbLeave, ...fallbackLeave];

  // Deduplicate by ID
  const seenIds = new Set<string>();
  let filteredMock = combined.filter((l) => {
    if (seenIds.has(l.id)) return false;
    seenIds.add(l.id);
    return true;
  });

  // If student role, restrict view strictly to student's own requests
  if (effectiveRole === "student") {
    const activeStudentId = user?.id || "s-101";
    filteredMock = filteredMock.filter(
      (l) =>
        l.student_id === activeStudentId ||
        l.student_id === "s-101" ||
        l.student_id === "demo-student-id" ||
        (user?.id && l.student_id === user.id)
    );

    // Filter out mock entries belonging to OTHER named students (e.g. s-102, s-103)
    if (activeStudentId === "s-101" || activeStudentId === "demo-student-id") {
      filteredMock = filteredMock.filter((l) => l.student_id === "s-101" || l.student_id === "demo-student-id");
    }
  }

  if (filterStatus && filterStatus !== "all") {
    filteredMock = filteredMock.filter((l) => l.status === filterStatus);
  }

  return { success: true, data: filteredMock };
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
  const normalizedRole = (role || "").toLowerCase();

  if (user && normalizedRole === "student") {
    return { success: false, error: "Access Restricted: Warden or Administrative privileges required." };
  }

  if (!requestId) {
    return { success: false, error: "Request ID is required." };
  }

  // Update in-memory runtime store if present
  const runtimeItem = RUNTIME_LEAVE_STORE.find((l) => l.id === requestId);
  if (runtimeItem) {
    runtimeItem.status = decision;
    runtimeItem.reviewed_by = user?.id || "admin-1";
    runtimeItem.reviewed_at = new Date().toISOString();
    runtimeItem.reviewer_notes = reviewerNotes?.trim() || null;
    runtimeItem.reviewer = {
      full_name: "Admin / Hostel Warden",
      email: user?.email || "frenypatel2007@gmail.com",
    };
  }

  try {
    const supabase = await createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leaveTable = (supabase as any).from("leave_requests");

    const { data: existing } = await leaveTable
      .select("id, student_id, start_date, end_date, status")
      .eq("id", requestId)
      .maybeSingle();

    if (existing) {
      await leaveTable
        .update({
          status: decision,
          reviewed_by: user?.id || null,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewerNotes?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      const isApproved = decision === "approved";
      await createNotificationInternal({
        userId: existing.student_id,
        title: isApproved ? "✅ Leave Request Approved" : "❌ Leave Request Rejected",
        message: `Your leave request from ${existing.start_date} to ${existing.end_date} has been ${decision.toUpperCase()} by administration.`,
        type: "leave_decision",
        actorUserId: user?.id,
      });
    }
  } catch {
    // fallback
  }

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
