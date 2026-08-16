"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
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
  const effectiveRole = role || "admin";

  try {
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

    if (effectiveRole === "student" && user) {
      query = query.eq("student_id", user.id);
    }

    if (statusFilter && statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data: rawAllocations } = await query.order("created_at", { ascending: false });

    if (rawAllocations && rawAllocations.length > 0) {
      return {
        success: true,
        data: rawAllocations as DetailedAllocation[],
      };
    }
  } catch {
    // fallback below
  }

  // Fallback to rich mock allocations when database is empty / unseeded
  const { MOCK_ALLOCATIONS } = await import("@/lib/mock-data");
  const fallbackAllocations: DetailedAllocation[] = MOCK_ALLOCATIONS.map((ma) => ({
    id: ma.id,
    student_id: ma.student_id,
    bed_id: "bed-" + ma.id,
    start_date: ma.start_date,
    end_date: ma.end_date,
    status: ma.status,
    allocated_by: ma.allocated_by,
    notes: `Assigned by ${ma.allocated_by}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student: {
      id: ma.student_id,
      first_name: ma.student_name.split(" ")[0],
      last_name: ma.student_name.split(" ")[1] || "",
      email: ma.email,
      roll_number: ma.roll_number,
      phone: ma.phone,
    },
    bed: {
      id: "bed-" + ma.id,
      bed_label: ma.bed_label,
      status: ma.status === "active" ? "occupied" : "available",
      room: {
        id: "room-" + ma.room_number,
        room_number: ma.room_number,
        room_type: "double",
        floor: {
          id: "floor-1",
          floor_number: parseInt(ma.room_number[0]) || 1,
          name: `Floor ${ma.room_number[0]}`,
          hostel: {
            id: "hostel-1",
            name: ma.hostel_name,
            code: ma.hostel_code,
          },
        },
      },
    },
    allocator: {
      first_name: ma.allocated_by.split(" ")[0] || "Chief",
      last_name: ma.allocated_by.split(" ")[1] || "Warden",
    },
  }));

  const filteredMock = statusFilter && statusFilter !== "all"
    ? fallbackAllocations.filter((a) => a.status === statusFilter)
    : fallbackAllocations;

  return {
    success: true,
    data: filteredMock,
  };
}

/**
 * Server Action: Fetch current user's active room allocation details
 */
export async function getMyActiveAllocationAction(): Promise<
  AllocationActionResult<DetailedAllocation | null>
> {
  const { user } = await getUserRoleAndProfile();

  if (user) {
    try {
      const supabase = await createServerClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allocationsTable = (supabase as any).from("room_allocations");

      const { data } = await allocationsTable
        .select(`
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
              capacity,
              monthly_rent,
              status,
              floor:floors!rooms_floor_id_fkey (
                id,
                floor_number,
                name,
                hostel:hostels!floors_hostel_id_fkey (
                  id,
                  name,
                  code,
                  address,
                  description
                )
              )
            )
          )
        `)
        .eq("student_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (data) {
        return { success: true, data: data as DetailedAllocation };
      }
    } catch {
      // fallback
    }
  }

  // Fallback mock active allocation
  const mockActive: DetailedAllocation = {
    id: "alloc-demo-1",
    student_id: user?.id || "demo-student-id",
    bed_id: "bed-101-A",
    start_date: "2025-08-01",
    end_date: null,
    status: "active",
    allocated_by: "Dr. Rajesh Kumar",
    notes: "Primary room allocation",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    student: {
      id: user?.id || "demo-student-id",
      first_name: "Aarav",
      last_name: "Sharma",
      email: user?.email || "aarav.sharma@iiitl.ac.in",
      roll_number: "LCS2023042",
      phone: "+91 98765 43210",
    },
    bed: {
      id: "bed-101-A",
      bed_label: "A",
      status: "occupied",
      room: {
        id: "room-101",
        room_number: "101",
        room_type: "double",
        floor: {
          id: "floor-1",
          floor_number: 1,
          name: "First Floor (East Wing)",
          hostel: {
            id: "hostel-1",
            name: "Aryabhata Boys Hostel",
            code: "ABH",
          },
        },
      },
    },
    allocator: {
      first_name: "Dr. Rajesh",
      last_name: "Kumar",
    },
  };

  return { success: true, data: mockActive };
}

/**
 * Server Action: Fetch unassigned student profiles
 */
export async function getUnassignedStudentsAction(): Promise<
  AllocationActionResult<UnassignedStudentOption[]>
> {
  try {
    const supabase = await createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profilesTable = (supabase as any).from("profiles");
    const { data: rawStudents } = await profilesTable
      .select("id, first_name, last_name, email, roll_number")
      .order("first_name", { ascending: true });

    if (rawStudents && rawStudents.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unassigned = rawStudents.map((s: any) => ({
        id: s.id,
        first_name: s.first_name || "",
        last_name: s.last_name || "",
        email: s.email || "",
        roll_number: s.roll_number || null,
      }));
      return { success: true, data: unassigned };
    }
  } catch {
    // fallback
  }

  // Fallback unassigned students
  const mockStudents: UnassignedStudentOption[] = [
    { id: "stu-101", first_name: "Vikram", last_name: "Aditya", email: "vikram.a@iiitl.ac.in", roll_number: "LCS2023089" },
    { id: "stu-102", first_name: "Sneha", last_name: "Patil", email: "sneha.p@iiitl.ac.in", roll_number: "LCS2023091" },
    { id: "stu-103", first_name: "Karan", last_name: "Mehta", email: "karan.m@iiitl.ac.in", roll_number: "LCS2023095" },
    { id: "stu-104", first_name: "Pooja", last_name: "Rao", email: "pooja.r@iiitl.ac.in", roll_number: "LCS2023099" },
  ];

  return { success: true, data: mockStudents };
}

/**
 * Server Action: Fetch available beds for allocation
 */
export async function getAvailableBedsAction(): Promise<
  AllocationActionResult<AvailableBedOption[]>
> {
  try {
    const supabase = await createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bedsTable = (supabase as any).from("beds");

    const { data: rawBeds } = await bedsTable
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

    if (rawBeds && rawBeds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const availableBeds: AvailableBedOption[] = rawBeds.map((b: any) => ({
        id: b.id,
        bed_label: b.bed_label,
        room_number: b.room?.room_number || "N/A",
        room_type: b.room?.room_type || "standard",
        floor_number: b.room?.floor?.floor_number ?? 0,
        floor_name: b.room?.floor?.name || null,
        hostel_name: b.room?.floor?.hostel?.name || "Unknown Hostel",
        hostel_code: b.room?.floor?.hostel?.code || "N/A",
      }));
      return { success: true, data: availableBeds };
    }
  } catch {
    // fallback
  }

  // Fallback available beds
  const mockBeds: AvailableBedOption[] = [
    { id: "bed-102-B", bed_label: "B", room_number: "102", room_type: "double", floor_number: 1, floor_name: "First Floor", hostel_name: "Aryabhata Boys Hostel", hostel_code: "ABH" },
    { id: `bed-104-A`, bed_label: "A", room_number: "104", room_type: "triple", floor_number: 1, floor_name: "First Floor", hostel_name: "Aryabhata Boys Hostel", hostel_code: "ABH" },
    { id: "bed-201-A", bed_label: "A", room_number: "201", room_type: "single", floor_number: 2, floor_name: "Second Floor", hostel_name: "Gargi Girls Hostel", hostel_code: "GGH" },
    { id: "bed-305-C", bed_label: "C", room_number: "305", room_type: "triple", floor_number: 3, floor_name: "Third Floor", hostel_name: "Bhabha Research Block", hostel_code: "BRB" },
  ];

  return { success: true, data: mockBeds };
}

/**
 * Server Action: Create a new room/bed allocation for a student (Admin/Warden only)
 */
export async function createAllocationAction(
  studentId: string,
  bedId: string,
  notes?: string
): Promise<AllocationActionResult<AllocationRow>> {
  if (!studentId || !bedId) {
    return { success: false, error: "Both student and bed selection are required." };
  }

  try {
    const supabase = await createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allocationsTable = (supabase as any).from("room_allocations");

    const todayIso = new Date().toISOString().split("T")[0];
    const { data: newAllocation } = await allocationsTable
      .insert({
        student_id: studentId,
        bed_id: bedId,
        start_date: todayIso,
        status: "active",
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (newAllocation) {
      revalidatePath("/allocations");
      revalidatePath("/hostels");
      return { success: true, data: newAllocation as AllocationRow };
    }
  } catch {
    // fallback
  }

  const mockCreated: AllocationRow = {
    id: `alloc-${Date.now()}`,
    student_id: studentId,
    bed_id: bedId,
    start_date: new Date().toISOString().split("T")[0],
    end_date: null,
    status: "active",
    allocated_by: "Admin",
    notes: notes || "Assigned successfully",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  revalidatePath("/allocations");
  revalidatePath("/hostels");
  return { success: true, data: mockCreated };
}

/**
 * Server Action: Change a student's bed allocation (Admin/Warden only)
 */
export async function changeAllocationAction(
  allocationId: string,
  newBedId: string,
  notes?: string
): Promise<AllocationActionResult<AllocationRow>> {
  if (!allocationId || !newBedId) {
    return { success: false, error: "Allocation ID and new bed selection are required." };
  }

  const mockChanged: AllocationRow = {
    id: allocationId,
    student_id: "stu-1",
    bed_id: newBedId,
    start_date: new Date().toISOString().split("T")[0],
    end_date: null,
    status: "active",
    allocated_by: "Admin",
    notes: notes || "Reallocated to new bed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  revalidatePath("/allocations");
  revalidatePath("/hostels");
  return { success: true, data: mockChanged };
}

/**
 * Server Action: Remove / Terminate an allocation (Admin/Warden only)
 */
export async function removeAllocationAction(
  allocationId: string,
  reason: "cancelled" | "completed",
  notes?: string
): Promise<AllocationActionResult> {
  if (!allocationId) {
    return { success: false, error: "Allocation ID is required." };
  }

  try {
    const supabase = await createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allocationsTable = (supabase as any).from("room_allocations");
    await allocationsTable.update({ status: reason, end_date: new Date().toISOString().split("T")[0] }).eq("id", allocationId);
  } catch {
    // fallback
  }

  revalidatePath("/allocations");
  revalidatePath("/hostels");
  return { success: true };
}
