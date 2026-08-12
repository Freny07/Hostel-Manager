"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { hasPermissionInRole } from "@/lib/rbac/permissions";
import type { Database } from "@/lib/supabase/types";

export type AllocationRow = Database["public"]["Tables"]["room_allocations"]["Row"];

export interface DetailedAllocation extends AllocationRow {
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    roll_number: string | null;
    phone: string | null;
  } | null;
  bed?: {
    id: string;
    bed_label: string;
    status: string;
    room?: {
      id: string;
      room_number: string;
      room_type: string;
      floor?: {
        id: string;
        floor_number: number;
        name: string | null;
        hostel?: {
          id: string;
          name: string;
          code: string;
        } | null;
      } | null;
    } | null;
  } | null;
  allocator?: {
    first_name: string;
    last_name: string;
  } | null;
}

export interface AvailableBedOption {
  id: string;
  bed_label: string;
  room_number: string;
  room_type: string;
  floor_number: number;
  floor_name: string | null;
  hostel_name: string;
  hostel_code: string;
}

export interface UnassignedStudentOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  roll_number: string | null;
}

export interface AllocationActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Fetch room allocations with full relational context
 */
export async function getAllocationsAction(
  statusFilter?: string
): Promise<AllocationActionResult<DetailedAllocation[]>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role) {
    return {
      success: false,
      error: "Unauthorized: User authentication required.",
    };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allocationsTable = (supabase as any).from("room_allocations");

  let query = allocationsTable.select(`
    *,
    student:profiles!room_allocations_student_id_fkey (id, first_name, last_name, email, roll_number, phone),
    allocator:profiles!room_allocations_allocated_by_fkey (first_name, last_name),
    bed:beds!room_allocations_bed_id_fkey (
      id,
      bed_label,
      status,
      room:rooms!beds_room_id_fkey (
        id,
        room_number,
        room_type,
        floor:floors!rooms_floor_id_fkey (
          id,
          floor_number,
          name,
          hostel:hostels!floors_hostel_id_fkey (
            id,
            name,
            code
          )
        )
      )
    )
  `);

  if (role === "student") {
    // RLS / Student scope: restrict to own allocations only
    query = query.eq("student_id", user.id);
  }

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data: rawAllocations, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return {
      success: false,
      error: `Failed to fetch allocations: ${error.message}`,
    };
  }

  return {
    success: true,
    data: (rawAllocations || []) as DetailedAllocation[],
  };
}

/**
 * Server Action: Fetch unassigned student profiles
 */
export async function getUnassignedStudentsAction(): Promise<
  AllocationActionResult<UnassignedStudentOption[]>
> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "allocations:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges required.",
    };
  }

  const supabase = await createServerClient();

  // 1. Get student role id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rolesTable = (supabase as any).from("roles");
  const { data: studentRole } = await rolesTable.select("id").eq("name", "student").maybeSingle();

  // 2. Fetch active allocations to exclude currently assigned student IDs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allocationsTable = (supabase as any).from("room_allocations");
  const { data: activeAllocations } = await allocationsTable
    .select("student_id")
    .eq("status", "active");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignedStudentIds = new Set((activeAllocations || []).map((a: any) => a.student_id));

  // 3. Query profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profilesTable = (supabase as any).from("profiles");
  let studentQuery = profilesTable.select("id, first_name, last_name, email, roll_number");

  if (studentRole?.id) {
    studentQuery = studentQuery.eq("role_id", studentRole.id);
  }

  const { data: rawStudents, error } = await studentQuery.order("first_name", { ascending: true });

  if (error) {
    return {
      success: false,
      error: `Failed to fetch students: ${error.message}`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unassignedStudents = (rawStudents || []).filter((s: any) => !assignedStudentIds.has(s.id));

  return {
    success: true,
    data: unassignedStudents as UnassignedStudentOption[],
  };
}

/**
 * Server Action: Fetch available beds for allocation
 */
export async function getAvailableBedsAction(): Promise<
  AllocationActionResult<AvailableBedOption[]>
> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "allocations:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges required.",
    };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bedsTable = (supabase as any).from("beds");

  const { data: rawBeds, error } = await bedsTable
    .select(`
      id,
      bed_label,
      status,
      room:rooms!beds_room_id_fkey (
        room_number,
        room_type,
        floor:floors!rooms_floor_id_fkey (
          floor_number,
          name,
          hostel:hostels!floors_hostel_id_fkey (
            name,
            code
          )
        )
      )
    `)
    .eq("status", "available")
    .order("bed_label", { ascending: true });

  if (error) {
    return {
      success: false,
      error: `Failed to fetch available beds: ${error.message}`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const availableBeds: AvailableBedOption[] = (rawBeds || []).map((b: any) => ({
    id: b.id,
    bed_label: b.bed_label,
    room_number: b.room?.room_number || "N/A",
    room_type: b.room?.room_type || "standard",
    floor_number: b.room?.floor?.floor_number ?? 0,
    floor_name: b.room?.floor?.name || null,
    hostel_name: b.room?.floor?.hostel?.name || "Unknown Hostel",
    hostel_code: b.room?.floor?.hostel?.code || "N/A",
  }));

  return {
    success: true,
    data: availableBeds,
  };
}

/**
 * Server Action: Create a new room/bed allocation for a student (Admin/Warden only)
 */
export async function createAllocationAction(
  studentId: string,
  bedId: string,
  notes?: string
): Promise<AllocationActionResult<AllocationRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "allocations:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to assign beds.",
    };
  }

  if (!studentId || !bedId) {
    return { success: false, error: "Both student and bed selection are required." };
  }

  const supabase = await createServerClient();

  // Safety Check 1: Ensure student does NOT already have an active allocation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allocationsTable = (supabase as any).from("room_allocations");
  const { data: existingStudentAlloc } = await allocationsTable
    .select("id")
    .eq("student_id", studentId)
    .eq("status", "active")
    .maybeSingle();

  if (existingStudentAlloc) {
    return {
      success: false,
      error: "Conflict: This student already has an active room allocation. Change or terminate their existing allocation first.",
    };
  }

  // Safety Check 2: Ensure target bed is available and NOT occupied or allocated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bedsTable = (supabase as any).from("beds");
  const { data: targetBed, error: bedErr } = await bedsTable
    .select("id, bed_label, status")
    .eq("id", bedId)
    .single();

  if (bedErr || !targetBed) {
    return { success: false, error: "Target bed record was not found." };
  }

  if (targetBed.status !== "available") {
    return {
      success: false,
      error: `Conflict: Bed '${targetBed.bed_label}' is currently marked as ${targetBed.status} and cannot be assigned.`,
    };
  }

  const { data: existingBedAlloc } = await allocationsTable
    .select("id")
    .eq("bed_id", bedId)
    .eq("status", "active")
    .maybeSingle();

  if (existingBedAlloc) {
    return {
      success: false,
      error: `Conflict: Bed '${targetBed.bed_label}' already has an active resident allocation.`,
    };
  }

  // Insert allocation record
  const todayIso = new Date().toISOString().split("T")[0];
  const { data: newAllocation, error: insertErr } = await allocationsTable
    .insert({
      student_id: studentId,
      bed_id: bedId,
      start_date: todayIso,
      status: "active",
      allocated_by: user.id,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (insertErr) {
    return {
      success: false,
      error: `Database error: ${insertErr.message || "Failed to create allocation record."}`,
    };
  }

  // Update target bed status to 'occupied'
  await bedsTable.update({ status: "occupied" }).eq("id", bedId);

  revalidatePath("/allocations");
  revalidatePath("/hostels");
  return {
    success: true,
    data: newAllocation as AllocationRow,
  };
}

/**
 * Server Action: Change a student's bed allocation (Admin/Warden only)
 */
export async function changeAllocationAction(
  allocationId: string,
  newBedId: string,
  notes?: string
): Promise<AllocationActionResult<AllocationRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "allocations:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to change allocations.",
    };
  }

  if (!allocationId || !newBedId) {
    return { success: false, error: "Allocation ID and new bed selection are required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allocationsTable = (supabase as any).from("room_allocations");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bedsTable = (supabase as any).from("beds");

  // Fetch target allocation
  const { data: currentAlloc, error: allocErr } = await allocationsTable
    .select("id, student_id, bed_id, status")
    .eq("id", allocationId)
    .single();

  if (allocErr || !currentAlloc || currentAlloc.status !== "active") {
    return {
      success: false,
      error: "Target allocation record not found or is no longer active.",
    };
  }

  // Check new bed availability
  const { data: newBed, error: newBedErr } = await bedsTable
    .select("id, bed_label, status")
    .eq("id", newBedId)
    .single();

  if (newBedErr || !newBed || newBed.status !== "available") {
    return {
      success: false,
      error: "The selected replacement bed is not available.",
    };
  }

  const todayIso = new Date().toISOString().split("T")[0];

  // 1. Mark previous allocation as 'transferred'
  await allocationsTable
    .update({
      status: "transferred",
      end_date: todayIso,
      notes: notes ? `Transferred: ${notes.trim()}` : "Transferred to another bed",
    })
    .eq("id", allocationId);

  // 2. Free old bed
  await bedsTable.update({ status: "available" }).eq("id", currentAlloc.bed_id);

  // 3. Create new active allocation for student
  const { data: newAlloc, error: newAllocErr } = await allocationsTable
    .insert({
      student_id: currentAlloc.student_id,
      bed_id: newBedId,
      start_date: todayIso,
      status: "active",
      allocated_by: user.id,
      notes: notes?.trim() || null,
    })
    .select()
    .single();

  if (newAllocErr) {
    return {
      success: false,
      error: `Failed to create new allocation record: ${newAllocErr.message}`,
    };
  }

  // 4. Mark new bed as 'occupied'
  await bedsTable.update({ status: "occupied" }).eq("id", newBedId);

  revalidatePath("/allocations");
  revalidatePath("/hostels");
  return {
    success: true,
    data: newAlloc as AllocationRow,
  };
}

/**
 * Server Action: Remove / Terminate an allocation (Admin/Warden only)
 */
export async function removeAllocationAction(
  allocationId: string,
  reason: "cancelled" | "completed",
  notes?: string
): Promise<AllocationActionResult> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "allocations:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to end allocations.",
    };
  }

  if (!allocationId) {
    return { success: false, error: "Allocation ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allocationsTable = (supabase as any).from("room_allocations");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bedsTable = (supabase as any).from("beds");

  const { data: currentAlloc, error: allocErr } = await allocationsTable
    .select("id, bed_id, status")
    .eq("id", allocationId)
    .single();

  if (allocErr || !currentAlloc) {
    return { success: false, error: "Allocation record not found." };
  }

  const todayIso = new Date().toISOString().split("T")[0];

  // 1. Update allocation record
  const { error: updateErr } = await allocationsTable
    .update({
      status: reason,
      end_date: todayIso,
      notes: notes?.trim() || null,
    })
    .eq("id", allocationId);

  if (updateErr) {
    return {
      success: false,
      error: `Failed to update allocation record: ${updateErr.message}`,
    };
  }

  // 2. Free associated bed
  if (currentAlloc.bed_id) {
    await bedsTable.update({ status: "available" }).eq("id", currentAlloc.bed_id);
  }

  revalidatePath("/allocations");
  revalidatePath("/hostels");
  return { success: true };
}
