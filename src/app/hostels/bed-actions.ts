"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { hasPermissionInRole } from "@/lib/rbac/permissions";
import type { Database } from "@/lib/supabase/types";

export type BedRow = Database["public"]["Tables"]["beds"]["Row"];

export interface BedWithAllocationCount extends BedRow {
  active_allocation_count?: number;
}

export interface BedActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface BedFormData {
  bed_label: string;
  status: "available" | "occupied" | "reserved" | "under_maintenance";
}

/**
 * Server Action: Fetch all beds for a given room
 */
export async function getBedsForRoomAction(
  roomId: string
): Promise<BedActionResult<BedWithAllocationCount[]>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "rooms:read")) {
    return {
      success: false,
      error: "Unauthorized: Access permissions required to view beds.",
    };
  }

  if (!roomId) {
    return { success: false, error: "Room ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bedsTable = (supabase as any).from("beds");

  const { data: rawBeds, error } = await bedsTable
    .select("*, room_allocations(id, status)")
    .eq("room_id", roomId)
    .order("bed_label", { ascending: true });

  if (error) {
    return {
      success: false,
      error: `Failed to fetch beds: ${error.message}`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const beds: BedWithAllocationCount[] = (rawBeds || []).map((b: any) => {
    const allocationsArray = Array.isArray(b.room_allocations) ? b.room_allocations : [];
    const activeAllocations = allocationsArray.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (alloc: any) => alloc.status === "active"
    );
    const bedObj = { ...b };
    delete bedObj.room_allocations;
    return {
      ...(bedObj as BedRow),
      active_allocation_count: activeAllocations.length,
    };
  });

  return { success: true, data: beds };
}

/**
 * Validates bed input data
 */
function validateBedInput(data: Partial<BedFormData>): {
  valid: boolean;
  errors: Record<string, string>;
  sanitized?: BedFormData;
} {
  const errors: Record<string, string> = {};

  const bed_label = data.bed_label?.trim() || "";
  const status = data.status || "available";

  if (!bed_label) {
    errors.bed_label = "Bed label is required.";
  } else if (bed_label.length > 10) {
    errors.bed_label = "Bed label must not exceed 10 characters.";
  }

  if (!["available", "occupied", "reserved", "under_maintenance"].includes(status)) {
    errors.status = "Invalid bed status selected.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      bed_label,
      status: status as "available" | "occupied" | "reserved" | "under_maintenance",
    },
  };
}

/**
 * Server Action: Create a new bed under a room (Admin only)
 */
export async function createBedAction(
  roomId: string,
  formData: BedFormData
): Promise<BedActionResult<BedRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "rooms:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to create beds.",
    };
  }

  if (!roomId) {
    return { success: false, error: "Room ID is required." };
  }

  const validation = validateBedInput(formData);
  if (!validation.valid || !validation.sanitized) {
    return {
      success: false,
      error: "Validation failed. Please check form inputs.",
      fieldErrors: validation.errors,
    };
  }

  const supabase = await createServerClient();

  // Safety check: Ensure the referenced room actually exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomsTable = (supabase as any).from("rooms");
  const { data: roomExists, error: roomErr } = await roomsTable
    .select("id, room_number")
    .eq("id", roomId)
    .maybeSingle();

  if (roomErr || !roomExists) {
    return {
      success: false,
      error: "Invalid room reference: Target room record was not found.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bedsTable = (supabase as any).from("beds");
  const { data, error } = await bedsTable
    .insert({
      room_id: roomId,
      bed_label: validation.sanitized.bed_label,
      status: validation.sanitized.status,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: `Bed label '${validation.sanitized.bed_label}' already exists in Room ${roomExists.room_number}. Bed labels must be unique within each room.`,
        fieldErrors: { bed_label: `Bed ${validation.sanitized.bed_label} already exists in this room.` },
      };
    }

    return {
      success: false,
      error: `Database error: ${error.message || "Failed to create bed."}`,
    };
  }

  revalidatePath("/hostels");
  return {
    success: true,
    data: data as BedRow,
  };
}

/**
 * Server Action: Update an existing bed (Admin only)
 */
export async function updateBedAction(
  bedId: string,
  formData: BedFormData
): Promise<BedActionResult<BedRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "rooms:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to update beds.",
    };
  }

  if (!bedId) {
    return { success: false, error: "Bed ID is required." };
  }

  const validation = validateBedInput(formData);
  if (!validation.valid || !validation.sanitized) {
    return {
      success: false,
      error: "Validation failed. Please check form inputs.",
      fieldErrors: validation.errors,
    };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bedsTable = (supabase as any).from("beds");

  const { data, error } = await bedsTable
    .update({
      bed_label: validation.sanitized.bed_label,
      status: validation.sanitized.status,
    })
    .eq("id", bedId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: `Bed label '${validation.sanitized.bed_label}' is already taken in this room.`,
        fieldErrors: { bed_label: `Bed ${validation.sanitized.bed_label} is already taken in this room.` },
      };
    }

    return {
      success: false,
      error: `Database error: ${error.message || "Failed to update bed."}`,
    };
  }

  revalidatePath("/hostels");
  return {
    success: true,
    data: data as BedRow,
  };
}

/**
 * Server Action: Delete a bed when safe (Admin only)
 * Prevents deletion if bed status is 'occupied' or has active room_allocations.
 */
export async function deleteBedAction(bedId: string): Promise<BedActionResult> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "rooms:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to delete beds.",
    };
  }

  if (!bedId) {
    return { success: false, error: "Bed ID is required for deletion." };
  }

  const supabase = await createServerClient();

  // Safety check 1: Fetch target bed status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bedsTable = (supabase as any).from("beds");
  const { data: targetBed, error: fetchErr } = await bedsTable
    .select("id, bed_label, status")
    .eq("id", bedId)
    .single();

  if (fetchErr || !targetBed) {
    return {
      success: false,
      error: "Bed record not found.",
    };
  }

  if (targetBed.status === "occupied") {
    return {
      success: false,
      error: `Cannot delete Bed '${targetBed.bed_label}': Bed is currently marked as occupied.`,
    };
  }

  // Safety check 2: Check active room allocations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allocationsTable = (supabase as any).from("room_allocations");
  const { count: activeCount, error: allocErr } = await allocationsTable
    .select("id", { count: "exact", head: true })
    .eq("bed_id", bedId)
    .eq("status", "active");

  if (allocErr) {
    return {
      success: false,
      error: `Failed safety check query: ${allocErr.message}`,
    };
  }

  if (activeCount && activeCount > 0) {
    return {
      success: false,
      error: `Cannot delete Bed '${targetBed.bed_label}': An active student room allocation is linked to this bed.`,
    };
  }

  const { error } = await bedsTable.delete().eq("id", bedId);

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        error: "Cannot delete bed because student allocation records reference it.",
      };
    }
    return {
      success: false,
      error: `Database error: ${error.message || "Failed to delete bed."}`,
    };
  }

  revalidatePath("/hostels");
  return { success: true };
}
