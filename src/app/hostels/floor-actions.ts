"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { hasPermissionInRole } from "@/lib/rbac/permissions";
import type { Database } from "@/lib/supabase/types";

export type FloorRow = Database["public"]["Tables"]["floors"]["Row"];

export interface FloorWithRoomCount extends FloorRow {
  room_count?: number;
}

export interface FloorActionResult<T = null> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface FloorFormData {
  floor_number: number;
  name?: string;
}

/**
 * Server Action: Fetch all floors for a given hostel
 */
export async function getFloorsForHostelAction(
  hostelId: string
): Promise<FloorActionResult<FloorWithRoomCount[]>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "hostels:read")) {
    return {
      success: false,
      error: "Unauthorized: Access permissions required to view floors.",
    };
  }

  if (!hostelId) {
    return { success: false, error: "Hostel ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const floorsTable = (supabase as any).from("floors");

  const { data: rawFloors, error } = await floorsTable
    .select("*, rooms(id)")
    .eq("hostel_id", hostelId)
    .order("floor_number", { ascending: true });

  if (error) {
    return {
      success: false,
      error: `Failed to fetch floors: ${error.message}`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const floors: FloorWithRoomCount[] = (rawFloors || []).map((f: any) => {
    const roomsArray = Array.isArray(f.rooms) ? f.rooms : [];
    const hostelObj = { ...f };
    delete hostelObj.rooms;
    return {
      ...(hostelObj as FloorRow),
      room_count: roomsArray.length,
    };
  });

  return { success: true, data: floors };
}

/**
 * Validates floor input data
 */
function validateFloorInput(data: Partial<FloorFormData>): {
  valid: boolean;
  errors: Record<string, string>;
  sanitized?: FloorFormData;
} {
  const errors: Record<string, string> = {};

  const floor_number = Number(data.floor_number);
  const name = data.name?.trim() || undefined;

  if (data.floor_number === undefined || data.floor_number === null || isNaN(floor_number)) {
    errors.floor_number = "Floor number is required.";
  } else if (floor_number < 0 || !Number.isInteger(floor_number)) {
    errors.floor_number = "Floor number must be a non-negative integer (0 or greater).";
  }

  if (name && name.length > 50) {
    errors.name = "Floor name/label must not exceed 50 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      floor_number,
      name,
    },
  };
}

/**
 * Server Action: Create a new floor under a hostel (Admin only)
 */
export async function createFloorAction(
  hostelId: string,
  formData: FloorFormData
): Promise<FloorActionResult<FloorRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "hostels:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to create floors.",
    };
  }

  if (!hostelId) {
    return { success: false, error: "Hostel ID is required." };
  }

  const validation = validateFloorInput(formData);
  if (!validation.valid || !validation.sanitized) {
    return {
      success: false,
      error: "Validation failed. Please check form inputs.",
      fieldErrors: validation.errors,
    };
  }

  const supabase = await createServerClient();

  // Safety check: Ensure the referenced hostel actually exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hostelsTable = (supabase as any).from("hostels");
  const { data: hostelExists, error: hostelErr } = await hostelsTable
    .select("id, name")
    .eq("id", hostelId)
    .maybeSingle();

  if (hostelErr || !hostelExists) {
    return {
      success: false,
      error: "Invalid hostel reference: Target hostel record was not found.",
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const floorsTable = (supabase as any).from("floors");
  const { data, error } = await floorsTable
    .insert({
      hostel_id: hostelId,
      floor_number: validation.sanitized.floor_number,
      name: validation.sanitized.name || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: `Floor number ${validation.sanitized.floor_number} already exists in ${hostelExists.name}. Each floor number must be unique within a hostel.`,
        fieldErrors: { floor_number: `Floor ${validation.sanitized.floor_number} already exists.` },
      };
    }

    return {
      success: false,
      error: `Database error: ${error.message || "Failed to create floor."}`,
    };
  }

  revalidatePath("/hostels");
  return {
    success: true,
    data: data as FloorRow,
  };
}

/**
 * Server Action: Update an existing floor (Admin only)
 */
export async function updateFloorAction(
  floorId: string,
  formData: FloorFormData
): Promise<FloorActionResult<FloorRow>> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "hostels:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to update floors.",
    };
  }

  if (!floorId) {
    return { success: false, error: "Floor ID is required." };
  }

  const validation = validateFloorInput(formData);
  if (!validation.valid || !validation.sanitized) {
    return {
      success: false,
      error: "Validation failed. Please check form inputs.",
      fieldErrors: validation.errors,
    };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const floorsTable = (supabase as any).from("floors");

  const { data, error } = await floorsTable
    .update({
      floor_number: validation.sanitized.floor_number,
      name: validation.sanitized.name || null,
    })
    .eq("id", floorId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: `Floor number ${validation.sanitized.floor_number} is already assigned to another floor in this hostel.`,
        fieldErrors: { floor_number: `Floor ${validation.sanitized.floor_number} is already taken.` },
      };
    }

    return {
      success: false,
      error: `Database error: ${error.message || "Failed to update floor."}`,
    };
  }

  revalidatePath("/hostels");
  return {
    success: true,
    data: data as FloorRow,
  };
}

/**
 * Server Action: Delete a floor when safe (Admin only)
 * Checks if rooms exist before allowing deletion.
 */
export async function deleteFloorAction(floorId: string): Promise<FloorActionResult> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user || !role || !hasPermissionInRole(role, "hostels:manage")) {
    return {
      success: false,
      error: "Unauthorized: Administrative privileges are required to delete floors.",
    };
  }

  if (!floorId) {
    return { success: false, error: "Floor ID is required for deletion." };
  }

  const supabase = await createServerClient();

  // Safety check: Verify whether rooms exist for this floor
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomsTable = (supabase as any).from("rooms");
  const { count: roomCount, error: countErr } = await roomsTable
    .select("id", { count: "exact", head: true })
    .eq("floor_id", floorId);

  if (countErr) {
    return {
      success: false,
      error: `Failed safety check query: ${countErr.message}`,
    };
  }

  if (roomCount && roomCount > 0) {
    return {
      success: false,
      error: `Cannot delete floor: ${roomCount} room(s) are currently configured on this floor. Delete or move the rooms first.`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const floorsTable = (supabase as any).from("floors");
  const { error } = await floorsTable.delete().eq("id", floorId);

  if (error) {
    if (error.code === "23503") {
      return {
        success: false,
        error: "Cannot delete floor because sub-entities (rooms/allocations) reference it.",
      };
    }
    return {
      success: false,
      error: `Database error: ${error.message || "Failed to delete floor."}`,
    };
  }

  revalidatePath("/hostels");
  return { success: true };
}
